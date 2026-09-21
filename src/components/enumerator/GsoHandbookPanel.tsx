import React, { useState } from 'react';
import { 
  BookOpen, ChevronDown, ChevronUp, Lightbulb, 
  CheckCircle2, Search, Building2, HelpCircle 
} from 'lucide-react';
import { GSO_SURVEY_GUIDELINES } from '../../data/gsoManual';
import { VsicPickerModal } from './VsicPickerModal';

export const GsoHandbookPanel: React.FC = () => {
  const [openSectionId, setOpenSectionId] = useState<string>('scope');
  const [showVsicModal, setShowVsicModal] = useState(false);

  return (
    <div className="space-y-4 text-xs">
      
      {/* Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900 text-xs">Sổ Tay Nghiệp Vụ Điều Tra Viên (CAPI)</h4>
            <p className="text-[11px] text-blue-700">Trích xuất từ Phương án Điều tra Thống kê cơ sở cá thể - Tổng cục Thống kê</p>
          </div>
        </div>

        <button
          onClick={() => setShowVsicModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shrink-0 shadow-xs transition-colors"
        >
          <Building2 className="w-3.5 h-3.5" /> Tra mã ngành VSIC
        </button>
      </div>

      {/* Guidelines list */}
      <div className="space-y-2.5">
        {GSO_SURVEY_GUIDELINES.map(item => {
          const isOpen = openSectionId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenSectionId(isOpen ? '' : item.id)}
                className="w-full p-3 text-left font-bold text-slate-800 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="block text-xs text-slate-900">{item.title}</span>
                  <span className="text-[11px] text-slate-500 font-normal">{item.summary}</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-3">
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-700 block text-[11px]">Nội dung quy định:</span>
                    <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                      {item.details.map((d, i) => (
                        <li key={i} className="leading-relaxed">{d}</li>
                      ))}
                    </ul>
                  </div>

                  {item.tips.length > 0 && (
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> Lưu ý quan trọng cho ĐTV:
                      </div>
                      <ul className="space-y-0.5 text-amber-800 text-[11px]">
                        {item.tips.map((t, i) => (
                          <li key={i}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tra cứu VSIC Modal */}
      {showVsicModal && (
        <VsicPickerModal
          currentCode=""
          onSelect={(ind) => {
            alert(`Mã ngành: ${ind.code} - ${ind.name}`);
            setShowVsicModal(false);
          }}
          onClose={() => setShowVsicModal(false)}
        />
      )}

    </div>
  );
};
