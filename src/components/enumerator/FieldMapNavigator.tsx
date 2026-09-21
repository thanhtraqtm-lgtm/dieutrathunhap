import React, { useState } from 'react';
import { 
  MapPin, Navigation, Compass, CheckCircle2, Clock, 
  AlertTriangle, Phone, PlayCircle, Eye, RefreshCw 
} from 'lucide-react';
import { SampleHousehold } from '../../types/survey';

interface FieldMapNavigatorProps {
  samples: SampleHousehold[];
  onSelectSample: (sample: SampleHousehold) => void;
}

export const FieldMapNavigator: React.FC<FieldMapNavigatorProps> = ({
  samples,
  onSelectSample
}) => {
  const [selectedSample, setSelectedSample] = useState<SampleHousehold | null>(
    samples[0] || null
  );
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number }>({
    lat: 21.0935,
    lng: 105.6982
  });
  const [isLocating, setIsLocating] = useState(false);

  // Giả lập tọa độ cho các hộ dựa trên mã TKCS nếu chưa có
  const getCoordinates = (sample: SampleHousehold, index: number) => {
    if (sample.surveyData?.verification.latitude && sample.surveyData?.verification.longitude) {
      return {
        lat: sample.surveyData.verification.latitude,
        lng: sample.surveyData.verification.longitude
      };
    }
    // Phân bổ đều quanh tâm xã
    const angle = (index * 47) * (Math.PI / 180);
    const radius = 0.003 + (index % 5) * 0.002;
    return {
      lat: currentGps.lat + Math.sin(angle) * radius,
      lng: currentGps.lng + Math.cos(angle) * radius
    };
  };

  const handleRefreshLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Tính khoảng cách ước tính (mét)
  const calculateDistanceMeters = (lat: number, lng: number) => {
    const dLat = (lat - currentGps.lat) * 111000;
    const dLng = (lng - currentGps.lng) * 111000 * Math.cos(currentGps.lat * (Math.PI / 180));
    return Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-xl overflow-hidden shadow-md">
      
      {/* Top controls */}
      <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white">Bản Đồ Điều Tra Thực Địa</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-[10px] text-slate-300">
            GPS: {currentGps.lat.toFixed(4)}, {currentGps.lng.toFixed(4)}
          </span>
          <button
            onClick={handleRefreshLocation}
            disabled={isLocating}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
            title="Định vị lại vị trí của ĐTV"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Radar Map Canvas Representation */}
      <div className="relative flex-1 min-h-[320px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex items-center justify-center p-4">
        
        {/* Radar grid circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-80 h-80 border border-blue-400 rounded-full"></div>
          <div className="w-56 h-56 border border-blue-400 rounded-full absolute"></div>
          <div className="w-32 h-32 border border-blue-400 rounded-full absolute"></div>
          <div className="w-full h-px bg-blue-400/40 absolute"></div>
          <div className="h-full w-px bg-blue-400/40 absolute"></div>
        </div>

        {/* Center: Enumerator position */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full ring-4 ring-blue-500/30 animate-pulse"></div>
          <span className="text-[10px] font-bold text-blue-300 bg-slate-900/80 px-1.5 py-0.5 rounded mt-1">
            Vị trí ĐTV
          </span>
        </div>

        {/* Household Pins */}
        {samples.map((sample, idx) => {
          const coords = getCoordinates(sample, idx);
          const isSelected = selectedSample?.id === sample.id;
          const isCompleted = sample.surveyStatus === 'completed';
          const isInProgress = sample.surveyStatus === 'in_progress';
          const isMoved = sample.surveyStatus === 'moved';

          // Tọa độ tương đối trên màn hình
          const dx = (coords.lng - currentGps.lng) * 22000;
          const dy = (coords.lat - currentGps.lat) * -22000;

          // Giới hạn trong vùng hiển thị
          const clampX = Math.max(-130, Math.min(130, dx));
          const clampY = Math.max(-120, Math.min(120, dy));

          const pinColor = isCompleted
            ? 'bg-emerald-500 text-white'
            : isInProgress
            ? 'bg-blue-500 text-white'
            : isMoved
            ? 'bg-rose-500 text-white'
            : 'bg-slate-500 text-slate-100';

          return (
            <button
              key={sample.id}
              onClick={() => setSelectedSample(sample)}
              style={{
                transform: `translate(${clampX}px, ${clampY}px)`
              }}
              className={`absolute z-20 transition-all p-1 rounded-full flex items-center justify-center shadow-lg ${pinColor} ${
                isSelected ? 'ring-4 ring-white scale-125 z-30' : 'hover:scale-110'
              }`}
              title={`${sample.householdName} (${sample.tkcsCode})`}
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>

      {/* Selected Household Detail Tray */}
      {selectedSample && (
        <div className="p-3 bg-slate-800 border-t border-slate-700 space-y-2 animate-in slide-in-from-bottom duration-150">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] font-bold text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded">
                  {selectedSample.tkcsCode}
                </span>
                <span className="text-[10px] text-slate-400">
                  Địa bàn {selectedSample.areaCode} • {selectedSample.communeName}
                </span>
              </div>
              <h4 className="font-bold text-xs text-white mt-1 leading-snug">
                {selectedSample.householdName}
              </h4>
              <p className="text-[11px] text-slate-300">
                Chủ hộ: <strong>{selectedSample.ownerName || selectedSample.householdName}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-blue-300 block">
                Cách ~{calculateDistanceMeters(
                  getCoordinates(selectedSample, 0).lat,
                  getCoordinates(selectedSample, 0).lng
                )} m
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded mt-1 inline-block ${
                selectedSample.surveyStatus === 'completed'
                  ? 'bg-emerald-900/60 text-emerald-300'
                  : selectedSample.surveyStatus === 'in_progress'
                  ? 'bg-blue-900/60 text-blue-300'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {selectedSample.surveyStatus === 'completed'
                  ? 'Đã nộp phiếu'
                  : selectedSample.surveyStatus === 'in_progress'
                  ? 'Đang thực hiện'
                  : 'Chưa phỏng vấn'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700 text-xs">
            <a
              href={`tel:${selectedSample.phone}`}
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white px-2.5 py-1.5 bg-slate-700/70 rounded-lg"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Gọi: {selectedSample.phone}
            </a>

            <button
              onClick={() => onSelectSample(selectedSample)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              {selectedSample.surveyStatus === 'completed' ? (
                <>
                  <Eye className="w-3.5 h-3.5" /> Xem phiếu đã nộp
                </>
              ) : (
                <>
                  <PlayCircle className="w-3.5 h-3.5" /> Mở phiếu phỏng vấn
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
