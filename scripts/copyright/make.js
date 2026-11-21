// 生成软件著作权登记材料：源程序 PDF 和用户手册 PDF，输出到 docs/copyright/。
// 用法见 docs/guides/申请软著.md。生成用户手册的截图要先启动网页预览（端口 8099）。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/copyright');
const SHOTS = path.join(os.tmpdir(), 'ledger-copyright-shots');
const URL = process.env.APP_URL || 'http://localhost:8099';

// 软著申请表里的"软件全称"和"版本号"，各材料必须一致
const NAME = '记账本软件';
const VERSION = 'V' + require(path.join(ROOT, 'app.json')).expo.version;
const LINES_PER_PAGE = 50; // 源程序每页不少于 50 行
const MAX_COLS = 120; // 超长的行折成多行，保证每页正好 50 行、不溢出

// 源文件顺序：入口和页面 → 组件 → 状态 → 服务 → 核心逻辑 → 文字和样式
const ORDER = ['src/app/', 'src/components/', 'src/state/', 'src/services/', 'src/core/', 'src/i18n/', 'src/ui/'];

function sourceLines() {
  const files = execSync('git ls-files src', { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .sort((a, b) => {
      const ra = ORDER.findIndex((p) => a.startsWith(p));
      const rb = ORDER.findIndex((p) => b.startsWith(p));
      return ra - rb || a.localeCompare(b);
    });
  const lines = [];
  let sourceCount = 0;
  for (const f of files) {
    lines.push(`// ===== 文件：${f} =====`);
    for (const raw of fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n')) {
      if (raw.trim() === '') continue; // 去掉空行
      sourceCount++;
      // 按显示宽度折行：中文字符算两个宽度
      let rest = raw.replace(/\t/g, '  ');
      while (width(rest) > MAX_COLS) {
        let cut = 0;
        let w = 0;
        while (cut < rest.length && w + charWidth(rest[cut]) <= MAX_COLS) w += charWidth(rest[cut++]);
        lines.push(rest.slice(0, cut));
        rest = '    ' + rest.slice(cut);
      }
      lines.push(rest);
    }
  }
  return { files, lines, sourceCount };
}

const charWidth = (c) => (/[ᄀ-￿]/.test(c) ? 2 : 1);
const width = (s) => [...s].reduce((n, c) => n + charWidth(c), 0);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PAGE_CSS = `@page{size:A4;margin:22mm 16mm 18mm}body{margin:0;font-family:'Noto Sans CJK SC','PingFang SC','WenQuanYi Micro Hei',sans-serif}`;
const header = `<div style="width:100%;font-size:9px;padding:0 16mm;display:flex;justify-content:space-between;font-family:'WenQuanYi Micro Hei',sans-serif"><span>${NAME} ${VERSION}</span><span>第 <span class="pageNumber"></span> 页，共 <span class="totalPages"></span> 页</span></div>`;

async function sourcePdf(browser) {
  const { files, lines, sourceCount } = sourceLines();
  let pages = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) pages.push(lines.slice(i, i + LINES_PER_PAGE));
  // 超过 60 页时只交前 30 页和后 30 页（规定）；不到 60 页全部提交
  const total = pages.length;
  if (total > 60) pages = [...pages.slice(0, 30), ...pages.slice(-30)];
  const html = `<html><head><style>${PAGE_CSS}
    .page{page-break-after:always;font:8.4px/1.62 'DejaVu Sans Mono','WenQuanYi Micro Hei Mono','Noto Sans Mono CJK SC',monospace;white-space:pre}
    .page:last-child{page-break-after:auto}</style></head><body>
    ${pages.map((p) => `<div class="page">${p.map(esc).join('\n')}</div>`).join('')}</body></html>`;
  const page = await browser.newPage();
  await page.setContent(html);
  await preview(page, 'source');
  const file = path.join(OUT, `${NAME}${VERSION}-源程序.pdf`);
  await page.pdf({ path: file, format: 'A4', displayHeaderFooter: true, headerTemplate: header, footerTemplate: '<span></span>', margin: { top: '22mm', bottom: '18mm', left: '16mm', right: '16mm' } });
  await page.close();
  return { file, pages: pages.length, total, files: files.length, sourceCount, printed: lines.length };
}

// 用户手册的截图：中文界面，演示数据
async function screenshots(browser) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, locale: 'zh-CN' });
  const p = await ctx.newPage();
  p.on('dialog', (d) => d.dismiss());
  const shot = (name) => p.screenshot({ path: path.join(SHOTS, name + '.png') });
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const day = (d) => `${ym}-${String(Math.max(now.getDate() - d, 1)).padStart(2, '0')}`;
  const entries = [
    ['expense', '餐饮', 2350, '午饭', 0], ['expense', '交通', 600, '地铁', 0], ['expense', '购物', 12900, '日用品', 1],
    ['expense', '娱乐', 6800, '电影', 2], ['income', '工资', 1200000, '', 3], ['expense', '居住', 180000, '房租', 4],
    ['expense', '餐饮', 4200, '晚饭', 4], ['expense', '通讯', 5800, '话费', 5], ['income', '红包', 20000, '', 6],
  ].map(([type, category, amountCents, note, d], i) => ({ id: 'm' + i, type, category, amountCents, note, date: day(d), createdAt: i }));
  await p.goto(URL);
  await p.evaluate((e) => {
    localStorage.clear();
    localStorage.setItem('ledger.v1', JSON.stringify({ version: 1, entries: e }));
    localStorage.setItem('ledger.settings.v1', JSON.stringify({ version: 1, lang: 'zh', currency: 'CNY' }));
  }, entries);
  await p.goto(URL);
  await p.waitForTimeout(2500);
  await p.addStyleTag({ content: '*:focus{outline:none !important}' });
  await shot('1-consent');
  await p.getByText('同意并继续', { exact: true }).click();
  await p.waitForTimeout(1500);
  await shot('2-detail');
  await p.getByLabel('记一笔').click();
  await p.waitForTimeout(1500);
  await p.addStyleTag({ content: '*:focus{outline:none !important}' });
  await p.keyboard.type('35.8');
  await p.waitForTimeout(600);
  await shot('3-entry');
  await p.goto(URL);
  await p.waitForTimeout(2000);
  await p.getByText('统计', { exact: true }).last().click();
  await p.waitForTimeout(1500);
  await shot('4-stats');
  await p.getByText('我的', { exact: true }).last().click();
  await p.waitForTimeout(1200);
  await shot('5-me');
  await p.mouse.move(195, 500);
  await p.mouse.wheel(0, 2000);
  await p.waitForTimeout(600);
  await shot('6-me-about');
  await ctx.close();
}

