# v0.7.22 修复说明

基于 v0.7.21。

## 本次修改

针对 iPhone 点货页面的多选有效期日历：

- 仅影响 `multiple=true` 的点货多选日期。
- 强制日历从日期入口下方打开：`placement=bottom-start`。
- 多选模式禁止 Popper 自动 fallback 到上方，避免日历覆盖已经选中的有效期。
- `teleported=false` 保留。
- 有效期新增页面的单选日期不改变。
- 扫码、BBD、其他页面不改变。

另外保留 v0.7.21 已修复的 Element Plus 中文 locale import。
