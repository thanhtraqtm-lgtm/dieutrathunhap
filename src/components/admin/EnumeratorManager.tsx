import React, { useState, useRef } from 'react';
import { 
  Users, UserPlus, Upload, FileSpreadsheet, Check, X, Shield, Phone, 
  Mail, MapPin, Search, Edit3, Trash2, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Enumerator, SampleHousehold } from '../../types/survey';
import { StorageService } from '../../services/storageService';
import { apiCreateEnumerator, apiUpdateEnumerator, apiDeleteEnumerator, apiResetEnumeratorPassword } from '../../services/apiClient';

interface EnumeratorManagerProps {
  enumerators: Enumerator[];
  samples: SampleHousehold[];
  onUpdate: () => void;
}

export const EnumeratorManager: React.FC<EnumeratorManagerProps> = ({ enumerators, samples, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEnumerator, setEditingEnumerator] = useState<Enumerator | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ name: string; username: string; tempPassword: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formCommunes, setFormCommunes] = useState('');
  const [formWards, setFormWards] = useState('');

  const handleOpenAddModal = (enumToEdit?: Enumerator) => {
    if (enumToEdit) {
      setEditingEnumerator(enumToEdit);
      setFormCode(enumToEdit.code);
      setFormName(enumToEdit.name);
      setFormPhone(enumToEdit.phone);
      setFormEmail(enumToEdit.email);
      setFormUsername(enumToEdit.username);
      setFormCommunes(enumToEdit.assignedCommunes.join(', '));
      setFormWards(enumToEdit.assignedWards.join(', '));
    } else {
      setEditingEnumerator(null);
      setFormCode(`DTV0${enumerators.length + 1}`);
      setFormName('');
      setFormPhone('');
      setFormEmail('');
      setFormUsername(`dtv0${enumerators.length + 1}`);
      setFormCommunes('00101');
      setFormWards('001, 002');
    }
    setShowAddModal(true);
  };

  const handleSaveEnumerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName || !formUsername) return;

    const assignedCommunes = formCommunes.split(',').map(s => s.trim()).filter(Boolean);
    const assignedWards = formWards.split(',').map(s => s.trim()).filter(Boolean);

    setSaving(true);
    try {
      if (editingEnumerator) {
        await apiUpdateEnumerator(editingEnumerator.id, {
          code: formCode,
          name: formName,
          phone: formPhone,
          email: formEmail,
          assignedCommunes,
          assignedWards,
        });
        setShowAddModal(false);
      } else {
        const { tempPassword } = await apiCreateEnumerator({
          code: formCode,
          name: formName,
          phone: formPhone,
          email: formEmail,
          username: formUsername,
          assignedCommunes,
          assignedWards,
          status: 'active',
        });
        setShowAddModal(false);
        // Hiện mật khẩu tạm 1 LẦN DUY NHẤT để Admin copy gửi cho ĐTV — hệ thống không lưu lại dạng đọc được.
        setNewCredentials({ name: formName, username: formUsername, tempPassword });
      }
      onUpdate();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEnumerator = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Điều tra viên này? Tài khoản đăng nhập của họ sẽ bị xoá luôn.')) return;
    try {
      await apiDeleteEnumerator(id);
      onUpdate();
    } catch (err: any) {
      alert(err?.message || 'Xóa thất bại.');
    }
  };

  const handleResetPassword = async (dtv: Enumerator) => {
    if (!confirm(`Cấp lại mật khẩu tạm mới cho "${dtv.name}"? Mật khẩu cũ sẽ không còn dùng được nữa.`)) return;
    try {
      const { tempPassword } = await apiResetEnumeratorPassword(dtv.id);
      setNewCredentials({ name: dtv.name, username: dtv.username, tempPassword });
    } catch (err: any) {
      alert(err?.message || 'Cấp lại mật khẩu thất bại.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await StorageService.parseEnumeratorsFromExcel(file);
      let successCount = 0;
      const createdCredentials: { name: string; username: string; tempPassword: string }[] = [];
      for (const entry of parsed) {
        try {
          const { tempPassword } = await apiCreateEnumerator(entry);
          successCount++;
          createdCredentials.push({ name: entry.name, username: entry.username, tempPassword });
        } catch (err) {
          // Bỏ qua dòng bị trùng username, tiếp tục các dòng khác
        }
      }
      setImportStatus({
        success: successCount > 0,
        message: successCount > 0
          ? `Đã tạo thành công ${successCount}/${parsed.length} tài khoản ĐTV từ file Excel! Xem danh sách mật khẩu tạm bên dưới để gửi cho từng người.`
          : `Không tạo được tài khoản nào (có thể do trùng tên đăng nhập).`
      });
      if (createdCredentials.length > 0) {
        // Hiện danh sách mật khẩu tạm của TẤT CẢ ĐTV vừa tạo (nối chuỗi vào 1 khối để admin copy)
        setNewCredentials({
          name: `${createdCredentials.length} tài khoản`,
          username: createdCredentials.map(c => c.username).join(', '),
          tempPassword: createdCredentials.map(c => `${c.username}: ${c.tempPassword}`).join('\n'),
        });
      }
      onUpdate();
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: `Lỗi khi đọc file Excel: ${err.message || 'Định dạng không hợp lệ'}`
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = enumerators.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.phone.includes(searchTerm) ||
    e.assignedCommunes.some(c => c.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Tiêu đề và nút tác vụ */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Quản Lý & Phân Quyền Điều Tra Viên
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo tài khoản và phân quyền quản lý địa bàn điều tra (Mã Xã, Mã Địa Bàn). Hỗ trợ tải lên danh sách từ Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            onClick={() => StorageService.exportEnumeratorTemplate()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Tải file mẫu Excel
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Upload className="w-4 h-4" /> Tải lên từ Excel
          </button>

          <button
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Thêm Điều Tra Viên
          </button>
        </div>
      </div>

      {/* Thông báo Import */}
      {importStatus && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between ${
          importStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {importStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{importStatus.message}</span>
          </div>
          <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tìm kiếm */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã ĐTV, số điện thoại, mã xã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Danh sách thẻ ĐTV */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map(dtv => {
          // Tính số hộ phân công và đã hoàn thành thực tế từ samples
          const assignedSamples = samples.filter(s => s.assignedEnumeratorId === dtv.id || s.assignedEnumeratorName === dtv.name);
          const completedSamples = assignedSamples.filter(s => s.surveyStatus === 'completed');
          const percent = assignedSamples.length > 0 ? Math.round((completedSamples.length / assignedSamples.length) * 100) : 0;
          const fakeIpCount = assignedSamples.filter(s => s.fakeIpDetails?.isFlagged).length;

          return (
            <div key={dtv.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {dtv.name.split(' ').pop()?.charAt(0) || 'Đ'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{dtv.name}</h4>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-mono font-semibold">
                        {dtv.code}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    dtv.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {dtv.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dtv.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{dtv.email || `${dtv.username}@gso.gov.vn`}</span>
                  </div>
                </div>

                {/* Phân quyền địa bàn */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Địa bàn phân công:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dtv.assignedCommunes.map(comm => (
                      <span key={comm} className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-mono font-medium">
                        Xã: {comm}
                      </span>
                    ))}
                    {dtv.assignedWards.map(ward => (
                      <span key={ward} className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-[10px] font-mono font-medium">
                        ĐB: {ward}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tiến độ ĐTV */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-500">Tiến độ điều tra:</span>
                    <span className="text-slate-900 font-bold">{completedSamples.length} / {assignedSamples.length} hộ ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                  {fakeIpCount > 0 && (
                    <div className="mt-2 text-[11px] text-red-600 font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3 text-red-500" /> Có {fakeIpCount} phiếu bị nghi vấn Fake IP
                    </div>
                  )}
                </div>
              </div>

              {/* Nút hành động */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleResetPassword(dtv)}
                  className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                  title="Cấp lại mật khẩu tạm"
                >
                  <Shield className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenAddModal(dtv)}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Chỉnh sửa phân quyền"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteEnumerator(dtv.id)}
                  className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Xóa ĐTV"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal hiện mật khẩu tạm — CHỈ hiện được 1 LẦN DUY NHẤT ngay sau khi tạo/cấp lại */}
      {newCredentials && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-2">
              <Shield className="w-5 h-5" /> Mật khẩu tạm — chỉ hiện DUY NHẤT lần này!
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Copy và gửi ngay cho <strong>{newCredentials.name}</strong> (tài khoản: <code className="bg-slate-100 px-1 rounded">{newCredentials.username}</code>).
              Hệ thống KHÔNG lưu lại mật khẩu dạng đọc được — nếu đóng cửa sổ này mà chưa lưu, phải bấm "Cấp lại mật khẩu" để tạo mật khẩu mới khác.
            </p>
            <pre className="bg-slate-900 text-emerald-300 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
{newCredentials.tempPassword}
            </pre>
            <button
              onClick={() => setNewCredentials(null)}
              className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm"
            >
              Đã lưu, đóng lại
            </button>
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa ĐTV */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingEnumerator ? 'Chỉnh Sửa Thông Tin ĐTV' : 'Thêm Điều Tra Viên Mới'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEnumerator} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Mã ĐTV *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: DTV05"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Tên Đăng Nhập *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingEnumerator}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="VD: dtv05"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  {editingEnumerator && (
                    <p className="text-[10px] text-slate-400 mt-0.5">Không đổi được tên đăng nhập. Dùng nút "Cấp lại mật khẩu" nếu cần.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Họ và Tên *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@gso.gov.vn"
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                <span className="font-bold text-blue-900 block">Phân Quyền Địa Bàn Phụ Trách:</span>
                <div>
                  <label className="font-medium text-slate-700">Mã Xã Phụ Trách (Cách nhau dấu phẩy):</label>
                  <input
                    type="text"
                    value={formCommunes}
                    onChange={(e) => setFormCommunes(e.target.value)}
                    placeholder="00101, 00102"
                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Mã Địa Bàn Phụ Trách (Cách nhau dấu phẩy):</label>
                  <input
                    type="text"
                    value={formWards}
                    onChange={(e) => setFormWards(e.target.value)}
                    placeholder="001, 002, 003"
                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg font-semibold shadow-xs"
                >
                  {saving ? 'Đang lưu...' : editingEnumerator ? 'Lưu Thay Đổi' : 'Thêm Điều Tra Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
