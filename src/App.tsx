import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, Users, Layers, TrendingUp, ShieldAlert, Cloud, 
  Smartphone, Building2, Loader2
} from 'lucide-react';
import { Enumerator, HouseholdListing, SampleHousehold } from './types/survey';
import {
  getToken, fetchMe, logout as apiLogout, LoginResult,
  apiGetEnumerators, apiGetListings, apiGetSamples, apiGetMySamples,
} from './services/apiClient';
import { LoginScreen } from './components/auth/LoginScreen';
import { ChangePasswordScreen } from './components/auth/ChangePasswordScreen';
import { ProgressTracker } from './components/admin/ProgressTracker';
import { EnumeratorManager } from './components/admin/EnumeratorManager';
import { SamplingEngine } from './components/admin/SamplingEngine';
import { AggregatedReports } from './components/admin/AggregatedReports';
import { FakeIpMonitor } from './components/admin/FakeIpMonitor';
import { GoogleDriveSync } from './components/admin/GoogleDriveSync';
import { EnumeratorApp } from './components/enumerator/EnumeratorApp';
import { SurveyFormModal } from './components/enumerator/SurveyFormModal';

type AuthStatus = 'checking' | 'loggedOut' | 'mustChangePassword' | 'loggedIn';

export default function App() {
  // ===== TRẠNG THÁI ĐĂNG NHẬP THẬT (qua backend) =====
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [role, setRole] = useState<'admin' | 'enumerator' | null>(null);
  const [currentEnumerator, setCurrentEnumerator] = useState<Enumerator | null>(null);

  const [activeAdminTab, setActiveAdminTab] = useState<
    'progress' | 'enumerators' | 'sampling' | 'reports' | 'fakeip' | 'drive'
  >('progress');

  // State dữ liệu (giờ tải từ SERVER dùng chung, không còn từ localStorage của riêng trình duyệt)
  const [enumerators, setEnumerators] = useState<Enumerator[]>([]);
  const [listings, setListings] = useState<HouseholdListing[]>([]);
  const [samples, setSamples] = useState<SampleHousehold[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [viewingSurveySample, setViewingSurveySample] = useState<SampleHousehold | null>(null);

  // Tải dữ liệu ban đầu / sau mỗi thao tác — theo ĐÚNG quyền của tài khoản đang đăng nhập:
  // Admin thấy toàn bộ ĐTV/bảng kê/mẫu; ĐTV chỉ thấy đúng mẫu được phân cho mình (server tự lọc).
  const loadData = useCallback(async (currentRole: 'admin' | 'enumerator' | null) => {
    setDataLoading(true);
    try {
      if (currentRole === 'admin') {
        const [e, l, s] = await Promise.all([
          apiGetEnumerators(),
          apiGetListings(),
          apiGetSamples(),
        ]);
        setEnumerators(e);
        setListings(l);
        setSamples(s);
      } else if (currentRole === 'enumerator') {
        const s = await apiGetMySamples();
        setSamples(s);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu từ server:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Kiểm tra phiên đăng nhập đã lưu (token) khi mở lại app
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setAuthStatus('loggedOut');
        return;
      }
      try {
        const me = await fetchMe();
        setRole(me.role);
        setCurrentEnumerator(me.enumerator);
        if (me.mustChangePassword) {
          setAuthStatus('mustChangePassword');
        } else {
          setAuthStatus('loggedIn');
          loadData(me.role);
        }
      } catch {
        apiLogout();
        setAuthStatus('loggedOut');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoggedIn = (result: LoginResult) => {
    setRole(result.role);
    setCurrentEnumerator(result.enumerator);
    if (result.mustChangePassword) {
      setAuthStatus('mustChangePassword');
    } else {
      setAuthStatus('loggedIn');
      loadData(result.role);
    }
  };

  const handlePasswordChanged = () => {
    setAuthStatus('loggedIn');
    loadData(role);
  };

  const handleLogout = () => {
    apiLogout();
    setAuthStatus('loggedOut');
    setRole(null);
    setCurrentEnumerator(null);
    setEnumerators([]);
    setListings([]);
    setSamples([]);
  };

  const handleDataUpdated = () => {
    loadData(role);
  };

  // ===== MÀN HÌNH THEO TRẠNG THÁI ĐĂNG NHẬP =====
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (authStatus === 'loggedOut') {
    return <LoginScreen onLoggedIn={handleLoggedIn} />;
  }

  if (authStatus === 'mustChangePassword') {
    return <ChangePasswordScreen onChanged={handlePasswordChanged} />;
  }

  // Từ đây trở xuống là authStatus === 'loggedIn'

  // Tài khoản ĐTV đăng nhập -> CHỈ vào thẳng Ứng dụng Điều tra viên (CAPI), không có quyền vào trang Admin
  if (role === 'enumerator' && currentEnumerator) {
    return (
      <EnumeratorApp
        currentEnumerator={currentEnumerator}
        samples={samples}
        onSurveyUpdated={handleDataUpdated}
        onLogout={handleLogout}
      />
    );
  }

  const flaggedCount = samples.filter(s => s.fakeIpDetails?.isFlagged).length;
  const completedCount = samples.filter(s => s.surveyStatus === 'completed').length;
  const totalCount = samples.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Tài khoản Admin đăng nhập -> Trang điều hành đầy đủ
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      
      {/* Thanh Header Điều Hành Chính */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Tiêu đề hệ thống */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    GSO TKCS-2026
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">• Tổng Cục Thống Kê</span>
                </div>
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Hệ Thống Điều Hành & Điều Tra Thống Kê Cơ Sở Cá Thể
                </h1>
              </div>
            </div>

            {/* Các nút chuyển đổi chế độ & tiện ích */}
            <div className="flex items-center gap-3">
              {dataLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              <button
                onClick={() => setActiveAdminTab('drive')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                title="Sao lưu / xuất báo cáo lên Google Drive"
              >
                <Cloud className="w-4 h-4 text-blue-400" />
                <span>Drive Sync</span>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Thanh điều hướng Tab Quản Trị */}
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 text-xs">
            
            <button
              onClick={() => setActiveAdminTab('progress')}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeAdminTab === 'progress'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>1. Theo Dõi Tiến Độ (Mã TKCS/Xã/ĐB)</span>
              <span className="px-1.5 py-0.2 bg-blue-700 text-white rounded-full text-[10px] font-bold">
                {completionPercentage}%
              </span>
            </button>

            <button
              onClick={() => setActiveAdminTab('enumerators')}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeAdminTab === 'enumerators'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>2. Quản Lý & Phân Quyền ĐTV</span>
              <span className="text-slate-400 text-[11px]">({enumerators.length})</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('sampling')}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeAdminTab === 'sampling'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3. Bảng Kê & Chọn Mẫu Theo Xã</span>
              <span className="text-slate-400 text-[11px]">({listings.length} hộ)</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('reports')}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeAdminTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>4. Tổng Hợp Nội Dung Phiếu</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('fakeip')}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeAdminTab === 'fakeip'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>5. Giám Sát Cờ Fake IP</span>
              {flaggedCount > 0 && (
                <span className="px-1.5 py-0.2 bg-red-700 text-white rounded-full text-[10px] font-bold animate-pulse">
                  {flaggedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveAdminTab('drive')}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeAdminTab === 'drive'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>6. Cấu Trúc Google Drive</span>
            </button>

          </div>
        </div>
      </header>

      {/* Nội dung chính của Trang Điều Hành */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeAdminTab === 'progress' && (
          <ProgressTracker
            samples={samples}
            onViewSurvey={(sample) => setViewingSurveySample(sample)}
            onRefresh={handleDataUpdated}
          />
        )}

        {activeAdminTab === 'enumerators' && (
          <EnumeratorManager
            enumerators={enumerators}
            samples={samples}
            onUpdate={handleDataUpdated}
          />
        )}

        {activeAdminTab === 'sampling' && (
          <SamplingEngine
            listings={listings}
            samples={samples}
            onSamplingComplete={handleDataUpdated}
          />
        )}

        {activeAdminTab === 'reports' && (
          <AggregatedReports
            samples={samples}
            onViewSurvey={(sample) => setViewingSurveySample(sample)}
          />
        )}

        {activeAdminTab === 'fakeip' && (
          <FakeIpMonitor
            samples={samples}
            onViewSurvey={(sample) => setViewingSurveySample(sample)}
          />
        )}

        {activeAdminTab === 'drive' && (
          <GoogleDriveSync
            samples={samples}
          />
        )}
      </main>

      {/* Footer hệ thống */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Hệ Thống Thống Kê Cơ Sở & Quản Lý ĐTV (TKCS)</span>
            <span>• Phiên bản 2026 • Dữ liệu dùng chung qua server</span>
          </div>
          <div className="flex items-center gap-3">
            <Smartphone className="w-3.5 h-3.5" />
            <span>ĐTV đăng nhập trực tiếp trên điện thoại bằng tài khoản riêng</span>
          </div>
        </div>
      </footer>

      {/* Modal Xem chi tiết / In / Chỉnh sửa phiếu điều tra */}
      {viewingSurveySample && (
        <SurveyFormModal
          sample={viewingSurveySample}
          enumeratorName={viewingSurveySample.assignedEnumeratorName}
          onClose={() => setViewingSurveySample(null)}
          onSaved={handleDataUpdated}
        />
      )}

    </div>
  );
}
