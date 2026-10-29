# v0.7.54 更新说明

基于 v0.7.53 新增订货管理前端页面：

- 左侧导航新增「订货管理」，仅 ADMIN 显示。
- 新增 `/purchase-recommendations` 路由，前端路由也校验 ADMIN 角色。
- 对接 `GET /api/purchase-recommendations`、`POST /api/purchase-recommendations/importStock`、`POST /api/purchase-recommendations/importSales`。
- 列表显示 PurchaseRecommendationVO 全部字段：商品 ID、图片、商品名称、Barcode、分类、采购价、当前库存、月均销量、库存可售月数、供应商。
- 多个供应商在同一单元格显示为「供应商1-货号1，供应商2-货号2」；货号为空时仅显示供应商名称。
- 支持按商品名称、Barcode、供应商筛选及分页。
- 提供「导入库存」和「导入月均销量」两个 Excel 导入按钮，导入成功后刷新列表。

说明：前端路由权限校验仅用于 UI 保护，后端仍需对订货管理相关接口执行 ADMIN 权限校验。
