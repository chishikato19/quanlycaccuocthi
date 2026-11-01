import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadToGoogleDrive, parseDriveConfig } from "@/lib/google-drive";
import { isDatabaseConfigured } from "@/lib/mock-data";

export async function POST(req: Request) {
  try {
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

    // Lấy tất cả bài nộp có ảnh minh chứng
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

    return NextResponse.json({
      success: true,
      totalFound: submissions.length,
      syncedCount: successCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Đã đồng bộ ${successCount}/${submissions.length} minh chứng lên Google Drive!`,
    });
  } catch (error) {
    console.error("Sync drive error:", error);
    return NextResponse.json({ error: "Lỗi đồng bộ minh chứng lên Google Drive" }, { status: 500 });
  }
}
