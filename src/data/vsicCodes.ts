export interface VsicIndustry {
  code: string;
  name: string;
  category: string;
  commonExamples: string;
}

export const VSIC_INDUSTRIES: VsicIndustry[] = [
  {
    code: '4711',
    name: 'Bán lẻ lương thực, thực phẩm, đồ uống, thuốc lá, thuốc lào chiếm tỷ trọng lớn trong các cửa hàng kinh doanh tổng hợp',
    category: 'Thương nghiệp bán lẻ',
    commonExamples: 'Cửa hàng tạp hóa, bách hóa, mini mart, tiệm đồ khô'
  },
  {
    code: '4721',
    name: 'Bán lẻ lương thực trong các cửa hàng chuyên doanh',
    category: 'Thương nghiệp bán lẻ',
    commonExamples: 'Đại lý gạo, cửa hàng bán ngô khoai sắn'
  },
  {
    code: '4722',
    name: 'Bán lẻ thực phẩm trong các cửa hàng chuyên doanh',
    category: 'Thương nghiệp bán lẻ',
    commonExamples: 'Cửa hàng thịt, cá tươi sống, rau củ quả, sữa chua, xúc xích'
  },
  {
    code: '4771',
    name: 'Bán lẻ hàng may mặc, giày dép, hàng da và giả da trong các cửa hàng chuyên doanh',
    category: 'Thương nghiệp bán lẻ',
    commonExamples: 'Shop quần áo thời trang, tiệm giày dép, túi xách'
  },
  {
    code: '4772',
    name: 'Bán lẻ thuốc, dụng cụ y tế, mỹ phẩm và vật phẩm vệ sinh trong các cửa hàng chuyên doanh',
    category: 'Thương nghiệp bán lẻ',
    commonExamples: 'Nhà thuốc tây, tiệm mỹ phẩm, cửa hàng dược phẩm tư nhân'
  },
  {
    code: '4752',
    name: 'Bán lẻ thiết bị, dụng cụ kim khí, sơn, kính và thiết bị lắp đặt khác trong xây dựng',
    category: 'Thương nghiệp bán lẻ',
    commonExamples: 'Cửa hàng vật liệu xây dựng, đại lý sơn, đồ điện nước gia dụng'
  },
  {
    code: '5610',
    name: 'Dịch vụ ăn uống phục vụ lưu động và tại chỗ',
    category: 'Dịch vụ ăn uống',
    commonExamples: 'Quán cơm bình dân, phở, bún chả, nhà hàng gia đình, quán ốc, quán lẩu'
  },
  {
    code: '5630',
    name: 'Dịch vụ phục vụ đồ uống',
    category: 'Dịch vụ ăn uống',
    commonExamples: 'Quán cà phê, trà sữa, quán nước giải khát, tiệm sinh tố, quán bia hơi'
  },
  {
    code: '9522',
    name: 'Sửa chữa thiết bị, đồ dùng gia đình',
    category: 'Dịch vụ sửa chữa',
    commonExamples: 'Sửa chữa điện tử, điện lạnh, tivi, tủ lạnh, máy giặt gia đình'
  },
  {
    code: '4520',
    name: 'Bảo dưỡng, sửa chữa ô tô và xe có động cơ khác',
    category: 'Dịch vụ sửa chữa xe',
    commonExamples: 'Gara sửa chữa ô tô, tiệm vá vỏ, bảo dưỡng xe hơi'
  },
  {
    code: '4542',
    name: 'Bảo dưỡng, sửa chữa mô tô, xe máy',
    category: 'Dịch vụ sửa chữa xe',
    commonExamples: 'Tiệm sửa chữa xe máy, vá săm xe máy, thay nhớt xe'
  },
  {
    code: '9602',
    name: 'Cắt tóc, làm đầu, gội đầu, làm móng (nail) và dịch vụ làm đẹp khác',
    category: 'Dịch vụ cá nhân',
    commonExamples: 'Tiệm cắt tóc nam nữ, tiệm làm móng nail, spa mini, chăm sóc da'
  },
  {
    code: '1071',
    name: 'Sản xuất các loại bánh từ bột',
    category: 'Công nghiệp chế biến',
    commonExamples: 'Lò bánh mì, tiệm bánh ngọt, cơ sở làm bánh chưng, bánh dày'
  },
  {
    code: '3100',
    name: 'Sản xuất giường, tủ, bàn, ghế và đồ gỗ nội thất',
    category: 'Công nghiệp chế biến',
    commonExamples: 'Xưởng mộc gia đình, đóng đồ gỗ, sofa, tủ bếp'
  },
  {
    code: '2599',
    name: 'Sản xuất sản phẩm khác bằng kim loại chưa được phân vào đâu',
    category: 'Công nghiệp chế biến',
    commonExamples: 'Xưởng cơ khí nhôm kính, gò hàn cửa sắt, hàng rào sắt'
  },
  {
    code: '1410',
    name: 'May trang phục (trừ trang phục từ da lông thú)',
    category: 'Công nghiệp chế biến',
    commonExamples: 'Tiệm may đo quần áo, xưởng gia công may mặc tại nhà'
  },
  {
    code: '4932',
    name: 'Vận tải hành khách bằng taxi và xe hợp đồng cá thể',
    category: 'Vận tải kho bãi',
    commonExamples: 'Xe taxi gia đình, xe chạy dịch vụ công nghệ, xe 16 chỗ gia đình'
  },
  {
    code: '4933',
    name: 'Vận tải hàng hóa bằng đường bộ',
    category: 'Vận tải kho bãi',
    commonExamples: 'Xe ba gác chở hàng, xe tải nhỏ chở hàng thuê, dịch vụ chuyển nhà'
  },
  {
    code: '5510',
    name: 'Dịch vụ lưu trú ngắn ngày',
    category: 'Khách sạn lưu trú',
    commonExamples: 'Nhà nghỉ bình dân, homestay gia đình, phòng trọ du lịch'
  },
  {
    code: '7420',
    name: 'Hoạt động nhiếp ảnh',
    category: 'Dịch vụ chuyên môn',
    commonExamples: 'Tiệm chụp ảnh thẻ, studio chụp ảnh cưới, quay phim gia đình'
  }
];
