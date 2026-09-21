import express from 'express';
import crypto from 'crypto';
import { query, withTransaction } from '../db.js';
import { requireAuth, requireAdmin, hashPassword, generateTempPassword } from '../auth.js';

const router = express.Router();

function rowToEnumerator(e) {
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
    avatar: e.avatar || undefined,
  };
}

// GET /api/enumerators  (Admin xem tất cả)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await query('SELECT * FROM enumerators ORDER BY created_at ASC');
  res.json(rows.map(rowToEnumerator));
});

// POST /api/enumerators — tạo ĐTV mới + tự động tạo tài khoản đăng nhập với mật khẩu tạm ngẫu nhiên.
// Trả về mật khẩu tạm 1 LẦN DUY NHẤT — Admin phải copy gửi cho ĐTV ngay.
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { code, name, phone, email, username, assignedCommunes, assignedWards, status } = req.body || {};
  if (!name || !username) {
    return res.status(400).json({ error: 'Thiếu họ tên hoặc tên đăng nhập.' });
  }
  const { rows: existing } = await query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.length > 0) {
    return res.status(409).json({ error: `Tên đăng nhập "${username}" đã tồn tại, vui lòng chọn tên khác.` });
  }

  const id = crypto.randomUUID();
  const tempPassword = generateTempPassword();

  await withTransaction(async (client) => {
    await client.query(`
      INSERT INTO enumerators (id, code, name, phone, email, username, assigned_communes, assigned_wards, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      id, code || '', name, phone || '', email || '', username,
      JSON.stringify(assignedCommunes || []), JSON.stringify(assignedWards || []), status || 'active',
    ]);

    await client.query(`
      INSERT INTO users (id, username, password_hash, role, enumerator_id, must_change_password)
      VALUES ($1, $2, $3, 'enumerator', $4, TRUE)
    `, [crypto.randomUUID(), username, hashPassword(tempPassword), id]);
  });

  const { rows } = await query('SELECT * FROM enumerators WHERE id = $1', [id]);
  res.status(201).json({ enumerator: rowToEnumerator(rows[0]), tempPassword });
});

// PUT /api/enumerators/:id  (cập nhật thông tin, KHÔNG đổi mật khẩu ở đây)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { code, name, phone, email, assignedCommunes, assignedWards, status } = req.body || {};
  const { rows: existingRows } = await query('SELECT * FROM enumerators WHERE id = $1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy ĐTV.' });

  await query(`
    UPDATE enumerators SET code = $1, name = $2, phone = $3, email = $4, assigned_communes = $5,
      assigned_wards = $6, status = $7, updated_at = NOW()
    WHERE id = $8
  `, [
    code ?? existing.code,
    name ?? existing.name,
    phone ?? existing.phone,
    email ?? existing.email,
    JSON.stringify(assignedCommunes ?? JSON.parse(existing.assigned_communes || '[]')),
    JSON.stringify(assignedWards ?? JSON.parse(existing.assigned_wards || '[]')),
    status ?? existing.status,
    req.params.id,
  ]);

  const { rows } = await query('SELECT * FROM enumerators WHERE id = $1', [req.params.id]);
  res.json(rowToEnumerator(rows[0]));
});

// DELETE /api/enumerators/:id
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await query('DELETE FROM users WHERE enumerator_id = $1', [req.params.id]);
  await query('DELETE FROM enumerators WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// POST /api/enumerators/:id/reset-password
router.post('/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE enumerator_id = $1', [req.params.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản đăng nhập của ĐTV này.' });
  const tempPassword = generateTempPassword();
  await query('UPDATE users SET password_hash = $1, must_change_password = TRUE WHERE id = $2', [hashPassword(tempPassword), user.id]);
  res.json({ tempPassword });
});

export default router;
