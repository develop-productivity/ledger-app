# ledger-app 协作规则

一个只存本地的记账本 App。目的是学习移动 App 工具链（真机调试、打包、安装、上架商店），不变现。上架路线见 [docs/decisions/2026-11-08-store-route.md](docs/decisions/2026-11-08-store-route.md)。

## 项目规则

- 开工前读：[README.md](README.md)、[docs/decisions/README.md](docs/decisions/README.md)、相关的 [docs/designs/](docs/designs/)。
- 提交前跑 `npm run check`（类型检查 + 单元测试），通过后再提交。
- 代码按目录分职责（见 [README.md](README.md) 的"代码结构"）：业务逻辑写成纯函数放 `src/core/`，配单测；和系统、存储打交道的放 `src/services/`；页面 `src/app/` 只管界面。
- 测试放根目录 `tests/`，子目录和 `src/` 对应（`src/core/ledger.ts` → `tests/core/ledger.test.ts`）。import 用 `@/` 别名（`@/core/ledger`），不写 `../../`。
- 金额一律用整数分（`amountCents`）。存储格式改动必须升 `version` 并写迁移。
- 不提交密钥、签名文件（`*.jks`、`*.keystore`、`*.p12`、`credentials.json`）和生成的 `ios/`、`android/` 目录。
- 改动走分支和 PR，不直接推 `main`（规则集强制）。PR 的 CI `check` 通过才能合并。合并由用户做。
- 发版：改 `app.json` 版本号和 `CHANGELOG.md`，合并后推 `v*` tag，CI 自动打包并建 Release。见 [docs/guides/发布Release.md](docs/guides/发布Release.md)。`v*` tag 不能移动或删除，发错了就发下一个补丁版本。
- App 不联网、不收集数据，这是隐私政策和商店数据安全表的前提。要加联网或收集数据的功能，先改 `PRIVACY.md` 和 `docs/store/README.md`。
- 需要 Mac 才能做的事（iOS 构建、Xcode），写进 `docs/guides/`，让 Mac 上的 session 只读仓库就能接上。
- 决定、设计、审查、复盘记在 `docs/` 对应目录，文件名 `YYYY-MM-DD-主题.md`，并更新该目录的 `README.md`。

## Expo 通用规则（Expo 模板自带）

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
