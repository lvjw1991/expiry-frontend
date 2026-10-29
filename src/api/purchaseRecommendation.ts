import { http } from './http'
import type { Page } from './types'

export interface SupplierOptionVO {
  supplierName?: string
  supplierCode?: string
}

export interface PurchaseRecommendationVO {
  productId: number
  barcode?: string
  productName?: string
  category?: string
  imgUrl?: string
  purchasePrice?: number | null
  stock?: number | null
  avgMonthlySalesQty?: number | null
  stockMonth?: number | null
  suppliers?: SupplierOptionVO[]
}

export interface ImportResultVO {
  success: number
  skip: number
}

export function getPurchaseRecommendations(params: {
  name?: string
  barcode?: string
  supplierId?: number
  pageNum: number
  pageSize: number
}) {
  return http.get<Page<PurchaseRecommendationVO>>('/purchase-recommendations', params)
}

export function importStock(file: File) {
  const form = new FormData()
  form.append('file', file)
  return http.post<ImportResultVO>('/purchase-recommendations/importStock', form)
}

export function importSales(file: File) {
  const form = new FormData()
  form.append('file', file)
  return http.post<ImportResultVO>('/purchase-recommendations/importSales', form)
}
