import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth/context/AuthContext";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Quản Lý Cuộc Thi & Báo Cáo Minh Chứng",
  description: "Hệ thống quản lý, đôn đốc và thu nhận minh chứng tham gia các cuộc thi của giáo viên và người lao động",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Báo Cáo Cuộc Thi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} min-h-screen bg-slate-50 antialiased text-slate-800`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
