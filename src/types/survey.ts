import { HouseholdIncomeSurveyData } from './householdIncomeSurvey';
export * from './householdIncomeSurvey';

export interface Enumerator {
  id: string;
  code: string; // Mã ĐTV (ví dụ: DTV01)
  name: string; // Họ và tên
  phone: string;
  email: string;
  username: string;
  assignedCommunes: string[]; // Danh sách mã xã phụ trách
  assignedWards: string[]; // Danh sách mã địa bàn phụ trách
  status: 'active' | 'inactive';
  avatar?: string;
  assignedHouseholdsCount?: number;
  completedHouseholdsCount?: number;
}

export interface HouseholdListing {
  id: string;
  stt: number;
  provinceCode: string; // Mã Tỉnh (VD: 01, 33)
  provinceName: string;
  districtCode: string; // Mã Huyện (VD: 001, 016)
  districtName: string;
  communeCode: string; // Mã Xã (VD: 00001, 03301)
  communeName: string; // Tên Xã / Phường (VD: Phường Thượng Hồng, Xã Tân Lập)
  areaCode: string; // Mã Địa bàn (VD: 001, TDP Sài Phi_001)
  tkcsCode: string; // Mã TKCS / Mã Hộ (VD: 0101001, HP001)
  householdName: string; // Tên chủ hộ / Tên cơ sở (VD: Đặng Văn Chuyên)
  ownerName?: string; // Họ và tên chủ hộ / người đại diện
  address: string; // Địa chỉ chi tiết (Thôn, ấp, tổ dân phố, số nhà, đường ĐH32...)
  industryCode: string; // Mã ngành cấp 4/5 (VD: 4711, 5610, 01, 41...)
  industryName: string; // Tên ngành nghề SXKD
  phone: string;
  estimatedRevenue?: number; // Doanh thu ước tính (triệu đồng)
  workerCount?: number; // Lao động ước tính
  notes?: string; // Ghi chú (chứa SĐT, đặc điểm hộ...)
  // Các trường chuẩn hóa theo biểu mẫu "BẢNG KÊ HỘ ĐIỀU TRA THU NHẬP BÌNH QUÂN ĐẦU NGƯỜI CẤP XÃ"
  memberCount?: number; // Cột 1: Số nhân khẩu thực tế thường trú của hộ khi lập bảng kê
  mainIncomeSourceCode?: number; // Cột 2: Nguồn thu nhập lớn nhất (1: Nông lâm thủy sản; 2: Công nghiệp xây dựng; 3: Thương mại dịch vụ; 4: Nguồn khác)
  mainIncomeSourceName?: string; // Tên nhóm nguồn thu nhập lớn nhất
  urbanRural?: string; // Thành thị / Nông thôn
  reviewerName?: string; // Người rà soát bảng kê
  reviewerPhone?: string; // SĐT người rà soát
  surveyListingType?: 'income' | 'tkcs'; // Loại bảng kê
}

export type SampleType = 'official' | 'reserve'; // Mẫu chính thức | Mẫu dự phòng

export type SurveyStatus = 
  | 'not_started' // Chưa điều tra
  | 'in_progress' // Đang điều tra
  | 'completed'   // Đã hoàn thành
  | 'refused'     // Từ chối cung cấp
  | 'moved'       // Đã chuyển đi / Không tìm thấy
  | 'needs_review'; // Cần kiểm tra lại

export interface FakeIpDetails {
  isFlagged: boolean;
  detectedIp: string;
  clientTimezone: string;
  mockGpsDetected: boolean;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  distanceDeviationKm?: number;
  reason?: string;
  checkedAt: string;
}

export interface SampleHousehold extends HouseholdListing {
  sampleType: SampleType;
  sampleOrder: number; // Thứ tự chọn mẫu
  assignedEnumeratorId?: string;
  assignedEnumeratorName?: string;
  surveyStatus: SurveyStatus;
  progressPercent: number; // 0 - 100%
  startedAt?: string;
  completedAt?: string;
  fakeIpDetails?: FakeIpDetails;
  surveyData?: SurveyFormData;
  incomeSurveyData?: HouseholdIncomeSurveyData;
  driveSynced?: boolean;
  driveSyncPath?: string;
  samplingNote?: string; // Ghi chú chọn mẫu, VD: hộ được bù từ địa bàn khác cho đủ chỉ tiêu
}

// Nội dung chi tiết phiếu điều tra theo đúng biểu mẫu Thống Kê Cơ Sở
export interface SurveyFormData {
  // Mục I: Thông tin nhận dạng
  generalInfo: {
    provinceName: string;
    provinceCode: string;
    districtName: string;
    districtCode: string;
    communeName: string;
    communeCode: string;
    areaCode: string; // Mã địa bàn
    tkcsCode: string; // Mã TKCS
    householdName: string; // Tên cơ sở / Tên chủ hộ
    representativeName: string; // Người đại diện / Chủ hộ
    gender: 'Nam' | 'Nữ';
    birthYear: string;
    idCardNumber: string; // CCCD / Mã số định danh
    taxCode: string; // Mã số thuế (nếu có)
    address: string;
    phone: string;
    email: string;
    industryName: string;
    industryCode: string;
    operationalStatus: '1. Đang hoạt động' | '2. Tạm ngừng hoạt động' | '3. Ngừng hẳn/Giải thể' | '4. Không tìm thấy hộ/Đã chuyển đi' | '5. Từ chối cung cấp';
  };

