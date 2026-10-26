import { http } from './http'
import type { Page, ReceivingOrderItemDetail } from './types'

export interface ItemBarcodeHistoryRow {
  id: number
  supplierName?: string
  receiveDate?: string
  progress?: string
  productName?: string
  orderQty?: number
  total?: number
  barcode?: string
  expiryDate?: string
  checkStatus?: string
}

export interface ItemBarcodeHistoryQuery {
  barcode: string
  pageNum?: number
  pageSize?: number
}

export function searchItemsByBarcode(params: ItemBarcodeHistoryQuery) {
  return http.get<Page<ItemBarcodeHistoryRow>>('/items/barcode', params)
}

export function getItemHistoryDetail(id: number) {
  return http.get<ReceivingOrderItemDetail>(`/items/${id}`)
}
