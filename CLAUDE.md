@AGENTS.md

## Claude Code 专用

- 用中文回复。用户用这个项目学习移动 App 开发：交付代码时附导读和思考题，思考题只提问，不代答。新的思考题同时追加进 [docs/guides/思考题.md](docs/guides/思考题.md)，写出处和相关文件。
- 页面用 Expo Router，放在 `src/app/`（Expo Router 规定的位置，不能移）；业务逻辑放 `src/core/` 的纯函数里，测试放 `tests/`。
- 加依赖用 `npx expo install`。npm 报 ERESOLVE 时，先查是不是缺了和 SDK 匹配的间接依赖（如 `react-dom`），不要用 `--legacy-peer-deps`。
- 改完界面用 `npx expo start --web` 在浏览器里预览。这台 WSL 上 Metro 可能察觉不到文件改动，看到的是旧代码时，加 `--clear` 重启。
- 这台 WSL 没有 Java、Android SDK、Xcode，也不能装软件。Android 打包用 EAS 云构建；iOS 构建交给 Mac。
- 代码审查用 Agent 工具新开 `general-purpose` 子 agent，不用 `fork`。只审一轮，照建议改完记进 `docs/reviews/` 就继续。
