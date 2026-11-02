@AGENTS.md

## Claude Code 专用

- 用中文回复。用户用这个项目学习移动 App 开发：交付代码时附导读和思考题，思考题只提问，不代答。
- 本项目只有一个界面，暂不用 Expo Router；AGENTS.md 里 "Navigation & Routing" 一节等加第二个界面时再执行。
- 这台 WSL 没有 Java、Android SDK、Xcode，也不能装软件。Android 打包用 EAS 云构建；iOS 构建交给 Mac。
- 代码审查用 Agent 工具新开 `general-purpose` 子 agent，不用 `fork`。只审一轮，照建议改完记进 `docs/reviews/` 就继续。
