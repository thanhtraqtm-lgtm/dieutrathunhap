// Danh mục chuẩn các nguồn thu phục vụ Phụ lục II - Phiếu điều tra thu nhập hộ dân cư

export interface CatalogItem {
  code: number;
  name: string;
  category: string;
  defaultSubtype?: string;
}

// 1. DANH MỤC CÁC NGUỒN THU TỪ HOẠT ĐỘNG TRỒNG TRỌT (Trang 25 - Ảnh 3)
export const CROPS_CATALOG: CatalogItem[] = [
  // CÂY LƯƠNG THỰC, THỰC PHẨM VÀ CÂY HÀNG NĂM
  { code: 1, name: 'Cây lúa', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 2, name: 'Ngô/bắp', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 3, name: 'Khoai lang', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 4, name: 'Sắn/khoai mỳ', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 5, name: 'Cây lương thực khác', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 6, name: 'Khoai tây', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 7, name: 'Rau muống', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 8, name: 'Su hào', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 9, name: 'Bắp cải, súp lơ', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 10, name: 'Rau cải các loại', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 11, name: 'Đậu ăn quả tươi các loại', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 12, name: 'Cà chua', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 13, name: 'Cây gia vị', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 14, name: 'Rau củ quả khác', category: 'Cây lương thực, thực phẩm và cây hàng năm' },
  { code: 15, name: 'Cây hằng năm khác (đậu xanh, đen, đỏ, hoa, cây cảnh, cây thức ăn gia súc, cây làm phân xanh,...)', category: 'Cây lương thực, thực phẩm và cây hàng năm' },

  // CÂY CÔNG NGHIỆP HÀNG NĂM VÀ LÂU NĂM
  { code: 16, name: 'Đậu tương/ đậu nành', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 17, name: 'Lạc/ đậu phộng', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 18, name: 'Vừng/ mè', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 19, name: 'Mía', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 20, name: 'Thuốc lá, thuốc lào', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 21, name: 'Bông', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 22, name: 'Đay, gai', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 23, name: 'Cói', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 24, name: 'Cây CN hằng năm khác', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 25, name: 'Chè', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 26, name: 'Cà phê', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 27, name: 'Cao su', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 28, name: 'Hồ tiêu', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 29, name: 'Dừa', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 30, name: 'Dâu tằm', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 31, name: 'Điều/ đào lộn hột', category: 'Cây công nghiệp hàng năm và lâu năm' },
  { code: 32, name: 'Cây CN lâu năm khác', category: 'Cây công nghiệp hàng năm và lâu năm' },

  // CÂY ĂN QUẢ
  { code: 33, name: 'Cam, chanh, quít, bưởi', category: 'Cây ăn quả' },
  { code: 34, name: 'Dứa', category: 'Cây ăn quả' },
  { code: 35, name: 'Chuối', category: 'Cây ăn quả' },
  { code: 36, name: 'Xoài, muỗm', category: 'Cây ăn quả' },
  { code: 37, name: 'Táo', category: 'Cây ăn quả' },
  { code: 38, name: 'Nho', category: 'Cây ăn quả' },
  { code: 39, name: 'Mận', category: 'Cây ăn quả' },
  { code: 40, name: 'Đu đủ', category: 'Cây ăn quả' },
  { code: 41, name: 'Nhãn, vải, chôm chôm', category: 'Cây ăn quả' },
  { code: 42, name: 'Hồng xiêm/Sa pu chê', category: 'Cây ăn quả' },
  { code: 43, name: 'Na/mãng cầu', category: 'Cây ăn quả' },
  { code: 44, name: 'Mít, sầu riêng', category: 'Cây ăn quả' },
  { code: 45, name: 'Măng cụt', category: 'Cây ăn quả' },
  { code: 46, name: 'Cây ăn quả khác', category: 'Cây ăn quả' },
  { code: 47, name: 'Cây lâu năm khác', category: 'Cây ăn quả' },

  // CÂY GIỐNG
  { code: 48, name: 'Cây giống', category: 'Cây giống' },

  // SẢN PHẨM PHỤ VÀ SẢN PHẨM THU NHẶT TỪ TRỒNG TRỌT
  { code: 49, name: 'Rơm, rạ', category: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt' },
  { code: 50, name: 'Lá, thân khoai lang', category: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt' },
  { code: 51, name: 'Thân cây ngô, cây sắn', category: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt' },
  { code: 52, name: 'Thân cây đậu các loại', category: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt' },
  { code: 53, name: 'Ngọn, lá mía', category: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt' },
  { code: 54, name: 'Thân cây đay, cây gai', category: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt' },
  { code: 55, name: 'Dâu tằm (thân cây)', category: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt' },
  { code: 56, name: 'Củi (từ các cây nông nghiệp)', category: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt' },
  { code: 57, name: 'Các sản phẩm phụ khác', category: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt' },
  { code: 58, name: 'Các sản phẩm thu nhặt, mót', category: 'Sản phẩm phụ và sản phẩm thu nhặt từ trồng trọt' },

  // DỊCH VỤ TRỒNG TRỌT
  { code: 59, name: 'Cày xới, làm đất', category: 'Dịch vụ trồng trọt' },
  { code: 60, name: 'Tưới tiêu nước', category: 'Dịch vụ trồng trọt' },
  { code: 61, name: 'Phòng trừ sâu bệnh', category: 'Dịch vụ trồng trọt' },
  { code: 62, name: 'Tuốt lúa, sơ chế sản phẩm', category: 'Dịch vụ trồng trọt' },
  { code: 63, name: 'Dịch vụ trồng trọt khác', category: 'Dịch vụ trồng trọt' },
];

// 2. DANH MỤC CÁC NGUỒN THU TỪ HOẠT ĐỘNG CHĂN NUÔI (Trang 26 - Ảnh 6)
export const LIVESTOCK_CATALOG: CatalogItem[] = [
  // GIA SÚC
  { code: 1, name: 'Thịt lợn hơi', category: 'Gia súc' },
  { code: 2, name: 'Thịt trâu, bò hơi', category: 'Gia súc' },
  { code: 3, name: 'Ngựa', category: 'Gia súc' },
  { code: 4, name: 'Dê, cừu', category: 'Gia súc' },
  { code: 5, name: 'Gia súc khác', category: 'Gia súc' },

  // GIA CẦM
  { code: 6, name: 'Gà', category: 'Gia cầm' },
  { code: 7, name: 'Vịt, ngan, ngỗng', category: 'Gia cầm' },
  { code: 8, name: 'Gia cầm khác', category: 'Gia cầm' },

  // CHĂN NUÔI KHÁC
  { code: 9, name: 'Chó', category: 'Chăn nuôi khác' },
  { code: 10, name: 'Thỏ', category: 'Chăn nuôi khác' },
  { code: 11, name: 'Trăn', category: 'Chăn nuôi khác' },
  { code: 12, name: 'Rắn', category: 'Chăn nuôi khác' },
  { code: 13, name: 'Chăn nuôi khác', category: 'Chăn nuôi khác' },

  // SẢN PHẨM KHÔNG QUA GIẾT MỔ
  { code: 14, name: 'Trứng gia cầm (gà, vịt, ...)', category: 'Sản phẩm không qua giết mổ' },
  { code: 15, name: 'Sữa tươi', category: 'Sản phẩm không qua giết mổ' },
  { code: 16, name: 'Kén tằm', category: 'Sản phẩm không qua giết mổ' },
  { code: 17, name: 'Mật ong', category: 'Sản phẩm không qua giết mổ' },
  { code: 18, name: 'Sản phẩm khác (không qua giết mổ)', category: 'Sản phẩm không qua giết mổ' },

  // GIỐNG GIA SÚC, GIA CẦM, VẬT NUÔI
  { code: 19, name: 'Lợn giống', category: 'Giống gia súc, gia cầm, vật nuôi' },
  { code: 20, name: 'Trâu bò giống', category: 'Giống gia súc, gia cầm, vật nuôi' },
  { code: 21, name: 'Giống gia súc khác, gia cầm, vật nuôi khác', category: 'Giống gia súc, gia cầm, vật nuôi' },

  // SẢN PHẨM PHỤ CHĂN NUÔI
  { code: 22, name: 'Phân trâu, bò, lợn, gia cầm, phân tằm', category: 'Sản phẩm phụ chăn nuôi' },
  { code: 23, name: 'Sản phẩm chăn nuôi tận thu: như lông, sừng, xương, da,... của gia súc bị chết, giết thịt', category: 'Sản phẩm phụ chăn nuôi' },

  // DỊCH VỤ CHĂN NUÔI
  { code: 24, name: 'Thụ tinh nhân tạo', category: 'Dịch vụ chăn nuôi' },
  { code: 25, name: 'Thiến, hoạn gia súc gia cầm', category: 'Dịch vụ chăn nuôi' },
  { code: 26, name: 'Dịch vụ chăn nuôi khác (phân loại và lau sạch trứng gia cầm,...)', category: 'Dịch vụ chăn nuôi' },
];

// 3. DANH MỤC CÁC NGUỒN THU TỪ HOẠT ĐỘNG LÂM NGHIỆP (Trang 26 - Ảnh 10)
export const FORESTRY_CATALOG: CatalogItem[] = [
  // KHAI THÁC, THU NHẶT LÂM SẢN
  { code: 1, name: 'Trẩu, sở', category: 'Khai thác, thu nhặt lâm sản' },
  { code: 2, name: 'Quế', category: 'Khai thác, thu nhặt lâm sản' },
  { code: 3, name: 'Hồi', category: 'Khai thác, thu nhặt lâm sản' },
  { code: 4, name: 'Thông', category: 'Khai thác, thu nhặt lâm sản' },
  { code: 5, name: 'Cây cánh kiến', category: 'Khai thác, thu nhặt lâm sản' },
  { code: 6, name: 'Cây lấy gỗ', category: 'Khai thác, thu nhặt lâm sản' },
  { code: 7, name: 'Tre, luồng, nứa', category: 'Khai thác, thu nhặt lâm sản' },
  { code: 8, name: 'Cọ', category: 'Khai thác, thu nhặt lâm sản' },
  { code: 9, name: 'Dừa nước', category: 'Khai thác, thu nhặt lâm sản' },
  { code: 10, name: 'Cây lâm nghiệp khác', category: 'Khai thác, thu nhặt lâm sản' },
  { code: 11, name: 'Củi', category: 'Khai thác, thu nhặt lâm sản' },

  // DỊCH VỤ LÂM NGHIỆP
  { code: 12, name: 'Bảo vệ rừng', category: 'Dịch vụ lâm nghiệp' },
  { code: 13, name: 'Quản lý lâm nghiệp', category: 'Dịch vụ lâm nghiệp' },
  { code: 14, name: 'Dịch vụ lâm nghiệp khác: Thu từ hoạt động tưới, tiêu nước phục vụ lâm nghiệp, hoạt động sơ chế gỗ trong rừng,... hộ làm cho bên ngoài', category: 'Dịch vụ lâm nghiệp' },
];

// 4. DANH MỤC CÁC NGUỒN THU TỪ HOẠT ĐỘNG THỦY SẢN (Trang 27-28 - Ảnh 11, 12)
export const FISHERY_CATALOG: CatalogItem[] = [
  { code: 1, name: 'Cá (Nuôi trồng)', category: 'Nuôi trồng thủy sản' },
  { code: 2, name: 'Tôm (Nuôi trồng)', category: 'Nuôi trồng thủy sản' },
  { code: 3, name: 'Thủy sản khác (Nuôi trồng: cua, ốc, lươn, ngao, sò...)', category: 'Nuôi trồng thủy sản' },
  { code: 4, name: 'Cá (Đánh bắt)', category: 'Đánh bắt thủy sản' },
  { code: 5, name: 'Tôm (Đánh bắt)', category: 'Đánh bắt thủy sản' },
  { code: 6, name: 'Thủy sản khác (Đánh bắt)', category: 'Đánh bắt thủy sản' },
  { code: 7, name: 'Cá giống các loại', category: 'Sản xuất giống' },
  { code: 8, name: 'Tôm giống các loại', category: 'Sản xuất giống' },
  { code: 9, name: 'Con giống thủy sản khác', category: 'Sản xuất giống' },
];
