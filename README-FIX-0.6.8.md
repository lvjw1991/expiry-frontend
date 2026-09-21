# v0.6.8 修改

1. 移动端有效期选择：删除“全部清空”按钮，保留每个有效期右侧的单独删除 `×`。
2. iPhone Safari 点货收货单列表：修复内容宽度超出 viewport 导致的横向偏移/裁切。
3. 不使用缩放（zoom/transform scale），不改变 Android 现有布局和点货业务逻辑。
4. `box-sizing: border-box` 下显式限制移动端页面、内容区和收货单卡片的宽度，避免固定/最小宽度造成溢出。
