## 修复

- 收货单详情页搜索 —ReceivingOrderDetail.vue 增加了货号/商品名称搜索框，复用现有 /api/items 接口的 supplierCode/productName 参数。
- 手机点货页必填 * — MobileCheckItems.vue 给 Barcode、有效期、类型标签加了 *。
- 手机点货有效期删除 bug — 修复：之前 expiry-tags-mobile 只展示标签没有删除入口，已加上 removeExpiry 函数和删除按钮（×）。
- 去掉"添加"按钮，选完日期自动添加 — PC 端 CheckGoods.vue 和手机端 MobileCheckItems.vue 均已把日期选择器加上 @change 自动调用 addExpiry，去掉了原来的"添加"按钮。
- 有效期列表新增功能 — ExpiryRecordList.vue（PC）和 MobileExpiry.vue（手机）都新增了"新增"入口和表单，Barcode + 日期必填；手机端复用了 MobileBarcodeScanner 组件做扫码录入。
- 有效期详情条形码图片 — 新建了 src/components/BarcodeImage.vue（基于 jsbarcode 库，根据 barcode 生成 SVG 条形码），已接入 PC 的 ExpiryRecordDetail.vue 和手机端 MobileExpiryDetail.vue；并在 package.json 里加了 jsbarcode 依赖。