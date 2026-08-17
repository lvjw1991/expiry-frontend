import { http } from './http'
import type { Page, Supplier } from './types'

export interface SupplierRequest { id?: number; supplierName: string }
export function getSuppliers(params: { pageNum: number; pageSize: number }) { return http.get<Page<Supplier>>('/suppliers', params) }
export function getSupplier(id: number) { return http.get<Supplier>(`/suppliers/${id}`) }
export function createSupplier(data: SupplierRequest) { return http.post<Supplier>('/suppliers', data) }
export function updateSupplier(id: number, data: SupplierRequest) { return http.put<Supplier>(`/suppliers/${id}`, { id, ...data }) }
export function deleteSupplier(id: number) { return http.delete<boolean>(`/suppliers/${id}`) }
