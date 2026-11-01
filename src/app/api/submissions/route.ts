import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToGoogleDrive } from "@/lib/google-drive";

export async function POST(req: Request) {
  try {
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
    let localImageUrl = base64Image || null;

    if (base64Image) {
      // Đẩy ảnh thẳng vào thư mục con của cuộc thi này
      const uploadRes = await uploadToGoogleDrive({
        base64Data: base64Image,
        fileName: fileName || "minh_chung.jpg",
        mimeType: mimeType || "image/jpeg",
        competitionTitle: competition.title,
        teacherName: teacher.name,
        competitionFolderId: competition.driveFolderId,
        masterParentFolderId: competition.creator.driveFolderId,
      });

      driveFileId = uploadRes.fileId;
      driveFileUrl = uploadRes.driveUrl;

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
        localImageUrl: localImageUrl || undefined,
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
