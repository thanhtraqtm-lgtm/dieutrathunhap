import { SurveyFormData } from '../types/survey';

export interface ValidationIssue {
  section: number;
  sectionName: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
}

export interface ValidationResult {
  isValid: boolean; // Không có lỗi nghiêm trọng (severity === 'error')
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  passedCount: number;
  totalChecks: number;
}

// Bảng kiểm định logic toàn diện theo Phương án Điều tra Thống kê cơ sở SXKD cá thể - Tổng cục Thống kê
export function validateSurveyForm(data: SurveyFormData): ValidationResult {
  const issues: ValidationIssue[] = [];
  let passedCount = 0;
  let totalChecks = 0;

  const check = (
    condition: boolean,
    issue: Omit<ValidationIssue, 'severity'> & { severity: 'error' | 'warning' | 'info' }
  ) => {
    totalChecks++;
    if (!condition) {
      issues.push(issue);
    } else {
      passedCount++;
    }
  };

  const isOperational = data.generalInfo.operationalStatus === '1. Đang hoạt động';

  // --- MỤC I: THÔNG TIN NHẬN DẠNG ---
  check(
    Boolean(data.generalInfo.householdName && data.generalInfo.householdName.trim().length >= 2),
    {
      section: 1,
      sectionName: 'Mục I. Nhận dạng cơ sở',
      field: 'householdName',
      message: 'Tên cơ sở / hộ kinh doanh không được để trống (tối thiểu 2 ký tự).',
      severity: 'error',
      code: 'ERR_SEC1_NAME'
    }
  );

  check(
    Boolean(data.generalInfo.representativeName && data.generalInfo.representativeName.trim().length >= 2),
    {
      section: 1,
      sectionName: 'Mục I. Nhận dạng cơ sở',
      field: 'representativeName',
      message: 'Họ tên chủ cơ sở / người đại diện không được để trống.',
      severity: 'error',
      code: 'ERR_SEC1_REP'
    }
  );

  check(
    Boolean(data.generalInfo.address && data.generalInfo.address.trim().length >= 5),
    {
      section: 1,
      sectionName: 'Mục I. Nhận dạng cơ sở',
      field: 'address',
      message: 'Địa chỉ nơi SXKD phải chi tiết (thôn/xóm/tổ/đường, tối thiểu 5 ký tự).',
      severity: 'error',
      code: 'ERR_SEC1_ADDR'
    }
  );

  const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
  check(
    Boolean(data.generalInfo.phone && phoneRegex.test(data.generalInfo.phone.replace(/\s+/g, ''))),
    {
      section: 1,
      sectionName: 'Mục I. Nhận dạng cơ sở',
      field: 'phone',
      message: 'Số điện thoại liên hệ phải hợp lệ theo định dạng mạng viễn thông Việt Nam (10 chữ số).',
      severity: 'warning',
      code: 'WARN_SEC1_PHONE'
    }
  );

  check(
    Boolean(data.generalInfo.industryCode && /^[0-9]{4,5}$/.test(data.generalInfo.industryCode.trim())),
    {
      section: 1,
      sectionName: 'Mục I. Nhận dạng cơ sở',
      field: 'industryCode',
      message: 'Mã ngành kinh tế phải là mã cấp 4 hoặc cấp 5 theo hệ thống ngành kinh tế Việt Nam VSIC (4-5 chữ số).',
      severity: 'error',
      code: 'ERR_SEC1_INDUSTRY_CODE'
    }
  );

  // Nếu cơ sở không hoạt động (giải thể/chuyển đi/từ chối)
  if (!isOperational) {
    check(
      Boolean(data.verification.notes && data.verification.notes.trim().length >= 5),
      {
        section: 1,
        sectionName: 'Mục I. Nhận dạng cơ sở',
        field: 'operationalStatus',
        message: `Cơ sở ở trạng thái "${data.generalInfo.operationalStatus}", phương án yêu cầu ghi chú rõ lý do xác minh thực địa vào phần Ghi chú.`,
        severity: 'error',
        code: 'ERR_SEC1_STATUS_NOTE'
      }
    );
    // Nếu không hoạt động thì không cần kiểm tra các mục II đến VII
    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      errors: issues.filter(i => i.severity === 'error'),
      warnings: issues.filter(i => i.severity === 'warning'),
      passedCount,
      totalChecks
    };
  }

  // --- MỤC II: LAO ĐỘNG CƠ SỞ ---
  check(
    data.laborInfo.totalLabor >= 1,
    {
      section: 2,
      sectionName: 'Mục II. Lao động',
      field: 'totalLabor',
      message: 'Cơ sở đang hoạt động phải có ít nhất 1 lao động thường xuyên (bao gồm cả chủ cơ sở).',
      severity: 'error',
      code: 'ERR_SEC2_TOTAL_LABOR'
    }
  );

  check(
    data.laborInfo.femaleLabor <= data.laborInfo.totalLabor,
    {
      section: 2,
      sectionName: 'Mục II. Lao động',
      field: 'femaleLabor',
      message: `Số lao động nữ (${data.laborInfo.femaleLabor}) không được lớn hơn tổng số lao động (${data.laborInfo.totalLabor}).`,
      severity: 'error',
      code: 'ERR_SEC2_FEMALE_LEQ_TOTAL'
    }
  );

  const sumFamilyHired = data.laborInfo.familyLabor + data.laborInfo.hiredLabor;
  check(
    sumFamilyHired === data.laborInfo.totalLabor,
    {
      section: 2,
      sectionName: 'Mục II. Lao động',
      field: 'familyLabor',
      message: `Cân đối lao động: Lao động gia đình (${data.laborInfo.familyLabor}) + Lao động thuê ngoài (${data.laborInfo.hiredLabor}) = ${sumFamilyHired} người, phải bằng Tổng số lao động (${data.laborInfo.totalLabor} người).`,
      severity: 'error',
      code: 'ERR_SEC2_LABOR_BALANCE'
    }
  );

  // --- MỤC III: KẾT QUẢ SẢN XUẤT KINH DOANH ---
  check(
    data.businessResults.monthsActive >= 1 && data.businessResults.monthsActive <= 12,
    {
      section: 3,
      sectionName: 'Mục III. Kết quả SXKD',
      field: 'monthsActive',
      message: 'Số tháng thực tế hoạt động trong năm phải từ 1 đến 12 tháng.',
      severity: 'error',
      code: 'ERR_SEC3_MONTHS'
    }
  );

  check(
    data.businessResults.averageMonthlyRevenue > 0,
    {
      section: 3,
      sectionName: 'Mục III. Kết quả SXKD',
      field: 'averageMonthlyRevenue',
      message: 'Doanh thu SXKD bình quân 1 tháng của cơ sở đang hoạt động phải lớn hơn 0.',
      severity: 'error',
      code: 'ERR_SEC3_REVENUE_GT_ZERO'
    }
  );

  const expectedYearly = data.businessResults.averageMonthlyRevenue * data.businessResults.monthsActive;
  check(
    Math.abs(data.businessResults.totalYearlyRevenue - expectedYearly) < 1,
    {
      section: 3,
      sectionName: 'Mục III. Kết quả SXKD',
      field: 'totalYearlyRevenue',
      message: `Doanh thu cả năm (${data.businessResults.totalYearlyRevenue}) phải bằng Doanh thu tháng (${data.businessResults.averageMonthlyRevenue}) × Số tháng (${data.businessResults.monthsActive}) = ${expectedYearly} triệu đồng.`,
      severity: 'error',
      code: 'ERR_SEC3_YEARLY_CALC'
    }
  );

  // Cân đối các khoản chi phí chi tiết với tổng chi phí
  const sumDetailExpenses = 
    (data.businessResults.materialsExpense || 0) +
    (data.businessResults.laborSalaryExpense || 0) +
    (data.businessResults.rentExpense || 0) +
    (data.businessResults.depreciationExpense || 0) +
    (data.businessResults.utilityServicesExpense || 0) +
    (data.businessResults.otherExpenses || 0);

  check(
    Math.abs(data.businessResults.totalMonthlyExpense - sumDetailExpenses) <= 0.5,
    {
      section: 3,
      sectionName: 'Mục III. Kết quả SXKD',
      field: 'totalMonthlyExpense',
      message: `Cân đối chi phí: Tổng chi phí bình quân tháng (${data.businessResults.totalMonthlyExpense} tr) phải bằng tổng 6 khoản chi tiết (${sumDetailExpenses} tr: NVL, lương, thuê mặt bằng, khấu hao, điện nước, khác).`,
      severity: 'error',
      code: 'ERR_SEC3_EXPENSE_BALANCE'
    }
  );

  // Kiểm tra chi trả lương khi có lao động thuê ngoài
  if (data.laborInfo.hiredLabor > 0) {
    check(
      data.businessResults.laborSalaryExpense > 0,
      {
        section: 3,
        sectionName: 'Mục III. Kết quả SXKD',
        field: 'laborSalaryExpense',
        message: `Cơ sở có ${data.laborInfo.hiredLabor} lao động thuê ngoài thì chi phí tiền công, tiền lương phải lớn hơn 0.`,
        severity: 'warning',
        code: 'WARN_SEC3_SALARY_HIRED'
      }
    );
  }

  // Kiểm tra lợi nhuận thuần
  const netIncome = data.businessResults.averageMonthlyRevenue - data.businessResults.totalMonthlyExpense;
  check(
    netIncome >= 0,
    {
      section: 3,
      sectionName: 'Mục III. Kết quả SXKD',
      field: 'netIncomeMonthly',
      message: `Chi phí (${data.businessResults.totalMonthlyExpense} tr) đang lớn hơn doanh thu (${data.businessResults.averageMonthlyRevenue} tr). Cơ sở đang kinh doanh bị lỗ (${netIncome} tr), hãy xác minh lại với chủ hộ trước khi nộp.`,
      severity: 'warning',
      code: 'WARN_SEC3_NEGATIVE_INCOME'
    }
  );

  // --- MỤC IV: THUẾ VÀ NGHĨA VỤ NSNN ---
  if (data.taxObligation.taxDeclarationType !== '3. Miễn thuế/Chưa đến mức nộp thuế') {
    check(
      data.taxObligation.totalTaxPaid >= 0,
      {
        section: 4,
        sectionName: 'Mục IV. Nghĩa vụ thuế',
        field: 'totalTaxPaid',
        message: 'Tổng số tiền thuế, phí đã nộp trong năm không được là số âm.',
        severity: 'error',
        code: 'ERR_SEC4_TAX_NON_NEGATIVE'
      }
    );
  }

  // --- MỤC V: VỐN ĐẦU TƯ VÀ TÍN DỤNG ---
  check(
    data.capitalCredit.totalCapital > 0,
    {
      section: 5,
      sectionName: 'Mục V. Vốn & Tín dụng',
      field: 'totalCapital',
      message: 'Tổng nguồn vốn đang sử dụng cho SXKD của cơ sở phải lớn hơn 0.',
      severity: 'error',
      code: 'ERR_SEC5_CAPITAL_GT_ZERO'
    }
  );

  check(
    data.capitalCredit.bankLoanCapital <= data.capitalCredit.totalCapital,
    {
      section: 5,
      sectionName: 'Mục V. Vốn & Tín dụng',
      field: 'bankLoanCapital',
      message: `Vốn vay ngân hàng (${data.capitalCredit.bankLoanCapital} tr) không được vượt quá Tổng nguồn vốn SXKD (${data.capitalCredit.totalCapital} tr).`,
      severity: 'error',
      code: 'ERR_SEC5_LOAN_LEQ_CAPITAL'
    }
  );

  if (data.capitalCredit.hasLoanDemand) {
    check(
      Boolean(data.capitalCredit.loanDemandAmount && data.capitalCredit.loanDemandAmount > 0),
      {
        section: 5,
        sectionName: 'Mục V. Vốn & Tín dụng',
        field: 'loanDemandAmount',
        message: 'Cơ sở có nhu cầu vay vốn thì phải khai báo số tiền cần vay (triệu đồng).',
        severity: 'warning',
        code: 'WARN_SEC5_LOAN_DEMAND_AMOUNT'
      }
    );
  }

  // --- MỤC VI: ỨNG DỤNG CNTT VÀ THƯƠNG MẠI ĐIỆN TỬ ---
  if (data.itApplication.sellsOnline) {
    check(
      data.itApplication.onlineChannels && data.itApplication.onlineChannels.length > 0,
      {
        section: 6,
        sectionName: 'Mục VI. CNTT & TMĐT',
        field: 'onlineChannels',
        message: 'Cơ sở có bán hàng/dịch vụ qua mạng thì phải chọn ít nhất 1 kênh bán hàng trực tuyến.',
        severity: 'error',
        code: 'ERR_SEC6_ONLINE_CHANNELS'
      }
    );

    check(
      data.itApplication.onlineRevenuePercent > 0 && data.itApplication.onlineRevenuePercent <= 100,
      {
        section: 6,
        sectionName: 'Mục VI. CNTT & TMĐT',
        field: 'onlineRevenuePercent',
        message: 'Tỷ lệ doanh thu qua mạng Internet phải từ 1% đến 100%.',
        severity: 'error',
        code: 'ERR_SEC6_ONLINE_PERCENT'
      }
    );
  }

  if (data.itApplication.acceptsCashlessPayment) {
    check(
      data.itApplication.cashlessMethods && data.itApplication.cashlessMethods.length > 0,
      {
        section: 6,
        sectionName: 'Mục VI. CNTT & TMĐT',
        field: 'cashlessMethods',
        message: 'Cơ sở chấp nhận thanh toán không tiền mặt thì phải chọn ít nhất 1 hình thức (QR Code, chuyển khoản, POS...).',
        severity: 'error',
        code: 'ERR_SEC6_CASHLESS_METHODS'
      }
    );
  }

  // --- MỤC VII: KHÓ KHĂN VÀ ĐỀ XUẤT ---
  check(
    data.challengesRecommendations.mainChallenges && data.challengesRecommendations.mainChallenges.length > 0,
    {
      section: 7,
      sectionName: 'Mục VII. Khó khăn & Kiến nghị',
      field: 'mainChallenges',
      message: 'Phương án yêu cầu chọn ít nhất 1 khó khăn lớn nhất trong hoạt động sản xuất kinh doanh.',
      severity: 'error',
      code: 'ERR_SEC7_CHALLENGES'
    }
  );

  // --- MỤC VIII: XÁC THỰC, GPS & CHỮ KÝ ---
  check(
    Boolean(data.verification.respondentName && data.verification.respondentName.trim().length >= 2),
    {
      section: 8,
      sectionName: 'Mục VIII. Xác thực & GPS',
      field: 'respondentName',
      message: 'Họ tên người cung cấp thông tin không được để trống.',
      severity: 'error',
      code: 'ERR_SEC8_RESPONDENT'
    }
  );

  check(
    Boolean(data.verification.enumeratorName && data.verification.enumeratorName.trim().length >= 2),
    {
      section: 8,
      sectionName: 'Mục VIII. Xác thực & GPS',
      field: 'enumeratorName',
      message: 'Họ tên Điều tra viên phụ trách không được để trống.',
      severity: 'error',
      code: 'ERR_SEC8_ENUMERATOR'
    }
  );

  check(
    data.verification.latitude !== 0 && data.verification.longitude !== 0,
    {
      section: 8,
      sectionName: 'Mục VIII. Xác thực & GPS',
      field: 'latitude',
      message: 'Bắt buộc phải lấy tọa độ GPS định vị tại hiện trường cơ sở điều tra.',
      severity: 'error',
      code: 'ERR_SEC8_GPS_MISSING'
    }
  );

  check(
    data.verification.gpsAccuracy <= 50,
    {
      section: 8,
      sectionName: 'Mục VIII. Xác thực & GPS',
      field: 'gpsAccuracy',
      message: `Độ chính xác GPS hiện tại là ±${data.verification.gpsAccuracy}m (Phương án khuyến nghị sai số dưới 50m để định vị chính xác địa bàn).`,
      severity: 'warning',
      code: 'WARN_SEC8_GPS_ACCURACY'
    }
  );

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    passedCount,
    totalChecks
  };
}
