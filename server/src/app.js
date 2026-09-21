// Đây là "lõi" Express dùng CHUNG cho cả 2 cách chạy:
//  - Chạy như 1 server Node truyền thống (local dev, Render, VPS...) qua src/index.js
//  - Chạy như 1 Vercel Serverless Function qua api/[...path].js ở thư mục gốc dự án
// File này KHÔNG gọi app.listen() — việc đó do nơi import nó quyết định.
import 'dotenv/config';
import express from 'express';
import 'express-async-errors'; // tự bắt lỗi trong các route async, khỏi phải try/catch từng nơi
import cors from 'cors';
import authRoutes from './routes/auth.js';
import enumeratorRoutes from './routes/enumerators.js';
import listingRoutes from './routes/listings.js';
import samplingRoutes from './routes/sampling.js';
import sampleRoutes from './routes/samples.js';
import driveRoutes from './routes/drive.js';
import { ensureSchema } from './db.js';

const app = express();

app.use(cors()); // Cho phép frontend (chạy ở domain/URL khác) gọi API này
app.use(express.json({ limit: '15mb' })); // tăng giới hạn vì import Excel có thể gửi nhiều dòng cùng lúc

// Đảm bảo bảng đã được tạo trước khi xử lý BẤT KỲ request nào — quan trọng với môi trường
// serverless (Vercel), vì không có sự kiện "khởi động server" rõ ràng như chạy Node truyền thống.
// ensureSchema() tự nhớ đã chạy chưa nên gọi lại nhiều lần (nhiều request) không tốn kém.
app.use(async (req, res, next) => {
  try {
    await ensureSchema();
    next();
  } catch (err) {
    console.error('Lỗi khởi tạo database:', err);
    res.status(500).json({ error: 'Không kết nối được database. Kiểm tra lại biến môi trường DATABASE_URL.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'tkcs-backend', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/enumerators', enumeratorRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/sampling', samplingRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/drive', driveRoutes);

// Xử lý lỗi chung (nhờ express-async-errors, cả lỗi từ route async cũng rơi vào đây)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Lỗi hệ thống phía server. Vui lòng thử lại hoặc báo Admin kỹ thuật.' });
});

export default app;
