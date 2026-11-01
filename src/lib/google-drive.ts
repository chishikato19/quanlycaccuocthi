export interface DriveUploadResult {
  fileId: string;
  driveUrl: string;
  isMock: boolean;
}

/**
 * Service tích hợp Google Drive.
 * Khi chưa cấu hình GOOGLE_SERVICE_ACCOUNT trong .env, hệ thống sẽ tự động chuyển sang chế độ
 * lưu trữ dự phòng/mô phỏng để bạn có thể kiểm thử toàn bộ giao diện mà không bị lỗi.
 */
export async function uploadToGoogleDrive(params: {
  base64Data: string;
  fileName: string;
  mimeType: string;
  competitionTitle: string;
  teacherName: string;
}): Promise<DriveUploadResult> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  // Nếu có đủ thông tin Service Account Google
  if (serviceAccountEmail && privateKey) {
    try {
      // Dynamic import để tránh lỗi khi build môi trường tối giản
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { google } = (await import("googleapis")) as any;

      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });
      const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

      // 1. Tìm hoặc tạo thư mục theo tên cuộc thi
      let targetFolderId = rootFolderId;
      if (rootFolderId) {
        const folderName = `[Cuộc thi] ${params.competitionTitle.trim()}`;
        const query = `'${rootFolderId}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        
        const folderRes = await drive.files.list({
          q: query,
          fields: "files(id, name)",
          spaces: "drive",
        });

        if (folderRes.data.files && folderRes.data.files.length > 0) {
          targetFolderId = folderRes.data.files[0].id;
        } else {
          // Tạo thư mục mới
          const newFolder = await drive.files.create({
            requestBody: {
              name: folderName,
              mimeType: "application/vnd.google-apps.folder",
              parents: [rootFolderId],
            },
            fields: "id",
          });
          targetFolderId = newFolder.data.id;
        }
      }

      // 2. Chuyển base64 sang Buffer và upload
      const cleanBase64 = params.base64Data.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      const { Readable } = await import("stream");
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const ext = params.fileName.split(".").pop() || "jpg";
      const sanitizedTeacherName = params.teacherName.replace(/[^a-zA-Z0-9_\sÀ-ỹ]/g, "").trim();
      const driveFileName = `${sanitizedTeacherName}_${timestamp}.${ext}`;

      const fileMetadata: Record<string, unknown> = {
        name: driveFileName,
      };
      if (targetFolderId) {
        fileMetadata.parents = [targetFolderId];
      }

      const fileRes = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: params.mimeType,
          body: stream,
        },
        fields: "id, webViewLink, webContentLink",
      });

      // Cấp quyền xem cho người có link
      const fileId = fileRes.data.id;
      if (fileId) {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        }).catch(() => null);
      }

      return {
        fileId: fileId || `drive-${Date.now()}`,
        driveUrl: fileRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
        isMock: false,
      };
    } catch (err) {
      console.error("[GoogleDriveService] Lỗi upload Drive:", err);
      // Fallback về mock url nếu có lỗi kết nối
    }
  }

  // Chế độ mô phỏng khi chưa cấu hình Google API
  const mockFileId = `drive-mock-${Date.now()}`;
  return {
    fileId: mockFileId,
    driveUrl: `https://drive.google.com/file/d/${mockFileId}/view?usp=sharing`,
    isMock: true,
  };
}
