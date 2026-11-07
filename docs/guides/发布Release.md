# 发布一个 Release

把 APK 放到 GitHub Release，别人从仓库页面就能下载安装。

## 平时的做法：推 tag，CI 自动发

### 第一次：配置 EXPO_TOKEN（只做一次，要人来做）

1. 打开 <https://expo.dev> → 右上角头像 → Account settings → Access tokens → Create token。名字写 `github-actions`，复制生成的令牌。
2. 打开仓库 Settings → Secrets and variables → Actions → New repository secret。Name 填 `EXPO_TOKEN`，Secret 粘贴令牌。

令牌等于你的 Expo 账号权限，不要发到聊天里，也不要写进仓库。

### 每次发版

1. 开分支，改三处，提 PR，合并：
   - `app.json` 的 `version` 改成新版本号，比如 `1.2.0`；
   - `app.json` 的 `android.versionCode` 加 1；
   - `CHANGELOG.md` 最上面加 `## v1.2.0（versionCode 3）` 一节。
2. 在 main 的最新提交上打 tag 并推送：

   ```bash
   git switch main && git pull
   git tag v1.2.0
   git push origin v1.2.0
   ```

3. 打开仓库的 Actions 页面看 Release 工作流：
   - `verify`：检查 tag、`app.json`、CHANGELOG 三处版本一致，tag 在 main 上，跑测试。
   - `release`：EAS 云端打 APK（10～30 分钟），算 SHA-256，从 CHANGELOG 取说明，创建 Release。
4. 完成后，<https://github.com/develop-productivity/ledger-app/releases/latest> 上就是新版本。

### 出错了怎么办

| 现象 | 处理 |
|---|---|
| `verify` 报版本不一致 | tag 已经推上去，而且受保护，不能移动。改好版本号，提 PR，发下一个补丁版本（如 `v1.2.1`） |
| `release` 报没有 `EXPO_TOKEN` | 按上面"第一次"配置，然后在 Actions 页面点 Re-run failed jobs |
| EAS 构建失败或额度用完 | 看 EAS 构建页的日志；额度用完时，改用下面的"手动发版" |

## 备用：在 Mac 上手动发版

CI 用不了时才用这一节。开发用的 WSL 连不上 GitHub 的上传地址，也装不上 eas-cli，所以要在 Mac 上做。

前提：Mac 上已登录 Expo（`npx eas-cli@latest whoami` 能显示用户名），已登录 gh（`gh auth status`）。

### 1. 准备代码

```bash
cd ledger-app
git switch main && git pull
npm install
npm run check
```

确认三处版本号一致：

- `app.json` 的 `expo.version`，比如 `1.0.0`
- `app.json` 的 `expo.android.versionCode`，比如 `1`
- `CHANGELOG.md` 最上面一节的标题，比如 `## v1.0.0（versionCode 1）`

不一致就停下来，先开 PR 改好再继续。下面的命令都以 `v1.0.0` 为例，发别的版本时替换掉。

### 2. 打包

从 `main` 的最新提交打包，这样 Release 里的 APK 和 tag 对应同一份代码：

```bash
npx eas-cli@latest build -p android --profile preview
```

完成后，终端会打出 APK 的下载链接，形如 `https://expo.dev/artifacts/eas/....apk`。

### 3. 下载 APK，算校验值

```bash
mkdir -p ~/ledger-release && cd ~/ledger-release
curl -L -o ledger-v1.0.0.apk "<上一步的下载链接>"
shasum -a 256 ledger-v1.0.0.apk | tee ledger-v1.0.0.apk.sha256
```

校验值让下载的人确认文件没被篡改，也没下载坏。

### 4. 写 Release 说明

从 `CHANGELOG.md` 里取出这个版本的一节，再加上安装说明和校验值：

```bash
REPO=~/path/to/ledger-app   # 改成仓库在 Mac 上的路径
{
  awk '/^## v1.0.0/{f=1;next} /^## /{f=0} f' "$REPO/CHANGELOG.md"
  echo
  echo '## 安装'
  echo
  echo '1. 在 Android 手机上下载下面的 `ledger-v1.0.0.apk`。'
  echo '2. 系统提示"禁止安装未知来源应用"时，按提示允许浏览器安装。'
  echo '3. 华为、小米等手机开着"纯净模式"时，要先关掉。'
  echo
  echo '## SHA-256'
  echo
  echo '```'
  cat ledger-v1.0.0.apk.sha256
  echo '```'
} > notes.md
cat notes.md
```

看一遍 `notes.md`，内容不对就手动改。

### 5. 创建 Release

```bash
gh release create v1.0.0 ledger-v1.0.0.apk ledger-v1.0.0.apk.sha256 \
  --repo develop-productivity/ledger-app \
  --target main \
  --title "记账本 v1.0.0" \
  --notes-file notes.md
```

- `--target main`：在 `main` 的最新提交上打 `v1.0.0` 这个 tag。先确认 main 的最新提交就是要发的版本，后面没有别的 PR 合进来。
- tag 一旦发出去就不要移动。发错了就发一个新版本（比如 `v1.0.1`），不要改旧 tag。

### 6. 验证

1. 打开 <https://github.com/develop-productivity/ledger-app/releases/latest>，看到 APK 和 `.sha256` 两个文件。
2. 用手机浏览器打开这个页面，下载 APK，装上，能记一笔。

## 版本号和签名

- `versionCode` 不加 1，已经装了旧版本的手机可能拒绝覆盖安装。
- 打包必须一直用 EAS 保管的那个签名密钥。换了密钥，旧版本不能直接升级，只能先卸载，账本数据也会跟着删掉。
