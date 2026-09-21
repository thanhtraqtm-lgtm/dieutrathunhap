import { Enumerator, HouseholdListing, SampleHousehold, SurveyFormData } from '../types/survey';

// Hệ thống khởi động KHÔNG có ĐTV, hộ trong bảng kê, hay hộ mẫu nào được gán cứng sẵn.
// Toàn bộ dữ liệu (ĐTV, Bảng kê hộ, Hộ mẫu) phải được nhập vào từ Admin
// (qua form nhập tay hoặc Import Excel) thì hệ thống mới có dữ liệu để làm việc.

export const INITIAL_ENUMERATORS: Enumerator[] = [];

export const INITIAL_HOUSEHOLD_LISTINGS: HouseholdListing[] = [];

export const INITIAL_SAMPLE_HOUSEHOLDS: SampleHousehold[] = [];
