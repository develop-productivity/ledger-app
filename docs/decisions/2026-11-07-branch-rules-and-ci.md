# main 分支保护，PR 和发版走 CI

2026-11-07 · 拍板：用户（具体规则由 Claude 定）· 状态：生效

## 决定

用 GitHub 规则集强制"main 只能经 PR 合并、CI 通过才能合并、`v*` tag 不能移动或删除"；推 `v*` tag 时由 CI 校验版本并自动打 APK、建 Release。

## 为什么

1. 用户要求加 main 分支保护和发版 CI，同时不要过度繁琐：不要求审批人数，不加 lint 和依赖机器人。
2. 发版原来要在 Mac 上手动做 6 步，tag、`app.json`、CHANGELOG 三处版本容易对不上；CI 把校验和打包自动化。
3. 设计见 [2026-11-07-rules-and-ci.md](../designs/2026-11-07-rules-and-ci.md)。
