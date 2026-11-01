export interface DriveUploadResult {
  fileId: string;
  driveUrl: string;
  folderId?: string;
  folderUrl?: string;
  isMock: boolean;
}

export interface CompetitionFolderResult {
  folderId: string;
  folderUrl: string;
  isMock: boolean;
}

/**
 * Tự động trích xuất Folder ID từ URL chia sẻ Google Drive hoặc ID thô
 */
export function extractDriveFolderId(input?: string | null): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();

  // URL dạng /folders/ID
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // URL dạng ?id=ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // ID thô
  if (!trimmed.includes("/") && !trimmed.includes(".")) {
    return trimmed;
  }

  return null;
}

/**
 * TỰ ĐỘNG TẠO HOẶC LẤY THƯ MỤC CON CHO CUỘC THI TRONG THƯ MỤC CHUNG
 * Cấu trúc: [Thư mục chung Nhà trường / Admin] / [Cuộc thi] Tên cuộc thi /
 */
export async function ensureCompetitionSubfolder(params: {
  competitionTitle: string;
  parentFolderId?: string | null;
}): Promise<CompetitionFolderResult> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  // Xác định thư mục cha chung (Ưu tiên thư mục Admin chỉ định, nếu không thì lấy thư mục gốc của Super Admin)
  const resolvedParentId = extractDriveFolderId(params.parentFolderId) || process.env.GOOGLE_DRIVE_FOLDER_ID;

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

      const folderName = `[Cuộc thi] ${params.competitionTitle.trim()}`;

      // Tìm xem thư mục con của cuộc thi này đã tồn tại trong thư mục cha chưa
      let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      if (resolvedParentId) {
        query += ` and '${resolvedParentId}' in parents`;
      }

      const listRes = await drive.files.list({
        q: query,
        fields: "files(id, name, webViewLink)",
        spaces: "drive",
      });

      if (listRes.data.files && listRes.data.files.length > 0) {
        const existing = listRes.data.files[0];
        return {
          folderId: existing.id,
          folderUrl: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
          isMock: false,
        };
      }

      // Tạo mới thư mục con cho cuộc thi nằm bên trong thư mục cha chung
      const fileMetadata: Record<string, unknown> = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      };
      if (resolvedParentId) {
        fileMetadata.parents = [resolvedParentId];
      }

      const createRes = await drive.files.create({
        requestBody: fileMetadata,
        fields: "id, webViewLink",
      });

      const newFolderId = createRes.data.id;

      // Cấp quyền xem cho bất kỳ ai có link mở thư mục này
      if (newFolderId) {
        await drive.permissions.create({
          fileId: newFolderId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        }).catch(() => null);
      }

      return {
        folderId: newFolderId,
        folderUrl: createRes.data.webViewLink || `https://drive.google.com/drive/folders/${newFolderId}`,
        isMock: false,
      };
    } catch (err) {
      console.error("[GoogleDriveService] Lỗi tạo thư mục con cuộc thi:", err);
    }
  }

  // Chế độ mô phỏng khi chưa kết nối API
  const mockFolderId = `folder-mock-${Date.now()}`;
  return {
    folderId: mockFolderId,
    folderUrl: `https://drive.google.com/drive/folders/${mockFolderId}`,
    isMock: true,
  };
}

/**
 * Upload ảnh minh chứng vào đúng thư mục con của cuộc thi
 */
export async function uploadToGoogleDrive(params: {
  base64Data: string;
  fileName: string;
  mimeType: string;
  competitionTitle: string;
  teacherName: string;
  competitionFolderId?: string | null; // ID thư mục con của cuộc thi
  masterParentFolderId?: string | null; // ID thư mục cha nếu chưa có thư mục con
}): Promise<DriveUploadResult> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  // 1. Đảm bảo có thư mục con của cuộc thi này
  let targetFolderId = extractDriveFolderId(params.competitionFolderId);
  let targetFolderUrl = targetFolderId ? `https://drive.google.com/drive/folders/${targetFolderId}` : "";

  if (!targetFolderId) {
    const ensured = await ensureCompetitionSubfolder({
      competitionTitle: params.competitionTitle,
      parentFolderId: params.masterParentFolderId,
    });
    targetFolderId = ensured.folderId;
    targetFolderUrl = ensured.folderUrl;
  }

  // 2. Upload file vào thư mục con đó
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
      if (targetFolderId && !targetFolderId.startsWith("folder-mock")) {
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
        folderUrl: targetFolderUrl,
        isMock: false,
      };
    } catch (err) {
      console.error("[GoogleDriveService] Lỗi upload Drive:", err);
    }
  }

  // Chế độ mô phỏng
  const mockFileId = `drive-mock-${Date.now()}`;
  return {
    fileId: mockFileId,
    driveUrl: `https://drive.google.com/file/d/${mockFileId}/view?usp=sharing`,
    folderId: targetFolderId,
    folderUrl: targetFolderUrl,
    isMock: true,
  };
}
