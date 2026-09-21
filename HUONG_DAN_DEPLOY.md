# Hướng Dẫn Triển Khai — Hệ Thống TKCS (Tất Cả Trên Vercel)

Toàn bộ hệ thống — **cả giao diện web (frontend) lẫn máy chủ API (backend)** — giờ chạy
chung trong **1 dự án Vercel duy nhất**. Chỉ có 1 phần bắt buộc phải ở nơi khác: **database
Postgres** (vì Vercel không giữ file lâu dài, cần 1 database thật ở ngoài) — dùng
**Neon** (miễn phí, chuyên cho môi trường serverless như Vercel).

**Tóm tắt kiến trúc:**
- `src/` → giao diện web, Vercel tự build thành trang tĩnh.
- `api/[...path].js` + `server/` → API backend, Vercel tự biến thành Serverless Function,
  chạy tại `<domain-vercel-cua-anh>/api/...` — CÙNG domain với giao diện web, không cần
  quản lý 2 domain riêng như trước.
- **Neon Postgres** → nơi lưu dữ liệu thật (ĐTV, bảng kê, hộ mẫu, phiếu điều tra).

---

## BƯỚC 1 — Tạo database Postgres miễn phí trên Neon

1. Vào [neon.tech](https://neon.tech) → đăng ký (dùng tài khoản GitHub cho nhanh) →
   **Create a project** → đặt tên tuỳ ý (VD `tkcs`) → **Create**.
2. Sau khi tạo xong, Neon hiện ngay 1 **Connection string** dạng:
   ```
   postgresql://neondb_owner:AbCdEf123@ep-cool-name-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   Bấm **Copy** — đây chính là giá trị sẽ dùng cho biến `DATABASE_URL` ở Bước 3. Giữ lại
   chuỗi này, không public ra ngoài.

---

## BƯỚC 2 — Đưa code lên GitHub

Vercel deploy bằng cách kết nối tới 1 repo GitHub.
1. Vào [github.com](https://github.com) → **New repository** (đặt tên VD `tkcs-system`,
   để **Private** cho an toàn).
2. Giải nén file zip đã tải về, rồi đẩy code lên:
```bash
cd duong-dan-toi-thu-muc-da-giai-nen
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<ten-cua-anh>/tkcs-system.git
git push -u origin main
```
(Chưa quen `git`? Dùng [GitHub Desktop](https://desktop.github.com) — kéo thả thư mục và
bấm nút, không cần gõ lệnh.)

---

## BƯỚC 3 — Deploy lên Vercel

1. Vào [vercel.com](https://vercel.com) → đăng nhập bằng GitHub → **Add New** → **Project**
   → chọn repo `tkcs-system`.
2. Ở màn hình cấu hình:
   - **Root Directory:** để trống / dấu chấm (`.`) — dùng đúng gốc repo (đã có cả `src/`
     lẫn `api/` ở đây).
   - **Framework Preset:** Vercel tự nhận ra **Vite**, để mặc định.
   - **Build Command / Output Directory:** để mặc định (`npm run build` / `dist`).
3. Mở mục **Environment Variables**, thêm:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | chuỗi kết nối Neon đã copy ở Bước 1 |
   | `JWT_SECRET` | 1 chuỗi ngẫu nhiên dài (gõ bừa 40 ký tự chữ+số cũng được) |
   | `ADMIN_USERNAME` | `admin` (hoặc tên anh muốn) |
   | `ADMIN_PASSWORD` | 1 mật khẩu mạnh cho tài khoản Admin đầu tiên |

   *(Không cần khai báo `VITE_API_BASE_URL` — vì frontend và backend giờ chạy chung 1
   domain, hệ thống tự gọi đúng địa chỉ.)*
4. Bấm **Deploy**. Chờ khoảng 1-2 phút.
5. Xong sẽ có 1 link dạng `https://tkcs-system.vercel.app`. Kiểm tra bằng cách mở
   `https://tkcs-system.vercel.app/api/health` — thấy `{"ok":true,...}` là backend chạy tốt.

### Tài khoản Admin đầu tiên được tạo thế nào?
Ngay lần đầu có ai gọi tới API (VD anh mở link app), server tự kiểm tra: nếu chưa có tài
khoản Admin nào và đã khai báo `ADMIN_USERNAME`/`ADMIN_PASSWORD`, nó tự tạo luôn — khỏi cần
làm gì thêm. Đăng nhập ngay bằng 2 giá trị đó.

*(Cách khác nếu muốn chủ động: chạy `DATABASE_URL="chuỗi-neon-cua-anh" node server/src/scripts/createAdmin.js admin "MatKhau123!"` từ máy cá nhân — cần cài Node.js trên máy.)*

---

## BƯỚC 4 — (Tuỳ chọn nhưng khuyên dùng) Kết nối Google Drive để sao lưu

Đẩy bản sao lưu + báo cáo Excel thật sang Google Drive của anh, phòng khi cần khôi phục dữ
liệu. Dữ liệu vận hành chính vẫn nằm ở Neon Postgres — Drive chỉ giữ **bản sao**.

### a) Tạo Service Account trên Google Cloud
1. Vào [console.cloud.google.com](https://console.cloud.google.com) → tạo 1 Project mới.
2. **APIs & Services** → **Library** → tìm **Google Drive API** → **Enable**.
3. **APIs & Services** → **Credentials** → **Create Credentials** → **Service Account** →
   đặt tên tuỳ ý (VD `tkcs-drive-sync`) → **Create and Continue** → **Done**.
4. Bấm vào Service Account vừa tạo → tab **Keys** → **Add Key** → **Create new key** →
   chọn **JSON** → tải file về. **Giữ kỹ, không chia sẻ công khai.**
5. Mở file JSON, copy giá trị `"client_email"` (dạng
   `tkcs-drive-sync@ten-project.iam.gserviceaccount.com`).

### b) Chia sẻ 1 thư mục Drive cho Service Account
1. Vào [drive.google.com](https://drive.google.com) → tạo thư mục mới, VD `TKCS_2026`.
2. Chuột phải → **Share** → dán email Service Account ở trên vào → quyền **Editor** → Gửi.
3. Mở thư mục đó, copy ID trong URL trình duyệt:
   `drive.google.com/drive/folders/`**`1AbCxYz...đây_là_folder_id`**

### c) Mã hoá file JSON key thành base64
```bash
base64 -i duong-dan-toi-file-service-account.json | tr -d '\n'
```
Copy chuỗi dài hiện ra.

### d) Khai báo trên Vercel
Vào Project trên Vercel → **Settings** → **Environment Variables**, thêm:
| Key | Value |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` | chuỗi base64 ở bước (c) |
| `GOOGLE_DRIVE_FOLDER_ID` | folder ID ở bước (b.3) |
| `CRON_SECRET` | 1 chuỗi bí mật ngẫu nhiên bất kỳ (để Vercel tự gọi sao lưu định kỳ an toàn) |

Vào tab **Deployments** → bấm **Redeploy** ở bản mới nhất để áp dụng biến môi trường mới.

Hệ thống đã có sẵn cấu hình **Vercel Cron** (`vercel.json`) tự động gọi sao lưu **mỗi 6
giờ** — không cần làm gì thêm. Vào app → đăng nhập Admin → tab **"Cấu Trúc Google Drive"**
để bấm sao lưu/xuất báo cáo ngay lập tức bất kỳ lúc nào.

*(Lưu ý: Vercel Cron Jobs ở gói Free giới hạn tần suất tối thiểu là 1 lần/ngày cho mỗi cron —
nếu gói Free của anh báo lỗi khi deploy vì `vercel.json` đặt "mỗi 6 giờ", sửa `"schedule"`
trong file `vercel.json` thành `"0 2 * * *"` (chạy 1 lần/ngày lúc 2h sáng) rồi đẩy code
push lại lên GitHub, Vercel tự deploy lại.)*

---

## BƯỚC 5 — Đăng nhập & sử dụng

1. Mở link Vercel (VD `https://tkcs-system.vercel.app`) → đăng nhập bằng `ADMIN_USERNAME` /
   `ADMIN_PASSWORD` đã khai báo ở Bước 3.
2. Tab **"Quản Lý & Phân Quyền ĐTV"** → **"Thêm Điều Tra Viên"** → điền tên, mã xã/địa bàn
   phụ trách → hệ thống hiện **mật khẩu tạm đúng 1 lần** — copy gửi ngay cho ĐTV.
3. Tab **"Bảng Kê & Chọn Mẫu Theo Xã"** → tải lên Bảng kê hộ (Excel) → chọn mẫu.
4. **ĐTV** mở **CÙNG link Vercel đó** trên điện thoại → đăng nhập bằng tên đăng nhập + mật
   khẩu tạm → bị bắt đổi mật khẩu lần đầu → thấy đúng **10 hộ chính thức + 4 hộ dự phòng**
   được phân cho địa bàn của mình → điền phiếu ngay trên điện thoại → dữ liệu lưu thẳng lên
   Neon Postgres, Admin xem được ngay, không cần đồng bộ file qua lại.
5. (Nếu đã làm Bước 4) Tab **"Cấu Trúc Google Drive"** để xem/tải bản sao lưu và báo cáo.

---

## Lưu ý khác
- Vercel tự cấp **HTTPS** miễn phí.
- Gói Free của Neon **tự tạm ngưng (sleep)** database sau ~5 phút không có truy vấn nào —
  lần gọi đầu tiên sau đó chậm hơn khoảng 1-2 giây để "đánh thức", rồi nhanh bình thường.
  Đây là hành vi bình thường của gói Free, không phải lỗi.
- Backup: khuyên dùng Bước 4 (Google Drive) làm nơi sao lưu định kỳ tự động. Ngoài ra Neon
  cũng tự giữ lịch sử thay đổi database vài ngày gần nhất (tính năng "Point-in-time
  restore") ở cả gói Free, có thể khôi phục qua giao diện Neon nếu cần.
- File `server/src/index.js` vẫn dùng được để chạy backend theo kiểu server truyền thống
  (VD nếu sau này muốn tách backend ra Render/VPS riêng thay vì chung Vercel) — chỉ cần
  chạy `npm start` trong thư mục `server/` với cùng biến môi trường `DATABASE_URL`. Khi đó
  cần khai báo thêm `VITE_API_BASE_URL` ở phần cấu hình Vercel của frontend trỏ về domain
  backend đó.
