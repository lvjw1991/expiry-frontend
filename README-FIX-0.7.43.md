# v0.7.43 修改说明

- 商品管理页原「导入商品」按钮改名为「导入Wolt图片」，继续调用 `POST /api/products/import`。
- 新增「导入POS进价」按钮，调用 `POST /api/products/import-price`。
- 两个导入入口使用独立的文件选择器和 loading 状态。
- 上传字段均为 `file`，使用 `multipart/form-data`。
- 导入成功后显示 success/skip 数量并刷新商品列表。
- 其他页面和功能未修改。

构建验证：当前执行环境未能完成依赖安装，因此未完成 `npm run build` 验证。
