// types/api.ts

export interface BaseResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedMetadata {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PagedResponse<T> extends BaseResponse<T[]> {
  meta: PaginatedMetadata;
}
