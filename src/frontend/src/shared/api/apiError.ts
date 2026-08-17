import axios from 'axios';

export const getApiErrorCode = (error: unknown): string | undefined =>
  axios.isAxiosError(error) ? error.response?.data?.code : undefined;

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  const code = error.response?.data?.code;
  if (code === 'FEATURE_DISABLED') return error.response?.data?.message || 'Tính năng này hiện đang được quản trị viên tạm tắt.';
  if (code === 'FEATURE_CHECK_UNAVAILABLE') return 'Không thể kiểm tra trạng thái tính năng. Vui lòng thử lại sau.';
  if (code === 'FORBIDDEN') return error.response?.data?.message || 'Bạn không có quyền thực hiện thao tác này.';
  return error.response?.data?.message || error.message || fallback;
};

