import express from 'express';
import crypto from 'crypto';
import { query, withTransaction } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';
import { rowToListing } from '../mappers.js';

const router = express.Router();

// Chia đều `total` suất cho 4 nhóm ngành theo tỷ trọng, làm tròn theo phần dư lớn nhất
// để tổng luôn khớp chính xác bằng `total`.
function allocateQuotaBySector(total, sectorProportions) {
  const quota = { 1: 0, 2: 0, 3: 0, 4: 0 };
  if (total <= 0) return quota;
  const raw = [1, 2, 3, 4].map(c => ({ c, val: total * sectorProportions[c] }));
  let allocated = 0;
  raw.forEach(r => { quota[r.c] = Math.floor(r.val); allocated += quota[r.c]; });
  let remaining = total - allocated;
  const byRemainder = [...raw].sort((a, b) => (b.val - Math.floor(b.val)) - (a.val - Math.floor(a.val)));
  let i = 0;
  while (remaining > 0 && byRemainder.length > 0) {
    quota[byRemainder[i % byRemainder.length].c]++;
    remaining--;
    i++;
  }
  return quota;
}

function pickSystematic(list, want) {
  if (want <= 0 || list.length === 0) return { picked: [], k: 0, r: 0 };
  const n = Math.min(want, list.length);
  const k = Math.max(1, Math.floor(list.length / n));
  const r = Math.floor(Math.random() * k) + 1;
  const idxs = [];
  for (let i = 0; i < n; i++) {
    const idx = (r - 1 + i * k) % list.length;
    if (!idxs.includes(idx)) idxs.push(idx);
  }
  return { picked: idxs.map(i => list[i]), k, r };
}

