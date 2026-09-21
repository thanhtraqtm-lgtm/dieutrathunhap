import express from 'express';
import { query, withTransaction } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';

const router = express.Router();

function rowToSample(r) {
  const household = JSON.parse(r.household_json || '{}');
  return {
    ...household,
    id: r.id,
    sampleType: r.sample_type,
    sampleOrder: r.sample_order,
    assignedEnumeratorId: r.assigned_enumerator_id || undefined,
    assignedEnumeratorName: r.assigned_enumerator_name || undefined,
    surveyStatus: r.survey_status,
    progressPercent: r.progress_percent,
    startedAt: r.started_at || undefined,
    completedAt: r.completed_at || undefined,
    samplingNote: r.sampling_note || undefined,
    surveyData: r.survey_data_json ? JSON.parse(r.survey_data_json) : undefined,
    incomeSurveyData: r.income_survey_data_json ? JSON.parse(r.income_survey_data_json) : undefined,
    fakeIpDetails: r.fake_ip_details_json ? JSON.parse(r.fake_ip_details_json) : undefined,
    driveSynced: !!r.drive_synced,
  };
}

// GET /api/samples/mine
router.get('/mine', requireAuth, async (req, res) => {
  if (req.user.role !== 'enumerator' || !req.user.enumeratorId) {
    return res.status(403).json({ error: 'Chỉ tài khoản ĐTV mới xem được mục này.' });
  }
  const { rows } = await query(
    'SELECT * FROM sample_households WHERE assigned_enumerator_id = $1 ORDER BY sample_order ASC',
    [req.user.enumeratorId]
  );
  res.json(rows.map(rowToSample));
});

// GET /api/samples?communeCode=  (Admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { communeCode } = req.query;
  const { rows } = communeCode
    ? await query('SELECT * FROM sample_households WHERE commune_code = $1 ORDER BY sample_order ASC', [communeCode])
    : await query('SELECT * FROM sample_households ORDER BY commune_code, sample_order ASC');
  res.json(rows.map(rowToSample));
});

function canEditSample(req, row) {
  if (req.user.role === 'admin') return true;
  return req.user.role === 'enumerator' && row.assigned_enumerator_id === req.user.enumeratorId;
}

// PUT /api/samples/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { rows } = await query('SELECT * FROM sample_households WHERE id = $1', [req.params.id]);
  const row = rows[0];
  if (!row) return res.status(404).json({ error: 'Không tìm thấy hộ mẫu.' });
  if (!canEditSample(req, row)) {
    return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa hộ mẫu này (không thuộc địa bàn được phân quyền).' });
  }

  const b = req.body || {};
  await query(`
    UPDATE sample_households SET
      survey_status = COALESCE($1, survey_status),
      progress_percent = COALESCE($2, progress_percent),
      started_at = COALESCE($3, started_at),
      completed_at = COALESCE($4, completed_at),
      survey_data_json = COALESCE($5, survey_data_json),
      income_survey_data_json = COALESCE($6, income_survey_data_json),
      fake_ip_details_json = COALESCE($7, fake_ip_details_json),
      drive_synced = COALESCE($8, drive_synced),
      updated_at = NOW()
    WHERE id = $9
  `, [
    b.surveyStatus ?? null,
    b.progressPercent ?? null,
    b.startedAt ?? null,
    b.completedAt ?? null,
    b.surveyData ? JSON.stringify(b.surveyData) : null,
    b.incomeSurveyData ? JSON.stringify(b.incomeSurveyData) : null,
    b.fakeIpDetails ? JSON.stringify(b.fakeIpDetails) : null,
    typeof b.driveSynced === 'boolean' ? b.driveSynced : null,
    req.params.id,
  ]);

  const { rows: updatedRows } = await query('SELECT * FROM sample_households WHERE id = $1', [req.params.id]);
  res.json(rowToSample(updatedRows[0]));
});

// POST /api/samples/replace  { officialId, reserveId, reason }
router.post('/replace', requireAuth, requireAdmin, async (req, res) => {
  const { officialId, reserveId, reason } = req.body || {};
  const { rows: officialRows } = await query('SELECT * FROM sample_households WHERE id = $1', [officialId]);
  const { rows: reserveRows } = await query('SELECT * FROM sample_households WHERE id = $1', [reserveId]);
  if (!officialRows[0] || !reserveRows[0]) {
    return res.status(404).json({ error: 'Không tìm thấy hộ chính thức hoặc hộ dự phòng.' });
  }

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE sample_households SET sample_type = 'reserve', sampling_note = $1, updated_at = NOW() WHERE id = $2`,
      [reason ? `Đã đổi sang dự phòng: ${reason}` : 'Đã đổi sang dự phòng', officialId]
    );
    await client.query(
      `UPDATE sample_households SET sample_type = 'official', updated_at = NOW() WHERE id = $1`,
      [reserveId]
    );
  });

  res.json({ success: true });
});

export default router;
