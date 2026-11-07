# 分支保护和 CI

2026-11-07 · 作者：Claude · 状态：已实现

## 问题

1. "不直接推 main"只是约定，没有强制。手一滑就会推上去。
2. 合并前的检查（类型检查、测试）只在本地跑，PR 页面看不到结果。
3. 发版要在 Mac 上手动做 6 步（打包、下载、算校验值、写说明、建 Release）。步骤多，容易出错，比如 tag、`app.json`、CHANGELOG 三处版本号对不上。

用户要求：加 main 分支保护，发版时有必要的 CI，但不要过度繁琐。

## 方案

### 1. 规则集（GitHub Rulesets）

仓库是公开的，免费账号可以用规则集。

| 规则集 | 作用对象 | 规则 |
|---|---|---|
| `main 保护` | 默认分支 main | 必须走 PR（不要求审批人数，一个人的项目要求审批会卡住自己）；CI 的 `check` 必须通过；禁止强推；禁止删除 |
| `版本 tag 保护` | `refs/tags/v*` | 禁止移动；禁止删除。可以新建 |

不设"可绕过的人"。紧急情况由仓库所有者在 Settings → Rules 里临时停用规则集。

### 2. PR 检查：`.github/workflows/ci.yml`

触发：PR 到 main、推送到 main。一个 job，名字叫 `check`：

1. `npm ci`
2. `npm run check`（tsc + jest）
3. `npx expo export --platform android`（确认能打出 JS 包）

预计 2～4 分钟。不跑 expo-doctor：它要联网查版本表，结果会随 Expo 发布新补丁而变，会让和本次改动无关的 PR 失败。

### 3. 发版：`.github/workflows/release.yml`

触发：推送 `v*` tag。

| job | 做什么 | 失败时 |
|---|---|---|
| `verify` | tag 必须等于 `v` + `app.json` 的 `version`；CHANGELOG 必须有 `## v<版本>` 一节；tag 指向的提交必须在 main 上；跑 `npm run check` | 不打包，不发 Release |
| `release` | 用 EAS 云端打 APK（`--wait` 等待完成）→ 下载 → 算 SHA-256 → 从 CHANGELOG 取说明 → `gh release create` | Release 不会建出来，可以修好后重跑 |

`release` 需要仓库密钥 `EXPO_TOKEN`（Expo 网站生成的访问令牌）。没有配置时，`release` 直接报错并说明要配置什么。

### 方案对比

| 做法 | 结论 |
|---|---|
| **推 tag 触发发版**（选用） | 发版只要一行 `git push origin v1.2.0`；tag 受规则集保护，不会被移动 |
| 在 Actions 页面手动点按钮，填版本号 | 也简单，但版本号要手填一次，可能和 `app.json` 不一致 |
| 继续在 Mac 上手动发 | 步骤多；WSL 上传不了 APK，只能依赖 Mac |
| 加 lint、依赖更新机器人、多个审批人 | 对一个人的学习项目太繁琐，不做 |

### 和上架商店的关系

用户的下一个目标是上架应用商店。商店（如 Google Play）要的是 AAB，不是 APK，通常还要用 `eas submit` 上传。上架路线定下来以后，再在 `release.yml` 里加一个 job：用 `production` 配置打 AAB 并提交到商店。本次不做，因为路线还没定。

## 风险和回滚

| 风险 | 处理 |
|---|---|
| CI 挂了，PR 合不进去 | 先看日志修；修不了时，在 Settings → Rules 临时停用 `main 保护` |
| EAS 免费额度用完 | 每次发版只打一次包；额度不够时按发布指南的"手动发版"一节在 Mac 上做 |
| 签名密钥 | 仍由 EAS 保管，CI 不接触密钥文件；`EXPO_TOKEN` 只存在 GitHub 的加密密钥里 |
| tag 打错了 | tag 不能移动或删除。改好版本号，发一个新的补丁版本 |

回滚：删除两个工作流文件；在 Settings → Rules 删除两条规则集。

## 怎么验证

1. 本 PR 的 CI `check` 通过。
2. 用 `gh api` 读回规则集，确认作用对象和规则。
3. 下次发版（v1.1.0）走一遍 tag 触发的流程。
