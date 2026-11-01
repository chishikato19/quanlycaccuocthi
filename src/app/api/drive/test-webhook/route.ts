import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { webhookUrl, folderId } = await req.json();

    if (!webhookUrl || !webhookUrl.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập đường link Webhook Google Apps Script" },
        { status: 400 }
      );
    }

    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl.startsWith("https://script.google.com/macros/s/")) {
      return NextResponse.json(
        {
          error:
            "Đường dẫn Webhook không hợp lệ. Đường dẫn chuẩn phải bắt đầu bằng https://script.google.com/macros/s/ và kết thúc bằng /exec",
        },
        { status: 400 }
      );
    }

    // Gửi yêu cầu kiểm tra đến Webhook
    try {
      const res = await fetch(cleanUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentFolderId: folderId || null,
          competitionTitle: "Kiểm tra kết nối",
          base64Data: "",
        }),
      });

      const responseText = await res.text();

      // Kiểm tra trường hợp Google chặn quyền truy cập (bắt đăng nhập)
      if (
        responseText.includes("Bạn cần có quyền truy cập") ||
        responseText.includes("accounts.google.com") ||
        responseText.includes("ServiceLogin") ||
        responseText.includes("request-access-icon")
      ) {
        return NextResponse.json({
          success: false,
          errorType: "PERMISSION_DENIED",
          error:
            "LỖI PHÂN QUYỀN GOOGLE: Webhook bị chặn do chưa mở quyền truy cập công khai! Trong Google Apps Script, bạn cần bấm 'Triển khai (Deploy)' ➔ 'Quản lý bản triển khai' ➔ Sửa mục 'Ai có quyền truy cập (Who has access)' thành 'Bất kỳ ai (Anyone)'.",
        });
      }

      let parsed = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        // Không parse được JSON
      }

      if (parsed && (parsed.success || parsed.status === "ok" || parsed.folderId)) {
        return NextResponse.json({
          success: true,
          message:
            "Kết nối Google Apps Script thành công 100%! Hệ thống đã sẵn sàng tự động tạo thư mục và tải ảnh vào Drive của trường.",
        });
      }

      return NextResponse.json({
        success: false,
        error:
          "Webhook phản hồi nhưng chưa đúng cấu trúc chuẩn. Vui lòng kiểm tra lại mã Apps Script đã sao chép đủ chưa.",
        raw: responseText.slice(0, 200),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({
        success: false,
        error: `Không thể kết nối tới Google Apps Script: ${msg}`,
      });
    }
  } catch (error) {
    console.error("Test webhook error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi kiểm tra Webhook" },
      { status: 500 }
    );
  }
}
