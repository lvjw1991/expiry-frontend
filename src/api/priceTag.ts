import { http } from './http'
import type { Page, Product } from './types'

export type NetUnitType = 'KG' | 'L'
export interface PriceTagRequest {
  id: number
  name: string
  nameFi: string
  salePrice: number
  netContent?: number | null
  netUnit?: NetUnitType | null
}
export interface PriceTagVO {
  name: string
  barcode?: string
  imgUrl?: string
  salePrice: number
  nameFi: string
  netContent?: number | null
  netUnit?: NetUnitType | null
  unitPrice?: number | null
}

// 商品选择入口：按业务约定查询全部商品
export function getAllProductsForTags(params: { pageNum: number; pageSize: number; keyword?: string }) {
  return http.get<Page<Product>>('/products/category-management', {
    ...params,
    categoryStatus: 'ALL'
  })
}

export function getTagProductsByOrder(orderId: number) {
  return http.get<Product[]>(`/tags/orders/${orderId}/items`)
}

export function getPriceTagsByIds(ids: number[]) {
  return http.post<PriceTagVO[]>('/tags/items', ids)
}

export function updatePriceTag(id: number, body: PriceTagRequest) {
  return http.put<PriceTagVO>(`/tags/items/${id}`, body)
}