// PREVIEW_DIR=目录：另存一张按打印样式渲染的长图，没有 PDF 阅读器时用来检查排版
async function preview(page, name) {
  if (!process.env.PREVIEW_DIR) return;
  await page.emulateMedia({ media: 'print' });
  await page.setViewportSize({ width: 680, height: 900 });
  await page.screenshot({ path: path.join(process.env.PREVIEW_DIR, name + '.png'), fullPage: true });
}

const img = (name) => `<img src="data:image/png;base64,${fs.readFileSync(path.join(SHOTS, name + '.png')).toString('base64')}">`;

function manualHtml() {
  const fig = (name, caption) => `<figure>${img(name)}<figcaption>${caption}</figcaption></figure>`;
  return `<html><head><style>${PAGE_CSS}
    body{font-size:12.5px;line-height:1.9;color:#1c2033}
    h1{font-size:24px;text-align:center;margin:40px 0 6px}h2{font-size:17px;margin:22px 0 6px;page-break-after:avoid}h3{font-size:14px;margin:14px 0 4px}
    p,li{margin:3px 0}.cover{text-align:center;color:#555;margin-bottom:24px}
    .row{display:flex;gap:18px;align-items:flex-start;page-break-inside:avoid;margin:8px 0}.row .text{flex:1}
    figure{margin:0;width:34%;text-align:center}figure img{width:100%;border:1px solid #ccc;border-radius:8px}figcaption{font-size:11px;color:#666}
    table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #bbb;padding:4px 8px;text-align:left}
    .break{page-break-before:always}</style></head><body>
<h1>${NAME} ${VERSION} 用户手册</h1>
<p class="cover">本手册说明${NAME}的运行环境、安装方法和全部功能的操作步骤。</p>

<h2>1 软件简介</h2>
<p>${NAME}（简称"记账本"，英文名 Ledger）是一款运行在 Android 手机上的个人记账工具。用户可以记录每一笔收入和支出，按月查看收支汇总，用环形图、排行和每日柱状图分析消费结构，并把数据备份到文件或导出为表格。</p>
<p>软件是单机应用：不需要注册登录，安装包中没有网络权限，所有功能在完全断网时都能使用。用户的记录只保存在手机本地，开发者无法访问。</p>
<p>主要功能：</p>
<ul>
<li>记账：支出、收入两种类型，支出 10 个分类，收入 5 个分类，可以填写备注、选择日期；记录可以修改和删除。</li>
<li>明细：按月份查看本月结余、收入、支出，记录按日期分组，显示每天的收支合计。</li>
<li>统计：分类占比环形图、分类排行、每日柱状图，可以切换支出和收入。</li>
<li>数据：备份到文件、从备份文件恢复、导出 CSV 表格。</li>
<li>偏好：界面语言（跟随系统、中文、英文），货币符号（自动或手动选择 9 种）。</li>
<li>隐私：首次启动征求同意，软件内可查看《用户协议》《隐私政策》，可撤回同意。</li>
</ul>

<h2>2 运行环境</h2>
<table><tr><th>项目</th><th>要求</th></tr>
<tr><td>操作系统</td><td>Android 7.0 及以上</td></tr>
<tr><td>硬件</td><td>Android 智能手机，可用存储空间 200 MB 以上</td></tr>
<tr><td>网络</td><td>不需要网络</td></tr>
<tr><td>权限</td><td>不申请网络、存储、相机、位置、通讯录等权限</td></tr></table>

<h2>3 安装和卸载</h2>
<ol><li>在应用市场搜索"记账本"安装，或下载安装包（.apk 文件）后在手机上打开，按系统提示安装。</li>
<li>安装完成后，桌面上出现"记账本"图标（系统语言为英文时显示"Ledger"）。</li>
<li>卸载：在系统设置的应用管理中卸载。卸载会删除手机上的全部记录，卸载前请先备份（见第 7.1 节）。</li></ol>

<h2 class="break">4 首次启动</h2>
<div class="row"><div class="text">
<p>第一次打开软件时，显示欢迎页，说明软件不联网、不收集个人信息，数据只保存在手机上。</p>
<p>操作步骤：</p>
<ol><li>点击《用户协议》或《隐私政策》，可以阅读全文；点击左上角"返回"或按手机返回键，回到欢迎页。</li>
<li>点击"同意并继续"，进入软件首页。</li>
<li>点击"不同意"，软件提示需要同意后才能使用，可以选择"退出应用"或"再看看"。</li></ol>
<p>同意之前，软件不读取任何记账数据。同意的记录保存在手机上，以后打开不再询问；隐私政策有实质变化时会再次询问。</p>
</div>${fig('1-consent', '图 1 首次启动的欢迎页')}</div>

<h2>5 记账</h2>
<div class="row"><div class="text">
<h3>5.1 记一笔</h3>
<ol><li>在"明细"页点击右下角的"+"按钮，打开"记一笔"页面。</li>
<li>在顶部选择"支出"或"收入"。</li>
<li>输入金额。金额要大于 0，最多两位小数。</li>
<li>点击分类图标选择分类。支出分类：餐饮、交通、购物、居住、娱乐、医疗、学习、人情、通讯、其他；收入分类：工资、副业、理财、红包、其他。</li>
<li>日期默认是今天，点击日期两边的箭头可以改到前一天或后一天，不能选择未来的日期。</li>
<li>可以在"添加备注"里填写说明，最多 40 个字。</li>
<li>点击底部的"保存"，回到明细页，新记录出现在对应日期下。</li></ol>
<p>金额格式不对时，软件提示"金额不对"，不会保存。</p>
</div>${fig('3-entry', '图 2 记一笔')}</div>
<h3>5.2 修改和删除记录</h3>
<ol><li>在明细页点击一条记录，打开编辑页面，修改后点击"保存"。</li>
<li>在编辑页面点击右上角的删除图标，确认后删除这条记录。</li>
<li>在明细页长按一条记录，也可以直接删除。</li></ol>

<h2 class="break">6 查看明细和统计</h2>
<div class="row"><div class="text">
<h3>6.1 明细</h3>
<ol><li>明细页顶部显示当前月份，点击左右箭头切换月份。</li>
<li>蓝色卡片显示本月结余（收入减支出）、本月收入和本月支出。</li>
<li>下方的记录按日期分组，"今天""昨天"以外的日期显示为"11月5日 周四"的格式；每组右侧显示当天的支出和收入合计。</li>
<li>每条记录显示分类图标、分类名、备注和金额。支出显示为负数，收入显示为正数。</li></ol>
</div>${fig('2-detail', '图 3 明细页')}</div>
<div class="row"><div class="text">
<h3>6.2 统计</h3>
<ol><li>点击底部的"统计"标签，打开统计页。</li>
<li>在顶部选择"支出"或"收入"，点击箭头切换月份。</li>
<li>环形图显示各分类所占比例，中间显示总金额，下方说明记录笔数和占比最多的分类。</li>
<li>"排行"列出每个分类的金额、百分比和进度条，按金额从高到低排列。</li>
<li>"每日"柱状图显示这个月每天的金额，并标出金额最高的一天。</li></ol>
</div>${fig('4-stats', '图 4 统计页')}</div>

<h2 class="break">7 我的</h2>
<div class="row"><div class="text">
<p>点击底部的"我的"标签打开。页面顶部显示手机上的记录总数，并提示在卸载或换手机前先备份。</p>
<h3>7.1 备份到文件</h3>
<ol><li>点击"备份到文件"。</li>
<li>选择"存到手机文件夹"：在系统文件夹选择器里选一个文件夹（例如"下载"），软件把备份文件存进去。</li>
<li>或选择"分享给其他 App"：在系统分享面板里选择网盘、聊天软件等，把备份文件发出去。</li>
<li>备份文件名的格式是 ledger-backup-年月日-时分.json。</li></ol>
<h3>7.2 从备份恢复</h3>
<ol><li>点击"从备份恢复"，在系统文件选择器里选择备份文件。</li>
<li>软件检查文件，并提示将新增几条记录、跳过几条本机已有的记录。</li>
<li>点击"恢复"完成。恢复只新增记录，不会删除或修改本机已有的记录；同一份备份恢复多次不会产生重复记录。</li>
<li>文件不是本软件的备份、内容损坏或来自更新版本时，软件提示原因，不导入任何记录。</li></ol>
</div>${fig('5-me', '图 5 我的')}</div>
<h3>7.3 导出表格（CSV）</h3>
<ol><li>点击"导出表格（CSV）"，选择存到手机文件夹或分享给其他 App。</li>
<li>表格包含日期、类型、分类、金额、备注五列，按日期从新到旧排列，可以用 Excel、WPS 打开。</li></ol>
<div class="row"><div class="text">
<h3>7.4 偏好设置</h3>
<ol><li>语言：选择"跟随系统""中文"或"English"，界面立即切换。</li>
<li>货币：选择"自动"（跟随手机地区）或手动选择 ¥、$、€、£、HK$、NT$、CA$、A$、S$ 中的一种。货币只改变显示的符号，不换算金额。</li></ol>
<h3>7.5 关于</h3>
<ol><li>版本：显示当前版本号。</li>
<li>隐私政策、用户协议：在软件内打开全文。</li>
<li>源代码：用手机浏览器打开项目主页。</li>
<li>撤回同意：确认后回到首次启动的欢迎页，需要重新同意才能继续使用；手机上的记录不会删除。</li></ol>
</div>${fig('6-me-about', '图 6 偏好和关于')}</div>

<h2>8 常见问题</h2>
<table><tr><th>问题</th><th>解答</th></tr>
<tr><td>换手机后记录还在吗？</td><td>记录只保存在原手机上。请先在原手机上"备份到文件"，把文件传到新手机，再在新手机上"从备份恢复"。</td></tr>
<tr><td>卸载后记录还能找回吗？</td><td>不能。卸载会删除全部记录，开发者也无法找回。请定期备份。</td></tr>
<tr><td>软件需要联网吗？</td><td>不需要。软件没有网络权限，断网时所有功能都能使用。</td></tr>
<tr><td>可以记外币吗？</td><td>可以在"我的 → 偏好 → 货币"里换成需要的货币符号。软件不做汇率换算。</td></tr>
</table>
</body></html>`;
}

async function manualPdf(browser) {
  await screenshots(browser);
  const page = await browser.newPage();
  await page.setContent(manualHtml());
  await preview(page, 'manual');
  const file = path.join(OUT, `${NAME}${VERSION}-用户手册.pdf`);
  await page.pdf({ path: file, format: 'A4', displayHeaderFooter: true, headerTemplate: header, footerTemplate: '<span></span>', margin: { top: '22mm', bottom: '18mm', left: '16mm', right: '16mm' } });
  await page.close();
  return file;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const src = await sourcePdf(browser);
  console.log(`源程序：${path.relative(ROOT, src.file)}，${src.files} 个文件，${src.sourceCount} 行（不含空行），排版后 ${src.printed} 行，共 ${src.total} 页${src.total > 60 ? `，只交前后各 30 页（${src.pages} 页）` : '，全部提交'}`);
  if (process.argv[2] !== 'source-only') console.log(`用户手册：${path.relative(ROOT, await manualPdf(browser))}`);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
