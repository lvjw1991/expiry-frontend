# Expiry Management Frontend

## 本次交付
- PC 点货页面增加状态筛选：全部 / 未点货 / 已点货 / 异常。
- 手机点货：先选择收货单，再搜索货号/商品名称，进入商品后通过摄像头扫码录入 Barcode，再录入有效期、Category、含糖等级和数量。
- 手机有效期：顶部今日到期数 + 月历 + 所选日期的到期商品列表。
- 手机底部导航：点货 / 有效期。

## 手机入口
- `/m/check`：选择收货单
- `/m/check/{orderId}`：该收货单点货
- `/m/expiry`：有效期日历

## 摄像头
扫码使用浏览器摄像头 `getUserMedia` + `BarcodeDetector`。摄像头访问需要安全上下文（通常 HTTPS）；`BarcodeDetector` 在部分浏览器中仍不是普遍可用，若浏览器不支持会提示手动输入 Barcode。生产环境如需覆盖更多 iOS/Android 浏览器，建议下一版接入 ZXing 等兼容性更好的扫码库。

## 本地运行
```bash
npm install
npm run dev
```

API 前缀仍为 `/api`，请按现有 Vite 代理配置访问 Spring Boot `/ia` 后端。


## v0.2.2 双登录
- PC 登录：`/login`，成功后进入 `/receiving-orders`，使用 `access_token`
- 手机登录：`/m/login`，成功后进入 `/m/check`，使用 `mobile_access_token`
- PC 与手机分别由路由 meta.platform 和导航守卫隔离
- PC 左侧菜单只包含来货管理、有效期管理、供应商管理、供应商商品
- 手机端不显示 PC 左侧菜单
