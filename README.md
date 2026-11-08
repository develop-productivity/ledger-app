# 记账本（ledger-app）

一个用 Expo（React Native）写的极简记账 App。数据只存在手机本地。

功能：记收入 / 支出、按月查看收支和结余、编辑和删除记录、饼图和每日柱状图统计、备份恢复和导出 CSV。

## 下载安装（Android）

到 [Releases](https://github.com/develop-productivity/ledger-app/releases/latest) 下载最新的 `.apk`，在手机上打开安装。系统提示"未知来源"时，按提示允许浏览器安装。

更新内容见 [CHANGELOG.md](CHANGELOG.md)。隐私政策见 [PRIVACY.md](PRIVACY.md)。

## 快速开始

```bash
npm install
npm run check        # 类型检查 + 单元测试
npx expo start       # 和手机同一 Wi-Fi 时用
npm run start:tunnel # 在 WSL 里跑时用
npx expo start --web # 在浏览器里预览界面（删除确认框在浏览器里不显示，删除功能要在手机上试）
```

- 真机调试：[docs/guides/真机调试.md](docs/guides/真机调试.md)
- 打包并装到手机：[docs/guides/打包安装.md](docs/guides/打包安装.md)
- 发布 Release：[docs/guides/发布Release.md](docs/guides/发布Release.md)
- 思考题（学习用）：[docs/guides/思考题.md](docs/guides/思考题.md)
- 上架商店：[docs/guides/上架Uptodown.md](docs/guides/上架Uptodown.md)、[docs/guides/上架GooglePlay.md](docs/guides/上架GooglePlay.md)；文案和图片在 [docs/store/](docs/store/)

## 代码结构

```text
src/
  app/          页面（Expo Router：一个文件一个页面，位置是框架规定的）
    (tabs)/       底部标签页：index 明细、stats 统计、me 我的
    entry.tsx     记一笔和编辑
  components/   可复用的界面组件：分类图标、月份切换、环形图……
  core/         纯函数业务逻辑，不碰 React、不碰存储，都有单测
  services/     和系统、存储打交道：AsyncStorage、写文件、分享、弹窗
  state/        全局状态（React Context）
  ui/           配色、分类的图标和颜色
tests/          单元测试，子目录和 src/ 一一对应
assets/         图标和启动图；source/ 里是 SVG 源文件
docs/           决定、设计、审查、指南、商店素材
```

| 文件 | 作用 |
|---|---|
| [src/core/ledger.ts](src/core/ledger.ts) | 金额、日期、筛选、汇总、分组、增删改、数据校验 |
| [src/core/chart.ts](src/core/chart.ts) | 分类占比、环形图分段、每日合计 |
| [src/core/backup.ts](src/core/backup.ts) | 备份文件格式、恢复时的合并、CSV |
| [src/services/storage.ts](src/services/storage.ts) | 用 AsyncStorage 读写数据 |
| [src/services/exporter.ts](src/services/exporter.ts) | 写文件、分享、选文件夹、选文件 |
| [src/services/dialog.ts](src/services/dialog.ts) | 弹窗（网页预览里用浏览器弹窗） |
| [src/state/LedgerContext.tsx](src/state/LedgerContext.tsx) | 账本数据和当前月份，供各页面共享 |
| [src/ui/theme.ts](src/ui/theme.ts)、[src/ui/categories.ts](src/ui/categories.ts) | 全局配色；分类的图标和颜色 |
| [eas.json](eas.json) | EAS 云构建配置（`preview` 出 APK，`production` 出给 Google Play 的 AAB） |

依赖方向只能往下：`app` → `components` → `state` → `services` → `core`；`ui` 只依赖 `core`。`core` 不 import 其他目录，所以能直接单测。

import 用 `@/` 别名，指向 `src/`，比如 `import { formatCents } from '@/core/ledger'`。别名配在 `tsconfig.json` 的 `paths`（给 TypeScript 和 Metro 用）和 `package.json` 的 `jest.moduleNameMapper`（给 Jest 用）。

设计见 [docs/designs/](docs/designs/)。
