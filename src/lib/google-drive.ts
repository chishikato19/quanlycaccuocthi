import {
  extractDriveFolderId,
  parseDriveConfig,
  serializeDriveConfig,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  ParsedDriveConfig,
} from "./google-drive-shared";

export {
  extractDriveFolderId,
  parseDriveConfig,
  serializeDriveConfig,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
};
export type { ParsedDriveConfig };

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
 * TỰ ĐỘNG TẠO HOẶC LẤY THƯ MỤC CON CHO CUỘC THI TRONG THƯ MỤC CHUNG
 */
export async function ensureCompetitionSubfolder(params: {
  competitionTitle: string;
  parentFolderId?: string | null;
  webhookUrl?: string | null;
}): Promise<CompetitionFolderResult> {
  const resolvedParentId = extractDriveFolderId(params.parentFolderId) || process.env.GOOGLE_DRIVE_FOLDER_ID;
  const webhookUrl = params.webhookUrl || process.env.GOOGLE_DRIVE_WEBHOOK_URL;

  // 1. Nếu có Webhook Google Apps Script, gọi trực tiếp để tạo thư mục
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentFolderId: resolvedParentId,
          competitionTitle: params.competitionTitle,
          base64Data: "",
        }),
      });

      if (res.ok) {
        const text = await res.text();
        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          // ignore html
        }

        if (data && data.success && data.folderId) {
          return {
            folderId: data.folderId,
            folderUrl: data.folderUrl || `https://drive.google.com/drive/folders/${data.folderId}`,
            isMock: false,
          };
        }
      }
    } catch (err) {
      console.warn("[GoogleDriveService] Không thể kết nối Webhook khi tạo thư mục:", err);
    }
  }

  // 2. Nếu có Service Account Google Cloud
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

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
      if (newFolderId) {
        await drive.permissions.create({
          fileId: newFolderId,
          requestBody: { role: "reader", type: "anyone" },
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

  // 3. Nếu chưa kết nối API, trả về thư mục chung nếu có, không sinh ID ảo
  const fallbackFolderId = resolvedParentId || "";
  return {
    folderId: fallbackFolderId,
    folderUrl: fallbackFolderId ? `https://drive.google.com/drive/folders/${fallbackFolderId}` : "",
    isMock: true,
  };
}

/**
 * Upload ảnh minh chứng vào đúng thư mục con của cuộc thi trên Google Drive
 */
export async function uploadToGoogleDrive(params: {
  base64Data: string;
  fileName: string;
  mimeType: string;
  competitionTitle: string;
  teacherName: string;
  competitionFolderId?: string | null;
  masterParentFolderId?: string | null;
  webhookUrl?: string | null;
}): Promise<DriveUploadResult> {
  const resolvedParentId = extractDriveFolderId(params.masterParentFolderId) || process.env.GOOGLE_DRIVE_FOLDER_ID;
  const webhookUrl = params.webhookUrl || process.env.GOOGLE_DRIVE_WEBHOOK_URL;

  // 1. ƯU TIÊN 1: Tải ảnh qua Google Apps Script Webhook (Dễ nhất cho Nhà Trường)
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentFolderId: resolvedParentId,
          competitionTitle: params.competitionTitle,
          competitionFolderId: extractDriveFolderId(params.competitionFolderId),
          teacherName: params.teacherName,
          fileName: params.fileName,
          mimeType: params.mimeType,
          base64Data: params.base64Data,
        }),
      });

      if (res.ok) {
        const text = await res.text();
        let result = null;
        try {
          result = JSON.parse(text);
        } catch {
          if (text.includes("Bạn cần có quyền truy cập") || text.includes("accounts.google.com")) {
            console.warn("[GoogleDriveService] Webhook bị chặn do chưa mở quyền 'Bất kỳ ai (Anyone)'!");
          }
        }

        if (result && result.success && result.fileId) {
          return {
            fileId: result.fileId,
            driveUrl: result.fileUrl || `https://drive.google.com/file/d/${result.fileId}/view`,
            folderId: result.folderId || params.competitionFolderId || undefined,
            folderUrl: result.folderUrl || (params.competitionFolderId ? `https://drive.google.com/drive/folders/${params.competitionFolderId}` : undefined),
            isMock: false,
          };
        }
      }
    } catch (err) {
      console.warn("[GoogleDriveService] Lỗi upload qua Webhook Apps Script:", err);
    }
  }

  // 2. ƯU TIÊN 2: Tải ảnh qua Google Cloud Service Account
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  let targetFolderId = extractDriveFolderId(params.competitionFolderId);
  let targetFolderUrl = targetFolderId ? `https://drive.google.com/drive/folders/${targetFolderId}` : "";

  if (!targetFolderId) {
    const ensured = await ensureCompetitionSubfolder({
      competitionTitle: params.competitionTitle,
      parentFolderId: resolvedParentId,
      webhookUrl,
    });
    targetFolderId = ensured.folderId;
    targetFolderUrl = ensured.folderUrl;
  }

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
          requestBody: { role: "reader", type: "anyone" },
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

  // 3. Chế độ dự phòng: KHÔNG sinh link file ảo (để tránh lỗi 404 khi người dùng bấm vào)
  return {
    fileId: "",
    driveUrl: "",
    folderId: targetFolderId || resolvedParentId || undefined,
    folderUrl: targetFolderUrl || (resolvedParentId ? `https://drive.google.com/drive/folders/${resolvedParentId}` : undefined),
    isMock: true,
  };
}
