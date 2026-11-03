import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToGoogleDrive, ensureCompetitionSubfolder, parseDriveConfig } from "@/lib/google-drive";
import { isDatabaseConfigured } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Xác thực Server Session bắt buộc
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: "Chế độ xem trước (Chưa kết nối cơ sở dữ liệu đám mây)",
        syncedCount: 0,
      });
    }

    const body = await req.json().catch(() => ({}));
    const { competitionId } = body;

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

    const schoolDrive = parseDriveConfig(superAdmin?.driveFolderId);

    // 1. Tự động tạo thư mục con trên Google Drive cho tất cả cuộc thi nếu chưa có
    const allComps = await db.competition.findMany({
      where: competitionId ? { id: competitionId } : {},
      select: { id: true, title: true, driveFolderId: true },
    });

    let foldersCreated = 0;
    for (const comp of allComps) {
      if (!comp.driveFolderId || comp.driveFolderId.includes("mock")) {
        const res = await ensureCompetitionSubfolder({
          competitionTitle: comp.title,
          parentFolderId: schoolDrive.folderId,
          webhookUrl: schoolDrive.webhookUrl,
        });

        if (!res.isMock && res.folderId) {
          await db.competition.update({
            where: { id: comp.id },
            data: {
              driveFolderId: res.folderId,
              driveFolderUrl: res.folderUrl || `https://drive.google.com/drive/folders/${res.folderId}`,
            },
          });
          foldersCreated++;
        }
      }
    }

    // 2. Lấy tất cả bài nộp có ảnh minh chứng để đẩy lên Google Drive
    const whereClause: Record<string, unknown> = {
      localImageUrl: { not: null },
    };
    if (competitionId) {
      whereClause.competitionId = competitionId;
    }

    const submissions = await db.submission.findMany({
      where: whereClause,
      include: {
        competition: {
          select: { id: true, title: true, driveFolderId: true },
        },
        teacher: {
          select: { id: true, name: true },
        },
      },
    });

    let successCount = 0;
    const errors: string[] = [];

    for (const sub of submissions) {
      if (!sub.localImageUrl) continue;

      try {
        const uploadRes = await uploadToGoogleDrive({
          base64Data: sub.localImageUrl,
          fileName: sub.imageFileName || "minh_chung.jpg",
          mimeType: "image/jpeg",
          competitionTitle: sub.competition.title,
          teacherName: sub.teacher.name,
          competitionFolderId: sub.competition.driveFolderId,
          masterParentFolderId: schoolDrive.folderId,
          webhookUrl: schoolDrive.webhookUrl,
        });

        if (!uploadRes.isMock && uploadRes.fileId && uploadRes.driveUrl) {
          await db.submission.update({
            where: { id: sub.id },
            data: {
              driveFileId: uploadRes.fileId,
              driveFileUrl: uploadRes.driveUrl,
              localImageUrl: null, // Giải phóng Base64 khỏi PostgreSQL và chặn upload trùng lặp
            },
          });

          if (!sub.competition.driveFolderId && uploadRes.folderId) {
            await db.competition.update({
              where: { id: sub.competition.id },
              data: {
                driveFolderId: uploadRes.folderId,
                driveFolderUrl: uploadRes.folderUrl || `https://drive.google.com/drive/folders/${uploadRes.folderId}`,
              },
            }).catch(() => null);
          }

          successCount++;
        } else if (uploadRes.isMock) {
          errors.push(
            `Chưa thể tải bài nộp ${sub.id}: Webhook Google Apps Script chưa nhận được quyền ghi hoặc chưa kết nối.`
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Lỗi nộp bài ${sub.id}: ${msg}`);
      }
    }

    let resultMsg = "";
    if (foldersCreated > 0 && successCount > 0) {
      resultMsg = `Đã tạo ${foldersCreated} thư mục cuộc thi và đồng bộ ${successCount} ảnh minh chứng lên Google Drive!`;
    } else if (foldersCreated > 0) {
      resultMsg = `Đã tạo thành công ${foldersCreated} thư mục cuộc thi trên Google Drive!`;
    } else if (successCount > 0) {
      resultMsg = `Đã đồng bộ ${successCount}/${submissions.length} ảnh minh chứng lên Google Drive!`;
    } else {
      resultMsg = `Đã kiểm tra Google Drive (Chưa có bài nộp mới cần đồng bộ).`;
    }

    return NextResponse.json({
      success: true,
      totalFound: submissions.length,
      syncedCount: successCount,
      foldersCreated,
      errors: errors.length > 0 ? errors : undefined,
      message: resultMsg,
    });
  } catch (error) {
    console.error("Sync drive error:", error);
    return NextResponse.json({ error: "Lỗi đồng bộ minh chứng lên Google Drive" }, { status: 500 });
  }
}
