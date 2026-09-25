# v0.7.6 Fix Notes 

1. /api/items 列表响应改为独立 OrderItemListVO
增加 barcode 查询参数
检查了 PC 货单详情、PC 点货、手机点货三个调用点
点货进入详情后改为调用 /api/items/{id} 获取完整详情
2. PC 货单明细
增加 Barcode 查询
列表保持精简字段
增加「详情」
详情显示箱规 cartonQty 及完整明细
3.有效期详情
增加 otherDateList
PC、手机都展示其他未来有效期
不参与确认/处理操作
PC + 手机点货详情
类型改为非必填
Drink 仍要求选择糖等级