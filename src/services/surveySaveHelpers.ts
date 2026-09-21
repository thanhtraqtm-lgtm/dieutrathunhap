import { HouseholdIncomeSurveyData, SurveyFormData, SurveyStatus, SampleHousehold } from '../types/survey';
import { apiUpdateSample } from './apiClient';

// Thay cho StorageService.saveHouseholdIncomeSurvey cũ (localStorage) — giờ lưu qua API lên server dùng chung.
export async function apiSaveHouseholdIncomeSurvey(
  sample: SampleHousehold,
  incomeData: HouseholdIncomeSurveyData,
  fakeIpFlag: boolean = false,
  fakeIpReason: string | undefined,
  status: SurveyStatus = 'completed'
): Promise<void> {
  const isCompleted = status === 'completed';
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  await apiUpdateSample(sample.id, {
    surveyStatus: status,
    progressPercent: isCompleted ? 100 : Math.max(sample.progressPercent, 60),
    completedAt: isCompleted ? nowStr : sample.completedAt,
    startedAt: sample.startedAt || nowStr,
    incomeSurveyData: incomeData,
    fakeIpDetails: {
      isFlagged: fakeIpFlag,
      detectedIp: incomeData.audit.ipAddress || '14.232.208.45',
      clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      mockGpsDetected: fakeIpFlag,
      gpsCoordinates: {
        latitude: incomeData.audit.latitude,
        longitude: incomeData.audit.longitude,
        accuracy: incomeData.audit.gpsAccuracy,
      },
      distanceDeviationKm: fakeIpFlag ? 1150 : 0.2,
      reason: fakeIpReason,
      checkedAt: nowStr,
    },
    driveSynced: isCompleted,
  });
}

// Thay cho StorageService.saveSurveyForm cũ (Phiếu CS cá thể 01/TKCS) — vẫn giữ lại cho các nơi khác
// trong hệ thống (VD: Tổng hợp báo cáo) còn tham chiếu tới, dù màn hình ĐTV không còn dùng phiếu này nữa.
export async function apiSaveSurveyForm(
  sample: SampleHousehold,
  formData: SurveyFormData,
  fakeIpFlag: boolean = false,
  fakeIpReason: string | undefined,
  status: SurveyStatus = 'completed'
): Promise<void> {
  const isCompleted = status === 'completed';
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

  await apiUpdateSample(sample.id, {
    surveyStatus: status,
    progressPercent: isCompleted ? 100 : 50,
    completedAt: isCompleted ? nowStr : sample.completedAt,
    startedAt: sample.startedAt || nowStr,
    surveyData: formData,
    fakeIpDetails: {
      isFlagged: fakeIpFlag,
      detectedIp: formData.verification.ipAddress || '14.232.208.45',
      clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      mockGpsDetected: fakeIpFlag,
      gpsCoordinates: {
        latitude: formData.verification.latitude,
        longitude: formData.verification.longitude,
        accuracy: formData.verification.gpsAccuracy,
      },
      distanceDeviationKm: fakeIpFlag ? 1150 : 0.2,
      reason: fakeIpReason,
      checkedAt: nowStr,
    },
    driveSynced: isCompleted,
  });
}
