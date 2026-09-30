# v0.7.10 修改说明

1. 手机端有效期新增：移除前置拍照识别图标，保留照片库上传识别入口，继续复用现有 MobileBarcodeScanner 图片识别逻辑。
2. 电脑端有效期列表：移除有效期列的前端假排序（sortable），不再只对当前分页数据排序。
3. 电脑端有效期列表：新增创建日期起止查询条件；列表新增创建日期显示。请求继续使用 GET /api/records，并传递 createDateFrom/createDateTo。
