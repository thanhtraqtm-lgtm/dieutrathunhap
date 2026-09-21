// Cấu trúc dữ liệu chuẩn xác 100% theo:
// "Phụ lục II: PHIẾU THU THẬP THÔNG TIN VỀ THU NHẬP CỦA HỘ DÂN CƯ"
// Đơn vị tính: 1.000 đồng

export interface SalaryMemberItem {
  id: string;
  memberCode: string; // Cột A: Mã thành viên (1, 2, 3...)
  fullName: string; // Cột B: Họ tên
  mainJobDescription: string; // Mô tả công việc chính
  salaryAndWages: number; // Cột 1: Thu nhập từ tiền lương, tiền công và các khoản có tính chất tiền lương, tiền công (tính cả tiền mặt và hiện vật quy đổi thành tiền)
  pensionAndAllowances: number; // Cột 2: Lương hưu và trợ cấp thất nghiệp, thôi việc một lần
}

export interface ProductionIncomeRow {
  id: string;
  stt: string; // Cột A: STT (1.1, 1.2, 2, 3...)
  name: string; // Cột B: Nguồn thu / Sản phẩm dịch vụ
  // Tổng thu
  soldValue?: number; // Cột 1: Giá trị đã bán/đổi/cho/biếu/tặng
  selfUsedValue?: number; // Cột 2: Giá trị đã thu hoạch để lại sử dụng (phục vụ SXKD & tiêu dùng) và giá trị tồn kho chưa sử dụng
  totalRevenue: number; // Cột 3: Tổng trị giá sản phẩm đã thu hoạch (3 = 1 + 2)
  // Chi phí
  seedCost?: number; // Cột 4: Giống (Bao gồm cả giống tự sản xuất)
  fertilizerOrFeedCost?: number; // Cột 5: Phân bón, BVTV (Trồng trọt, Lâm nghiệp) hoặc Thức ăn, thuốc phòng chữa bệnh (Chăn nuôi, Thủy sản)
  otherCost?: number; // Cột 6: Chi khác
  totalCost: number; // Cột 7: Tổng chi phí (7 = 4 + 5 + 6)
  // Thu nhập
  netIncome: number; // Cột 8: Thu nhập (8 = 3 - 7)
  // Disable flags
  disableSold?: boolean; // Hiển thị dấu x
  disableSelfUsed?: boolean; // Hiển thị dấu x
  disableTotalRevenue?: boolean; // Hiển thị dấu x
  disableSeed?: boolean; // Hiển thị dấu x
  disableFertilizerOrFeed?: boolean; // Hiển thị dấu x
  disableOtherCost?: boolean; // Hiển thị dấu x
  disableTotalCost?: boolean; // Hiển thị dấu x
}

export interface NonAgriRow {
  id: string;
  stt: string; // Cột A
  activityDescription: string; // Cột B: Mô tả hoạt động
  soldValue: number; // Cột 1: Giá trị đã bán/đổi/cho/biếu/tặng
  selfUsedValue: number; // Cột 2: Giá trị để lại sử dụng
  totalRevenue: number; // Cột 3: Tổng thu (3 = 1 + 2)
  materialsCost: number; // Cột 4: Nguyên vật liệu chính, phụ, thực liệu
  energyCost: number; // Cột 5: Năng lượng, nhiên liệu
  otherCost: number; // Cột 6: Chi khác
  totalCost: number; // Cột 7: Tổng chi phí (7 = 4 + 5 + 6)
  netIncome: number; // Cột 8: Thu nhập (8 = 3 - 7)
}

export interface HouseholdIncomeSurveyData {
  // PHẦN THÔNG TIN CHUNG (Trang 23)
  general: {
    year: string; // Năm điều tra (ví dụ: 2026)
    communeName: string; // Xã/phường
    communeCode: string; // Mã xã/phường (6 ô)
    areaCode: string; // Địa bàn điều tra (3 ô)
    householdNumber: string; // Hộ số (3 ô)
    ownerName: string; // Họ và tên chủ hộ
    address: string; // Địa chỉ (số nhà, đường phố, tổ/thôn)
    phone: string; // Số điện thoại
    totalMembers: number; // Tổng số thành viên của hộ (Người)
    workingMembers: number; // Trong đó, số người đang làm việc (Người)
  };

  // MỤC 1: THU NHẬP TỪ TIỀN LƯƠNG, TIỀN CÔNG (Trang 23)
  section1: {
    hasSalaryIncome: 1 | 2; // 1. Có (Mã 1: Hỏi thông tin), 2. Không (Mã 2: Chuyển qua mục 2)
    members: SalaryMemberItem[];
    totalSalaryCol1: number; // Dòng tổng số Cột 1
    totalPensionCol2: number; // Dòng tổng số Cột 2
    q2TotalIncome: number; // Câu 2. Tổng thu nhập = Dòng tổng số (cột 1 + cột 2)
  };

