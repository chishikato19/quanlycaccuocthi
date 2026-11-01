import { toPng, toBlob } from "html-to-image";

export async function downloadReportAsPng(
  element: HTMLElement,
  fileName: string
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2, // Tăng độ nét cao gấp đôi để gửi Zalo đọc rõ chữ
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Lỗi khi xuất ảnh PNG:", error);
    throw error;
  }
}

export async function copyReportToClipboard(element: HTMLElement): Promise<boolean> {
  try {
    const blob = await toBlob(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    if (!blob) throw new Error("Không thể tạo dữ liệu ảnh");

    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      return true;
    } else {
      throw new Error("Trình duyệt không hỗ trợ sao chép ảnh trực tiếp");
    }
  } catch (error) {
    console.error("Lỗi sao chép ảnh vào clipboard:", error);
    return false;
  }
}
