import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToGoogleDrive, parseDriveConfig } from "@/lib/google-drive";
import { isDatabaseConfigured } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Xác thực Server Session bắt buộc
    const auth = requireAuth();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const {
      competitionId,
      teacherId,
      base64Image,
      fileName,
      mimeType,
      note,
    } = body;

    if (!competitionId || !teacherId) {
      return NextResponse.json({ error: "Thông tin nộp bài không đầy đủ" }, { status: 400 });
    }

    // 2. Chống lỗ hổng IDOR: Giáo viên thường CHỈ ĐƯỢC nộp bài cho chính mình
    if (auth.user!.role === "USER" && auth.user!.id !== teacherId) {
      return NextResponse.json(
        { error: "Bạn không được phép nộp minh chứng thay cho giáo viên khác" },
        { status: 403 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Cơ sở dữ liệu chưa sẵn sàng" },
        { status: 503 }
      );
    }

    // 3. Kiểm tra kích thước tệp tải lên ở Server (Tối đa ~4.5MB Base64)
    if (base64Image && base64Image.length > 6 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Dung lượng tệp tải lên vượt quá giới hạn 4.5MB" },
        { status: 400 }
      );
    }

    const competition = await db.competition.findUnique({
      where: { id: competitionId },
      include: {
        creator: {
          select: { id: true, name: true, driveFolderId: true },
        },
      },
    });

    if (!competition) {
      return NextResponse.json({ error: "Không tìm thấy cuộc thi" }, { status: 404 });
    }

    if (competition.status === "CLOSED_EARLY") {
      return NextResponse.json({ error: "Cuộc thi này đã được quản trị viên kết thúc sớm" }, { status: 400 });
    }

    // 4. Kiểm tra giáo viên có được phân công tham gia cuộc thi này không
    const isAssigned = await db.competitionAssignee.findUnique({
      where: {
        competitionId_teacherId: {
          competitionId,
          teacherId,
        },
      },
    });

    if (!isAssigned && auth.user!.role === "USER") {
      return NextResponse.json(
        { error: "Bạn không thuộc danh sách giáo viên được phân công cuộc thi này" },
        { status: 403 }
      );
    }

    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Không tìm thấy thông tin giáo viên" }, { status: 404 });
    }

    // Kiểm tra thời hạn nộp
    const now = new Date();
    const isPastDeadline = now > competition.deadline;

    if (isPastDeadline && !competition.allowLateSubmission) {
      return NextResponse.json({
        error: "Cuộc thi đã quá hạn và không cho phép nộp muộn!",
      }, { status: 400 });
    }

    const submissionStatus = isPastDeadline ? "LATE" : "ON_TIME";

    let driveFileId = null;
    let driveFileUrl = null;
    let localImageUrl: string | null = null;

    if (base64Image) {
      // Lấy cấu hình Drive chung của Nhà trường từ Super Admin
      const superAdmin = await db.teacher.findFirst({
        where: {
          OR: [
            { role: "SUPER_ADMIN" },
            { phone: "admin" },
            { name: { contains: "Quản Trị" } },
            { department: "Hệ Thống" },
          ],
        },
        select: { driveFolderId: true },
      });

      const schoolDrive = parseDriveConfig(superAdmin?.driveFolderId || competition.creator?.driveFolderId);

      // Đẩy ảnh thẳng vào thư mục con của cuộc thi này
      const uploadRes = await uploadToGoogleDrive({
        base64Data: base64Image,
        fileName: fileName || "minh_chung.jpg",
        mimeType: mimeType || "image/jpeg",
        competitionTitle: competition.title,
        teacherName: teacher.name,
        competitionFolderId: competition.driveFolderId,
        masterParentFolderId: schoolDrive.folderId || competition.creator?.driveFolderId,
        webhookUrl: schoolDrive.webhookUrl,
      });

      driveFileId = uploadRes.fileId;
      driveFileUrl = uploadRes.driveUrl;

      // Nếu tải lên Drive thành công thì không lưu Base64 vào CSDL để tránh nghẽn storage
      if (!driveFileUrl) {
        localImageUrl = base64Image;
      }

      // Nếu cuộc thi trước đó chưa lưu driveFolderId, cập nhật ngay
      if (!competition.driveFolderId && uploadRes.folderId) {
        await db.competition.update({
          where: { id: competition.id },
          data: {
            driveFolderId: uploadRes.folderId,
            driveFolderUrl: uploadRes.folderUrl || `https://drive.google.com/drive/folders/${uploadRes.folderId}`,
          },
        }).catch(() => null);
      }
    }

    // Lưu hoặc cập nhật bản ghi Submission (Upsert)
    const submission = await db.submission.upsert({
      where: {
        competitionId_teacherId: {
          competitionId,
          teacherId,
        },
      },
      update: {
        status: submissionStatus,
        driveFileId: driveFileId || undefined,
        driveFileUrl: driveFileUrl || undefined,
        localImageUrl: driveFileUrl ? null : (localImageUrl || undefined),
        imageFileName: fileName || undefined,
        note: note ? note.trim() : null,
        submittedAt: now,
        reviewStatus: "PENDING",
      },
      create: {
        competitionId,
        teacherId,
        status: submissionStatus,
        driveFileId,
        driveFileUrl,
        localImageUrl,
        imageFileName: fileName,
        note: note ? note.trim() : null,
        submittedAt: now,
        reviewStatus: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: isPastDeadline
        ? "Đã nộp minh chứng (Ghi nhận: Nộp muộn sau hạn chót)!"
        : "Nộp minh chứng thành công đúng hạn!",
      data: submission,
    });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Lỗi trong quá trình nộp minh chứng" }, { status: 500 });
  }
}
