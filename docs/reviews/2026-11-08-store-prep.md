# v1.2.0 上架准备代码审查

2026-11-08 · 审查人：新上下文子 agent（一轮）· 对象：`feat/store-prep` 相对 `main`

结论：可以合并，没有必须修的问题。和已有决定不冲突，没有超出设计范围。审查人跑了 `npm run check`、`expo-doctor`、`expo config`，核对了图片规格和隐私政策与代码的一致性。

| # | 级别 | 意见 | 处理 |
|---|---|---|---|
| 1 | 建议 | 最终清单带 Expo 默认的读写存储、悬浮窗权限，商店页会列出来，和隐私政策对不上 | `app.json` 加 `blockedPermissions` 去掉这三个；用 `expo config --type introspect` 确认已标记移除 |
| 2 | 建议 | Uptodown 指南说"发版流程检查了 versionCode 变大"，实际没检查 | `release.yml` 的 `verify` 加检查：versionCode 必须比上一个 `v*` tag 的大；本地按 v1.0.0 → 当前提交试过 |
| 3 | 建议 | Play 指南"versionCode 加 1，重新打 AAB"没说要先发版 | 改为：先发补丁版本推新 tag，再用新 tag 跑 AAB 工作流 |
| 4 | 建议 | `icon-512.png` 是 RGB，Play 要求 32 位带透明通道 | 重新导出为 RGBA |
| 5 | 建议 | "签名密钥选了就不能再改"说得太绝对 | 改为：Play 允许一次密钥升级，只对新安装生效 |
| 6 | 需要人判断 | 要不要屏蔽 `INTERNET` 权限 | 不屏蔽（审查人也不建议）：屏蔽后开发版连不上 Metro。记进设计 |
| 7 | 建议 | AAB 工作流输入早于 v1.2.0 的 tag 时，EAS 报错难懂 | 检查 `eas.json` 有没有 `production` 配置，没有就给明确提示 |

还没有验证的：推 `v1.2.0` tag 后在真机上看图标和启动图、覆盖安装保留数据、手动跑一次 AAB 工作流。
