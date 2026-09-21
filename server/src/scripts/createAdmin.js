// Chạy để tạo/cập nhật tài khoản Admin đầu tiên. Vì database giờ là Postgres (Neon/Supabase...),
// có thể chạy lệnh này TỪ MÁY CÁ NHÂN, chỉ cần biết chuỗi kết nối DATABASE_URL của Postgres cloud.
// Cách dùng:
//   DATABASE_URL="postgresql://..." node src/scripts/createAdmin.js admin "MatKhauManh123!"
// hoặc:
//   DATABASE_URL="postgresql://..." ADMIN_USERNAME=admin ADMIN_PASSWORD="MatKhauManh123!" node src/scripts/createAdmin.js
import crypto from 'crypto';
import { query, ensureSchema, pool } from '../db.js';
import { hashPassword } from '../auth.js';

const argUsername = process.argv[2];
const argPassword = process.argv[3];

const username = argUsername || process.env.ADMIN_USERNAME;
const password = argPassword || process.env.ADMIN_PASSWORD;

if (!process.env.DATABASE_URL) {
  console.error('❌ Thiếu biến môi trường DATABASE_URL (chuỗi kết nối Postgres).');
  process.exit(1);
}
if (!username || !password) {
  console.error('❌ Thiếu tên đăng nhập hoặc mật khẩu.');
  console.error('   Dùng: DATABASE_URL="..." node src/scripts/createAdmin.js <username> <password>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('❌ Mật khẩu Admin nên dài tối thiểu 8 ký tự.');
  process.exit(1);
}

async function main() {
  await ensureSchema();

  const { rows } = await query('SELECT id FROM users WHERE username = $1', [username]);
  if (rows.length > 0) {
    await query('UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE username = $2', [
      hashPassword(password),
      username,
    ]);
    console.log(`✅ Đã CẬP NHẬT mật khẩu cho tài khoản Admin đã có: "${username}"`);
  } else {
    await query(`
      INSERT INTO users (id, username, password_hash, role, enumerator_id, must_change_password)
      VALUES ($1, $2, $3, 'admin', NULL, FALSE)
    `, [crypto.randomUUID(), username, hashPassword(password)]);
    console.log(`✅ Đã TẠO tài khoản Admin mới: "${username}"`);
  }
  console.log('Giờ có thể đăng nhập bằng tài khoản này.');
  await pool.end();
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
