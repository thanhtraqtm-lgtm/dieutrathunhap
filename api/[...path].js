// Vercel tự biến file này thành 1 Serverless Function, nhận MỌI request tới /api/* (nhờ đặt tên
// dạng "catch-all" [...path].js) và giao lại cho ứng dụng Express xử lý — dùng lại NGUYÊN VẸN toàn
// bộ route trong server/src/app.js, không cần viết lại thành nhiều hàm serverless riêng lẻ.
import app from '../server/src/app.js';

export default app;
