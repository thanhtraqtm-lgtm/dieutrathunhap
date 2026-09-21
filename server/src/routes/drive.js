import express from 'express';
import * as XLSX from 'xlsx';
import { query } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';
import { rowToListing } from '../mappers.js';
import {
  isDriveConfigured,
  getRootFolderId,
  findOrCreateFolder,
  uploadOrUpdateFile,
} from '../googleDrive.js';

const router = express.Router();

function rowToSampleFull(r) {
  const household = JSON.parse(r.household_json || '{}');
  return {
    ...household,
    id: r.id,
    sampleType: r.sample_type,
    sampleOrder: r.sample_order,
    assignedEnumeratorName: r.assigned_enumerator_name || '',
    surveyStatus: r.survey_status,
    progressPercent: r.progress_percent,
    completedAt: r.completed_at || '',
  };
}

// GET /api/drive/status — cho frontend biết Google Drive đã được cấu hình (Admin đã làm theo
// hướng dẫn thiết lập Service Account) hay chưa, để KHÔNG hiển thị như thể đã đồng bộ thật.
router.get('/status', requireAuth, requireAdmin, (req, res) => {
  res.json({ configured: isDriveConfigured() });
});

// Logic sao lưu dùng chung — được gọi cả từ route POST /backup (Admin bấm tay) LẪN từ bộ đếm
// giờ tự động trong index.js (không cần Admin nhớ bấm).
export async function performFullBackup() {
  const { rows: enumerators } = await query('SELECT * FROM enumerators');
  const { rows: listingRows } = await query('SELECT * FROM household_listings');
  const listings = listingRows.map(rowToListing);
  const { rows: sampleRows } = await query('SELECT * FROM sample_households');
  const samples = sampleRows.map(r => ({
    ...JSON.parse(r.household_json || '{}'),
    id: r.id,
    sampleType: r.sample_type,
    sampleOrder: r.sample_order,
    assignedEnumeratorId: r.assigned_enumerator_id,
    assignedEnumeratorName: r.assigned_enumerator_name,
    surveyStatus: r.survey_status,
    progressPercent: r.progress_percent,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    samplingNote: r.sampling_note,
    surveyData: r.survey_data_json ? JSON.parse(r.survey_data_json) : undefined,
    incomeSurveyData: r.income_survey_data_json ? JSON.parse(r.income_survey_data_json) : undefined,
    fakeIpDetails: r.fake_ip_details_json ? JSON.parse(r.fake_ip_details_json) : undefined,
  }));

  const backupPayload = {
    exportedAt: new Date().toISOString(),
    enumeratorsCount: enumerators.length,
    listingsCount: listings.length,
    samplesCount: samples.length,
    enumerators: enumerators.map(e => ({
      id: e.id, code: e.code, name: e.name, phone: e.phone, email: e.email, username: e.username,
      assignedCommunes: JSON.parse(e.assigned_communes || '[]'),
      assignedWards: JSON.parse(e.assigned_wards || '[]'),
      status: e.status,
    })),
    listings,
    samples,
  };

  const buffer = Buffer.from(JSON.stringify(backupPayload, null, 2), 'utf-8');
  const rootId = getRootFolderId();
  const backupFolderId = await findOrCreateFolder('Sao_Luu_Du_Lieu_TKCS', rootId);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fileName = `backup_${timestamp}.json`;
  const result = await uploadOrUpdateFile(fileName, backupFolderId, buffer, 'application/json');
  await uploadOrUpdateFile('backup_moi_nhat.json', backupFolderId, buffer, 'application/json');

  return {
    fileName,
    fileLink: result.webViewLink,
    counts: { enumerators: enumerators.length, listings: listings.length, samples: samples.length },
  };
}

