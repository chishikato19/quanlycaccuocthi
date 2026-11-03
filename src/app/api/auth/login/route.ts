import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/mock-data";
import {
  setSessionCookie,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  SessionUser,
} from "@/lib/auth";

/**
 * Hàm kiểm tra mã PIN hỗ trợ 2 chế độ (Dual-Mode Verification)
 * - Nếu mã PIN đã hash (bcrypt): So sánh bằng bcrypt.compare
 * - Nếu mã PIN là dạng text cũ ("1234"): So sánh trực tiếp, nếu đúng sẽ TỰ ĐỘNG nâng cấp lên hash bcrypt
 * Đảm bảo 100% không làm mất dữ liệu và nâng cấp bảo mật tự động.
 */
async function verifyAndUpgradePin(
  teacher: { id: string; pinCode: string },
  inputPin: string
): Promise<boolean> {
  const cleanInput = inputPin.trim();
  const dbPin = teacher.pinCode || "";
  const isHashed = dbPin.startsWith("$2a$") || dbPin.startsWith("$2b$") || dbPin.startsWith("$2y$");

  if (isHashed) {
    return await bcrypt.compare(cleanInput, dbPin);
  } else {
    // Dạng plain text cũ: So sánh an toàn
    if (dbPin === cleanInput) {
      try {
        const hashed = await bcrypt.hash(cleanInput, 10);
        await db.teacher.update({
          where: { id: teacher.id },
          data: { pinCode: hashed },
        });
      } catch (err) {
        console.warn("Lỗi tự động nâng cấp hash PIN:", err);
      }
      return true;
    }
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { teacherId, username, pinCode, isSuperAdminLogin } = await req.json();

    if (!pinCode || !pinCode.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập mã PIN" }, { status: 400 });
    }

    // 1. Kiểm tra cấu hình Database: Bắt buộc phải có CSDL thật, không mở backdoor demo mode
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Hệ thống chưa kết nối cơ sở dữ liệu (PostgreSQL). Vui lòng cấu hình biến môi trường DATABASE_URL để sử dụng.",
        },
        { status: 503 }
      );
    }

    // 2. ĐĂNG NHẬP TỔNG QUẢN TRỊ (SUPER ADMIN)
    if (isSuperAdminLogin || username) {
      const inputUsername = (username || "").trim().toLowerCase();
      const rateKey = `admin_login_${inputUsername || "admin"}`;

      // Chống brute-force: tối đa 5 lần sai trong 15 phút
      const rateCheck = checkLoginRateLimit(rateKey, 5, 15 * 60 * 1000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            error: `Bạn đã nhập sai mã PIN quá nhiều lần. Vui lòng thử lại sau ${rateCheck.waitMinutes} phút.`,
          },
          { status: 429 }
        );
      }

      // Tìm tài khoản Super Admin CHÍNH XÁC (Tuyệt đối không dùng OR chứa số điện thoại tùy ý từ input)
      let superAdmin = await db.teacher.findFirst({
        where: {
          isActive: true,
          role: "SUPER_ADMIN",
        },
        orderBy: [{ createdAt: "asc" }],
      });

      if (!superAdmin) {
        superAdmin = await db.teacher.findFirst({
          where: {
            isActive: true,
            phone: "admin",
          },
        });
      }

      if (!superAdmin) {
        return NextResponse.json({ error: "Tài khoản Tổng Quản Trị không tồn tại" }, { status: 404 });
      }

      // XÁC THỰC MÃ PIN TRƯỚC - TUYỆT ĐỐI KHÔNG SỬA DỮ LIỆU KHI CHƯA ĐÚNG PIN!
      const isSuperAdminPinValid = await verifyAndUpgradePin(superAdmin, pinCode);
      if (!isSuperAdminPinValid) {
        recordFailedLogin(rateKey);
        return NextResponse.json({ error: "Mật mã Tổng Quản Trị không chính xác" }, { status: 401 });
      }

      // Xác thực thành công: Reset đếm sai
      resetLoginAttempts(rateKey);

      // Đảm bảo role chính xác nếu trước đó bị sai lệch
      if (superAdmin.role !== "SUPER_ADMIN" || superAdmin.phone !== "admin") {
        superAdmin = await db.teacher.update({
          where: { id: superAdmin.id },
          data: { role: "SUPER_ADMIN", phone: "admin" },
        });
      }

      const safeUser: SessionUser = {
        id: superAdmin.id,
        name: superAdmin.name,
        department: superAdmin.department,
        role: "SUPER_ADMIN",
        phone: superAdmin.phone,
      };

      const response = NextResponse.json({
        success: true,
        user: { ...safeUser, driveFolderId: superAdmin.driveFolderId },
      });

      // Tạo và đính kèm Server-side Session HttpOnly Cookie
      setSessionCookie(response, safeUser);
      return response;
    }

    // 3. ĐĂNG NHẬP GIÁO VIÊN / NHÂN VIÊN THƯỜNG
    if (!teacherId) {
      return NextResponse.json({ error: "Vui lòng chọn tên giáo viên" }, { status: 400 });
    }

    const rateKey = `teacher_login_${teacherId}`;
    const rateCheck = checkLoginRateLimit(rateKey, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Bạn đã nhập sai mã PIN quá nhiều lần. Vui lòng thử lại sau ${rateCheck.waitMinutes} phút.`,
        },
        { status: 429 }
      );
    }

    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher || !teacher.isActive) {
      return NextResponse.json({ error: "Không tìm thấy thông tin giáo viên" }, { status: 404 });
    }

    // XÁC THỰC MÃ PIN
    const isTeacherPinValid = await verifyAndUpgradePin(teacher, pinCode);
    if (!isTeacherPinValid) {
      recordFailedLogin(rateKey);
      return NextResponse.json({ error: "Mã PIN không chính xác" }, { status: 401 });
    }

    // Xác thực thành công: Reset đếm sai
    resetLoginAttempts(rateKey);

    const safeUser: SessionUser = {
      id: teacher.id,
      name: teacher.name,
      department: teacher.department,
      role: teacher.role as "USER" | "ADMIN" | "SUPER_ADMIN",
      phone: teacher.phone,
    };

    const response = NextResponse.json({
      success: true,
      user: { ...safeUser, driveFolderId: teacher.driveFolderId },
    });

    // Tạo và đính kèm Server-side Session HttpOnly Cookie
    setSessionCookie(response, safeUser);
    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ trong quá trình đăng nhập" },
      { status: 500 }
    );
  }
}
