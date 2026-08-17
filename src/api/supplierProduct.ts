import { http } from './http'
import type { Page, SupplierProduct } from './types'
export function getSupplierProducts(params: { supplierId?: number; pageNum: number; pageSize: number }) { return http.get<Page<SupplierProduct>>('/codes', params) }
export function getSupplierProduct(id: number) { return http.get<SupplierProduct>(`/codes/${id}`) }
