# v0.6.2 - damageQty 字段 + 点货新增功能 + 明细状态筛选

本次基于 v0.6.1-modified 修改，共三处：

## 1. 货单物品新增 damageQty（破损数）字段
- `ReceivingOrderItem` 增加 `damageQty?: number`。
- `checkReceivingItem` 请求增加 `damageQty` 参数。
- 电脑端点货（CheckGoods.vue）、手机端点货（MobileCheckItems.vue）：
  - "实际来货个数"（actualQty）默认不显示；
  - 只有点货结果选择【异常 / FAIL】时，才显示并要求必填"实际来货个数"和"破损数"（damageQty 默认 0）；
  - 结果为【通过 / PASS】时不提交 actualQty / damageQty。
- 字段中文对照统一为：`total` → 应到个数，`actualQty` → 实际来货个数，`damageQty` → 破损数。

## 2. 点货页面新增"新增货品"功能（电脑端 + 手机端）
- 新增接口封装：`createReceivingItem(data)`，`POST /api/items`。
- `receivingOrderId` 直接从当前路由（点货页面的收货单 id）获取，无需用户选择。
- 电脑端 CheckGoods.vue：点货列表头部新增【新增】按钮，弹出对话框，字段与点货表单一致（货号/商品名称可选，Barcode、类型、含糖等级、有效期、实际来货个数、破损数）。
- 手机端 MobileCheckItems.vue：搜索栏新增【新增】按钮，进入与点货同样风格的表单卡片。
- 新增货品默认结果为【异常 / FAIL】，与需求一致，且必须填写"实际来货个数"和"破损数"。

**后端需要新增/确认接口**：`POST /api/items`，请求体建议：
```json
{
  "receivingOrderId": 123,
  "supplierCode": "可选",
  "productName": "可选",
  "barcode": "必填",
  "category": "必填",
  "sugar": "Drink 时必填",
  "actualQty": 0,
  "damageQty": 0,
  "expiryDate": ["YYYY-MM-DD"],
  "status": "FAIL"
}
```
返回新建的 `ReceivingOrderItem`（或至少 `{code,message,data}` 包裹）。

## 3. 电脑端货单明细列表增加状态筛选
- `ReceivingOrderDetail.vue` 的"货单明细"卡片头部新增【状态】筛选下拉框（全部 / 未点货 / 已点货 / 异常），复用 `/api/items` 的 `checkStatus` 参数。
- 列表新增/调整列：`total`（应到个数）、`actualQty`（实际来货个数）、新增 `damageQty`（破损数）三列均展示。

## 本地验证
`npm install && npx vue-tsc --noEmit && npm run build` 均已在本环境执行通过，未发现类型或构建错误。

## 待后端确认
- `/api/items` 的 `POST`（新增）目前仅前端假设了字段结构，需要后端对齐字段名与校验规则（尤其 `damageQty` 是否允许为 0、`actualQty`/`damageQty` 在 status=PASS 时是否需要置空或保留原值）。
- 现有 `checkReceivingItem`（`/api/items/{id}/check`）也需要后端接受新增的 `damageQty` 字段。
