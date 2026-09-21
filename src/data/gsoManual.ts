export interface GsoGuideline {
  id: string;
  title: string;
  summary: string;
  details: string[];
  tips: string[];
}

export const GSO_SURVEY_GUIDELINES: GsoGuideline[] = [
  {
    id: 'scope',
    title: '1. Đối tượng và đơn vị điều tra',
    summary: 'Cơ sở sản xuất kinh doanh cá thể thuộc tất cả các ngành kinh tế (trừ nông nghiệp, lâm nghiệp và thủy sản)',
    details: [
      'Là cơ sở do một cá nhân hoặc một nhóm cá nhân/hộ gia đình làm chủ.',
      'Địa điểm hoạt động: Có địa điểm cố định (cửa hàng, ki-ốt, nhà xưởng, tại nhà riêng) hoặc không có địa điểm cố định (bán rong, vận tải đường bộ cá thể).',
      'Đã hoạt động liên tục hoặc theo mùa vụ trong năm điều tra.',
      'Chưa đăng ký thành lập doanh nghiệp theo Luật Doanh nghiệp.'
    ],
    tips: [
      'ĐTV phải đến tận nơi cơ sở để phỏng vấn trực tiếp chủ cơ sở hoặc người am hiểu nhất về tình hình SXKD.',
      'Không phỏng vấn qua điện thoại hoặc nhờ người không liên quan trả lời thay.'
    ]
  },
  {
    id: 'replacement_rules',
    title: '2. Quy tắc thay thế mẫu chính thức bằng mẫu dự phòng',
    summary: 'Tuyệt đối tuân thủ quy định thay mẫu của Tổng cục Thống kê, không tùy tiện bỏ mẫu',
    details: [
      'Trường hợp 1: Cơ sở đã giải thể, ngừng hoạt động hẳn trước thời điểm điều tra.',
      'Trường hợp 2: Cơ sở đã chuyển hẳn khỏi địa bàn xã/phường điều tra và không thể liên lạc.',
      'Trường hợp 3: Cơ sở từ chối cung cấp thông tin sau khi ĐTV và Tổ trưởng/Giám sát viên đã đến vận động nhiều lần.',
      'ĐTV phải chọn đúng trạng thái tại Mục I, ghi rõ biên bản xác minh vào phần Ghi chú, sau đó bấm "Kích hoạt mẫu dự phòng" cùng địa bàn để thay thế.'
    ],
    tips: [
      'Không được tự ý bỏ qua hộ mẫu chính thức khi chưa có xác nhận của địa phương hoặc tổ trưởng.',
      'Mẫu thay thế phải lấy từ danh sách Mẫu dự phòng đã được sinh ngẫu nhiên cùng xã/địa bàn.'
    ]
  },
  {
    id: 'revenue_expense',
    title: '3. Phương pháp thu thập Doanh thu và Chi phí',
    summary: 'Kỹ thuật hỏi và bóc tách số liệu đối với các hộ không có sổ sách kế toán',
    details: [
      'Bước 1 - Hỏi doanh thu ngày bình thường và ngày cao điểm (cuối tuần, lễ tết), sau đó tính bình quân tháng: Doanh thu tháng = (Doanh thu ngày thường x số ngày) + (Doanh thu ngày đông x số ngày).',
      'Bước 2 - Bóc tách 6 khoản chi phí: (1) Tiền mua hàng hóa/NVL; (2) Tiền công trả người làm thuê; (3) Tiền thuê mặt bằng; (4) Khấu hao công cụ/máy móc; (5) Tiền điện nước viễn thông; (6) Chi khác.',
      'Bước 3 - Cân đối logic: Lợi nhuận thuần = Doanh thu - Tổng chi phí. Lợi nhuận phải hợp lý với quy mô cuộc sống và tích lũy của chủ hộ.'
    ],
    tips: [
      'Nếu hộ bán hàng tạp hóa/thương nghiệp: Doanh thu = Toàn bộ tiền bán hàng (không phải tiền lãi). Chi phí NVL = Toàn bộ tiền nhập hàng.',
      'Nếu hộ có người nhà cùng làm không trả lương: Không tính tiền lương người nhà vào chi phí, chỉ tính lương người thuê ngoài.'
    ]
  },
  {
    id: 'gps_ip',
    title: '4. Giám sát tọa độ GPS và Cờ chống Fake IP',
    summary: 'Quy trình thu nhận bằng chứng định vị thực địa tại cơ sở',
    details: [
      'Tại vị trí cơ sở, ĐTV mở phần "VIII. Xác thực & GPS" và bấm nút "Lấy tọa độ GPS hiện tại".',
      'Hệ thống tự động ghi nhận kinh độ, vĩ độ, sai số (mét) và địa chỉ IP mạng.',
      'ĐTV chụp ảnh biển hiệu hoặc mặt tiền cơ sở kinh doanh để lưu chứng thư thực địa.',
      'Hệ thống ngầm đối soát vị trí với ranh giới xã/địa bàn để đảm bảo tính khách quan của dữ liệu.'
    ],
    tips: [
      'Bật định vị GPS trên điện thoại trước khi bắt đầu phỏng vấn.',
      'Nếu vào khu vực sóng yếu hoặc trong nhà bị che khuất, ĐTV đứng ra cửa hàng hoặc hiên ngoài để dò GPS đạt sai số dưới 15m.'
    ]
  }
];
