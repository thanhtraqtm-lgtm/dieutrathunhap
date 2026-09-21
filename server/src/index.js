// Điểm khởi động khi chạy như 1 server Node TRUYỀN THỐNG (local dev, Render, VPS, PM2...).
// Trên Vercel KHÔNG dùng file này — Vercel dùng api/[...path].js ở thư mục gốc dự án,
// import thẳng app.js (không có app.listen() vì serverless không cần).
import 'dotenv/config';
import crypto from 'crypto';
import app from './app.js';
import { query, ensureSchema } from './db.js';
import { hashPassword } from './auth.js';
import { isDriveConfigured } from './googleDrive.js';
import { performFullBackup } from './routes/drive.js';

const PORT = process.env.PORT || 4000;

// Tự động tạo/cập nhật tài khoản Admin đầu tiên từ biến môi trường ADMIN_USERNAME/ADMIN_PASSWORD.
// Tiện cho việc deploy lên Render/Railway... nơi không dễ mở Shell. Trên Vercel, dùng cách khác
// (chạy npm run init-admin từ máy cá nhân, trỏ vào DATABASE_URL) — xem HUONG_DAN_DEPLOY.md.
async function bootstrapAdminFromEnv() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;

  const { rows } = await query('SELECT id FROM users WHERE username = $1', [username]);
  if (rows.length > 0) return; // đã có rồi thì không ghi đè, tránh reset mật khẩu Admin đã tự đổi

  await query(`
    INSERT INTO users (id, username, password_hash, role, enumerator_id, must_change_password)
    VALUES ($1, $2, $3, 'admin', NULL, FALSE)
  `, [crypto.randomUUID(), username, hashPassword(password)]);
  console.log(`✅ Đã tự động tạo tài khoản Admin "${username}" từ biến môi trường ADMIN_USERNAME/ADMIN_PASSWORD.`);
}

async function start() {
  await ensureSchema();
  await bootstrapAdminFromEnv();

  app.listen(PORT, () => {
    console.log(`✅ TKCS Backend đang chạy tại http://localhost:${PORT}`);
    console.log(`   Kiểm tra nhanh: http://localhost:${PORT}/api/health`);

    if (isDriveConfigured()) {
      const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
      const runBackup = () => {
        performFullBackup()
          .then(r => console.log(`✅ Đã tự động sao lưu lên Google Drive: ${r.fileName}`))
          .catch(err => console.error('⚠️ Tự động sao lưu Google Drive thất bại:', err.message));
      };
      runBackup();
      setInterval(runBackup, SIX_HOURS_MS);
    } else {
      console.log('ℹ️  Chưa cấu hình Google Drive — bỏ qua tự động sao lưu. Xem HUONG_DAN_DEPLOY.md nếu muốn bật.');
    }
  });
}

start().catch(err => {
  console.error('❌ Không khởi động được server:', err);
  process.exit(1);
});
