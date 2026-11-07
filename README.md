# 记账本（ledger-app）

一个用 Expo（React Native）写的极简记账 App。数据只存在手机本地。

功能：记收入 / 支出、按月查看收支和结余、长按删除。

## 下载安装（Android）

到 [Releases](https://github.com/develop-productivity/ledger-app/releases/latest) 下载最新的 `.apk`，在手机上打开安装。系统提示"未知来源"时，按提示允许浏览器安装。

更新内容见 [CHANGELOG.md](CHANGELOG.md)。

## 快速开始

```bash
npm install
npm run check        # 类型检查 + 单元测试
npx expo start       # 和手机同一 Wi-Fi 时用
npm run start:tunnel # 在 WSL 里跑时用
```

- 真机调试：[docs/guides/真机调试.md](docs/guides/真机调试.md)
- 打包并装到手机：[docs/guides/打包安装.md](docs/guides/打包安装.md)
- 发布 Release：[docs/guides/发布Release.md](docs/guides/发布Release.md)

## 代码结构

| 文件 | 作用 |
|---|---|
| [App.tsx](App.tsx) | 唯一的界面：月份切换、汇总、记一笔表单、记录列表 |
| [src/ledger.ts](src/ledger.ts) | 纯函数：金额解析与格式化、按月筛选、汇总、分组、数据校验 |
| [src/storage.ts](src/storage.ts) | 用 AsyncStorage 读写数据 |
| [eas.json](eas.json) | EAS 云构建配置（`preview` 出 APK） |

设计见 [docs/designs/2026-11-02-mvp.md](docs/designs/2026-11-02-mvp.md)。