  // MỤC 2: THU NHẬP TỪ TRỒNG TRỌT (Trang 24)
  section2: {
    hasCropsIncome: 1 | 2; // 1. Có, 2. Không -> Chuyển qua mục 3
    cropRows: ProductionIncomeRow[];
    // Cố định các dòng theo biểu mẫu
    breedingSeedRow: ProductionIncomeRow; // 2. Nhân giống và chăm sóc giống
    byProductsRow: ProductionIncomeRow; // 3. Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt (Cột 4: x, Cột 5: x)
    servicesRow: ProductionIncomeRow; // 4. Dịch vụ trồng trọt (Cột 1: x, Cột 2: x, Cột 4: x, Cột 5: x)
    compensationRow: ProductionIncomeRow; // 5. Tiền được đền bù/hỗ trợ thiệt hại (Cột 1-7: x)
    totalRow: {
      soldValue: number;
      selfUsedValue: number;
      totalRevenue: number;
      seedCost: number;
      fertilizerCost: number;
      otherCost: number;
      totalCost: number;
      netIncome: number;
    };
    q2TotalIncome: number; // Câu 2. Tổng thu nhập từ trồng trọt = Dòng tổng số cột (8)
  };

  // MỤC 3: THU NHẬP TỪ CHĂN NUÔI (Trang 26 - 27)
  section3: {
    hasLivestockIncome: 1 | 2; // 1. Có, 2. Không -> Chuyển qua mục 4
    livestockRows: ProductionIncomeRow[]; // 1. Gia súc, 2. Gia cầm, 3. Chăn nuôi khác, 4. SP không qua giết mổ
    breedingRow: ProductionIncomeRow; // 5. Giống gia súc, gia cầm, vật nuôi
    byProductsRow: ProductionIncomeRow; // 6. Sản phẩm phụ chăn nuôi (Cột 4: x, Cột 5: x)
    servicesRow: ProductionIncomeRow; // 7. Dịch vụ chăn nuôi (Cột 1: x, Cột 2: x, Cột 4: x, Cột 5: x)
    huntingRow: ProductionIncomeRow; // 8. Săn bắt, đánh bẫy (Cột 1: x, Cột 2: x, Cột 4: x, Cột 5: x)
    compensationRow: ProductionIncomeRow; // 9. Tiền được đền bù/hỗ trợ thiệt hại (Cột 1-7: x)
    totalRow: {
      soldValue: number;
      selfUsedValue: number;
      totalRevenue: number;
      seedCost: number;
      feedCost: number;
      otherCost: number;
      totalCost: number;
      netIncome: number;
    };
    q2TotalIncome: number; // Câu 2. Tổng thu nhập từ chăn nuôi = Dòng tổng số cột (8)
  };

  // MỤC 4: THU NHẬP TỪ LÂM NGHIỆP (Trang 25)
  section4: {
    hasForestryIncome: 1 | 2; // 1. Có, 2. Không -> Chuyển qua mục 5
    forestryRows: ProductionIncomeRow[]; // 1. Khai thác, thu nhặt lâm sản (1.1, 1.2...) (Cột 4: x, Cột 5: x)
    nurseryRow: ProductionIncomeRow; // 2. Ươm giống cây lâm nghiệp
    plantingRow: ProductionIncomeRow; // 3. Trồng rừng, chăm sóc, tu bổ, cải tạo rừng, khoanh nuôi tái sinh
    servicesRow: ProductionIncomeRow; // 4. Dịch vụ lâm nghiệp (Cột 4: x, Cột 5: x)
    compensationRow: ProductionIncomeRow; // 5. Tiền được đền bù/hỗ trợ thiệt hại (Cột 1-7: x)
    totalRow: {
      soldValue: number;
      selfUsedValue: number;
      totalRevenue: number;
      seedCost: number;
      fertilizerCost: number;
      otherCost: number;
      totalCost: number;
      netIncome: number;
    };
    q2TotalIncome: number; // Câu 2. Tổng thu nhập từ lâm nghiệp = Dòng tổng số cột (8)
  };

