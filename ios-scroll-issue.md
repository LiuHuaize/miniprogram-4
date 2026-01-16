问题总结：iOS 真机扫码列表/详情不显示

背景
- 现象：真机扫码后，首页卡片列表显示异常；随后发现创业营详情、订单详情等页面内容也不显示或仅显示底部按钮。
- 开发者工具、模拟器、微信开发者 App 均正常，数据与图片 URL 在控制台可见。

排查过程
- 通过控制台日志确认 cards/poster 数据已 setData。
- 真机调试查看 DOM：节点存在，但 scroll-view 高度为 0。
- 结论：iOS 真机下，flex 子元素 + scroll-view 的 height: 0 组合会导致高度被压扁。

根因
- 多个页面的 `.scroll-area` 使用了 `height: 0;`，在 iOS 真机的 flex 布局中被计算为 0 高度。

解决方案
- 统一将 `.scroll-area` 从 `height: 0;` 改为 `min-height: 0;`，保留 flex: 1。
- 涉及页面：index、detail、order-detail、order-form、camper-list、camper-info、my-submissions、pay-success。

注意事项
- 若页面顶部/底部有自定义导航或 TabBar，scroll-view 高度不要用固定 0，优先 `flex: 1; min-height: 0;`。
- iOS 真机渲染差异较多，遇到“元素存在但不显示”，优先检查容器高度。
- 真机问题排查可用：`wx.createSelectorQuery().boundingClientRect()` 记录布局尺寸。

回归检查
- 真机扫码打开首页、创业营详情、订单详情、报名表、我的提交、成功页等滚动页面，确保内容可见且可滚动。
