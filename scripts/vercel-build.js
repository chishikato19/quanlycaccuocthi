const { execSync } = require('child_process');

console.log('--- [BUILD SCRIPT] Bắt đầu quá trình build ---');

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  '';

if (dbUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl;
  console.log('🔗 Đã tự động ánh xạ DATABASE_URL từ biến môi trường Vercel/Neon!');
}

// 1. Luôn generate Prisma Client
try {
  console.log('🔄 Đang chạy: prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (err) {
  console.error('❌ Lỗi khi generate Prisma Client:', err);
  process.exit(1);
}

// 2. Kiểm tra biến DATABASE_URL
if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
  console.log('✅ Đã phát hiện cấu hình DATABASE_URL (PostgreSQL). Đang đồng bộ cấu trúc bảng...');
  try {
    // Không dùng cờ --accept-data-loss để đảm bảo an toàn tuyệt đối cho dữ liệu hiện có
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Đồng bộ bảng CSDL thành công (An toàn dữ liệu)!');
  } catch (err) {
    console.error('⚠️ Không thể tự động push schema:', err.message);
  }

  // Tự động seed dữ liệu ban đầu nếu database trống
  try {
    console.log('🌱 Đang kiểm tra và khởi tạo dữ liệu ban đầu (Super Admin & Giáo viên)...');
    execSync('node prisma/seed-if-empty.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('⚠️ Lỗi khi chạy seed-if-empty:', err.message);
  }

  // Tự động dọn dẹp Super Admin khỏi danh sách tham gia cuộc thi
  try {
    console.log('🧹 Đang làm sạch dữ liệu: loại bỏ Super Admin khỏi danh sách tham gia cuộc thi...');
    execSync('node scripts/cleanup-admin.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('⚠️ Lỗi cleanup-admin:', err.message);
  }
} else {
  console.warn('\n⚠️ [CHÚ Ý]: Chưa cấu hình biến môi trường DATABASE_URL dạng PostgreSQL.');
  console.warn('👉 Hãy vào Vercel Dashboard -> Tab "Storage" -> Tạo "Neon Postgres", hoặc vào Settings -> Environment Variables để thêm DATABASE_URL.\n');
}

// 3. Tiến hành Next.js build
try {
  console.log('🚀 Đang chạy: next build...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('🎉 Build hoàn tất thành công!');
} catch (err) {
  console.error('❌ Build Next.js thất bại:', err);
  process.exit(1);
}
