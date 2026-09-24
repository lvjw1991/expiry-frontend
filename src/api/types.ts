export interface Page<T> { list: T[]; total: number; pageNum: number; pageSize: number; totalPages: number; hasNext: boolean }
export interface Product { id:number; name:string; barcode:string; imgUrl?:string; category?:string; status?:boolean; createdAt?:string; updatedAt?:string }
export interface Supplier { id: number; supplierName: string; status?: boolean; createdAt?: string; updatedAt?: string }
export interface SupplierProduct { id: number; supplierId?: number; supplierCode?: string; barcode?: string; status?: boolean; createdAt?: string; updatedAt?: string }
export interface ReceivingOrder { id: number; supplierId: number; number?: number; receiveDate: string; progress: 'DRAFT'|'READY'|'CHECKING'|'COMPLETED'|string; temperature?: string; transport?: string; supplierName?: string }
export interface ReceivingOrderItem { id: number; supplierCode?: string; productName?: string; barcode?: string; orderQty?: number; actualQty?: number; damageQty?: number; total?: number; expiryDate?: string; unitPrice?: number; category?: string; sugar?: string; checkStatus?: 'UNCHECKED'|'PASS'|'FAIL'|string; remark?: string; damageImgList?: string[] }
export type ConfirmStatus = 'UNCONFIRM'|'CONFIRM'|'NOT_FOUND'
export type ProcessStatus = 'UNPROCESS'|'NORMAL'|'PROMOTE'|'DAMAGE'
export interface ExpiryRecord { id:number; barcode:string; expiryDate:string; stock:number; confirmStatus:ConfirmStatus; confirmTime?:string; processStatus:ProcessStatus; processTime?:string; processRemark?:string; category?:string; productName?:string; imgUrl?:string }
