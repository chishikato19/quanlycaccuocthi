export interface DriveUploadResult {
  fileId: string;
  driveUrl: string;
  isMock: boolean;
  folderId?: string;
}

/**
 * Tự động trích xuất Folder ID từ URL chia sẻ Google Drive hoặc ID thô
 * Ví dụ: https://drive.google.com/drive/folders/1A2b3C4d5E6f... -> 1A2b3C4d5E6f...
 */
export function extractDriveFolderId(input?: string | null): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();

  // Kiểm tra nếu là URL dạng /folders/ID
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // Kiểm tra nếu là URL dạng ?id=ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // Nếu là ID thô (chuỗi không chứa dấu gạch chéo / hoặc dấu chấm .)
  if (!trimmed.includes("/") && !trimmed.includes(".")) {
    return trimmed;
  }

  return null;
}

/**
 * Service tích hợp Google Drive:
 * - Ưu tiên 1: Lưu vào customFolderId (Thư mục riêng của Admin tạo cuộc thi).
 * - Ưu tiên 2: Lưu vào GOOGLE_DRIVE_FOLDER_ID (Thư mục chung của Super Admin / Nhà trường).
 */
export async function uploadToGoogleDrive(params: {
  base64Data: string;
  fileName: string;
  mimeType: string;
  competitionTitle: string;
  teacherName: string;
  customFolderId?: string | null;
}): Promise<DriveUploadResult> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  // Xác định thư mục cha: Thư mục riêng của Admin hoặc Thư mục chung của Super Admin
  const extractedCustomId = extractDriveFolderId(params.customFolderId);
  const parentFolderId = extractedCustomId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Nếu có đủ thông tin Service Account Google
  if (serviceAccountEmail && privateKey) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { google } = (await import("googleapis")) as any;

      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });

      // 1. Tìm hoặc tạo thư mục con theo tên cuộc thi nằm trong parentFolderId
      let targetFolderId = parentFolderId;
      if (parentFolderId) {
        const folderName = `[Cuộc thi] ${params.competitionTitle.trim()}`;
        const query = `'${parentFolderId}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        
        try {
          const folderRes = await drive.files.list({
            q: query,
            fields: "files(id, name)",
            spaces: "drive",
          });

          if (folderRes.data.files && folderRes.data.files.length > 0) {
            targetFolderId = folderRes.data.files[0].id;
          } else {
            // Tạo thư mục cuộc thi mới bên trong thư mục cha
            const newFolder = await drive.files.create({
              requestBody: {
                name: folderName,
                mimeType: "application/vnd.google-apps.folder",
                parents: [parentFolderId],
              },
              fields: "id",
            });
            targetFolderId = newFolder.data.id;
          }
        } catch (folderErr) {
          console.warn("[GoogleDriveService] Không thể tạo thư mục con trong folder cha, sẽ upload trực tiếp vào folder cha:", folderErr);
          targetFolderId = parentFolderId;
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

      // Cấp quyền xem cho bất kỳ ai có link
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
        folderId: targetFolderId,
        isMock: false,
      };
    } catch (err) {
      console.error("[GoogleDriveService] Lỗi upload Drive:", err);
    }
  }

  // Chế độ dự phòng / mô phỏng khi chưa gắn Service Account
  const mockFileId = `drive-mock-${Date.now()}`;
  return {
    fileId: mockFileId,
    driveUrl: `https://drive.google.com/file/d/${mockFileId}/view?usp=sharing`,
    folderId: parentFolderId || undefined,
    isMock: true,
  };
}
