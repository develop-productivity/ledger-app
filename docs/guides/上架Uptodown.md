# 上架 Uptodown

Uptodown 是海外的 APK 商店，免费，收 APK。用它先走一遍"商店上架"：建开发者账号、填商店页、上传、等审核、发更新。

Uptodown 的开发者后台（<https://www.uptodown.dev/>）是动态网页，写这份指南时没能读到它的帮助文档。下面是通用流程，**具体按钮和必填项以后台页面为准**。走完后把实际步骤补进这份指南。

## 准备

1. 发一个带新图标的版本（v1.2.0 起）。按 [发布Release.md](发布Release.md) 推 tag，CI 会在 Release 里放好 APK。
2. 从 Release 页面下载 `ledger-v1.2.0.apk`。
3. 打开 [docs/store/README.md](../store/README.md)，准备好文案和图片。

## 上架

1. 打开 <https://www.uptodown.dev/>，注册开发者账号（用邮箱或 Google 账号）。
2. 新建应用，上传 APK。包名是 `com.developproductivity.ledger`。
3. 填商店页：
   - 名称、简介、详细描述：从 [docs/store/README.md](../store/README.md) 复制。后台只有英文时，用英文那一份。
   - 分类：Finance。
   - 图标：[icon-512.png](../store/icon-512.png)。截图：[screenshots/](../store/screenshots/) 里的 4 张。
   - 隐私政策网址：`https://github.com/develop-productivity/ledger-app/blob/main/PRIVACY.md`。
4. 提交审核。审核通过后，在 Uptodown 网站搜"记账本"或包名，确认能下载。
5. 用另一台手机（或卸载后）从 Uptodown 下载安装，记一笔，确认能用。

## 发更新

每次 GitHub Release 发了新版本，就到后台上传新的 APK。要注意两点：

- `versionCode` 必须比上一次上传的大。发版流程的 `verify` 会检查它比上一个 tag 的大。
- APK 必须用同一个签名密钥（EAS 保管的那个）。换了密钥，用户就不能覆盖升级。

## 走完后要记的

- 实际的注册和上传步骤、必填项、审核用了几天，补进本指南。
- 应用在 Uptodown 的页面网址，写进 [README.md](../../README.md) 的"下载安装"一节。
