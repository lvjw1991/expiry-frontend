export interface Page<T> { list: T[]; total: number; pageNum: number; pageSize: number; totalPages: number; hasNext: boolean }
export interface Product { id:number; name:string; barcode:string; imgUrl?:string; category?:string; status?:boolean; createdAt?:string; updatedAt?:string }
export interface Supplier { id: number; supplierName: string; status?: boolean; createdAt?: string; updatedAt?: string }
export interface SupplierProduct { id: number; supplierId?: number; supplierCode?: string; barcode?: string; status?: boolean; createdAt?: string; updatedAt?: string }
export interface ReceivingOrder { id: number; supplierId: number; number?: number; receiveDate: string; progress: 'DRAFT'|'READY'|'CHECKING'|'COMPLETED'|string; temperature?: string; transport?: string; supplierName?: string }
export interface OrderItemListVO { id: number; supplierCode?: string; productName?: string; orderQty?: number; total?: number; barcode?: string; expiryDate?: string; checkStatus?: 'UNCHECKED'|'PASS'|'FAIL'|string }
export interface ReceivingOrderItemDetail extends OrderItemListVO { actualQty?: number; damageQty?: number; unitPrice?: number; category?: string; sugar?: string; remark?: string; damageImgList?: string[]; cartonQty?: number }
export type ReceivingOrderItem = ReceivingOrderItemDetail
export type ConfirmStatus = 'UNCONFIRM'|'CONFIRM'|'NOT_FOUND'
export type ProcessStatus = 'UNPROCESS'|'NORMAL'|'PROMOTE'|'DAMAGE'
export interface ExpiryRecord { id:number; barcode:string; expiryDate:string; stock:number; confirmStatus:ConfirmStatus; confirmTime?:string; processStatus:ProcessStatus; processTime?:string; processRemark?:string; category?:string; productName?:string; imgUrl?:string; otherDateList?:string[] }
