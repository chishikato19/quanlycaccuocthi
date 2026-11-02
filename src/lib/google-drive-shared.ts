export interface ParsedDriveConfig {
  folderId: string | null;
  folderUrl: string | null;
  webhookUrl: string | null;
}

/**
 * Trích xuất ID thư mục từ link Google Drive hoặc ID thô
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
  if (!trimmed.includes("/") && !trimmed.includes(".") && !trimmed.startsWith("{")) {
    return trimmed;
  }

  return null;
}

/**
 * Trích xuất ID tệp tin từ link Google Drive (/file/d/ID hoặc /d/ID hoặc ?id=ID)
 */
export function extractDriveFileId(input?: string | null): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();

  // URL dạng /file/d/ID
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  // URL dạng /d/ID
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }

  // URL dạng ?id=ID hoặc &id=ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // URL dạng /folders/ID
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // ID thô
  if (!trimmed.includes("/") && !trimmed.includes(".") && !trimmed.startsWith("{")) {
    return trimmed;
  }

  return null;
}

/**
 * Phân tích cấu hình Google Drive từ chuỗi lưu trong CSDL
 */
export function parseDriveConfig(raw?: string | null): ParsedDriveConfig {
  if (!raw || !raw.trim()) {
    return {
      folderId: null,
      folderUrl: null,
      webhookUrl: null,
    };
  }

  const trimmed = raw.trim();

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const folderId = extractDriveFolderId(parsed.folderId || parsed.folderUrl) || null;
      return {
        folderId,
        folderUrl: folderId
          ? `https://drive.google.com/drive/folders/${folderId}`
          : (parsed.folderUrl || null),
        webhookUrl: parsed.webhookUrl || null,
      };
    } catch {
      // Bỏ qua lỗi JSON parse
    }
  }

  const folderId = extractDriveFolderId(trimmed) || null;
  return {
    folderId,
    folderUrl: folderId ? `https://drive.google.com/drive/folders/${folderId}` : (trimmed.startsWith("http") ? trimmed : null),
    webhookUrl: null,
  };
}

/**
 * Đóng gói cấu hình Google Drive để lưu vào CSDL
 */
export function serializeDriveConfig(config: {
  folderUrlOrId?: string | null;
  webhookUrl?: string | null;
}): string | null {
  const folderId = extractDriveFolderId(config.folderUrlOrId);
  const webhookUrl = config.webhookUrl ? config.webhookUrl.trim() : null;

  if (!folderId && !webhookUrl) return null;

  if (!webhookUrl && folderId) {
    return folderId;
  }

  return JSON.stringify({
    folderId,
    folderUrl: folderId ? `https://drive.google.com/drive/folders/${folderId}` : null,
    webhookUrl,
  });
}

/**
 * Mẫu mã nguồn Google Apps Script chuẩn dành cho Nhà Trường
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    var parentFolderId = data.parentFolderId;
    var competitionTitle = data.competitionTitle || "Cuộc thi";
    var competitionFolderId = data.competitionFolderId;
    var teacherName = data.teacherName || "Giáo viên";
    var fileName = data.fileName || "minh_chung.jpg";
    var base64Data = data.base64Data ? data.base64Data.replace(/^data:[^;]+;base64,/, "") : "";
    var mimeType = data.mimeType || "image/jpeg";
    
    // 1. Mở thư mục gốc chung của Nhà trường
    var parentFolder;
    try {
      parentFolder = parentFolderId ? DriveApp.getFolderById(parentFolderId) : DriveApp.getRootFolder();
    } catch(err) {
      parentFolder = DriveApp.getRootFolder();
    }
    
    // 2. Tìm hoặc tự động tạo thư mục con cho Cuộc thi
    var targetFolder = null;
    if (competitionFolderId) {
      try {
        targetFolder = DriveApp.getFolderById(competitionFolderId);
      } catch(e) {}
    }
    
    if (!targetFolder) {
      var subfolderName = "[Cuộc thi] " + competitionTitle.trim();
      var subfolders = parentFolder.getFoldersByName(subfolderName);
      if (subfolders.hasNext()) {
        targetFolder = subfolders.next();
      } else {
        targetFolder = parentFolder.createFolder(subfolderName);
      }
    }
    
    // 3. Tạo file ảnh minh chứng vào đúng thư mục con
    var fileId = "";
    var fileUrl = "";
    if (base64Data) {
      var decoded = Utilities.base64Decode(base64Data);
      var timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
      var safeTeacherName = teacherName.replace(/[\\\\/:*?"<>|]/g, "_").trim();
      var safeFileName = safeTeacherName + "_" + timestamp + "_" + fileName;
      
      var blob = Utilities.newBlob(decoded, mimeType, safeFileName);
      var file = targetFolder.createFile(blob);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch(e) {}
      fileId = file.getId();
      fileUrl = file.getUrl();
    }
    
    var result = {
      success: true,
      fileId: fileId,
      fileUrl: fileUrl,
      folderId: targetFolder.getId(),
      folderUrl: targetFolder.getUrl()
    };
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "Google Apps Script Webhook Hệ Thống Quản Lý Cuộc Thi đang hoạt động!"
  })).setMimeType(ContentService.MimeType.JSON);
}`;
