# 商店素材生成脚本

两个脚本都用无头浏览器（`playwright-core`）出图。它们不是 App 的一部分，不在 `package.json` 里，用的时候临时装。

| 脚本 | 做什么 | 什么时候跑 |
|---|---|---|
| [icons.js](icons.js) | 把 `assets/source/*.svg` 导出成 `assets/*.png`（App 图标、启动图、网页图标），再生成 `docs/store/icon-512.png` | 改了图标的 SVG 之后 |
| [screenshots.js](screenshots.js) | 生成中英文各 5 张商店截图（`docs/store/screenshots/zh/`、`en/`）和两张置顶大图（`docs/store/feature-graphic-zh.jpg`、`-en.jpg`） | 界面改动以后，发版前 |

## 在 Mac 或普通 Linux 上

要求 Node 22.2 以上（`icons.js` 用了 `zlib.crc32`）。

```bash
cd ledger-app
npm install --no-save playwright-core
npx playwright-core install chromium-headless-shell

# 图标
node scripts/store/icons.js

# 截图：先在另一个终端启动网页预览（端口 8099）
npx expo start --web --port 8099
node scripts/store/screenshots.js        # 两种语言都生成
node scripts/store/screenshots.js en     # 只生成英文
```

`--no-save` 不会改动 `package.json` 和 `package-lock.json`。网页预览不在 8099 端口时，用环境变量 `APP_URL` 指定地址。

## 在开发用的 WSL 上

这台 WSL 不能装软件。用 slingshot-game 项目里现成的 `playwright-core`，再用环境变量指定浏览器和缺的系统库：

```bash
PLAYWRIGHT_CORE=<slingshot-game>/node_modules/.pnpm/playwright-core@1.64.1/node_modules/playwright-core \
CHROME=~/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell \
LD_LIBRARY_PATH=<解出来的 libnss3、libnspr4、libasound2 所在目录> \
FONTCONFIG_FILE=<含中文字体目录的 fonts.conf> \
node scripts/store/screenshots.js
```

缺的库用 `apt-get download libnss3 libnspr4 libasound2t64 fonts-wqy-microhei` 下载，再用 `dpkg -x` 解到一个临时目录，不需要 sudo。

## 截图里的数据

`screenshots.js` 往浏览器存储里写入上个月一整月的演示数据（固定的伪随机数，每次结果一样），再切到上个月截图。语言和货币通过 `ledger.settings.v1` 设置：中文用人民币，英文用美元。

截图是浏览器按手机尺寸（390×720，2 倍）渲染的，和真机用的是同一套界面代码。
