import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/mock-data";

export async function GET() {
  const sessionUser = getServerSession();
  if (!sessionUser) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  // Nếu DB đã kết nối, kiểm tra lại trạng thái tài khoản thực tế
  if (isDatabaseConfigured()) {
    try {
      const liveUser = await db.teacher.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          name: true,
          department: true,
          phone: true,
          role: true,
          isActive: true,
          driveFolderId: true,
        },
      });

      if (!liveUser || !liveUser.isActive) {
        return NextResponse.json({ authenticated: false, user: null });
      }

      return NextResponse.json({
        authenticated: true,
        user: liveUser,
      });
    } catch {
      // Fallback về session token nếu DB gặp lỗi tạm thời
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: sessionUser,
  });
}