router.post('/backup', requireAuth, requireAdmin, async (req, res) => {
  if (!isDriveConfigured()) {
    return res.status(400).json({ error: 'Chưa cấu hình Google Drive trên server. Xem HUONG_DAN_DEPLOY.md để thiết lập.' });
  }
  try {
    const result = await performFullBackup();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Lỗi sao lưu Google Drive:', err);
    res.status(500).json({ error: `Lỗi khi đẩy dữ liệu lên Google Drive: ${err.message}` });
  }
});

router.post('/export-reports', requireAuth, requireAdmin, async (req, res) => {
  if (!isDriveConfigured()) {
    return res.status(400).json({ error: 'Chưa cấu hình Google Drive trên server. Xem HUONG_DAN_DEPLOY.md để thiết lập.' });
  }

  try {
    const allSamples = (await query('SELECT * FROM sample_households ORDER BY commune_code, sample_order')).rows;
    if (allSamples.length === 0) {
      return res.status(400).json({ error: 'Chưa có hộ mẫu nào để xuất báo cáo.' });
    }

    const byCommune = new Map();
    allSamples.forEach(r => {
      const key = r.commune_code || 'Chua_xac_dinh';
      if (!byCommune.has(key)) byCommune.set(key, []);
      byCommune.get(key).push(rowToSampleFull(r));
    });

    const rootId = getRootFolderId();
    const reportsFolderId = await findOrCreateFolder('Bao_Cao_TKCS', rootId);

    const uploadedFiles = [];
    for (const [communeCode, samples] of byCommune.entries()) {
      const communeName = samples[0]?.communeName || communeCode;
      const rows = samples.map((s, idx) => ({
        'STT Mẫu': idx + 1,
        'Loại Mẫu': s.sampleType === 'official' ? 'Chính thức' : 'Dự phòng',
        'Mã TKCS': s.tkcsCode || '',
        'Địa bàn': s.areaCode || '',
        'Tên chủ hộ': s.ownerName || s.householdName || '',
        'Địa chỉ': s.address || '',
        'ĐTV phụ trách': s.assignedEnumeratorName || '',
        'Trạng thái': s.surveyStatus,
        'Tiến độ (%)': s.progressPercent,
        'Hoàn thành lúc': s.completedAt || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BaoCao');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const safeCommuneName = String(communeName).replace(/[\\/:*?"<>|]/g, '_');
      const communeFolderId = await findOrCreateFolder(`${communeCode}_${safeCommuneName}`, reportsFolderId);
      const fileName = `BaoCao_${safeCommuneName}.xlsx`;
      const result = await uploadOrUpdateFile(
        fileName,
        communeFolderId,
        buffer,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      uploadedFiles.push({ communeCode, communeName, fileName, fileLink: result.webViewLink });
    }

    res.json({ success: true, files: uploadedFiles });
  } catch (err) {
    console.error('Lỗi xuất báo cáo Google Drive:', err);
    res.status(500).json({ error: `Lỗi khi đẩy báo cáo lên Google Drive: ${err.message}` });
  }
});

// GET /api/drive/cron-backup — dùng cho Vercel Cron Jobs gọi định kỳ tự động (xem vercel.json).
// Vercel Cron tự gửi kèm header Authorization: Bearer <CRON_SECRET> nếu biến môi trường CRON_SECRET
// được khai báo — route này kiểm tra đúng bí mật đó thay vì yêu cầu đăng nhập Admin thông thường,
// vì đây là tác vụ hệ thống tự gọi, không phải người dùng bấm tay.
router.get('/cron-backup', async (req, res) => {
  const expected = process.env.CRON_SECRET;
  const header = req.headers.authorization || '';
  if (!expected || header !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Không có quyền gọi endpoint này.' });
  }
  if (!isDriveConfigured()) {
    return res.json({ skipped: true, reason: 'Chưa cấu hình Google Drive.' });
  }
  try {
    const result = await performFullBackup();
    console.log(`✅ [Cron] Đã tự động sao lưu lên Google Drive: ${result.fileName}`);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('⚠️ [Cron] Tự động sao lưu Google Drive thất bại:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
