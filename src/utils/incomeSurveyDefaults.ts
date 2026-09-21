import { SampleHousehold } from '../types/survey';
import { HouseholdIncomeSurveyData, ProductionIncomeRow } from '../types/householdIncomeSurvey';

export function createDefaultIncomeSurvey(sample: SampleHousehold, enumeratorName?: string): HouseholdIncomeSurveyData {
  const membersCount = sample.memberCount || 4;
  const workingCount = Math.min(sample.workerCount || 2, membersCount);
  const mainSource = sample.mainIncomeSourceCode || 1;

  // Xử lý mã xã 6 ô, mã địa bàn 3 ô, mã hộ 3 ô
  const cleanCommuneCode = (sample.communeCode || '00101').replace(/\D/g, '').padEnd(6, '0').slice(0, 6);
  const cleanAreaCode = (sample.areaCode || '001').replace(/\D/g, '').padEnd(3, '0').slice(0, 3);
  const cleanHhNumber = String(sample.stt || 1).padStart(3, '0').slice(-3);

  // Khởi tạo Mục 1: Tiền lương, tiền công
  const hasSalary = mainSource === 4 || mainSource === 2;
  const section1Members = hasSalary ? [
    {
      id: 'sal-1',
      memberCode: '1',
      fullName: sample.ownerName || sample.householdName,
      mainJobDescription: mainSource === 2 ? 'Công nhân cơ khí / Thợ xây dựng' : 'Viên chức / Nhân viên văn phòng',
      salaryAndWages: 84000, // 84 triệu/năm (7 tr/tháng)
      pensionAndAllowances: 0,
    },
    ...(membersCount > 2 ? [{
      id: 'sal-2',
      memberCode: '2',
      fullName: 'Vợ/Chồng chủ hộ',
      mainJobDescription: 'Công nhân may mặc khu công nghiệp',
      salaryAndWages: 72000, // 72 triệu/năm (6 tr/tháng)
      pensionAndAllowances: 0,
    }] : [])
  ] : [];

  const totalSalary1 = section1Members.reduce((sum, m) => sum + m.salaryAndWages, 0);
  const totalPension1 = section1Members.reduce((sum, m) => sum + m.pensionAndAllowances, 0);
  const q2Sec1 = totalSalary1 + totalPension1;

  // Khởi tạo Mục 2: Trồng trọt
  const hasCrops = mainSource === 1;
  const cropRows: ProductionIncomeRow[] = hasCrops ? [
    {
      id: 'crop-1',
      stt: '1.1',
      name: 'Cây lúa (vụ Đông Xuân và Mùa)',
      soldValue: 38000,
      selfUsedValue: 12000,
      totalRevenue: 50000,
      seedCost: 3500,
      fertilizerOrFeedCost: 14500,
      otherCost: 4000,
      totalCost: 22000,
      netIncome: 28000,
    },
    {
      id: 'crop-2',
      stt: '1.2',
      name: 'Rau củ các loại (rau muống, bắp cải, su hào)',
      soldValue: 26000,
      selfUsedValue: 4000,
      totalRevenue: 30000,
      seedCost: 2000,
      fertilizerOrFeedCost: 6000,
      otherCost: 2000,
      totalCost: 10000,
      netIncome: 20000,
    }
  ] : [];

  const breedingSeedRow2: ProductionIncomeRow = {
    id: 'crop-seed',
    stt: '2',
    name: 'Nhân giống và chăm sóc giống',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
  };

  const byProductsRow2: ProductionIncomeRow = {
    id: 'crop-byproduct',
    stt: '3',
    name: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt',
    soldValue: hasCrops ? 2000 : 0,
    selfUsedValue: hasCrops ? 1500 : 0,
    totalRevenue: hasCrops ? 3500 : 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: hasCrops ? 3500 : 0,
    disableSeed: true,
    disableFertilizerOrFeed: true,
  };

  const servicesRow2: ProductionIncomeRow = {
    id: 'crop-services',
    stt: '4',
    name: 'Dịch vụ trồng trọt (làm đất, gặt đập, phun thuốc thuê...)',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
    disableSold: true,
    disableSelfUsed: true,
    disableSeed: true,
    disableFertilizerOrFeed: true,
  };

  const compensationRow2: ProductionIncomeRow = {
    id: 'crop-compensation',
    stt: '5',
    name: 'Tiền được đền bù/hỗ trợ thiệt hại về trồng trọt do dịch bệnh, thiên tai, môi trường',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
    disableSold: true,
    disableSelfUsed: true,
    disableTotalRevenue: true,
    disableSeed: true,
    disableFertilizerOrFeed: true,
    disableOtherCost: true,
    disableTotalCost: true,
  };

  const allCropRows = [...cropRows, breedingSeedRow2, byProductsRow2, servicesRow2, compensationRow2];
  const sec2Total = {
    soldValue: allCropRows.reduce((s, r) => s + (r.soldValue || 0), 0),
    selfUsedValue: allCropRows.reduce((s, r) => s + (r.selfUsedValue || 0), 0),
    totalRevenue: allCropRows.reduce((s, r) => s + (r.totalRevenue || 0), 0),
    seedCost: allCropRows.reduce((s, r) => s + (r.seedCost || 0), 0),
    fertilizerCost: allCropRows.reduce((s, r) => s + (r.fertilizerOrFeedCost || 0), 0),
    otherCost: allCropRows.reduce((s, r) => s + (r.otherCost || 0), 0),
    totalCost: allCropRows.reduce((s, r) => s + (r.totalCost || 0), 0),
    netIncome: allCropRows.reduce((s, r) => s + (r.netIncome || 0), 0),
  };

  // Khởi tạo Mục 3: Chăn nuôi
  const hasLivestock = hasCrops; // thường hộ nông nghiệp nuôi thêm lợn, gà
  const livestockRows: ProductionIncomeRow[] = hasLivestock ? [
    {
      id: 'live-1',
      stt: '1.1',
      name: 'Thịt lợn hơi (xuất chuồng 2 lứa)',
      soldValue: 45000,
      selfUsedValue: 5000,
      totalRevenue: 50000,
      seedCost: 6000,
      fertilizerOrFeedCost: 26000,
      otherCost: 2000,
      totalCost: 34000,
      netIncome: 16000,
    },
    {
      id: 'live-2',
      stt: '2.1',
      name: 'Gà thịt thả vườn & trứng gia cầm',
      soldValue: 18000,
      selfUsedValue: 4000,
      totalRevenue: 22000,
      seedCost: 2500,
      fertilizerOrFeedCost: 9500,
      otherCost: 1000,
      totalCost: 13000,
      netIncome: 9000,
    }
  ] : [];

  const breedingLiveRow: ProductionIncomeRow = {
    id: 'live-breed',
    stt: '5',
    name: 'Giống gia súc, gia cầm, vật nuôi',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
  };

  const byProductsLiveRow: ProductionIncomeRow = {
    id: 'live-byproduct',
    stt: '6',
    name: 'Sản phẩm phụ chăn nuôi (phân chuồng, phân hữu cơ)',
    soldValue: hasLivestock ? 1800 : 0,
    selfUsedValue: hasLivestock ? 1200 : 0,
    totalRevenue: hasLivestock ? 3000 : 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: hasLivestock ? 3000 : 0,
    disableSeed: true,
    disableFertilizerOrFeed: true,
  };

  const servicesLiveRow: ProductionIncomeRow = {
    id: 'live-service',
    stt: '7',
    name: 'Dịch vụ chăn nuôi (thụ tinh nhân tạo, thú y cơ sở)',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
    disableSold: true,
    disableSelfUsed: true,
    disableSeed: true,
    disableFertilizerOrFeed: true,
  };

  const huntingLiveRow: ProductionIncomeRow = {
    id: 'live-hunt',
    stt: '8',
    name: 'Săn bắt, đánh bẫy',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
    disableSold: true,
    disableSelfUsed: true,
    disableSeed: true,
    disableFertilizerOrFeed: true,
  };

  const compensationLiveRow: ProductionIncomeRow = {
    id: 'live-comp',
    stt: '9',
    name: 'Tiền được đền bù/hỗ trợ thiệt hại về chăn nuôi do dịch bệnh, thiên tai, môi trường',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
    disableSold: true,
    disableSelfUsed: true,
    disableTotalRevenue: true,
    disableSeed: true,
    disableFertilizerOrFeed: true,
    disableOtherCost: true,
    disableTotalCost: true,
  };

  const allLiveRows = [...livestockRows, breedingLiveRow, byProductsLiveRow, servicesLiveRow, huntingLiveRow, compensationLiveRow];
  const sec3Total = {
    soldValue: allLiveRows.reduce((s, r) => s + (r.soldValue || 0), 0),
    selfUsedValue: allLiveRows.reduce((s, r) => s + (r.selfUsedValue || 0), 0),
    totalRevenue: allLiveRows.reduce((s, r) => s + (r.totalRevenue || 0), 0),
    seedCost: allLiveRows.reduce((s, r) => s + (r.seedCost || 0), 0),
    feedCost: allLiveRows.reduce((s, r) => s + (r.fertilizerOrFeedCost || 0), 0),
    otherCost: allLiveRows.reduce((s, r) => s + (r.otherCost || 0), 0),
    totalCost: allLiveRows.reduce((s, r) => s + (r.totalCost || 0), 0),
    netIncome: allLiveRows.reduce((s, r) => s + (r.netIncome || 0), 0),
  };

  // Khởi tạo Mục 4: Lâm nghiệp
  const forestryRows: ProductionIncomeRow[] = [];
  const nurseryRow4: ProductionIncomeRow = {
    id: 'forest-nursery',
    stt: '2',
    name: 'Ươm giống cây lâm nghiệp',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
  };
  const plantingRow4: ProductionIncomeRow = {
    id: 'forest-planting',
    stt: '3',
    name: 'Trồng rừng, chăm sóc, tu bổ, cải tạo rừng, khoanh nuôi tái sinh',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
  };
  const servicesRow4: ProductionIncomeRow = {
    id: 'forest-service',
    stt: '4',
    name: 'Dịch vụ lâm nghiệp',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
    disableSeed: true,
    disableFertilizerOrFeed: true,
  };
  const compensationRow4: ProductionIncomeRow = {
    id: 'forest-comp',
    stt: '5',
    name: 'Tiền được đền bù/hỗ trợ thiệt hại về lâm nghiệp do dịch bệnh, thiên tai, môi trường',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
    disableSold: true,
    disableSelfUsed: true,
    disableTotalRevenue: true,
    disableSeed: true,
    disableFertilizerOrFeed: true,
    disableOtherCost: true,
    disableTotalCost: true,
  };
  const allForestRows = [...forestryRows, nurseryRow4, plantingRow4, servicesRow4, compensationRow4];
  const sec4Total = {
    soldValue: allForestRows.reduce((s, r) => s + (r.soldValue || 0), 0),
    selfUsedValue: allForestRows.reduce((s, r) => s + (r.selfUsedValue || 0), 0),
    totalRevenue: allForestRows.reduce((s, r) => s + (r.totalRevenue || 0), 0),
    seedCost: allForestRows.reduce((s, r) => s + (r.seedCost || 0), 0),
    fertilizerCost: allForestRows.reduce((s, r) => s + (r.fertilizerOrFeedCost || 0), 0),
    otherCost: allForestRows.reduce((s, r) => s + (r.otherCost || 0), 0),
    totalCost: allForestRows.reduce((s, r) => s + (r.totalCost || 0), 0),
    netIncome: allForestRows.reduce((s, r) => s + (r.netIncome || 0), 0),
  };

  // Khởi tạo Mục 5: Thủy sản
  const aquacultureRows: ProductionIncomeRow[] = [];
  const catchingRows: ProductionIncomeRow[] = [];
  const breedingRows: ProductionIncomeRow[] = [];
  const compensationRow5: ProductionIncomeRow = {
    id: 'fish-comp',
    stt: '4',
    name: 'Tiền được đền bù/hỗ trợ thiệt hại về thủy sản do dịch bệnh, thiên tai, môi trường',
    soldValue: 0,
    selfUsedValue: 0,
    totalRevenue: 0,
    seedCost: 0,
    fertilizerOrFeedCost: 0,
    otherCost: 0,
    totalCost: 0,
    netIncome: 0,
    disableSold: true,
    disableSelfUsed: true,
    disableTotalRevenue: true,
    disableSeed: true,
    disableFertilizerOrFeed: true,
    disableOtherCost: true,
    disableTotalCost: true,
  };
  const allFishRows = [...aquacultureRows, ...catchingRows, ...breedingRows, compensationRow5];
  const sec5Total = {
    soldValue: allFishRows.reduce((s, r) => s + (r.soldValue || 0), 0),
    selfUsedValue: allFishRows.reduce((s, r) => s + (r.selfUsedValue || 0), 0),
    totalRevenue: allFishRows.reduce((s, r) => s + (r.totalRevenue || 0), 0),
    seedCost: allFishRows.reduce((s, r) => s + (r.seedCost || 0), 0),
    feedCost: allFishRows.reduce((s, r) => s + (r.fertilizerOrFeedCost || 0), 0),
    otherCost: allFishRows.reduce((s, r) => s + (r.otherCost || 0), 0),
    totalCost: allFishRows.reduce((s, r) => s + (r.totalCost || 0), 0),
    netIncome: allFishRows.reduce((s, r) => s + (r.netIncome || 0), 0),
  };

  // Khởi tạo Mục 6: Phi nông nghiệp / chế biến
  const hasNonAgri = mainSource === 3;
  const nonAgriRows = hasNonAgri ? [
    {
      id: 'nonagri-1',
      stt: '1',
      activityDescription: sample.industryName || 'Bán lẻ hàng tạp hóa, bách hóa tổng hợp',
      soldValue: 120000,
      selfUsedValue: 8000,
      totalRevenue: 128000,
      materialsCost: 92000,
      energyCost: 4000,
      otherCost: 2000,
      totalCost: 98000,
      netIncome: 30000,
    }
  ] : [];

  const sec6Total = {
    soldValue: nonAgriRows.reduce((s, r) => s + r.soldValue, 0),
    selfUsedValue: nonAgriRows.reduce((s, r) => s + r.selfUsedValue, 0),
    totalRevenue: nonAgriRows.reduce((s, r) => s + r.totalRevenue, 0),
    materialsCost: nonAgriRows.reduce((s, r) => s + r.materialsCost, 0),
    energyCost: nonAgriRows.reduce((s, r) => s + r.energyCost, 0),
    otherCost: nonAgriRows.reduce((s, r) => s + r.otherCost, 0),
    totalCost: nonAgriRows.reduce((s, r) => s + r.totalCost, 0),
    netIncome: nonAgriRows.reduce((s, r) => s + r.netIncome, 0),
  };

  // Khởi tạo Mục 7: Thu nhập khác
  const row1_1 = hasSalary ? 2000 : 1500;
  const row1_2 = 0;
  const row1_3 = 0;
  const row1_Total = row1_1 + row1_2 + row1_3;

  const row2_1 = 0;
  const row2_2 = 1200; // Lãi tiền gửi ngân hàng
  const row2_Total = row2_1 + row2_2;

  const row3 = 500; // Xổ số, quà tặng
  const sec7Total = row1_Total + row2_Total + row3;

  // Tính Biểu Tổng Hợp
  const inc1 = hasSalary ? q2Sec1 : 0;
  const inc2 = hasCrops ? sec2Total.netIncome : 0;
  const inc3 = hasLivestock ? sec3Total.netIncome : 0;
  const inc4 = sec4Total.netIncome;
  const inc5 = sec5Total.netIncome;
  const inc6 = hasNonAgri ? sec6Total.netIncome : 0;
  const inc7 = sec7Total;

  const totalHouseholdIncome = inc1 + inc2 + inc3 + inc4 + inc5 + inc6 + inc7;
  const perCapitaYearly = membersCount > 0 ? Math.round(totalHouseholdIncome / membersCount) : 0;
  const perCapitaMonthly = membersCount > 0 ? Math.round(totalHouseholdIncome / membersCount / 12) : 0;

  return {
    general: {
      year: '2026',
      communeName: sample.communeName || '',
      communeCode: cleanCommuneCode,
      areaCode: cleanAreaCode,
      householdNumber: cleanHhNumber,
      ownerName: sample.ownerName || sample.householdName,
      address: sample.address,
      phone: sample.phone,
      totalMembers: membersCount,
      workingMembers: workingCount,
    },
    section1: {
      hasSalaryIncome: hasSalary ? 1 : 2,
      members: section1Members,
      totalSalaryCol1: totalSalary1,
      totalPensionCol2: totalPension1,
      q2TotalIncome: inc1,
    },
    section2: {
      hasCropsIncome: hasCrops ? 1 : 2,
      cropRows,
      breedingSeedRow: breedingSeedRow2,
      byProductsRow: byProductsRow2,
      servicesRow: servicesRow2,
      compensationRow: compensationRow2,
      totalRow: sec2Total,
      q2TotalIncome: inc2,
    },
    section3: {
      hasLivestockIncome: hasLivestock ? 1 : 2,
      livestockRows,
      breedingRow: breedingLiveRow,
      byProductsRow: byProductsLiveRow,
      servicesRow: servicesLiveRow,
      huntingRow: huntingLiveRow,
      compensationRow: compensationLiveRow,
      totalRow: sec3Total,
      q2TotalIncome: inc3,
    },
    section4: {
      hasForestryIncome: 2,
      forestryRows,
      nurseryRow: nurseryRow4,
      plantingRow: plantingRow4,
      servicesRow: servicesRow4,
      compensationRow: compensationRow4,
      totalRow: sec4Total,
      q2TotalIncome: inc4,
    },
    section5: {
      hasFisheryIncome: 2,
      aquacultureRows,
      catchingRows,
      breedingRows,
      compensationRow: compensationRow5,
      totalRow: sec5Total,
      q2TotalIncome: inc5,
    },
    section6: {
      hasNonAgriIncome: hasNonAgri ? 1 : 2,
      rows: nonAgriRows,
      totalRow: sec6Total,
      q2TotalIncome: inc6,
    },
    section7: {
      row1_1,
      row1_2,
      row1_3,
      row1_Total,
      row2_1,
      row2_2,
      row2_Total,
      row3,
      totalIncome: sec7Total,
      q2TotalIncome: sec7Total,
    },
    summary: {
      income1Salary: inc1,
      income2Crops: inc2,
      income3Livestock: inc3,
      income4Forestry: inc4,
      income5Fishery: inc5,
      income6NonAgri: inc6,
      income7Other: inc7,
      totalHouseholdIncome,
      perCapitaYearlyIncome: perCapitaYearly,
      perCapitaMonthlyIncome: perCapitaMonthly,
      locationDate: `${sample.communeName || 'Địa phương'}, ngày 18 tháng 9 năm 2026`,
      surveyorName: enumeratorName || sample.assignedEnumeratorName || '',
    },
    audit: {
      surveyDate: '2026-09-18',
      latitude: 21.0935,
      longitude: 105.6982,
      gpsAccuracy: 6.5,
      ipAddress: '14.232.208.45',
      fakeIpWarning: false,
      notes: 'Hộ dân cư phối hợp cung cấp đầy đủ thông tin thu nhập và chi phí.',
    }
  };
}

export const initializeIncomeSurveyData = createDefaultIncomeSurvey;