// POST /api/sampling/run
// { communeCode, householdsPerArea=10, reservePerArea=4, samplingMethod='stratified_by_income' }
// Chọn mẫu HỆ THỐNG THEO TỪNG ĐỊA BÀN: tính tỷ trọng 4 nhóm ngành trên TOÀN XÃ, áp tỷ trọng đó vào
// chỉ tiêu householdsPerArea/reservePerArea của MỖI địa bàn; thiếu ngành nào thì bù bằng hộ ngành khác
// trong CHÍNH địa bàn đó. Ghi kết quả vào bảng sample_households (server) -> mọi thiết bị đăng nhập vào
// đều thấy CHUNG một kết quả chọn mẫu này.
router.post('/run', requireAuth, requireAdmin, async (req, res) => {
  const {
    communeCode,
    householdsPerArea = 10,
    reservePerArea = 4,
    samplingMethod = 'stratified_by_income',
  } = req.body || {};

  if (!communeCode) return res.status(400).json({ error: 'Thiếu mã xã (communeCode).' });

  const { rows: listingRows } = await query('SELECT * FROM household_listings WHERE commune_code = $1', [communeCode]);
  const communeHouseholds = listingRows.map(rowToListing);
  const N = communeHouseholds.length;
  if (N === 0) {
    return res.status(400).json({ error: `Không tìm thấy hộ nào trong bảng kê thuộc xã mã: ${communeCode}` });
  }

  const { rows: enumeratorRows } = await query('SELECT * FROM enumerators WHERE status = $1', ['active']);
  const enumerators = enumeratorRows.map(e => ({
    id: e.id,
    name: e.name,
    assignedCommunes: JSON.parse(e.assigned_communes || '[]'),
    assignedWards: JSON.parse(e.assigned_wards || '[]'),
  }));
  const getEnumeratorForHousehold = (commCode, areaCode) => {
    const matched = enumerators.find(e =>
      e.assignedCommunes.includes(commCode) &&
      (e.assignedWards.includes(areaCode) || e.assignedWards.length === 0)
    );
    return matched || enumerators[0] || null;
  };

  // BƯỚC 1: Tỷ trọng 4 nhóm ngành trên TOÀN XÃ
  const sectorTotalsCommune = { 1: 0, 2: 0, 3: 0, 4: 0 };
  communeHouseholds.forEach(h => {
    const sec = h.mainIncomeSourceCode || 4;
    sectorTotalsCommune[sec] = (sectorTotalsCommune[sec] || 0) + 1;
  });
  const sectorProportions = { 1: 0, 2: 0, 3: 0, 4: 0 };
  [1, 2, 3, 4].forEach(c => { sectorProportions[c] = N > 0 ? sectorTotalsCommune[c] / N : 0.25; });

  const areaMap = new Map();
  communeHouseholds.forEach(h => {
    const key = h.areaCode || 'Chưa xác định';
    if (!areaMap.has(key)) areaMap.set(key, []);
    areaMap.get(key).push(h);
  });

  const officialSamples = [];
  const reserveSamples = [];
  let orderCounter = 0;
  let lastK = 0, lastR = 0, compensatedCount = 0;

  const areaCodesSorted = Array.from(areaMap.keys()).sort((a, b) => a.localeCompare(b, 'vi'));

  areaCodesSorted.forEach(areaCode => {
    const areaList = areaMap.get(areaCode);
    const areaN = areaList.length;

    const bySector = { 1: [], 2: [], 3: [], 4: [] };
    areaList.forEach(h => {
      const sec = h.mainIncomeSourceCode || 4;
      (bySector[sec] || bySector[4]).push(h);
    });

    let selectedOfficial = [];
    const selectedIds = new Set();

    if (samplingMethod === 'stratified_by_income') {
      const officialQuota = allocateQuotaBySector(Math.min(householdsPerArea, areaN), sectorProportions);
      [1, 2, 3, 4].forEach(sec => {
        const { picked, k, r } = pickSystematic(bySector[sec], officialQuota[sec]);
        if (k) { lastK = k; lastR = r; }
        picked.forEach(hh => { selectedOfficial.push(hh); selectedIds.add(hh.id); });
      });
      const officialTarget = Math.min(householdsPerArea, areaN);
      let deficit = officialTarget - selectedOfficial.length;
      if (deficit > 0) {
        const leftoverPool = areaList.filter(h => !selectedIds.has(h.id));
        const filled = leftoverPool.slice(0, deficit);
        filled.forEach(hh => { selectedOfficial.push(hh); selectedIds.add(hh.id); });
        compensatedCount += filled.length;
      }
    } else {
      const sorted = [...areaList].sort((a, b) => (a.stt || 0) - (b.stt || 0));
      const { picked, k, r } = pickSystematic(sorted, Math.min(householdsPerArea, areaN));
      if (k) { lastK = k; lastR = r; }
      selectedOfficial = picked;
      selectedOfficial.forEach(hh => selectedIds.add(hh.id));
    }

    const remainingAfterOfficial = areaList.filter(h => !selectedIds.has(h.id));
    let selectedReserve = [];
    const reserveTarget = Math.min(reservePerArea, remainingAfterOfficial.length);

    if (samplingMethod === 'stratified_by_income') {
      const remBySector = { 1: [], 2: [], 3: [], 4: [] };
      remainingAfterOfficial.forEach(h => {
        const sec = h.mainIncomeSourceCode || 4;
        (remBySector[sec] || remBySector[4]).push(h);
      });
      const reserveQuota = allocateQuotaBySector(reserveTarget, sectorProportions);
      const reserveIds = new Set();
      [1, 2, 3, 4].forEach(sec => {
        const want = Math.min(reserveQuota[sec], remBySector[sec].length);
        remBySector[sec].slice(0, want).forEach(hh => { selectedReserve.push(hh); reserveIds.add(hh.id); });
      });
      let rDeficit = reserveTarget - selectedReserve.length;
      if (rDeficit > 0) {
        const leftover = remainingAfterOfficial.filter(h => !reserveIds.has(h.id));
        const filled = leftover.slice(0, rDeficit);
        filled.forEach(hh => { selectedReserve.push(hh); reserveIds.add(hh.id); });
        compensatedCount += filled.length;
      }
    } else {
      selectedReserve = remainingAfterOfficial.slice(0, reserveTarget);
    }

    const areaShortNote = areaN < householdsPerArea
      ? `Địa bàn ${areaCode} chỉ có ${areaN} hộ trong bảng kê (thiếu ${householdsPerArea - areaN} so với chỉ tiêu ${householdsPerArea} hộ/địa bàn)`
      : null;

    selectedOfficial.forEach(hh => {
      orderCounter++;
      const dtv = getEnumeratorForHousehold(communeCode, areaCode);
      officialSamples.push({ hh, sampleType: 'official', sampleOrder: orderCounter, dtv, samplingNote: areaShortNote });
    });
    selectedReserve.forEach(hh => {
      orderCounter++;
      const dtv = getEnumeratorForHousehold(communeCode, areaCode);
      reserveSamples.push({ hh, sampleType: 'reserve', sampleOrder: orderCounter, dtv, samplingNote: null });
    });
  });

  // Ghi vào DB: xoá mẫu cũ của xã này (nếu chọn lại) rồi ghi mẫu mới -> mọi thiết bị thấy ngay
  const communeName = communeHouseholds[0].communeName || communeCode;
  const allNewSamples = [...officialSamples, ...reserveSamples];

  await withTransaction(async (client) => {
    await client.query('DELETE FROM sample_households WHERE commune_code = $1', [communeCode]);
    for (const s of allNewSamples) {
      await client.query(`
        INSERT INTO sample_households (
          id, listing_id, commune_code, area_code, sample_type, sample_order,
          assigned_enumerator_id, assigned_enumerator_name, survey_status, progress_percent,
          sampling_note, household_json
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'not_started',0,$9,$10)
      `, [
        crypto.randomUUID(),
        s.hh.id,
        communeCode,
        s.hh.areaCode || '',
        s.sampleType,
        s.sampleOrder,
        s.dtv?.id || null,
        s.dtv?.name || null,
        s.samplingNote,
        JSON.stringify(s.hh),
      ]);
    }
  });

  const sectorNames = {
    1: '1. Nông lâm thủy sản',
    2: '2. Công nghiệp - Xây dựng',
    3: '3. Thương mại - Dịch vụ',
    4: '4. Nguồn khác (Lương/Trợ cấp/Khác)',
  };
  const sectorDistribution = [1, 2, 3, 4].map(code => ({
    code,
    name: sectorNames[code],
    totalCount: sectorTotalsCommune[code] || 0,
    selectedCount: officialSamples.filter(s => (s.hh.mainIncomeSourceCode || 4) === code).length,
    percentage: N > 0 ? Math.round(((sectorTotalsCommune[code] || 0) / N) * 100) : 0,
  }));

  const summary = {
    communeCode,
    communeName,
    totalListHouseholds: N,
    targetSampleSize: officialSamples.length,
    samplingRatioPercent: N > 0 ? Math.round((officialSamples.length / N) * 1000) / 10 : 0,
    samplingIntervalK: lastK,
    randomStartR: lastR,
    officialSampleCount: officialSamples.length,
    reserveSampleCount: reserveSamples.length,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    samplingMethod,
    householdsPerAreaTarget: householdsPerArea,
    reservePerAreaTarget: reservePerArea,
    areaCount: areaCodesSorted.length,
    compensatedCount,
    sectorDistribution,
  };

  await query(`
    INSERT INTO sampling_runs (id, commune_code, commune_name, summary_json, created_by)
    VALUES ($1, $2, $3, $4, $5)
  `, [crypto.randomUUID(), communeCode, communeName, JSON.stringify(summary), req.user.username]);

  res.json({ summary });
});

export default router;
