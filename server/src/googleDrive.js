import { google } from 'googleapis';
import { Readable } from 'stream';

// ============ THIẾT LẬP GOOGLE DRIVE (Service Account) ============
// Dùng "Service Account" thay vì đăng nhập Google cá nhân, vì server cần tự động đẩy file
// lên Drive mà không có ai ngồi bấm "Cho phép" mỗi lần. Cách thiết lập: xem HUONG_DAN_DEPLOY.md.
//
// Biến môi trường cần có:
//   GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 — nội dung file JSON khoá của Service Account, mã hoá base64
//   GOOGLE_DRIVE_FOLDER_ID            — ID thư mục Google Drive của Admin, đã chia sẻ quyền Editor
//                                       cho email của Service Account đó

function getCredentials() {
  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!base64Key) return null;
  try {
    const jsonStr = Buffer.from(base64Key, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Không đọc được GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 — kiểm tra lại giá trị đã mã hoá base64 đúng chưa.', err.message);
    return null;
  }
}

export function isDriveConfigured() {
  return !!getCredentials() && !!process.env.GOOGLE_DRIVE_FOLDER_ID;
}

let cachedDrive = null;
function getDriveClient() {
  if (cachedDrive) return cachedDrive;
  const credentials = getCredentials();
  if (!credentials) throw new Error('Chưa cấu hình Google Drive (thiếu GOOGLE_SERVICE_ACCOUNT_KEY_BASE64).');

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  cachedDrive = google.drive({ version: 'v3', auth });
  return cachedDrive;
}

export function getRootFolderId() {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id) throw new Error('Chưa cấu hình Google Drive (thiếu GOOGLE_DRIVE_FOLDER_ID).');
  return id;
}

// Tìm thư mục con theo tên trong 1 thư mục cha; nếu chưa có thì tự tạo mới. Trả về folder ID.
export async function findOrCreateFolder(name, parentId) {
  const drive = getDriveClient();
  const safeName = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name = '${safeName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });
  return created.data.id;
}

// Tải file lên thư mục Drive. Nếu đã có file trùng tên trong thư mục đó, GHI ĐÈ (cập nhật nội dung)
// thay vì tạo file trùng lặp. Trả về {id, webViewLink}.
export async function uploadOrUpdateFile(fileName, folderId, buffer, mimeType) {
  const drive = getDriveClient();
  const safeName = fileName.replace(/'/g, "\\'");
  const existing = await drive.files.list({
    q: `name = '${safeName}' and '${folderId}' in parents and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const media = { mimeType, body: bufferToStream(buffer) };

  if (existing.data.files && existing.data.files.length > 0) {
    const fileId = existing.data.files[0].id;
    const updated = await drive.files.update({
      fileId,
      media,
      fields: 'id, webViewLink',
    });
    return updated.data;
  }

  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media,
    fields: 'id, webViewLink',
  });
  return created.data;
}

function bufferToStream(buffer) {
  return Readable.from(buffer);
}
