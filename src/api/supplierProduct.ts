import { http } from './http'
import type { Page, SupplierProduct } from './types'
export function getSupplierProducts(params: { supplierId?: number; supplierCode?: string; pageNum: number; pageSize: number }) { return http.get<Page<SupplierProduct>>('/codes', params) }
export function getSupplierProduct(id: number) { return http.get<SupplierProduct>(`/codes/${id}`) }
export function exportSupplierProducts(params: { supplierId?: number; supplierCode?: string }) { return http.download('/codes/export', params) }
