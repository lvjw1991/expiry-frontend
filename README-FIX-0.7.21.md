# v0.7.21 Mobile date picker fix

Based on v0.7.20.

Changes:
1. Fix Element Plus locale import in `MobileDatePicker.vue`:
   `import zhCn from 'element-plus/es/locale/lang/zh-cn'`
2. Set `:teleported="false"` so the mobile date picker popper stays within the picker container instead of being teleported to `body`.

Scope:
- Point-check detail expiry dates: multi-select unchanged.
- Point-check add expiry dates: multi-select unchanged.
- Mobile expiry add: single-select unchanged.
- Barcode recognition unchanged.
- BBD logic unchanged.
- Other pages unchanged.

Build note: the provided v0.7.20 workspace did not contain a usable `node_modules/.bin/vue-tsc`, so a full production build could not be completed in this environment. Please run `npm install` (if needed) and `npm run build` before deployment.
