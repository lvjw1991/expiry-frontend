import { http } from './http'
import type { Page, ReceivingOrder, ReceivingOrderItem, Supplier } from './types'
export interface OrderRequest { id?: number; supplierId: number; number?: number; receiveDate?: string; temperature?: string; transport?: string }
export function getReceivingOrders(params:{supplierId?:number;startDate?:string;endDate?:string;pageNum:number;pageSize:number}) { return http.get<Page<ReceivingOrder>>('/orders',params) }
export function createReceivingOrder(data:OrderRequest){return http.post<ReceivingOrder>('/orders',data)}
export function getReceivingOrder(id:number){return http.get<ReceivingOrder>(`/orders/${id}`)}
export function updateReceivingOrder(id:number,data:OrderRequest){return http.put<ReceivingOrder>(`/orders/${id}`,{id,...data})}
export function deleteReceivingOrder(id:number){return http.delete<boolean>(`/orders/${id}`)}
export function completeReceivingOrder(id:number){return http.post<boolean>(`/orders/${id}/complete`)}
export interface OrderItemQuery { orderId:number; productName?:string; supplierCode?:string; checkStatus?:'UNCHECKED'|'PASS'|'FAIL'; pageNum?:number; pageSize?:number }
export function getReceivingOrderItems(params:OrderItemQuery){return http.get<Page<ReceivingOrderItem>>('/items',params as any)}
export interface ImportResult { success:number; skip:number }
export function importReceivingOrderExcel(orderId:number,file:File){const form=new FormData();form.append('file',file);return http.post<ImportResult>('/orders/import?orderId='+encodeURIComponent(String(orderId)),form)}
export function checkReceivingItem(itemId:number,data:{barcode:string;total?:number;actualQty?:number;damageQty?:number;expiryDate?:string[];category:string;sugar?:string;status:'UNCHECKED'|'PASS'|'FAIL'}){return http.post<boolean>(`/items/${itemId}/check`,data)}
export interface CreateItemRequest { receivingOrderId:number; barcode?:string; productName?:string; supplierCode?:string; category?:string; sugar?:string; actualQty?:number; damageQty?:number; expiryDate?:string[]; status?:'UNCHECKED'|'PASS'|'FAIL' }
export function createReceivingItem(data:CreateItemRequest){return http.post<ReceivingOrderItem>('/items',data)}
export function exportReceivingItems(orderId:number){return http.download(`/items/export/${orderId}`)}
export function getSuppliers(params:{pageNum:number;pageSize:number}){return http.get<Page<Supplier>>('/suppliers',params)}
