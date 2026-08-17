# v0.2.1 登录与布局修正版

本版修复两个问题：

1. PC 登录页强制使用 `meta.layout = none`，不会渲染左侧 PC 导航；手机路由使用 mobile layout。只有明确标记为 desktop 的路由才显示 PC 左侧导航。Vue Router 支持通过 route meta 在导航守卫/布局中区分路由。
2. 登录响应解析兼容 `{code,message,data:{token}}`、`{data:{token}}` 和直接 `{token}`，并同时保存 `access_token` 与 `token`，解决旧页面使用不同 token key 导致的手机端认证问题。

启动：

```bash
npm install
npm run dev
```
