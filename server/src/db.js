import pg from 'pg';

// Đọc chuỗi kết nối Postgres từ biến môi trường DATABASE_URL — hoạt động với BẤT KỲ nhà cung cấp
// Postgres nào có kiểu chuỗi kết nối chuẩn (Neon, Supabase, Vercel Postgres, hay 1 server Postgres tự cài).
// Trên Vercel Serverless, giữ số connection thấp (max: 1-3) vì mỗi lần hàm "nguội" khởi động lại
// có thể tạo pool riêng — giữ pool nhỏ để tránh vượt giới hạn connection của gói free bên Postgres.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ THIẾU biến môi trường DATABASE_URL — server không thể kết nối database. Xem HUONG_DAN_DEPLOY.md.');
}

export const pool = new pg.Pool({
  connectionString,
  max: process.env.VERCEL ? 3 : 10,
  ssl: connectionString && !connectionString.includes('localhost') ? { rejectUnauthorized: false } : false,
});

// Helper gọi query ngắn gọn hơn — dùng khắp các route thay vì gọi pool.query trực tiếp.
export async function query(text, params) {
  return pool.query(text, params);
}

// Chạy nhiều câu lệnh trong 1 transaction (BEGIN...COMMIT/ROLLBACK) — dùng khi cần ghi nhiều
// bảng cùng lúc và phải thành công/thất bại đồng thời (VD: tạo ĐTV + tạo tài khoản đăng nhập).
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

let schemaInitialized = false;
let schemaInitPromise = null;

// Tạo bảng nếu chưa có — AN TOÀN gọi lại nhiều lần (IF NOT EXISTS). Trên serverless, mỗi lần
// hàm "nguội" khởi động lại đều gọi hàm này 1 lần, nhưng chỉ chạy thật sự lần đầu (nhờ cờ nhớ).
export async function ensureSchema() {
  if (schemaInitialized) return;
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'enumerator')),
        enumerator_id TEXT,
        must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS enumerators (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        username TEXT,
        assigned_communes TEXT NOT NULL DEFAULT '[]',
        assigned_wards TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'active',
        avatar TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      DO $$ BEGIN
        ALTER TABLE users ADD CONSTRAINT users_enumerator_fk
          FOREIGN KEY (enumerator_id) REFERENCES enumerators(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS household_listings (
        id TEXT PRIMARY KEY,
        stt INTEGER,
        province_code TEXT,
        province_name TEXT,
        district_code TEXT,
        district_name TEXT,
        commune_code TEXT NOT NULL,
        commune_name TEXT,
        area_code TEXT,
        tkcs_code TEXT,
        household_name TEXT,
        owner_name TEXT,
        address TEXT,
        industry_code TEXT,
        industry_name TEXT,
        phone TEXT,
        main_income_source_code INTEGER,
        member_count INTEGER,
        estimated_revenue REAL,
        worker_count INTEGER,
        notes TEXT,
        reviewer_name TEXT,
        reviewer_phone TEXT,
        urban_rural TEXT,
        survey_listing_type TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_listings_commune ON household_listings(commune_code);
      CREATE INDEX IF NOT EXISTS idx_listings_area ON household_listings(area_code);

      CREATE TABLE IF NOT EXISTS sample_households (
        id TEXT PRIMARY KEY,
        listing_id TEXT,
        commune_code TEXT NOT NULL,
        area_code TEXT,
        sample_type TEXT NOT NULL CHECK (sample_type IN ('official', 'reserve')),
        sample_order INTEGER,
        assigned_enumerator_id TEXT,
        assigned_enumerator_name TEXT,
        survey_status TEXT NOT NULL DEFAULT 'not_started',
        progress_percent INTEGER NOT NULL DEFAULT 0,
        started_at TEXT,
        completed_at TEXT,
        sampling_note TEXT,
        household_json TEXT NOT NULL DEFAULT '{}',
        survey_data_json TEXT,
        income_survey_data_json TEXT,
        fake_ip_details_json TEXT,
        drive_synced BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_samples_commune ON sample_households(commune_code);
      CREATE INDEX IF NOT EXISTS idx_samples_enumerator ON sample_households(assigned_enumerator_id);

      CREATE TABLE IF NOT EXISTS sampling_runs (
        id TEXT PRIMARY KEY,
        commune_code TEXT NOT NULL,
        commune_name TEXT,
        summary_json TEXT NOT NULL,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    schemaInitialized = true;
  })();

  return schemaInitPromise;
}
