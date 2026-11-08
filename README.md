# 记账本（ledger-app）

一个用 Expo（React Native）写的极简记账 App。数据只存在手机本地。

功能：记收入 / 支出、按月查看收支和结余、编辑和删除记录、饼图和每日柱状图统计。

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
- 上架商店：[docs/guides/上架Uptodown.md](docs/guides/上架Uptodown.md)、[docs/guides/上架GooglePlay.md](docs/guides/上架GooglePlay.md)；文案和图片在 [docs/store/](docs/store/)

## 代码结构

| 文件 | 作用 |
|---|---|
| [src/app/](src/app/) | 页面（Expo Router，一个文件一个页面）：`(tabs)/index.tsx` 明细、`(tabs)/stats.tsx` 统计、`entry.tsx` 记一笔和编辑 |
| [src/LedgerContext.tsx](src/LedgerContext.tsx) | 账本数据和当前月份，供各页面共享 |
| [src/ledger.ts](src/ledger.ts) | 纯函数：金额、日期、筛选、汇总、分组、增删改、数据校验 |
| [src/chart.ts](src/chart.ts) | 纯函数：分类占比、环形图分段、每日合计 |
| [src/storage.ts](src/storage.ts) | 用 AsyncStorage 读写数据 |
| [src/components/](src/components/) | 分类图标、月份切换、环形图等组件 |
| [src/categories.ts](src/categories.ts)、[src/theme.ts](src/theme.ts) | 分类的图标和颜色；全局配色 |
| [eas.json](eas.json) | EAS 云构建配置（`preview` 出 APK，`production` 出给 Google Play 的 AAB） |
| [assets/](assets/) | 图标和启动图；源文件是 `assets/source/` 里的 SVG |

设计见 [docs/designs/](docs/designs/)。
