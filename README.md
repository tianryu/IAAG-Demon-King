# 我是哥布林：魔王

竖屏 2D 粗像素领地防守小游戏，Phaser 3.90 + TypeScript + Vite。

## 运行

开发与测试推荐 Node.js 24，本机已用 24.8.0 验证。

```powershell
git clone https://github.com/tianryu/IAAG-Demon-King.git
cd IAAG-Demon-King
npm.cmd ci
npm.cmd run dev
```

仓库包含运行和构建所需的全部素材。`assets/source` 原始素材下载包和 `.tools` 本机辅助工具不入库，正常运行、测试和构建不依赖这两个目录。素材来源与许可见 `public/licenses` 和 `assets/licenses`。

打开终端显示的本机地址。手机可以在同一局域网内通过 `npm.cmd run dev -- --host 0.0.0.0` 启动后访问本机局域网 IP；该操作会监听局域网，默认仅监听 127.0.0.1。

## 操作

- 手机底部中央摇杆移动，桌面 WASD 或方向键。
- 靠近建筑后，右侧出现建筑等级和升级按钮，也可点建筑自动走近。
- 左侧王冠升级魔王，顶部迎敌开始战斗。
- 魔王、军队、箭塔自动攻击。士兵免费排队复活。
- 魔王和所有建筑均可无限升级，强化永久累加。建筑保留五档外观，魔王在 1、6、11、16、21 级改变外观。城堡 5 级开放全部地块。兵营最多 12 人，达到编制后继续强化属性。
- 波次结束统一恢复建筑与部队。金币自动结算，战斗失败保留成长。
- 每十波有 Boss。失败后可重试当前主线波次，没有补给战。
- 新游戏从城堡和一座 3 人兵营起步，其他建筑均需建造。首次开局提供移动、金矿、箭塔、城墙和迎敌引导，可跳过。
- 敌军在视野外按小队集结，优先攻击最近的建筑。前 3 波逐渐增加压力，之后无限推进。
- 魔王和士兵每秒恢复最大生命的 0.8%，阵亡后仍按原规则复活。
- 金币广告每波一次，最低 80 金币，按主线波次和平均生产收益动态增长，向上取整到 10。0.4.0 版本将全部敌人和 Boss 的血量、攻击各降低 15%，盾兵减伤从 20% 降为 10%。
- 金矿和蘑菇田下方显示金币产出及结算频率，建造和升级面板显示前后收益范围，蘑菇田提示距离收获还需几次胜利。显示金额与实际结算使用同一套计算。

常规经济已收紧：胜利奖励为 34 + 波次 × 4，Boss 波额外 50；小兵击败奖励 1，Boss 10。一级金矿每胜 8 金币，一级蘑菇田每三胜 28 金币。升级费用按等级平滑递增，不会在 5 级归零，也不会继续指数膨胀。旧存档现有金币保留。

## 检查与发布构建

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run check:release
npm.cmd run preview
```

发布目录为 `dist`。ZIP 根目录直接包含 index.html、assets、licenses，不包含外层 dist 文件夹。不要上传项目源码或 assets/source。

开发专用 `?qa=1` 提供五级领地、无限升级、无广告十波、Boss、阵亡、失败和加速验收操作，使用隔离的内存存档，不会写入正常存档。QA 模块会从生产构建移除。

## 文档

- DEVELOPMENT_PLAN.md：步骤与验收标准
- docs/balance-0.4.0-status.json：当前版本数值、无限升级和回归验收
- docs/v4-implementation-status.json：0.3.0 历史验收记录
- docs/v3-implementation-status.json：0.2.0 历史验收记录
- docs/layout-v3.json：六种屏幕尺寸的弹窗与操作区测量
- docs/acceptance-report.md：首版历史验收记录
- docs/taptap-integration.md：MCP 与待账号授权的广告步骤
- docs/game-rules.json：规则原案
- docs/visual-spec.json：确认的视觉原则
- docs/concepts/v3-production-prompts.json：当前素材的生成提示词与输出路径
- docs/concepts/v4-ui-prompts.json：独立 UI、标题和等级旗帜的生成提示词与输出路径
- docs/audio-validation.json：背景音乐与音效格式检查
- public/licenses：发布包内实际使用素材的许可

本机 localStorage 保存永久进度并保留上一份备份。异常存档会另存原始内容，尝试恢复备份并提示。尚未接入跨设备云存档。

当前版本包含 40 幅建筑等级外观、5 阶段魔王外观、14 类角色的行走和攻击动画，以及 CC0 背景音乐和音效。升级弹窗含三个普通选项和一个广告全选选项。金币奖励、免费全选和失败转胜利的奖励逻辑已实现；真实 TapTap 广告仍等待账号授权，未接通时按钮会提示不可用，正式包不包含模拟广告。
