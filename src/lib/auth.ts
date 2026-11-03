import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export interface SessionUser {
  id: string;
  name: string;
  department: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  phone?: string | null;
}

export const SESSION_COOKIE_NAME = "auth_session_token";
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.DATABASE_URL ||
  "app-van-thu-secure-session-salt-2026";

/**
 * Ký và tạo chuỗi token phiên đăng nhập an toàn bằng HMAC-SHA256
 */
export function signSession(
  payload: SessionUser,
  expiresInMs = 30 * 24 * 60 * 60 * 1000
): string {
  const expiresAt = Date.now() + expiresInMs;
  const data = JSON.stringify({ ...payload, exp: expiresAt });
  const base64Data = Buffer.from(data).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Data)
    .digest("base64url");
  return `${base64Data}.${signature}`;
}

/**
 * Xác thực token phiên đăng nhập
 */
export function verifySession(token: string): SessionUser | null {
  if (!token || !token.includes(".")) return null;
  const [base64Data, signature] = token.split(".");
  if (!base64Data || !signature) return null;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(base64Data)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const json = JSON.parse(Buffer.from(base64Data, "base64url").toString("utf8"));
    if (json.exp && Date.now() > json.exp) {
      return null;
    }

    const { exp, ...user } = json;
    return user as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Lấy thông tin phiên đăng nhập đã xác thực từ HttpOnly Cookie ở Server
 */
export function getServerSession(): SessionUser | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}

/**
 * Gắn Cookie phiên đăng nhập an toàn vào phản hồi
 */
export function setSessionCookie(response: NextResponse, user: SessionUser): void {
  const token = signSession(user);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
  });
}

/**
 * Xóa Cookie phiên đăng nhập
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Middleware kiểm tra phân quyền phía Server
 */
export function requireAuth(allowedRoles?: Array<"USER" | "ADMIN" | "SUPER_ADMIN">): {
  user: SessionUser | null;
  errorResponse?: NextResponse;
} {
  const user = getServerSession();
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Vui lòng đăng nhập để thực hiện thao tác này" },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole =
      user.role === "SUPER_ADMIN" ||
      allowedRoles.includes(user.role);

    if (!hasRole) {
      return {
        user,
        errorResponse: NextResponse.json(
          { error: "Bạn không có quyền thực hiện thao tác này" },
          { status: 403 }
        ),
      };
    }
  }

  return { user };
}

// -------------------------------------------------------------
// CHỐNG TẤN CÔNG BRUTE-FORCE MÃ PIN (RATE LIMITER)
// -------------------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();

export function checkLoginRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now > record.resetAt) {
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    const waitMinutes = Math.ceil((record.resetAt - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  return { allowed: true };
}

export function recordFailedLogin(key: string, windowMs = 15 * 60 * 1000): void {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    record.count += 1;
  }
}

export function resetLoginAttempts(key: string): void {
  loginAttempts.delete(key);
}
