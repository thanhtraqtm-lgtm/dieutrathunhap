import express from 'express';
import { query } from '../db.js';
import { verifyPassword, hashPassword, signToken, requireAuth } from '../auth.js';

const router = express.Router();

function enumeratorRowToObj(e) {
  return {
    id: e.id,
    code: e.code,
    name: e.name,
    phone: e.phone,
    email: e.email,
    username: e.username,
    assignedCommunes: JSON.parse(e.assigned_communes || '[]'),
    assignedWards: JSON.parse(e.assigned_wards || '[]'),
    status: e.status,
  };
}

// POST /api/auth/login  { username, password }
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
  }

  const { rows } = await query('SELECT * FROM users WHERE username = $1', [String(username).trim()]);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
  }

  let enumerator = null;
  if (user.role === 'enumerator' && user.enumerator_id) {
    const { rows: eRows } = await query('SELECT * FROM enumerators WHERE id = $1', [user.enumerator_id]);
    const e = eRows[0];
    if (e) {
      if (e.status !== 'active') {
        return res.status(403).json({ error: 'Tài khoản ĐTV của bạn hiện đang bị khoá (inactive). Liên hệ Admin.' });
      }
      enumerator = enumeratorRowToObj(e);
    }
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    enumeratorId: user.enumerator_id || null,
  });

  res.json({
    token,
    role: user.role,
    mustChangePassword: !!user.must_change_password,
    enumerator,
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });

  let enumerator = null;
  if (user.role === 'enumerator' && user.enumerator_id) {
    const { rows: eRows } = await query('SELECT * FROM enumerators WHERE id = $1', [user.enumerator_id]);
    if (eRows[0]) enumerator = enumeratorRowToObj(eRows[0]);
  }

  res.json({
    username: user.username,
    role: user.role,
    mustChangePassword: !!user.must_change_password,
    enumerator,
  });
});

// POST /api/auth/change-password  { oldPassword, newPassword }
router.post('/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
  }
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  if (!verifyPassword(oldPassword || '', user.password_hash)) {
    return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng.' });
  }
  const newHash = hashPassword(newPassword);
  await query('UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2', [newHash, user.id]);
  res.json({ success: true });
});

export default router;
