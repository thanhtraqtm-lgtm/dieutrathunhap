import {
  Enumerator,
  HouseholdListing,
  SampleHousehold,
  SamplingSummary,
  SurveyFormData,
  HouseholdIncomeSurveyData,
} from '../types/survey';

// Địa chỉ backend. Khi frontend + backend cùng chạy chung 1 dự án Vercel (api/ ở cùng domain),
// để TRỐNG biến VITE_API_BASE_URL là được — app sẽ tự gọi API cùng domain (VD: /api/auth/login).
// Chỉ cần đặt VITE_API_BASE_URL khi tách backend ra chạy ở 1 domain khác (VD: deploy backend
// riêng trên Render). Khi chạy `npm run dev` ở máy cá nhân (Vite dev server cổng 3000, backend
// cổng 4000 riêng), tự động trỏ về localhost:4000 nếu chưa khai báo gì.
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? ((import.meta as any).env?.DEV ? 'http://localhost:4000' : '');

const TOKEN_KEY = 'tkcs_auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    throw new ApiError(
      `Không kết nối được tới máy chủ (${API_BASE_URL}). Kiểm tra lại kết nối mạng hoặc địa chỉ server.`,
      0
    );
  }

  if (res.status === 401) {
    clearToken();
    throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    throw new ApiError(body?.error || `Lỗi máy chủ (mã ${res.status})`, res.status);
  }
  return body as T;
}

// ============ AUTH ============
export interface LoginResult {
  token: string;
  role: 'admin' | 'enumerator';
  mustChangePassword: boolean;
  enumerator: Enumerator | null;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const result = await request<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(result.token);
  return result;
}

export function logout() {
  clearToken();
}

export async function fetchMe(): Promise<{
  username: string;
  role: 'admin' | 'enumerator';
  mustChangePassword: boolean;
  enumerator: Enumerator | null;
}> {
  return request('/api/auth/me');
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await request('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

// ============ ENUMERATORS (Admin) ============
export async function apiGetEnumerators(): Promise<Enumerator[]> {
  return request('/api/enumerators');
}

export async function apiCreateEnumerator(
  data: Omit<Enumerator, 'id'>
): Promise<{ enumerator: Enumerator; tempPassword: string }> {
  return request('/api/enumerators', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateEnumerator(id: string, data: Partial<Enumerator>): Promise<Enumerator> {
  return request(`/api/enumerators/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function apiDeleteEnumerator(id: string): Promise<void> {
  await request(`/api/enumerators/${id}`, { method: 'DELETE' });
}

export async function apiResetEnumeratorPassword(id: string): Promise<{ tempPassword: string }> {
  return request(`/api/enumerators/${id}/reset-password`, { method: 'POST' });
}

// ============ HOUSEHOLD LISTINGS (Admin) ============
export async function apiGetListings(communeCode?: string): Promise<HouseholdListing[]> {
  const qs = communeCode ? `?communeCode=${encodeURIComponent(communeCode)}` : '';
  return request(`/api/listings${qs}`);
}

export async function apiGetCommunesSummary(): Promise<{ code: string; name: string; count: number }[]> {
  return request('/api/listings/communes');
}

export async function apiImportListings(listings: HouseholdListing[]): Promise<{ inserted: number }> {
  return request('/api/listings/import', { method: 'POST', body: JSON.stringify({ listings }) });
}

export async function apiDeleteListingsByCommune(communeCode: string): Promise<{ deleted: number }> {
  return request(`/api/listings/commune/${encodeURIComponent(communeCode)}`, { method: 'DELETE' });
}

// ============ SAMPLING (Admin) ============
export async function apiRunSampling(
  communeCode: string,
  householdsPerArea: number,
  reservePerArea: number,
  samplingMethod: 'systematic' | 'stratified_by_income'
): Promise<{ summary: SamplingSummary }> {
  return request('/api/sampling/run', {
    method: 'POST',
    body: JSON.stringify({ communeCode, householdsPerArea, reservePerArea, samplingMethod }),
  });
}

// ============ SAMPLES ============
export async function apiGetMySamples(): Promise<SampleHousehold[]> {
  return request('/api/samples/mine');
}

export async function apiGetSamples(communeCode?: string): Promise<SampleHousehold[]> {
  const qs = communeCode ? `?communeCode=${encodeURIComponent(communeCode)}` : '';
  return request(`/api/samples${qs}`);
}

export async function apiUpdateSample(
  id: string,
  patch: Partial<{
    surveyStatus: string;
    progressPercent: number;
    startedAt: string;
    completedAt: string;
    surveyData: SurveyFormData;
    incomeSurveyData: HouseholdIncomeSurveyData;
    fakeIpDetails: any;
    driveSynced: boolean;
  }>
): Promise<SampleHousehold> {
  return request(`/api/samples/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
}

export async function apiReplaceSample(officialId: string, reserveId: string, reason: string): Promise<void> {
  await request('/api/samples/replace', {
    method: 'POST',
    body: JSON.stringify({ officialId, reserveId, reason }),
  });
}

// ============ GOOGLE DRIVE (Admin) ============
export async function apiGetDriveStatus(): Promise<{ configured: boolean }> {
  return request('/api/drive/status');
}

export async function apiDriveBackup(): Promise<{
  success: boolean; fileName: string; fileLink: string;
  counts: { enumerators: number; listings: number; samples: number };
}> {
  return request('/api/drive/backup', { method: 'POST' });
}

export async function apiDriveExportReports(): Promise<{
  success: boolean;
  files: { communeCode: string; communeName: string; fileName: string; fileLink: string }[];
}> {
  return request('/api/drive/export-reports', { method: 'POST' });
}

export { ApiError };