  // Mục II: Lao động của cơ sở
  laborInfo: {
    totalLabor: number; // Tổng số lao động hiện có
    femaleLabor: number; // Trong đó: Lao động nữ
    familyLabor: number; // Lao động gia đình (không hưởng lương)
    hiredLabor: number; // Lao động thuê ngoài (hưởng lương)
    qualification: '1. Đại học trở lên' | '2. Cao đẳng, Trung cấp' | '3. Sơ cấp / Đào tạo ngắn hạn' | '4. Chưa qua đào tạo';
  };

  // Mục III: Kết quả sản xuất kinh doanh
  businessResults: {
    monthsActive: number; // Số tháng thực tế hoạt động trong năm (1-12)
    averageMonthlyRevenue: number; // Doanh thu bình quân 1 tháng (triệu đồng)
    totalYearlyRevenue: number; // Ước tính tổng doanh thu cả năm (triệu đồng)
    
    // Chi phí sản xuất kinh doanh bình quân 1 tháng
    totalMonthlyExpense: number; // Tổng chi phí bình quân 1 tháng
    materialsExpense: number; // a. Chi mua nguyên nhiên vật liệu, hàng hóa
    laborSalaryExpense: number; // b. Chi trả tiền công, tiền lương người lao động
    rentExpense: number; // c. Chi thuê nhà xưởng, mặt bằng, máy móc
    depreciationExpense: number; // d. Chi phí khấu hao tài sản cố định
    utilityServicesExpense: number; // e. Chi dịch vụ mua ngoài (điện, nước, viễn thông, cước vận chuyển)
    otherExpenses: number; // f. Các chi phí khác
    
    netIncomeMonthly: number; // Thu nhập / Lợi nhuận thuần bình quân 1 tháng (triệu đồng)
  };

  // Mục IV: Thuế và nghĩa vụ ngân sách nhà nước
  taxObligation: {
    taxDeclarationType: '1. Thuế khoán' | '2. Kê khai theo doanh thu/chi phí' | '3. Miễn thuế/Chưa đến mức nộp thuế';
    totalTaxPaid: number; // Tổng tiền thuế và các khoản phí đã nộp trong kỳ (triệu đồng)
  };

  // Mục V: Vốn đầu tư và tiếp cận tín dụng
  capitalCredit: {
    totalCapital: number; // Tổng nguồn vốn đang sử dụng cho SXKD (triệu đồng)
    bankLoanCapital: number; // Trong đó: Vốn vay ngân hàng, tổ chức tín dụng (triệu đồng)
    hasLoanDemand: boolean; // Có nhu cầu vay vốn mở rộng SXKD không?
    loanDemandAmount?: number; // Số tiền cần vay nếu có (triệu đồng)
  };

  // Mục VI: Ứng dụng công nghệ thông tin & TMĐT
  itApplication: {
    usesInternet: boolean; // Có sử dụng Internet phục vụ SXKD không?
    sellsOnline: boolean; // Có bán hàng/dịch vụ qua các kênh trực tuyến không?
    onlineChannels: string[]; // Website, Facebook, Zalo, TikTok, Shopee, Lazada, Sàn TMĐT khác...
    onlineRevenuePercent: number; // Tỷ lệ doanh thu qua mạng internet (%)
    acceptsCashlessPayment: boolean; // Chấp nhận thanh toán không dùng tiền mặt?
    cashlessMethods: string[]; // Chuyển khoản, QR Code, Thẻ POS, Ví điện tử
  };

  // Mục VII: Đánh giá khó khăn và kiến nghị
  challengesRecommendations: {
    mainChallenges: string[]; // Thiếu vốn, Mặt bằng, Thị trường tiêu thụ, Giá nguyên vật liệu, Nhân công, Thủ tục hành chính...
    otherChallengeDetails?: string;
    recommendations: string; // Đề xuất, kiến nghị với Nhà nước
  };

  // Mục VIII: Thông tin kiểm định và chữ ký
  verification: {
    respondentName: string; // Họ tên người cung cấp thông tin
    respondentTitle: string; // Chức danh / Mối quan hệ với chủ hộ
    respondentSignature?: string; // Data URL chữ ký
    enumeratorName: string; // Họ tên ĐTV
    enumeratorCode: string; // Mã ĐTV
    enumeratorSignature?: string;
    surveyDate: string; // Ngày thực hiện
    latitude: number;
    longitude: number;
    gpsAccuracy: number;
    proofPhotoUrl?: string; // Ảnh chụp hiện trường
    ipAddress: string;
    fakeIpWarning: boolean;
    fakeIpReason?: string;
    notes?: string;
  };
}

export interface SamplingSummary {
  communeCode: string;
  communeName: string;
  totalListHouseholds: number; // N
  targetSampleSize: number; // n
  samplingRatioPercent: number;
  samplingIntervalK: number; // Bước nhảy k = N / n
  randomStartR: number; // Số ngẫu nhiên ban đầu r
  officialSampleCount: number;
  reserveSampleCount: number;
  selectedOfficialIds: string[];
  selectedReserveIds: string[];
  createdAt: string;
  samplingMethod?: 'systematic' | 'stratified_by_income';
  householdsPerAreaTarget?: number; // Chỉ tiêu số hộ chính thức / địa bàn
  reservePerAreaTarget?: number; // Chỉ tiêu số hộ dự phòng / địa bàn
  areaCount?: number; // Số địa bàn tham gia chọn mẫu trong xã
  compensatedCount?: number; // Số hộ phải bù từ địa bàn khác trong xã cho đủ chỉ tiêu
  sectorDistribution?: {
    code: number;
    name: string;
    totalCount: number;
    selectedCount: number;
    percentage: number;
  }[];
}

export interface GoogleDriveFolderNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  size?: string;
  children?: GoogleDriveFolderNode[];
  downloadUrl?: string;
  mimeType?: string;
}
