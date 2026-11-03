const { execSync } = require('child_process');

console.log('--- [BUILD SCRIPT] Bắt đầu quá trình build an toàn (Zero Data Mutation) ---');

// 1. Luôn generate Prisma Client cho Next.js runtime
try {
  console.log('🔄 Đang chạy: prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (err) {
  console.error('❌ Lỗi khi generate Prisma Client:', err);
  process.exit(1);
}

// 2. Tiến hành Next.js build (Tuyệt đối không chạy script chỉnh sửa CSDL trong bước build)
try {
  console.log('🚀 Đang chạy: next build...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('🎉 Build hoàn tất thành công!');
} catch (err) {
  console.error('❌ Build Next.js thất bại:', err);
  process.exit(1);
}
