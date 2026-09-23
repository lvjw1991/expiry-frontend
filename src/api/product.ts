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