  // MỤC 5: THU NHẬP TỪ THỦY SẢN (Trang 27 - 28)
  section5: {
    hasFisheryIncome: 1 | 2; // 1. Có, 2. Không -> Chuyển qua mục 6
    aquacultureRows: ProductionIncomeRow[]; // 1. Nuôi trồng thủy sản (1.1 Cá, 1.2 Tôm, ...)
    catchingRows: ProductionIncomeRow[]; // 2. Đánh bắt thủy sản (2.1 Cá, 2.2 Tôm, ...) (Cột 4: x, Cột 5: x)
    breedingRows: ProductionIncomeRow[]; // 3. Sản xuất giống (3.1 Cá giống các loại, 3.2 Tôm giống các loại...)
    compensationRow: ProductionIncomeRow; // 4. Tiền được đền bù/hỗ trợ thiệt hại (Cột 1-7: x)
    totalRow: {
      soldValue: number;
      selfUsedValue: number;
      totalRevenue: number;
      seedCost: number;
      feedCost: number;
      otherCost: number;
      totalCost: number;
      netIncome: number;
    };
    q2TotalIncome: number; // Câu 2. Tổng thu nhập từ thủy sản = Dòng tổng số cột (8)
  };

  // MỤC 6: THU NHẬP TỪ SXKD PHI NÔNG NGHIỆP HOẶC CHẾ BIẾN SP NLTS (Trang 28)
  section6: {
    hasNonAgriIncome: 1 | 2; // 1. Có, 2. Không -> Chuyển qua mục 7
    rows: NonAgriRow[];
    totalRow: {
      soldValue: number;
      selfUsedValue: number;
      totalRevenue: number;
      materialsCost: number;
      energyCost: number;
      otherCost: number;
      totalCost: number;
      netIncome: number;
    };
    q2TotalIncome: number; // Câu 2. Dòng tổng số cột (8)
  };

  // MỤC 7: THU NHẬP KHÁC (Trang 29)
  section7: {
    // 1. Thu nhập từ các nguồn hỗ trợ bên ngoài hộ (=1.1+1.2+1.3)
    row1_1: number; // 1.1. Tiền và trị giá hiện vật người ngoài hộ cho/biếu/tặng/mừng/giúp (dùng cho sinh hoạt của hộ)
    row1_2: number; // 1.2. Các khoản trợ cấp xã hội, trợ cấp thiên tai, dịch bệnh...
    row1_3: number; // 1.3. Học bổng, thưởng giáo dục, trợ giúp y tế
    row1_Total: number; // 1. Tổng = 1.1 + 1.2 + 1.3

    // 2. Thu nhập từ sở hữu tài sản, đầu tư tài chính (=2.1+2.2)
    row2_1: number; // 2.1. Thu từ cho thuê tài sản, đất đai, nhà ở
    row2_2: number; // 2.2. Thu từ lãi đầu tư, tín dụng (lãi tiết kiệm, cổ phiếu, cho vay, góp vốn...)
    row2_Total: number; // 2. Tổng = 2.1 + 2.2

    // 3. Thu nhập khác
    row3: number; // 3. Thu nhập khác (trúng xổ số, vui chơi có thưởng,...)

    totalIncome: number; // TỔNG SỐ (dòng 1+2+3)
    q2TotalIncome: number; // Câu 2. Tổng thu nhập khác = Dòng tổng số cột (1)
  };

  // BIỂU TỔNG HỢP THU NHẬP CỦA HỘ NĂM ..... (Trang 30)
  summary: {
    income1Salary: number; // 1. Thu nhập từ tiền lương, tiền công (Câu 2 Mục 1)
    income2Crops: number; // 2. Thu nhập từ trồng trọt (Câu 2 Mục 2)
    income3Livestock: number; // 3. Thu nhập từ chăn nuôi (Câu 2 Mục 3)
    income4Forestry: number; // 4. Thu nhập từ lâm nghiệp (Câu 2 Mục 4)
    income5Fishery: number; // 5. Thu nhập từ thủy sản (Câu 2 Mục 5)
    income6NonAgri: number; // 6. Thu nhập từ SXKD phi NLTS hoặc chế biến (Câu 2 Mục 6)
    income7Other: number; // 7. Thu nhập khác (Câu 2 Mục 7)
    totalHouseholdIncome: number; // Tổng thu nhập hộ (Nghìn đồng)
    perCapitaYearlyIncome: number; // Thu nhập bình quân đầu người/năm (Nghìn đồng)
    perCapitaMonthlyIncome: number; // Thu nhập bình quân đầu người/tháng (Triệu đồng hoặc nghìn đồng)
    
    // Ngày tháng ký
    locationDate: string; // VD: Tân Lập, ngày 18 tháng 9 năm 2026
    surveyorName: string; // Điều tra viên (Ký, ghi rõ họ tên)
  };

  // THÔNG TIN KIỂM ĐỊNH HIỆN TRƯỜNG & GPS
  audit: {
    surveyDate: string;
    latitude: number;
    longitude: number;
    gpsAccuracy: number;
    ipAddress: string;
    fakeIpWarning: boolean;
    fakeIpReason?: string;
    notes?: string;
  };
}
