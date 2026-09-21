process.env.TZ = 'Asia/Ho_Chi_Minh';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// QUAN TRỌNG: khi triển khai thật, đặt biến môi trường JWT_SECRET riêng, dài, ngẫu nhiên
// (VD: chạy `openssl rand -hex 32`) — KHÔNG dùng giá trị mặc định này ở môi trường thật.
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_DEV_ONLY_INSECURE_SECRET';
const TOKEN_EXPIRY = '30d'; // ĐTV cần đăng nhập lại sau 12 giờ để đảm bảo an toàn

export function hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, 10);
}

export function verifyPassword(plainPassword, hash) {
  return bcrypt.compareSync(plainPassword, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Middleware: yêu cầu đã đăng nhập (mọi role)
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng đăng nhập lại.' });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { userId, username, role, enumeratorId }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' });
  }
}

// Middleware: yêu cầu role = admin
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ tài khoản Quản trị (Admin) mới được thực hiện thao tác này.' });
  }
  next();
}

// Sinh mật khẩu tạm ngẫu nhiên (dùng khi Admin tạo ĐTV mới) — dễ đọc, dễ gõ trên điện thoại
export function generateTempPassword() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // bỏ ký tự dễ nhầm 0/O, 1/I/L
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
