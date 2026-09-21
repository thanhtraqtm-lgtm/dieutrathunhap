import express from 'express';
import crypto from 'crypto';
import { query, withTransaction } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';
import { rowToListing } from '../mappers.js';

const router = express.Router();

// GET /api/listings?communeCode=xxx  (chỉ Admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { communeCode } = req.query;
  const { rows } = communeCode
    ? await query('SELECT * FROM household_listings WHERE commune_code = $1 ORDER BY stt ASC', [communeCode])
    : await query('SELECT * FROM household_listings ORDER BY commune_code, stt ASC');
  res.json(rows.map(rowToListing));
});

// GET /api/listings/communes  -> danh sách các xã hiện có trong bảng kê (mã + tên + số hộ)
router.get('/communes', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await query(`
    SELECT commune_code as code, commune_name as name, COUNT(*) as count
    FROM household_listings GROUP BY commune_code, commune_name ORDER BY commune_code
  `);
  res.json(rows.map(r => ({ ...r, count: Number(r.count) })));
});

// POST /api/listings/import  { listings: HouseholdListing[] }
router.post('/import', requireAuth, requireAdmin, async (req, res) => {
  const { listings } = req.body || {};
  if (!Array.isArray(listings) || listings.length === 0) {
    return res.status(400).json({ error: 'Không có dữ liệu hộ nào để nhập.' });
  }

  await withTransaction(async (client) => {
    for (const l of listings) {
      await client.query(`
        INSERT INTO household_listings (
          id, stt, province_code, province_name, district_code, district_name,
          commune_code, commune_name, area_code, tkcs_code, household_name, owner_name,
          address, industry_code, industry_name, phone, estimated_revenue, worker_count,
          notes, member_count, main_income_source_code, urban_rural, reviewer_name,
          reviewer_phone, survey_listing_type
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      `, [
        l.id || crypto.randomUUID(),
        l.stt ?? 0,
        l.provinceCode || '',
        l.provinceName || '',
        l.districtCode || '',
        l.districtName || '',
        l.communeCode || '',
        l.communeName || '',
        l.areaCode || '',
        l.tkcsCode || '',
        l.householdName || '',
        l.ownerName || '',
        l.address || '',
        l.industryCode || '',
        l.industryName || '',
        l.phone || '',
        l.estimatedRevenue ?? null,
        l.workerCount ?? null,
        l.notes || '',
        l.memberCount ?? null,
        l.mainIncomeSourceCode ?? null,
        l.urbanRural || '',
        l.reviewerName || '',
        l.reviewerPhone || '',
        l.surveyListingType || 'income',
      ]);
    }
  });

  res.status(201).json({ inserted: listings.length });
});

// DELETE /api/listings/commune/:communeCode
router.delete('/commune/:communeCode', requireAuth, requireAdmin, async (req, res) => {
  const result = await query('DELETE FROM household_listings WHERE commune_code = $1', [req.params.communeCode]);
  res.json({ deleted: result.rowCount });
});

export default router;
