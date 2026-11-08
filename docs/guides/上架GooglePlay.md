# 上架 Google Play

费用：开发者账号一次性 25 美元，要 Visa 或万事达卡。耗时：3～4 周，大头是 14 天封闭测试。

Play Console 的页面经常改。下面的步骤按 2026-11 的规则写，**按钮名称和必填项以页面为准**。走完后把实际情况补进来。

## 1. 注册开发者账号（人来做）

1. 打开 <https://play.google.com/console/signup>，用 Google 账号登录。
2. 账号类型选**个人**（Personal）。组织账号要 D-U-N-S 编码，个人项目不需要。
3. 付 25 美元，按要求上传身份证件，完成验证。还可能要在一台 Android 手机上装 Play Console App 验证设备。
4. 验证通过一般要几天。

## 2. 打 AAB（Google Play 只收 AAB，不收 APK）

1. 确认要上架的版本已经按 [发布Release.md](发布Release.md) 发过 Release，比如 `v1.2.0`。
2. 打开仓库的 Actions 页面 → 左边选 **Google Play AAB** → **Run workflow** → tag 填 `v1.2.0` → 运行。
3. 等 10～30 分钟。完成后打开这次运行的摘要页，有 AAB 的下载链接。下载到电脑上。

这一步用 `eas.json` 里的 `production` 配置，会多用一次 EAS 免费打包额度。所以只在要上传 Play 时手动运行，平时发版不打 AAB。

## 3. 建应用、第一次上传（人来做）

1. Play Console → 创建应用：
   - 应用名：记账本；默认语言：中文（简体）- zh-CN；类型：应用；免费。
2. 按 [docs/store/README.md](../store/README.md) 填：商店页文案、图标、置顶大图、截图、隐私政策网址、数据安全表、内容分级问卷、目标受众（18 岁以上即可）、广告声明（无广告）。
3. 测试 → **封闭测试**（Closed testing）→ 新建版本 → 上传 AAB。

   第一次上传时，Play 会问**签名密钥**怎么管，见下面的"签名密钥要选一次"。

### 签名密钥要选一次（需要人判断）

Google Play 会用"应用签名密钥"重新签名，用户从 Play 装到的 App 带的是这把密钥。我们在 GitHub Release 和 Uptodown 发的 APK，用的是 EAS 保管的那把密钥。

| 选法 | 好处 | 代价 |
|---|---|---|
| **让 Google 生成新密钥**（页面默认） | 最省事，点下一步就行 | Play 版和 APK 版签名不同。从 Uptodown 装的用户不能直接用 Play 升级，要先卸载，数据会丢 |
| **上传 EAS 的密钥作为应用签名密钥** | 所有渠道签名一样，可以互相覆盖升级 | 要在 Mac 上用 `npx eas-cli@latest credentials` 下载密钥库，再用 Google 提供的 PEPK 工具（需要 Java）加密上传，约半小时 |

选了基本不能改：Play 只允许做一次签名密钥升级，而且新密钥只对新安装生效，已经装了的用户不受影响。现在用户只有你自己，选哪种都行；想让以后各渠道能互相升级，选第二种。

## 4. 封闭测试：12 人 × 14 天（人来做）

2023-11-13 以后注册的个人账号，要先满足这条才能申请正式版：

- 至少 **12 个测试者**加入封闭测试；
- 他们要**连续 14 天**保持加入。

做法：

1. 在封闭测试的"测试者"里，加一个邮件列表，填 12 个以上测试者的 Google 账号邮箱。多找几个人，中途有人退出也够数。
2. 把"加入测试"的链接发给他们。每个人用手机打开链接，点"成为测试者"，再从 Play 安装。
3. 14 天里让大家偶尔打开用一用。期间可以发新版本修问题：先按 [发布Release.md](发布Release.md) 发一个补丁版本（versionCode 加 1、推新 tag），再用新 tag 运行 **Google Play AAB** 工作流，上传新的 AAB。AAB 工作流只接受已经发布的 tag。
4. 满 14 天后，在 Play Console 首页申请正式版访问权限（Apply for production），回答几个关于测试的问题。审核一般不超过 7 天。

## 5. 正式发布

1. 正式版（Production）→ 新建版本 → 选封闭测试里那个 AAB（或上传新的）→ 提交审核。
2. 审核通过后，在 Play 商店搜"记账本"，确认能下载。
3. 把 Play 商店链接写进 [README.md](../../README.md)。

## 以后每次更新

1. 按 [发布Release.md](发布Release.md) 发版（APK 进 GitHub Release）。
2. 手动运行 **Google Play AAB** 工作流，下载 AAB，在 Play Console 上传到正式版。

更新频繁了，再考虑用 `eas submit` 自动上传：要在 Google Cloud 建服务账号、给 Play Console 授权，再把服务账号密钥存为仓库密钥。第一次上传必须手动，所以先不做。
