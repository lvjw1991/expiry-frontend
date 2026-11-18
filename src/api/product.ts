import { http } from './http'
import type { Page, Product } from './types'

export interface ProductImportResult { success: number; skip: number }

export function getProducts(params: { pageNum: number; pageSize: number }) {
  return http.get<Page<Product>>('/products', params)
}

export function importProducts(file: File) {
  const form = new FormData()
  form.append('file', file)
  return http.post<ProductImportResult>('/products/import', form)
}

export function importProductPrices(file: File) {
  const form = new FormData()
  form.append('file', file)
  return http.post<ProductImportResult>('/products/import-price', form)
}


export interface ProductCategoryItem { id: number; barcode?: string; name: string; category?: string; imgUrl?: string; purchasePrice?: number | null }
export interface ProductCategoryPage extends Page<ProductCategoryItem> {}
export type ProductCategoryStatus = 'UNCLASSIFIED' | 'CLASSIFIED' | 'ALL'

export function getProductCategoryManagement(params: {
  pageNum: number; pageSize: number; keyword?: string; categoryStatus: ProductCategoryStatus
}) {
  return http.get<ProductCategoryPage>('/products/category-management', params)
}

export function batchUpdateProductCategory(body: { category: string; productIds: number[] }) {
  return http.patch<boolean>('/products/category/batch', body)
}

// 按商品 ID 获取完整商品信息（价签商品加入确认列表时使用）
export function getProductById(id: number) {
  return http.get<Product>(`/products/${id}`)
}

// 按条形码查询商品（价签打印扫码入口）
export function getProductByBarcode(barcode: string) {
  return http.get<Product>('/products/by-barcode', { barcode })
}
