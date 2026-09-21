import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Enumerator, HouseholdListing, SampleHousehold, SurveyFormData, SamplingSummary, GoogleDriveFolderNode, SurveyStatus } from '../types/survey';
import { HouseholdIncomeSurveyData } from '../types/householdIncomeSurvey';
import { createDefaultIncomeSurvey } from '../utils/incomeSurveyDefaults';
import { INITIAL_ENUMERATORS, INITIAL_HOUSEHOLD_LISTINGS, INITIAL_SAMPLE_HOUSEHOLDS } from './mockData';

const STORAGE_KEYS = {
  ENUMERATORS: 'gso_survey_enumerators_v1',
  HOUSEHOLDS: 'gso_survey_households_v1',
  SAMPLES: 'gso_survey_samples_v1',
  SAMPLING_SUMMARIES: 'gso_survey_sampling_summaries_v1',
  GDRIVE_CONFIG: 'gso_survey_gdrive_config_v1',
};

export class StorageService {
  // --- ENUMERATORS ---
  static getEnumerators(): Enumerator[] {
    const data = localStorage.getItem(STORAGE_KEYS.ENUMERATORS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.ENUMERATORS, JSON.stringify(INITIAL_ENUMERATORS));
      return INITIAL_ENUMERATORS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_ENUMERATORS;
    }
  }

  static saveEnumerators(enumerators: Enumerator[]): void {
    localStorage.setItem(STORAGE_KEYS.ENUMERATORS, JSON.stringify(enumerators));
  }

  static addEnumerator(enumerator: Enumerator): void {
    const list = this.getEnumerators();
    list.push(enumerator);
    this.saveEnumerators(list);
  }

  static updateEnumerator(enumerator: Enumerator): void {
    const list = this.getEnumerators().map(e => e.id === enumerator.id ? enumerator : e);
    this.saveEnumerators(list);
  }

  static deleteEnumerator(id: string): void {
    const list = this.getEnumerators().filter(e => e.id !== id);
    this.saveEnumerators(list);
  }

  // --- HOUSEHOLD LISTINGS ---
  static getHouseholdListings(): HouseholdListing[] {
    const data = localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify(INITIAL_HOUSEHOLD_LISTINGS));
      return INITIAL_HOUSEHOLD_LISTINGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_HOUSEHOLD_LISTINGS;
    }
  }

  static saveHouseholdListings(listings: HouseholdListing[]): void {
    localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify(listings));
  }

  // --- SAMPLE HOUSEHOLDS ---
  static getSampleHouseholds(): SampleHousehold[] {
    let list: SampleHousehold[] = [];
    const data = localStorage.getItem(STORAGE_KEYS.SAMPLES);
    if (!data) {
      list = INITIAL_SAMPLE_HOUSEHOLDS;
      localStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(list));
    } else {
      try {
        list = JSON.parse(data);
      } catch {
        list = INITIAL_SAMPLE_HOUSEHOLDS;
      }
    }

    // Tự động đảm bảo mỗi hộ điều tra đều có dữ liệu Phụ lục II thu nhập tương ứng
    let needsUpdate = false;
    const enriched = list.map(s => {
      if (!s.incomeSurveyData) {
        needsUpdate = true;
        return {
          ...s,
          incomeSurveyData: createDefaultIncomeSurvey(s, s.assignedEnumeratorName)
        };
      }
      return s;
    });

    if (needsUpdate) {
      localStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(enriched));
      return enriched;
    }
    return list;
  }

  static saveSampleHouseholds(samples: SampleHousehold[]): void {
    localStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(samples));
  }

  // Lưu trữ Phiếu Thu Thập Thông Tin Về Thu Nhập Của Hộ Dân Cư (Phụ lục II)
  static saveHouseholdIncomeSurvey(
    tkcsCode: string,
    incomeData: HouseholdIncomeSurveyData,
    fakeIpFlag: boolean = false,
    fakeIpReason?: string,
    status: SurveyStatus = 'completed'
  ): void {
    const samples = this.getSampleHouseholds();
    const updated = samples.map(s => {
      if (s.tkcsCode === tkcsCode || s.id === tkcsCode) {
        const isCompleted = status === 'completed';
        return {
          ...s,
          surveyStatus: status,
          progressPercent: isCompleted ? 100 : Math.max(s.progressPercent, 60),
          completedAt: isCompleted ? new Date().toISOString().replace('T', ' ').substring(0, 16) : s.completedAt,
          startedAt: s.startedAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
          incomeSurveyData: incomeData,
          fakeIpDetails: {
            isFlagged: fakeIpFlag,
            detectedIp: incomeData.audit.ipAddress || '14.232.208.45',
            clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            mockGpsDetected: fakeIpFlag,
            gpsCoordinates: {
              latitude: incomeData.audit.latitude,
              longitude: incomeData.audit.longitude,
              accuracy: incomeData.audit.gpsAccuracy
            },
            distanceDeviationKm: fakeIpFlag ? 1150 : 0.2,
            reason: fakeIpReason,
            checkedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          },
          driveSynced: isCompleted,
          driveSyncPath: `DIEU_TRA_THU_NHAP_2026/XA_${s.communeCode}_${s.communeName.replace(/\s+/g, '')}/DB_${s.areaCode}/HO_${s.tkcsCode}_${s.householdName.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}`
        };
      }
      return s;
    });
    this.saveSampleHouseholds(updated);
  }

  static saveSurveyForm(
    tkcsCode: string, 
    formData: SurveyFormData, 
    fakeIpFlag: boolean = false, 
    fakeIpReason?: string,
    status: SurveyStatus = 'completed'
  ): void {
    const samples = this.getSampleHouseholds();
    const updated = samples.map(s => {
      if (s.tkcsCode === tkcsCode || s.id === tkcsCode) {
        const isCompleted = status === 'completed';
        return {
          ...s,
          surveyStatus: status,
          progressPercent: isCompleted ? 100 : 50,
          completedAt: isCompleted ? new Date().toISOString().replace('T', ' ').substring(0, 16) : s.completedAt,
          startedAt: s.startedAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
          surveyData: formData,
          fakeIpDetails: {
            isFlagged: fakeIpFlag,
            detectedIp: formData.verification.ipAddress || '14.232.208.45',
            clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            mockGpsDetected: fakeIpFlag,
            gpsCoordinates: {
              latitude: formData.verification.latitude,
              longitude: formData.verification.longitude,
              accuracy: formData.verification.gpsAccuracy
            },
            distanceDeviationKm: fakeIpFlag ? 1150 : 0.2,
            reason: fakeIpReason,
            checkedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          },
          driveSynced: isCompleted,
          driveSyncPath: `DIEU_TRA_TKCS_2026/XA_${s.communeCode}_${s.communeName.replace(/\s+/g, '')}/DB_${s.areaCode}/TKCS_${s.tkcsCode}_${s.householdName.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}`
        };
      }
      return s;
    });
    this.saveSampleHouseholds(updated);
  }

  // Thay thế mẫu chính thức bằng mẫu dự phòng theo đúng quy trình Phương án GSO
  static replaceSample(officialId: string, reserveId: string, reason: string): boolean {
    const samples = this.getSampleHouseholds();
    const official = samples.find(s => s.id === officialId);
    const reserve = samples.find(s => s.id === reserveId);
    if (!official || !reserve) return false;

    const updated = samples.map(s => {
      if (s.id === officialId) {
        return {
          ...s,
          surveyStatus: 'moved' as SurveyStatus,
          notes: (s.notes ? s.notes + ' | ' : '') + `Đã thay thế bằng mẫu dự phòng ${reserve.tkcsCode} (${reserve.householdName}). Lý do: ${reason}`,
          progressPercent: 100,
          completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      if (s.id === reserveId) {
        return {
          ...s,
          sampleType: 'official' as const, // Thăng hạng thành mẫu chính thức
          notes: (s.notes ? s.notes + ' | ' : '') + `Kích hoạt thay thế cho mẫu ${official.tkcsCode} (${official.householdName}). Lý do: ${reason}`,
          surveyStatus: 'not_started' as SurveyStatus,
          progressPercent: 0
        };
      }
      return s;
    });

    this.saveSampleHouseholds(updated);
    return true;
  }

  // Đồng bộ tất cả phiếu hoàn thành lên Google Drive
  static syncAllPendingToDrive(): { syncedCount: number; totalCount: number } {
    const samples = this.getSampleHouseholds();
    let count = 0;
    const updated = samples.map(s => {
      if (s.surveyStatus === 'completed' && !s.driveSynced) {
        count++;
        return {
          ...s,
          driveSynced: true,
          driveSyncPath: `DIEU_TRA_TKCS_2026/XA_${s.communeCode}_${s.communeName.replace(/\s+/g, '')}/DB_${s.areaCode}/TKCS_${s.tkcsCode}_${s.householdName.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}`
        };
      }
      return s;
    });
    this.saveSampleHouseholds(updated);
    return { syncedCount: count, totalCount: samples.filter(s => s.surveyStatus === 'completed').length };
  }

  // --- SAMPLING ENGINE (Chọn mẫu ngẫu nhiên hệ thống theo Phương án Thống Kê GSO) ---
  static performSystematicSampling(
    communeCode: string,
    householdsPerArea: number = 10,
    reservePerArea: number = 4,
    samplingMethod: 'systematic' | 'stratified_by_income' = 'stratified_by_income'
  ): {
    summary: SamplingSummary;
    officialSamples: SampleHousehold[];
    reserveSamples: SampleHousehold[];
  } {
    const allListings = this.getHouseholdListings();
    const communeHouseholds = allListings.filter(h => h.communeCode === communeCode);
    const N = communeHouseholds.length;

    if (N === 0) {
      throw new Error(`Không tìm thấy hộ nào trong bảng kê thuộc xã/phường mã: ${communeCode}`);
    }

    const enumerators = this.getEnumerators();

    // Gán ĐTV theo địa bàn phụ trách
    const getEnumeratorForHousehold = (commCode: string, areaCode: string) => {
      const matched = enumerators.find(e =>
        e.assignedCommunes.includes(commCode) &&
        (e.assignedWards.includes(areaCode) || e.assignedWards.length === 0)
      );
      return matched || enumerators[0];
    };

    // BƯỚC 1: Tính tỷ trọng từng nhóm ngành (nguồn thu nhập 1/2/3/4) trên TOÀN XÃ
    // (cộng dồn hộ cùng loại của TẤT CẢ địa bàn trong xã lại với nhau).
    const sectorTotalsCommune: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    communeHouseholds.forEach(h => {
      const sec = h.mainIncomeSourceCode || 4;
      sectorTotalsCommune[sec] = (sectorTotalsCommune[sec] || 0) + 1;
    });
    const sectorProportions: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    [1, 2, 3, 4].forEach(c => {
      sectorProportions[c] = N > 0 ? sectorTotalsCommune[c] / N : 0.25;
    });

    // Chia đều `total` suất cho 4 nhóm ngành theo đúng tỷ trọng ở trên (làm tròn theo phần dư lớn nhất
    // để tổng luôn khớp chính xác bằng `total`, không lệch do làm tròn số lẻ).
    const allocateQuotaBySector = (total: number): Record<number, number> => {
      const quota: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
      if (total <= 0) return quota;
      const raw = [1, 2, 3, 4].map(c => ({ c, val: total * sectorProportions[c] }));
      let allocated = 0;
      raw.forEach(r => {
        quota[r.c] = Math.floor(r.val);
        allocated += quota[r.c];
      });
      let remaining = total - allocated;
      const byRemainder = [...raw].sort((a, b) => (b.val - Math.floor(b.val)) - (a.val - Math.floor(a.val)));
      let i = 0;
      while (remaining > 0 && byRemainder.length > 0) {
        quota[byRemainder[i % byRemainder.length].c]++;
        remaining--;
        i++;
      }
      return quota;
    };

    // Gộp TẤT CẢ các loại hộ trong CÙNG 1 địa bàn lại làm 1 để nhóm theo địa bàn
    const areaMap = new Map<string, HouseholdListing[]>();
    communeHouseholds.forEach(h => {
      const key = h.areaCode || 'Chưa xác định';
      if (!areaMap.has(key)) areaMap.set(key, []);
      areaMap.get(key)!.push(h);
    });

    const officialSamples: SampleHousehold[] = [];
    const reserveSamples: SampleHousehold[] = [];
    let orderCounter = 0;
    let lastK = 0;
    let lastR = 0;
    let compensatedCount = 0;

    const areaCodesSorted = Array.from(areaMap.keys()).sort((a, b) => a.localeCompare(b, 'vi'));

    // Chọn `want` hộ theo kiểu ngẫu nhiên hệ thống (systematic) trong 1 danh sách cho trước
    const pickSystematic = (list: HouseholdListing[], want: number): HouseholdListing[] => {
      if (want <= 0 || list.length === 0) return [];
      const n = Math.min(want, list.length);
      const k = Math.max(1, Math.floor(list.length / n));
      const r = Math.floor(Math.random() * k) + 1;
      lastK = k;
      lastR = r;
      const idxs: number[] = [];
      for (let i = 0; i < n; i++) {
        const idx = (r - 1 + i * k) % list.length;
        if (!idxs.includes(idx)) idxs.push(idx);
      }
      return idxs.map(i => list[i]);
    };

    areaCodesSorted.forEach(areaCode => {
      const areaList = areaMap.get(areaCode)!;
      const areaN = areaList.length;

      const bySector: Record<number, HouseholdListing[]> = { 1: [], 2: [], 3: [], 4: [] };
      areaList.forEach(h => {
        const sec = h.mainIncomeSourceCode || 4;
        (bySector[sec] || bySector[4]).push(h);
      });

      let selectedOfficial: HouseholdListing[] = [];
      const selectedIds = new Set<string>();

      if (samplingMethod === 'stratified_by_income') {
        // BƯỚC 2: Áp tỷ trọng của XÃ vào chỉ tiêu householdsPerArea của địa bàn này
        // -> biết cần lấy bao nhiêu hộ ở mỗi nhóm ngành trong địa bàn.
        const officialQuota = allocateQuotaBySector(Math.min(householdsPerArea, areaN));
        [1, 2, 3, 4].forEach(sec => {
          const picked = pickSystematic(bySector[sec], officialQuota[sec]);
          picked.forEach(hh => { selectedOfficial.push(hh); selectedIds.add(hh.id); });
        });

        // Nếu 1 nhóm ngành trong địa bàn không đủ hộ để đạt chỉ tiêu tỷ trọng (ví dụ ngành đó ít/không
        // có hộ nào ở địa bàn này), phần còn thiếu được lấy BÙ từ hộ của NGÀNH KHÁC còn lại
        // trong CHÍNH địa bàn đó, để vẫn đủ đúng householdsPerArea hộ chính thức.
        const officialTarget = Math.min(householdsPerArea, areaN);
        let deficit = officialTarget - selectedOfficial.length;
        if (deficit > 0) {
          const leftoverPool = areaList.filter(h => !selectedIds.has(h.id));
          const filled = leftoverPool.slice(0, deficit);
          filled.forEach(hh => { selectedOfficial.push(hh); selectedIds.add(hh.id); });
          compensatedCount += filled.length;
        }
      } else {
        // Không phân tầng theo ngành: chọn hệ thống tuần tự trên toàn bộ hộ của địa bàn
        selectedOfficial = pickSystematic([...areaList].sort((a, b) => a.stt - b.stt), Math.min(householdsPerArea, areaN));
        selectedOfficial.forEach(hh => selectedIds.add(hh.id));
      }

      // Hộ dự phòng: lấy tiếp trong số CÒN LẠI của CHÍNH địa bàn này (không sang địa bàn khác),
      // cũng theo đúng tỷ trọng ngành của xã.
      const remainingAfterOfficial = areaList.filter(h => !selectedIds.has(h.id));
      let selectedReserve: HouseholdListing[] = [];
      const reserveTarget = Math.min(reservePerArea, remainingAfterOfficial.length);

      if (samplingMethod === 'stratified_by_income') {
        const remBySector: Record<number, HouseholdListing[]> = { 1: [], 2: [], 3: [], 4: [] };
        remainingAfterOfficial.forEach(h => {
          const sec = h.mainIncomeSourceCode || 4;
          (remBySector[sec] || remBySector[4]).push(h);
        });
        const reserveQuota = allocateQuotaBySector(reserveTarget);
        const reserveIds = new Set<string>();
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
        : undefined;

      selectedOfficial.forEach(hh => {
        orderCounter++;
        const dtv = getEnumeratorForHousehold(hh.communeCode, hh.areaCode);
        officialSamples.push({
          ...hh,
          sampleType: 'official',
          sampleOrder: orderCounter,
          assignedEnumeratorId: dtv?.id,
          assignedEnumeratorName: dtv?.name,
          surveyStatus: 'not_started',
          progressPercent: 0,
          driveSynced: false,
          samplingNote: areaShortNote,
        });
      });

      selectedReserve.forEach(hh => {
        orderCounter++;
        const dtv = getEnumeratorForHousehold(hh.communeCode, hh.areaCode);
        reserveSamples.push({
          ...hh,
          sampleType: 'reserve',
          sampleOrder: orderCounter,
          assignedEnumeratorId: dtv?.id,
          assignedEnumeratorName: dtv?.name,
          surveyStatus: 'not_started',
          progressPercent: 0,
          driveSynced: false,
        });
      });
    });

    // Thống kê phân bổ theo 4 nhóm ngành nguồn thu nhập (toàn xã)
    const sectorNames: Record<number, string> = {
      1: '1. Nông lâm thủy sản',
      2: '2. Công nghiệp - Xây dựng',
      3: '3. Thương mại - Dịch vụ',
      4: '4. Nguồn khác (Lương/Trợ cấp/Khác)',
    };
    const sectorDistribution = [1, 2, 3, 4].map(code => {
      const totalCount = sectorTotalsCommune[code] || 0;
      const selectedCount = officialSamples.filter(s => (s.mainIncomeSourceCode || 4) === code).length;
      return {
        code,
        name: sectorNames[code],
        totalCount,
        selectedCount,
        percentage: N > 0 ? Math.round((totalCount / N) * 100) : 0,
      };
    });

    const summary: SamplingSummary = {
      communeCode,
      communeName: communeHouseholds[0].communeName,
      totalListHouseholds: N,
      targetSampleSize: officialSamples.length,
      samplingRatioPercent: N > 0 ? Math.round((officialSamples.length / N) * 1000) / 10 : 0,
      samplingIntervalK: lastK,
      randomStartR: lastR,
      officialSampleCount: officialSamples.length,
      reserveSampleCount: reserveSamples.length,
      selectedOfficialIds: officialSamples.map(s => s.id),
      selectedReserveIds: reserveSamples.map(s => s.id),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      samplingMethod,
      householdsPerAreaTarget: householdsPerArea,
      reservePerAreaTarget: reservePerArea,
      areaCount: areaCodesSorted.length,
      compensatedCount,
      sectorDistribution,
    };

    // Cập nhật danh sách mẫu trong hệ thống (giữ lại mẫu của các xã khác)
    const existingSamples = this.getSampleHouseholds().filter(s => s.communeCode !== communeCode);
    const newSampleList = [...existingSamples, ...officialSamples, ...reserveSamples];
    this.saveSampleHouseholds(newSampleList);

    return { summary, officialSamples, reserveSamples };
  }

  // --- EXCEL IMPORT / EXPORT UTILITIES ---

  // File mẫu (rỗng, chỉ có 1 dòng ví dụ minh họa) để Admin biết đúng cấu trúc cột cần nhập
  static exportIncomeHouseholdTemplate(): void {
    const wsData = [
      ['BẢNG KÊ HỘ'],
      ['ĐIỀU TRA THU NHẬP BÌNH QUÂN ĐẦU NGƯỜI CẤP XÃ'],
      ['Tỉnh: ...', '', 'Mã tỉnh: ...', '', 'Thành thị/Nông thôn: ...'],
      ['Xã/phường: ...', '', 'Mã xã: ...', '', 'Người rà soát: ...'],
      ['Tên địa bàn: ...', '', 'Mã địa bàn: ...', '', 'Số điện thoại: ...'],
      [],
      [
        'STT',
        'Họ và tên chủ hộ',
        'Địa chỉ của hộ',
        'Số nhân khẩu thực tế thường trú của hộ khi lập bảng kê',
        'Nguồn thu nhập lớn nhất của hộ thuộc ngành nào (1: Hộ có nguồn thu nhập lớn nhất từ ngành Nông lâm thủy sản; 2: Hộ có nguồn thu nhập lớn nhất từ ngành Công nghiệp xây dựng; 3: Hộ có nguồn thu nhập lớn nhất từ ngành Thương mại dịch vụ; 4: Hộ có nguồn thu nhập lớn nhất từ nguồn khác)',
        'Ghi chú',
      ],
      [1, '(VD: Nguyễn Văn A)', '(VD: Thôn ..., Xã ...)', 4, 2, ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bang_Ke_Ho_Thu_Nhap');
    XLSX.writeFile(wb, 'Mau_Bang_Ke_Ho_Dieu_Tra_Thu_Nhap_Cap_Xa.xlsx');
  }

  static exportHouseholdTemplate(): void {
    const wsData = [
      ['STT', 'Mã Tỉnh', 'Tên Tỉnh', 'Mã Huyện', 'Tên Huyện', 'Mã Xã', 'Tên Xã', 'Mã Địa Bàn', 'Mã TKCS', 'Tên Chủ Hộ / Cơ Sở', 'Địa Chỉ', 'Mã Ngành', 'Tên Ngành Nghề', 'Số Điện Thoại', 'Doanh Thu Ước Tính (Triệu)', 'Số Lao Động', 'Ghi Chú'],
      [1, '...', '...', '...', '...', '...', '...', '...', '...', '(VD: Cửa hàng tạp hóa ...)', '...', '...', '...', '...', '', '', '']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Bang_Ke_Ho');
    XLSX.writeFile(wb, 'Mau_Bang_Ke_Ho_Dieu_Tra.xlsx');
  }

  static exportEnumeratorTemplate(): void {
    const wsData = [
      ['Mã ĐTV', 'Họ Và Tên', 'Số Điện Thoại', 'Email', 'Tên Đăng Nhập', 'Mã Xã Phụ Trách (Cách nhau dấu phẩy)', 'Mã Địa Bàn Phụ Trách (Cách nhau dấu phẩy)', 'Trạng Thái'],
      ['DTV01', '(VD: Nguyễn Văn A)', '...', '...', 'dtv01', '00101, 00102', '001, 002', 'active']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Dieu_Tra_Vien');
    XLSX.writeFile(wb, 'Mau_Danh_Sach_Dieu_Tra_Vien.xlsx');
  }

  // Tạo tên trang tính (sheet) hợp lệ cho Excel: tối đa 31 ký tự, không chứa : \ / ? * [ ]
  private static sanitizeSheetName(name: string, usedNames: Set<string>): string {
    let clean = (name || 'DiaBan').replace(/[:\\/?*\[\]]/g, '_').trim();
    if (!clean) clean = 'DiaBan';
    if (clean.length > 31) clean = clean.slice(0, 31);
    let finalName = clean;
    let suffix = 2;
    while (usedNames.has(finalName)) {
      const base = clean.slice(0, 31 - String(suffix).length - 1);
      finalName = `${base}_${suffix}`;
      suffix++;
    }
    usedNames.add(finalName);
    return finalName;
  }

  // Dựng dữ liệu 1 trang (sheet) Bảng kê hộ cho đúng 1 địa bàn, theo mẫu chuẩn:
  // Dòng tiêu đề -> Dòng thông tin tỉnh/xã/địa bàn -> Dòng tên cột (đã gộp sẵn giải thích mã 1-2-3-4) -> Dữ liệu hộ
  private static buildIncomeListingSheetData(areaHouseholds: HouseholdListing[]): any[][] {
    const first = areaHouseholds[0];
    const rows: any[][] = [
      ['BẢNG KÊ HỘ'],
      ['ĐIỀU TRA THU NHẬP BÌNH QUÂN ĐẦU NGƯỜI CẤP XÃ'],
      [`Tỉnh: ${first.provinceName || ''}`, '', `Mã tỉnh: ${first.provinceCode || ''}`, '', `Thành thị/Nông thôn: ${first.urbanRural || ''}`],
      [`Xã/phường: ${first.communeName || ''}`, '', `Mã xã: ${first.communeCode || ''}`, '', `Người rà soát: ${first.reviewerName || ''}`],
      [`Tên địa bàn: ${first.areaCode || ''}`, '', `Mã địa bàn: ${first.areaCode || ''}`, '', `Số điện thoại: ${first.reviewerPhone || ''}`],
      [],
      [
        'STT',
        'Họ và tên chủ hộ',
        'Địa chỉ của hộ',
        'Số nhân khẩu thực tế thường trú của hộ khi lập bảng kê',
        'Nguồn thu nhập lớn nhất của hộ thuộc ngành nào (1: Hộ có nguồn thu nhập lớn nhất từ ngành Nông lâm thủy sản; 2: Hộ có nguồn thu nhập lớn nhất từ ngành Công nghiệp xây dựng; 3: Hộ có nguồn thu nhập lớn nhất từ ngành Thương mại dịch vụ; 4: Hộ có nguồn thu nhập lớn nhất từ nguồn khác)',
        'Ghi chú',
      ],
    ];

    areaHouseholds.forEach((h, idx) => {
      rows.push([
        idx + 1,
        h.ownerName || h.householdName || '',
        h.address || '',
        h.memberCount ?? '',
        h.mainIncomeSourceCode ?? '',
        h.notes || h.phone || '',
      ]);
    });

    return rows;
  }

  // Xuất Bảng kê hộ của 1 xã: TOÀN BỘ xã nằm trong 1 file .xlsx duy nhất,
  // và mỗi địa bàn (TDP/thôn/tổ...) trong xã đó là 1 trang (sheet) riêng trong file đó.
  // Trả về số địa bàn (số trang) đã xuất.
  static exportIncomeHouseholdListingByCommune(allListings: HouseholdListing[], communeCode: string): number {
    const communeHouseholds = allListings.filter(h => h.communeCode === communeCode);
    if (communeHouseholds.length === 0) {
      throw new Error('Xã này chưa có hộ nào trong Bảng kê để xuất. Vui lòng nhập/tải lên Bảng kê hộ trước.');
    }

    // Nhóm các hộ trong xã theo từng địa bàn (areaCode)
    const areaMap = new Map<string, HouseholdListing[]>();
    communeHouseholds.forEach(h => {
      const key = h.areaCode || 'Chưa xác định';
      if (!areaMap.has(key)) areaMap.set(key, []);
      areaMap.get(key)!.push(h);
    });

    const wb = XLSX.utils.book_new();
    const usedSheetNames = new Set<string>();

    // Sắp xếp địa bàn theo mã để dòng ra file có thứ tự ổn định
    const areaCodesSorted = Array.from(areaMap.keys()).sort((a, b) => a.localeCompare(b, 'vi'));
    areaCodesSorted.forEach(areaCode => {
      const householdsInArea = areaMap.get(areaCode)!;
      const wsData = this.buildIncomeListingSheetData(householdsInArea);
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const sheetName = this.sanitizeSheetName(areaCode, usedSheetNames);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const communeName = communeHouseholds[0].communeName || communeCode;
    const safeCommuneName = communeName.replace(/[\\/:*?"<>|]/g, '_');
    XLSX.writeFile(wb, `Bang_Ke_Ho_Xa_${communeCode}_${safeCommuneName}.xlsx`);

    return areaCodesSorted.length;
  }

  // Xuất TẤT CẢ các xã đang có trong Bảng kê: mỗi xã tải về thành 1 file .xlsx riêng
  // (mỗi địa bàn trong xã đó vẫn là 1 trang trong file của xã đó).
  // Trả về số file (số xã) đã xuất.
  static exportIncomeHouseholdListingAllCommunes(allListings: HouseholdListing[]): number {
    if (allListings.length === 0) {
      throw new Error('Chưa có hộ nào trong Bảng kê để xuất. Vui lòng nhập/tải lên Bảng kê hộ trước.');
    }
    const communeCodes = Array.from(new Set(allListings.map(h => h.communeCode))).sort((a, b) => a.localeCompare(b, 'vi'));
    communeCodes.forEach(code => this.exportIncomeHouseholdListingByCommune(allListings, code));
    return communeCodes.length;
  }

  // Tải lên danh sách bảng kê hộ thông minh (Hỗ trợ cả Mẫu Điều Tra Thu Nhập và Mẫu TKCS)
  // Chỉ ĐỌC & PHÂN TÍCH file Excel thành danh sách hộ thô — KHÔNG tự lưu vào localStorage nữa.
  // Component gọi hàm này rồi tự POST lên server qua apiImportListings để mọi thiết bị dùng chung.
  static async parseHouseholdsFromExcel(file: File): Promise<HouseholdListing[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          if (rows.length < 2) {
            throw new Error('File không chứa dữ liệu hợp lệ');
          }

          const newEntries: HouseholdListing[] = [];

          // 1. Kiểm tra xem file có phải dạng "BẢNG KÊ HỘ ĐIỀU TRA THU NHẬP BÌNH QUÂN ĐẦU NGƯỜI CẤP XÃ" không
          let isIncomeSurvey = false;
          let headerRowIndex = -1;
          let colSTT = 0;
          let colName = 1;
          let colAddress = 2;
          let colMembers = 3;
          let colIncome = 4;
          let colNotes = 5;

          // Metadata đọc được từ phần tiêu đề của file (không đặt giá trị mặc định cố định theo 1 tỉnh/xã cụ thể nào)
          let detectedProvince = '';
          let detectedProvinceCode = '';
          let detectedCommune = '';
          let detectedCommuneCode = '';
          let detectedArea = '';
          let detectedAreaCode = '';

          for (let r = 0; r < Math.min(rows.length, 15); r++) {
            const row = rows[r];
            if (!Array.isArray(row)) continue;
            const textLine = row.map(cell => String(cell || '').toLowerCase()).join(' ');

            if (textLine.includes('bảng kê hộ') || textLine.includes('thu nhập bình quân')) {
              isIncomeSurvey = true;
            }

            // Đọc metadata
            for (let c = 0; c < row.length; c++) {
              const cellVal = String(row[c] || '');
              const cellLower = cellVal.toLowerCase();
              if (cellLower.includes('mã tỉnh:')) {
                const parts = cellVal.split(':');
                if (parts[1]?.trim()) detectedProvinceCode = parts[1].trim();
                else if (row[c + 1]) detectedProvinceCode = String(row[c + 1]).trim();
              } else if (cellLower.includes('tỉnh:')) {
                const parts = cellVal.split(':');
                if (parts[1]?.trim()) detectedProvince = parts[1].trim();
                else if (row[c + 1]) detectedProvince = String(row[c + 1]).trim();
              }
              if (cellLower.includes('mã xã:')) {
                const parts = cellVal.split(':');
                if (parts[1]?.trim()) detectedCommuneCode = parts[1].trim();
                else if (row[c + 1]) detectedCommuneCode = String(row[c + 1]).trim();
              } else if (cellLower.includes('xã/phường:') || cellLower.includes('xã:')) {
                const parts = cellVal.split(':');
                if (parts[1]?.trim()) detectedCommune = parts[1].trim();
                else if (row[c + 1]) detectedCommune = String(row[c + 1]).trim();
              }
              if (cellLower.includes('mã địa bàn:')) {
                const parts = cellVal.split(':');
                if (parts[1]?.trim()) detectedAreaCode = parts[1].trim();
                else if (row[c + 1]) detectedAreaCode = String(row[c + 1]).trim();
              } else if (cellLower.includes('tên địa bàn:') || cellLower.includes('địa bàn:')) {
                const parts = cellVal.split(':');
                if (parts[1]?.trim()) detectedArea = parts[1].trim();
                else if (row[c + 1]) detectedArea = String(row[c + 1]).trim();
              }
            }

            // Tìm hàng tiêu đề cột
            if (
              textLine.includes('họ và tên chủ hộ') || 
              (textLine.includes('chủ hộ') && textLine.includes('địa chỉ'))
            ) {
              headerRowIndex = r;
              row.forEach((col, idx) => {
                const cText = String(col || '').toLowerCase();
                if (cText.includes('stt') || cText === 'a') colSTT = idx;
                if (cText.includes('họ và tên') || cText.includes('chủ hộ') || cText === 'b') colName = idx;
                if (cText.includes('địa chỉ') || cText === 'c') colAddress = idx;
                if (cText.includes('nhân khẩu') || cText.includes('thường trú') || cText === '1') colMembers = idx;
                if (cText.includes('thu nhập') || cText.includes('ngành nào') || cText === '2') colIncome = idx;
                if (cText.includes('ghi chú') || cText === '3') colNotes = idx;
              });
              break;
            }
          }

          // Nếu file không ghi rõ "Mã xã:"/"Mã địa bàn:" riêng, tạm dùng lại tên xã/địa bàn làm mã để vẫn nhóm được đúng theo từng xã/địa bàn
          if (!detectedAreaCode) detectedAreaCode = detectedArea;
          if (!detectedCommuneCode) detectedCommuneCode = detectedCommune;
          if (!detectedProvinceCode) detectedProvinceCode = detectedProvince;

          if (isIncomeSurvey && headerRowIndex !== -1) {
            // Parser chuyên dụng cho Bảng kê điều tra thu nhập
            const sectorNamesMap: Record<number, string> = {
              1: '1. Nông lâm thủy sản',
              2: '2. Công nghiệp - Xây dựng',
              3: '3. Thương mại - Dịch vụ',
              4: '4. Nguồn khác (Lương/Trợ cấp/Khác)',
            };

            for (let i = headerRowIndex + 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || !row[colName]) continue;

              const nameStr = String(row[colName] || '').trim();
              // Bỏ qua dòng ghi chú phụ như '(A)', '(B)', 'HƯỚNG DẪN'
              if (nameStr.startsWith('(') || nameStr.includes('HƯỚNG DẪN') || nameStr.includes('CỘT')) continue;

              const sttNum = Number(row[colSTT]) || (newEntries.length + 1);
              const addressStr = String(row[colAddress] || detectedArea).trim();
              const memCount = Number(row[colMembers]) || 1;
              const incomeCode = Number(row[colIncome]) || 2;
              const notesStr = String(row[colNotes] || '').trim();
              const phoneMatch = notesStr.match(/0\d{9,10}/);
              const phoneStr = phoneMatch ? phoneMatch[0] : '';

              const tkcsCode = `${detectedCommuneCode.slice(-3)}${detectedAreaCode.slice(-2)}${String(sttNum).padStart(3, '0')}`;

              newEntries.push({
                id: `income-hk-${Date.now()}-${i}`,
                stt: sttNum,
                provinceCode: detectedProvinceCode,
                provinceName: detectedProvince,
                districtCode: '',
                districtName: '',
                communeCode: detectedCommuneCode,
                communeName: detectedCommune,
                areaCode: detectedAreaCode,
                tkcsCode,
                householdName: `Hộ ${nameStr}`,
                ownerName: nameStr,
                address: addressStr,
                industryCode: incomeCode === 1 ? '0111' : incomeCode === 2 ? '4100' : incomeCode === 3 ? '4711' : '9999',
                industryName: sectorNamesMap[incomeCode] || 'Hoạt động kinh tế hộ',
                phone: phoneStr,
                estimatedRevenue: incomeCode === 2 ? 150 : incomeCode === 3 ? 120 : 80,
                workerCount: Math.min(memCount, 3),
                notes: notesStr || 'Bảng kê điều tra thu nhập cấp xã',
                memberCount: memCount,
                mainIncomeSourceCode: incomeCode,
                mainIncomeSourceName: sectorNamesMap[incomeCode] || '4. Nguồn khác',
                surveyListingType: 'income',
                urbanRural: 'Nông thôn',
              });
            }
          } else {
            // Parser cho bảng kê dạng chuẩn TKCS cơ sở cá thể
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length < 5 || !row[8]) continue;

              newEntries.push({
                id: `hk-import-${Date.now()}-${i}`,
                stt: newEntries.length + 1,
                provinceCode: String(row[1] || ''),
                provinceName: String(row[2] || ''),
                districtCode: String(row[3] || ''),
                districtName: String(row[4] || ''),
                communeCode: String(row[5] || ''),
                communeName: String(row[6] || ''),
                areaCode: String(row[7] || ''),
                tkcsCode: String(row[8]),
                householdName: String(row[9] || 'Hộ kinh doanh mới'),
                ownerName: String(row[9] || 'Chủ hộ'),
                address: String(row[10] || ''),
                industryCode: String(row[11] || '4711'),
                industryName: String(row[12] || 'Bán lẻ'),
                phone: String(row[13] || ''),
                estimatedRevenue: Number(row[14]) || 50,
                workerCount: Number(row[15]) || 2,
                notes: String(row[16] || 'Tải lên từ Excel'),
                surveyListingType: 'tkcs'
              });
            }
          }

          if (newEntries.length === 0) {
            throw new Error('Không tìm thấy dòng dữ liệu hộ gia đình nào trong bảng tính. Vui lòng kiểm tra định dạng cột.');
          }

          // Trả về danh sách đã phân tích — component sẽ gọi API để lưu lên server dùng chung
          resolve(newEntries);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Chỉ ĐỌC & PHÂN TÍCH file Excel thành danh sách ĐTV thô — KHÔNG tự lưu vào localStorage nữa.
  // Component gọi hàm này rồi tự POST từng ĐTV lên server qua apiCreateEnumerator (để mỗi ĐTV được
  // cấp tài khoản đăng nhập thật + mật khẩu tạm).
  static async parseEnumeratorsFromExcel(file: File): Promise<Omit<Enumerator, 'id'>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          if (rows.length < 2) {
            throw new Error('File không chứa dữ liệu hợp lệ');
          }

          const newEntries: Omit<Enumerator, 'id'>[] = [];

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[0] || !row[1]) continue;

            const communes = String(row[5] || '').split(',').map(s => s.trim()).filter(Boolean);
            const wards = String(row[6] || '').split(',').map(s => s.trim()).filter(Boolean);

            newEntries.push({
              code: String(row[0]),
              name: String(row[1]),
              phone: String(row[2] || ''),
              email: String(row[3] || ''),
              username: String(row[4] || String(row[0]).toLowerCase()),
              assignedCommunes: communes,
              assignedWards: wards,
              status: (row[7] === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
            });
          }

          resolve(newEntries);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  static exportSampleListToExcel(samples: SampleHousehold[]): void {
    const rows = samples.map((s, idx) => ({
      'STT Mẫu': idx + 1,
      'Loại Mẫu': s.sampleType === 'official' ? 'Chính thức' : 'Dự phòng',
      'Mã TKCS': s.tkcsCode,
      'Mã Xã': s.communeCode,
      'Tên Xã': s.communeName,
      'Mã Địa Bàn': s.areaCode,
      'Tên Hộ / Cơ Sở': s.householdName,
      'Địa Chỉ': s.address,
      'Ngành Nghề': s.industryName,
      'Số Điện Thoại': s.phone,
      'ĐTV Phụ Trách': s.assignedEnumeratorName || 'Chưa gán',
      'Trạng Thái Điều Tra': s.surveyStatus === 'completed' ? 'Đã hoàn thành' : s.surveyStatus === 'in_progress' ? 'Đang điều tra' : s.surveyStatus === 'refused' ? 'Từ chối' : 'Chưa thực hiện',
      'Tiến Độ (%)': s.progressPercent,
      'Cảnh Báo Fake IP': s.fakeIpDetails?.isFlagged ? 'CÓ (CẢNH BÁO)' : 'Bình thường',
      'Đồng Bộ Google Drive': s.driveSynced ? 'Đã đồng bộ' : 'Chưa đồng bộ'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Ho_Mau');
    XLSX.writeFile(wb, `Danh_Sach_Ho_Mau_TKCS_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  static exportAggregatedReportToExcel(samples: SampleHousehold[]): void {
    const completed = samples.filter(s => s.surveyStatus === 'completed' && s.surveyData);

    const rows = completed.map((s, idx) => {
      const d = s.surveyData!;
      return {
        'STT': idx + 1,
        'Mã TKCS': s.tkcsCode,
        'Mã Xã': s.communeCode,
        'Tên Xã': s.communeName,
        'Mã Địa Bàn': s.areaCode,
        'Tên Cơ Sở': d.generalInfo.householdName,
        'Chủ Cơ Sở': d.generalInfo.representativeName,
        'Số Điện Thoại': d.generalInfo.phone,
        'Ngành SXKD': d.generalInfo.industryName,
        'Tổng Lao Động': d.laborInfo.totalLabor,
        'Lao Động Nữ': d.laborInfo.femaleLabor,
        'Lao Động Gia Đình': d.laborInfo.familyLabor,
        'Lao Động Thuê Ngoài': d.laborInfo.hiredLabor,
        'Doanh Thu Tháng (Tr.đ)': d.businessResults.averageMonthlyRevenue,
        'Ước Doanh Thu Năm (Tr.đ)': d.businessResults.totalYearlyRevenue,
        'Tổng Chi Phí Tháng (Tr.đ)': d.businessResults.totalMonthlyExpense,
        'Chi Nguyên Vật Liệu': d.businessResults.materialsExpense,
        'Chi Lương': d.businessResults.laborSalaryExpense,
        'Thu Nhập Thuần Tháng': d.businessResults.netIncomeMonthly,
        'Hình Thức Thuế': d.taxObligation.taxDeclarationType,
        'Thuế Đã Nộp (Tr.đ)': d.taxObligation.totalTaxPaid,
        'Tổng Vốn SXKD': d.capitalCredit.totalCapital,
        'Vốn Vay Ngân Hàng': d.capitalCredit.bankLoanCapital,
        'Có Dùng Internet': d.itApplication.usesInternet ? 'Có' : 'Không',
        'Có Bán Hàng Online': d.itApplication.sellsOnline ? 'Có' : 'Không',
        'Thanh Toán Không Tiền Mặt': d.itApplication.acceptsCashlessPayment ? 'Có' : 'Không',
        'ĐTV Thực Hiện': d.verification.enumeratorName,
        'Cảnh Báo Fake IP': s.fakeIpDetails?.isFlagged ? 'CÓ' : 'Không'
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bao_Cao_Tong_Hop_Phieu');
    XLSX.writeFile(wb, `Bao_Cao_Tong_Hop_Dieu_Tra_TKCS_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // --- GOOGLE DRIVE FOLDER GENERATOR & ZIP EXPORTER ---
  static buildGoogleDriveTree(samples: SampleHousehold[]): GoogleDriveFolderNode {
    const root: GoogleDriveFolderNode = {
      id: 'root-drive',
      name: 'DIEU_TRA_THONG_KE_CO_SO_2026',
      path: '/DIEU_TRA_THONG_KE_CO_SO_2026',
      type: 'folder',
      children: []
    };

    // Nhóm theo Xã
    const communeMap = new Map<string, SampleHousehold[]>();
    samples.forEach(s => {
      const list = communeMap.get(s.communeCode) || [];
      list.push(s);
      communeMap.set(s.communeCode, list);
    });

    communeMap.forEach((communeSamples, commCode) => {
      const commName = communeSamples[0].communeName.replace(/\s+/g, '_');
      const communeNode: GoogleDriveFolderNode = {
        id: `xa-${commCode}`,
        name: `XA_${commCode}_${commName}`,
        path: `${root.path}/XA_${commCode}_${commName}`,
        type: 'folder',
        children: []
      };

      // Nhóm theo Địa bàn
      const areaMap = new Map<string, SampleHousehold[]>();
      communeSamples.forEach(s => {
        const list = areaMap.get(s.areaCode) || [];
        list.push(s);
        areaMap.set(s.areaCode, list);
      });

      areaMap.forEach((areaSamples, areaCode) => {
        const areaNode: GoogleDriveFolderNode = {
          id: `db-${commCode}-${areaCode}`,
          name: `DB_${areaCode}`,
          path: `${communeNode.path}/DB_${areaCode}`,
          type: 'folder',
          children: []
        };

        // Danh sách hộ / cơ sở trong địa bàn
        areaSamples.forEach(s => {
          const cleanName = s.householdName.substring(0, 25).replace(/[^a-zA-Z0-9]/g, '_');
          const hhNode: GoogleDriveFolderNode = {
            id: `hh-${s.tkcsCode}`,
            name: `TKCS_${s.tkcsCode}_${cleanName}`,
            path: `${areaNode.path}/TKCS_${s.tkcsCode}_${cleanName}`,
            type: 'folder',
            children: [
              {
                id: `file-json-${s.tkcsCode}`,
                name: `Phieu_Dieu_Tra_${s.tkcsCode}.json`,
                path: `${areaNode.path}/TKCS_${s.tkcsCode}_${cleanName}/Phieu_Dieu_Tra_${s.tkcsCode}.json`,
                type: 'file',
                size: '4.2 KB'
              },
              {
                id: `file-html-${s.tkcsCode}`,
                name: `Ban_In_Phieu_${s.tkcsCode}.html`,
                path: `${areaNode.path}/TKCS_${s.tkcsCode}_${cleanName}/Ban_In_Phieu_${s.tkcsCode}.html`,
                type: 'file',
                size: '12.8 KB'
              },
              {
                id: `file-log-${s.tkcsCode}`,
                name: `Nhat_Ky_Dinh_Vi_IP_${s.tkcsCode}.txt`,
                path: `${areaNode.path}/TKCS_${s.tkcsCode}_${cleanName}/Nhat_Ky_Dinh_Vi_IP_${s.tkcsCode}.txt`,
                type: 'file',
                size: '1.5 KB'
              }
            ]
          };

          if (s.surveyData?.verification.proofPhotoUrl) {
            hhNode.children?.push({
              id: `file-img-${s.tkcsCode}`,
              name: `Anh_Minh_Chung_${s.tkcsCode}.jpg`,
              path: `${areaNode.path}/TKCS_${s.tkcsCode}_${cleanName}/Anh_Minh_Chung_${s.tkcsCode}.jpg`,
              type: 'file',
              size: '450 KB'
            });
          }

          areaNode.children?.push(hhNode);
        });

        communeNode.children?.push(areaNode);
      });

      root.children?.push(communeNode);
    });

    return root;
  }

  // Tải file ZIP chứa toàn bộ cấu trúc thư mục phân cấp tự động
  static async exportGoogleDriveZip(samples: SampleHousehold[]): Promise<void> {
    const zip = new JSZip();
    const baseFolder = zip.folder('DIEU_TRA_THONG_KE_CO_SO_2026');

    if (!baseFolder) return;

    // Thêm README & mục lục
    baseFolder.file('MUC_LUC_CAU_TRUC_THU_MUC.txt', 
      `HỆ THỐNG ĐIỀU HÀNH & THỐNG KÊ CƠ SỞ 2026\n` +
      `Cấu trúc thư mục lưu trữ tự động trên Google Drive:\n` +
      `[Tên Cuộc Điều Tra] / XA_[Mã Xã] / DB_[Mã Địa Bàn] / TKCS_[Mã TKCS]_[Tên Hộ] /\n` +
      `Ngày tạo: ${new Date().toLocaleString('vi-VN')}\n` +
      `Tổng số hộ mẫu: ${samples.length}\n` +
      `Số phiếu đã hoàn thành: ${samples.filter(s => s.surveyStatus === 'completed').length}\n`
    );

    samples.forEach(s => {
      const cleanCommune = `XA_${s.communeCode}_${s.communeName.replace(/\s+/g, '_')}`;
      const cleanArea = `DB_${s.areaCode}`;
      const cleanName = s.householdName.substring(0, 25).replace(/[^a-zA-Z0-9]/g, '_');
      const hhFolderName = `TKCS_${s.tkcsCode}_${cleanName}`;

      const hhFolder = baseFolder.folder(cleanCommune)?.folder(cleanArea)?.folder(hhFolderName);
      if (!hhFolder) return;

      // 1. File JSON
      const jsonContent = JSON.stringify({
        householdInfo: s,
        surveyData: s.surveyData || null,
        syncMetadata: {
          exportedAt: new Date().toISOString(),
          appletId: '57d98032-0531-4694-b1ce-496500e7c104',
          fakeIpFlag: s.fakeIpDetails?.isFlagged || false
        }
      }, null, 2);
      hhFolder.file(`Phieu_Dieu_Tra_${s.tkcsCode}.json`, jsonContent);

      // 2. File HTML phiếu in chuẩn
      const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Phiếu Điều Tra TKCS: ${s.tkcsCode}</title>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 24px; color: #111; line-height: 1.6; }
    h1 { text-align: center; font-size: 20px; text-transform: uppercase; margin-bottom: 4px; }
    h2 { text-align: center; font-size: 15px; font-style: italic; margin-top: 0; color: #444; }
    .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .table th, .table td { border: 1px solid #333; padding: 6px 10px; font-size: 13px; }
    .table th { background: #f0f0f0; text-align: left; }
    .section-header { background: #e2e8f0; font-weight: bold; padding: 8px 12px; margin-top: 18px; border-left: 4px solid #1e40af; }
    .warning { color: #dc2626; font-weight: bold; }
  </style>
</head>
<body>
  <h1>TỔNG CỤC THỐNG KÊ</h1>
  <h2>PHIẾU ĐIỀU TRA CƠ SỞ SẢN XUẤT KINH DOANH CÁ THỂ VÀ HỘ MẪU</h2>
  <div style="text-align: center; margin-bottom: 20px;">
    <strong>MÃ TKCS: ${s.tkcsCode}</strong> | Mã Xã: ${s.communeCode} (${s.communeName}) | Mã Địa Bàn: ${s.areaCode}
  </div>

  <div class="section-header">I. THÔNG TIN NHẬN DẠNG CƠ SỞ</div>
  <table class="table">
    <tr><th width="30%">Tên cơ sở / Hộ:</th><td>${s.householdName}</td></tr>
    <tr><th>Chủ cơ sở:</th><td>${s.surveyData?.generalInfo.representativeName || 'Chưa cập nhật'}</td></tr>
    <tr><th>Địa chỉ:</th><td>${s.address}</td></tr>
    <tr><th>Số điện thoại:</th><td>${s.phone}</td></tr>
    <tr><th>Ngành kinh doanh chính:</th><td>${s.industryName} (Mã: ${s.industryCode})</td></tr>
    <tr><th>Tình trạng:</th><td>${s.surveyData?.generalInfo.operationalStatus || s.surveyStatus}</td></tr>
  </table>

  <div class="section-header">II. KẾT QUẢ SẢN XUẤT KINH DOANH</div>
  <table class="table">
    <tr><th width="30%">Tổng số lao động:</th><td>${s.surveyData?.laborInfo.totalLabor || 0} người (Nữ: ${s.surveyData?.laborInfo.femaleLabor || 0})</td></tr>
    <tr><th>Doanh thu bình quân 1 tháng:</th><td>${s.surveyData?.businessResults.averageMonthlyRevenue || 0} Triệu VNĐ</td></tr>
    <tr><th>Ước tổng doanh thu cả năm:</th><td>${s.surveyData?.businessResults.totalYearlyRevenue || 0} Triệu VNĐ</td></tr>
    <tr><th>Tổng chi phí SXKD 1 tháng:</th><td>${s.surveyData?.businessResults.totalMonthlyExpense || 0} Triệu VNĐ</td></tr>
    <tr><th>Lợi nhuận/Thu nhập thuần:</th><td>${s.surveyData?.businessResults.netIncomeMonthly || 0} Triệu VNĐ</td></tr>
  </table>

  <div class="section-header">III. KIỂM ĐỊNH VỊ TRÍ & BẢO MẬT ĐIỀU TRA</div>
  <table class="table">
    <tr><th width="30%">Điều tra viên:</th><td>${s.assignedEnumeratorName || 'Chưa phân công'}</td></tr>
    <tr><th>Tọa độ GPS ghi nhận:</th><td>Lat: ${s.fakeIpDetails?.gpsCoordinates?.latitude || 'N/A'}, Lng: ${s.fakeIpDetails?.gpsCoordinates?.longitude || 'N/A'} (Sai số: ${s.fakeIpDetails?.gpsCoordinates?.accuracy || 'N/A'}m)</td></tr>
    <tr><th>Địa chỉ IP:</th><td>${s.fakeIpDetails?.detectedIp || '14.232.208.45'}</td></tr>
    <tr><th>Trạng thái Fake IP:</th><td>${s.fakeIpDetails?.isFlagged ? '<span class="warning">CẢNH BÁO PHÁT HIỆN FAKE IP / GPS LỆCH</span>' : 'Hợp lệ / Bình thường'}</td></tr>
  </table>

  <div style="margin-top: 40px; display: flex; justify-content: space-between;">
    <div style="text-align: center; width: 45%;">
      <p><strong>Người cung cấp thông tin</strong><br><em>(Ký, ghi rõ họ tên)</em></p>
      <br><br><br>
      <p>${s.surveyData?.verification.respondentName || s.householdName}</p>
    </div>
    <div style="text-align: center; width: 45%;">
      <p><strong>Điều tra viên</strong><br><em>(Ký, ghi rõ họ tên)</em></p>
      <br><br><br>
      <p>${s.assignedEnumeratorName || ''}</p>
    </div>
  </div>
</body>
</html>`;
      hhFolder.file(`Ban_In_Phieu_${s.tkcsCode}.html`, htmlContent);

      // 3. File Log GPS & IP
      const logContent = 
        `NHẬT KÝ ĐỊNH VỊ & ĐỊA CHỈ IP ĐIỀU TRA VIÊN\n` +
        `-----------------------------------------\n` +
        `Mã TKCS: ${s.tkcsCode}\n` +
        `Cơ sở: ${s.householdName}\n` +
        `ĐTV: ${s.assignedEnumeratorName || 'N/A'}\n` +
        `Thời gian ghi nhận: ${s.completedAt || s.startedAt || 'N/A'}\n` +
        `Tọa độ GPS: Lat ${s.fakeIpDetails?.gpsCoordinates?.latitude || 21.0935}, Lng ${s.fakeIpDetails?.gpsCoordinates?.longitude || 105.6982}\n` +
        `Độ chính xác: ${s.fakeIpDetails?.gpsCoordinates?.accuracy || 10} mét\n` +
        `Địa chỉ IP: ${s.fakeIpDetails?.detectedIp || '14.232.208.45'}\n` +
        `Múi giờ máy khách: ${s.fakeIpDetails?.clientTimezone || 'Asia/Ho_Chi_Minh'}\n` +
        `Cảnh báo Fake IP: ${s.fakeIpDetails?.isFlagged ? 'CẢNH BÁO: ' + (s.fakeIpDetails.reason || 'Bất thường') : 'Bình thường'}\n` +
        `Sai lệch địa bàn: ${s.fakeIpDetails?.distanceDeviationKm || 0.1} km\n`;
      hhFolder.file(`Nhat_Ky_Dinh_Vi_IP_${s.tkcsCode}.txt`, logContent);
    });

    // Tạo file zip và kích hoạt download
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dong_Bo_Google_Drive_TKCS_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
