import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function createDocx() {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

  // 2. _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // 3. word/_rels/document.xml.rels
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  // 4. word/styles.xml
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="26"/>
        <w:lang w:val="vi-VN"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`);

  // 5. word/document.xml
  const content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>TỔNG CỤC THỐNG KÊ - CỤC THỐNG KÊ</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>HỆ THỐNG ĐIỀU TRA THỐNG KÊ QUỐC GIA</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1E3A8A"/></w:rPr><w:t>PHƯƠNG ÁN ĐIỀU TRA THU NHẬP BÌNH QUÂN ĐẦU NGƯỜI CẤP XÃ</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:i/><w:sz w:val="26"/><w:color w:val="1E3A8A"/></w:rPr><w:t>VÀ ĐIỀU TRA CƠ SỞ SẢN XUẤT KINH DOANH CÁ THỂ</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="22"/><w:color w:val="475569"/></w:rPr><w:t>(Quy định quy trình lập bảng kê, thuật toán chọn mẫu hệ thống và phương pháp tổng hợp)</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr><w:t>I. MỤC ĐÍCH VÀ YÊU CẦU CỦA PHƯƠNG ÁN</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>1. Mục đích:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Thu thập thông tin định kỳ về mức thu nhập bình quân đầu người một tháng/năm của các xã, phường, thị trấn nhằm đánh giá thực trạng đời sống kinh tế - xã hội của cư dân nông thôn và đô thị.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Cung cấp dữ liệu chính thức phục vụ việc công nhận xã đạt chuẩn Nông thôn mới, Nông thôn mới nâng cao theo Bộ tiêu chí quốc gia (Tiêu chí số 10 về Thu nhập).</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Đánh giá mức độ chuyển dịch cơ cấu ngành kinh tế (nông nghiệp, công nghiệp, dịch vụ) và mức độ phân hóa thu nhập trong nội bộ cấp xã.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>2. Yêu cầu:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Điều tra viên (ĐTV) phải đến trực tiếp từng hộ mẫu để phỏng vấn chủ hộ và các thành viên, ghi nhận tọa độ GPS thực tế tại hộ, tuyệt đối không được ngồi tại trụ sở để ghi hộ hoặc suy đoán số liệu.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Số liệu điều tra phải phản ánh trung thực toàn bộ các khoản thu nhập thực tế thường trú trong 12 tháng qua.</w:t></w:r>
    </w:p>

    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr><w:t>II. ĐỐI TƯỢNG VÀ ĐƠN VỊ ĐIỀU TRA</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>1. Đối tượng điều tra: Hộ gia đình và toàn bộ các nhân khẩu thực tế thường trú (NKTT) tại xã/phường tại thời điểm lập bảng kê và thời điểm điều tra.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>2. Đơn vị điều tra: Hộ dân cư được chọn vào mẫu điều tra từ dàn chọn mẫu (Bảng kê hộ) của địa bàn/xã.</w:t></w:r>
    </w:p>

    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr><w:t>III. QUY TRÌNH LẬP BẢNG KÊ HỘ (DÀN CHỌN MẪU)</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>ĐTV phối hợp cùng Trưởng thôn / Tổ trưởng tổ dân phố tiến hành rà soát từng hộ trong địa bàn để ghi Bảng kê hộ với các cột chỉ tiêu bắt buộc:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Cột A: Số thứ tự (STT) từ 1 đến N của các hộ trong địa bàn.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Cột B: Họ và tên chủ hộ.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Cột C: Địa chỉ cụ thể của hộ (số nhà, đường/ngõ/xóm/thôn/TDP).</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Cột 1: Số nhân khẩu thực tế thường trú của hộ (NKTT) khi lập bảng kê.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Cột 2: Nguồn thu nhập lớn nhất của hộ thuộc ngành nào (Mã hóa theo 4 nhóm GSO):</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>    - Mã 1: Nông lâm nghiệp, thủy sản (trồng trọt, chăn nuôi, nuôi trồng/đánh bắt thủy sản, lâm nghiệp).</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>    - Mã 2: Công nghiệp, xây dựng (gia công, may mặc, cơ khí, chế biến, thợ xây, mộc, điện...).</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>    - Mã 3: Thương mại, dịch vụ (bán buôn, bán lẻ, vận tải, tạp hóa, ăn uống, dịch vụ đời sống...).</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>    - Mã 4: Nguồn khác (tiền lương, tiền công viên chức/công nhân, lương hưu, trợ cấp xã hội, kiều hối, lãi tiết kiệm...).</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Cột 3: Ghi chú hoặc số điện thoại liên hệ của hộ.</w:t></w:r>
    </w:p>

    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr><w:t>IV. THUẬT TOÁN VÀ CÁCH CHỌN MẪU HỘ ĐIỀU TRA THEO PHƯƠNG ÁN</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Phương pháp chọn mẫu chuẩn của Tổng cục Thống kê là Chọn Mẫu Ngẫu Nhiên Hệ Thống (Systematic Random Sampling), ưu tiên phân tầng theo 4 nhóm ngành nguồn thu nhập để đảm bảo cơ cấu mẫu đại diện chính xác cho toàn bộ xã/địa bàn.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:b/><w:t>1. Các thông số cơ bản:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Quy mô tổng thể N: Tổng số hộ trong bảng kê của xã hoặc địa bàn điều tra.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Cỡ mẫu chính thức n: Số hộ cần chọn để phỏng vấn chính thức (theo quy định của phương án, ví dụ n = 6 hộ/địa bàn hoặc n = 30 hộ/xã).</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Cỡ mẫu dự phòng: Thường lấy từ 20% đến 30% cỡ mẫu chính thức để dự phòng thay mẫu khi cần thiết.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:b/><w:t>2. Công thức xác định bước nhảy mẫu (Khoảng cách chọn mẫu k):</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1E3A8A"/></w:rPr><w:t>k = ⌊ N / n ⌋</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Trong đó: ⌊ ⌋ là phép lấy phần nguyên. Ví dụ: Nếu N = 25, n = 6 thì k = ⌊25 / 6⌋ = 4.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:b/><w:t>3. Xác định số ngẫu nhiên ban đầu (r):</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Sinh một số ngẫu nhiên r trong khoảng từ 1 đến k (1 ≤ r ≤ k). Số r chính là số thứ tự của hộ mẫu đầu tiên được chọn.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:b/><w:t>4. Dãy thứ tự các hộ mẫu được chọn chính thức:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1E3A8A"/></w:rPr><w:t>S_i = r + (i - 1) × k    (với i = 1, 2, ..., n)</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Mẫu 1: S_1 = r</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Mẫu 2: S_2 = r + k</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Mẫu 3: S_3 = r + 2k</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Mẫu thứ n: S_n = r + (n - 1)k</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Ví dụ: Với N = 25, n = 6, k = 4, nếu số ngẫu nhiên r = 2, thì dãy hộ mẫu được chọn là các hộ có STT: 2, 6, 10, 14, 18, 22.</w:t></w:r>
    </w:p>

    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r><w:b/><w:t>5. Phân tầng ngẫu nhiên hệ thống theo 4 nhóm ngành nguồn thu nhập:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Để tránh trường hợp mẫu chọn bị tập trung quá nhiều vào 1 ngành (ví dụ toàn hộ nông nghiệp hoặc toàn hộ làm công ăn lương), trước khi áp dụng công thức chọn mẫu hệ thống, danh sách hộ được sắp xếp lần lượt theo:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Nhóm 1 (Nông nghiệp) -> Nhóm 2 (Công nghiệp) -> Nhóm 3 (Dịch vụ) -> Nhóm 4 (Nguồn khác).</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Trong từng nhóm, sắp xếp giảm dần theo số nhân khẩu thực tế thường trú.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Sau khi sắp xếp, tiến hành chọn mẫu hệ thống với bước nhảy k và số ngẫu nhiên r. Khi đó, mẫu được chọn sẽ phân bổ đều khắp các nhóm ngành theo đúng tỷ trọng của toàn xã.</w:t></w:r>
    </w:p>

    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr><w:t>V. QUY TẮC THAY THẾ MẪU VÀ SỬ DỤNG MẪU DỰ PHÒNG</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>1. Các trường hợp được phép thay mẫu:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Toàn bộ hộ gia đình đã chuyển hẳn đi nơi khác trước thời điểm điều tra.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Toàn bộ thành viên trong hộ đi vắng trong suốt chu kỳ điều tra thực địa.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Chủ hộ chết hoặc hộ giải thể, không còn ai sinh sống.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Hộ kiên quyết từ chối hợp tác sau khi ĐTV, Tổ trưởng và Ban chỉ đạo xã đã đến vận động, giải thích tối thiểu 3 lần.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>2. Quy trình thay mẫu:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- ĐTV lập biên bản nêu rõ lý do không thể điều tra hộ mẫu chính thức.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Giám sát viên phê duyệt đề xuất thay mẫu trên phần mềm quản lý.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Chọn hộ thay thế từ danh sách MẪU DỰ PHÒNG có cùng nhóm ngành nguồn thu nhập (Mã 1, 2, 3 hoặc 4) và cùng địa bàn với hộ bị thay thế.</w:t></w:r>
    </w:p>

    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr><w:t>VI. CÔNG THỨC TÍNH TOÁN VÀ TỔNG HỢP THEO PHIẾU ĐIỀU TRA</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Thu nhập bình quân đầu người của xã (triệu đồng/người/năm hoặc /tháng) được tính theo công thức:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1E3A8A"/></w:rPr><w:t>Thu nhập BQĐN = Tổng thu nhập của các hộ mẫu / Tổng nhân khẩu thường trú của các hộ mẫu</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Trong đó, thu nhập của hộ gồm 4 khoản chính:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>1. Thu nhập từ sản xuất nông, lâm nghiệp, thủy sản = Tổng doanh thu thu hoạch - Chi phí giống, phân bón, thức ăn, thuốc BVTV, dịch vụ nông nghiệp...</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>2. Thu nhập từ sản xuất kinh doanh phi nông nghiệp (cá thể) = Tổng doanh thu - Chi phí nguyên vật liệu, tiền thuê mặt bằng, điện nước, thuế...</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>3. Thu nhập từ tiền lương, tiền công = Tổng tiền lương, tiền thưởng, phụ cấp, làm thêm của tất cả các thành viên trong hộ.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>4. Các khoản thu khác = Tiền kiều hối, quà biếu, lãi tiền gửi tiết kiệm, trợ cấp thương binh/liệt sĩ, bảo trợ xã hội...</w:t></w:r>
    </w:p>

    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr><w:t>VII. GIÁM SÁT THỰC ĐỊA, ĐỊNH VỊ GPS VÀ PHÒNG CHỐNG FAKE IP</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Mỗi phiếu điều tra CAPI tự động thu thập tọa độ kinh độ, vĩ độ và độ chính xác GPS ngay tại địa điểm phỏng vấn.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Hệ thống tự động kiểm tra ranh giới địa lý của xã và phát hiện các dấu hiệu dùng phần mềm Fake GPS, VPN hoặc địa chỉ IP bất thường để gắn cờ cảnh báo trên Bảng điều khiển Giám sát.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>- Dữ liệu điều tra được tự động đồng bộ hóa lên đám mây theo cấu trúc thư mục phân cấp: Tỉnh / Huyện / Xã / Địa bàn / Phiếu điều tra.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', content);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });

  // Save to public and root
  fs.writeFileSync('public/phuong_an_chon_mau_ho_thu_nhap.docx', buffer);
  fs.writeFileSync('phuong_an_chon_mau_ho_thu_nhap.docx', buffer);

  console.log('Successfully created phuong_an_chon_mau_ho_thu_nhap.docx (size:', buffer.length, 'bytes)');
}

createDocx().catch(console.error);
