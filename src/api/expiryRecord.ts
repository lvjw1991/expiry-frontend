import { http } from './http'
import type { ConfirmStatus, ExpiryRecord, Page, ProcessStatus } from './types'
export interface ExpiryRecordQuery { expireDateFrom?:string; expireDateTo?:string; confirmStatus?:ConfirmStatus; processStatus?:ProcessStatus; category?:string; barcode?:string; pageNum?:number; pageSize?:number }
export interface ExpiryRecordUpdateRequest { barcode:string; expiryDate:string; category:string; stock:number }
export function getExpiryRecords(params:ExpiryRecordQuery){return http.get<Page<ExpiryRecord>>('/records',params)}
export interface ExpiryRecordCalendarQuery { expireDateFrom:string; expireDateTo:string; confirmStatus?:ConfirmStatus; processStatus?:ProcessStatus; category?:string }
export function getExpiryRecordsCalendar(params:ExpiryRecordCalendarQuery){return http.get<ExpiryRecord[]>('/records/calendar',params)}
export function getExpiryRecord(id:number){return http.get<ExpiryRecord>(`/records/${id}`)}
export function createExpiryRecord(data:ExpiryRecordUpdateRequest){return http.post<ExpiryRecord>('/records',data)}
export function confirmExpiryRecord(id:number,stock:number,confirmStatus:'CONFIRM'|'NOT_FOUND'){return http.post<boolean>(`/records/${id}/confirm`,{id,stock,confirmStatus})}
export function processExpiryRecord(id:number,processStatus:'NORMAL'|'PROMOTE'|'DAMAGE',processRemark:string,stock:number){return http.post<boolean>(`/records/${id}/process`,{id,processStatus,processRemark,stock})}
export function updateExpiryRecord(id:number,data:ExpiryRecordUpdateRequest){return http.put<ExpiryRecord>(`/records/${id}`,{id,...data})}
export function deleteExpiryRecord(id:number){return http.delete<boolean>(`/records/${id}`)}
export function importExpiryRecords(file:File){const form=new FormData();form.append('file',file);return http.post<any>('/records/import',form)}
