import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../services/inventoryApi';

export const useInventory = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  bloodType?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryApi.getInventory(params),
    staleTime: 1000 * 30, // 30 seconds
  });
};
