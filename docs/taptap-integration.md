# TapTap 集成状态

2026-10-28，官方 `@taptap/instant-games-open-mcp@1.24.14` 已安装，Codex 全局配置新增 `taptap-minigame`，保留原有 MCP。使用 Node 24.8.0 和 stdio 完成 MCP 握手，成功调用工具列表、环境检查、广告接入工作流、发起授权。

当前账号未授权。用户明确选择先完成游戏，稍后授权。无需现在重启或停止开发。后续在 Codex 中重新加载 MCP 连接，可使其加入新会话的工具目录。当前开发验证通过项目下的 MCP SDK 客户端连接同一个官方服务完成。配置直接使用本地 Node 与 `.tools/taptap` 下已安装的官方入口，避免每次启动依赖 npx 下载；移动项目文件夹后需要更新 MCP 的入口路径。

## 官方来源

- 安装说明：https://developer.taptap.cn/minigameapidoc/quick-start/mcp-guide/mcp-setup/
- 安装指南：https://tap-miniapp-bj.oss-cn-beijing.aliyuncs.com/doc/AI_SETUP_GUIDE.md
- 广告开通：https://developer.taptap.cn/minigameapidoc/quick-start/mcp-guide/ad-integration-guide/
- 实际技术依据：MCP 工具 `get_ads_integration_workflow` 的当前响应。

## 后续真实广告接入顺序

1. `start_oauth_authorization`，用户在 TapTap App 扫码，随后 `complete_oauth_authorization`。
2. `get_current_app_info`。未选应用时，`list_developers_and_apps`，确认属于本游戏的应用后 `select_app`。
3. `check_ads_status`，服务端确认 status=1，并且游戏方向为竖屏，自动匹配有效 space_id。
4. `get_ad_integration_guide`，从官方生成的当前应用代码落实 `AdProvider`。
5. 上传构建内容后在 TapTap H5 宿主中验证完播、取消、无填充、加载错误、切后台、重复点击。

H5 宿主提供全局 `tap`。普通浏览器不可假定它存在。不能用 Unity 广告 API，不用猜测的广告位，也不向用户索取手工广告位。开发者后台认证和财务主体开通由账号持有人完成。

## 已实现的游戏侧合同

`src/ads.ts` 定义 `AdProvider` 与 `RewardAds`。没有真实 Provider 时隐藏广告按钮，正常游戏不受影响。完播才发奖；取消、错误、超时不奖励；同一事务只成功一次；并发观看被拒绝；120 秒保护超时后不接受迟到回调。

三个入口在 `src/ui.ts`：胜利额外领取基础战斗金币、升级选项重抽一次、失败续战一次。已完成游戏奖励逻辑和隔离测试，尚未完成真实 TapTap API 绑定和真机广告验收。不能将 mock 测试结果描述为实际广告可播放。

## 包体

项目坚持最终构建内容 <20,000,000 字节，不包含源素材、开发工具、概念图。普通小游戏文档中的 4 MB/60 MB 与审核规范的 20 MB 不应擅自解释为 H5 的一致限制；H5 上传时仍需根据当前服务端校验结果确认。
