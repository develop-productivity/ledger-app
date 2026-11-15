// 生成商店素材：中英文各 5 张 1080×1920 截图、两张 1024×500 置顶大图、512 图标。
// 用法见 scripts/store/README.md。要先在另一个终端运行 `npx expo start --web --port 8099`。
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/store');
const RAW = path.join(require('os').tmpdir(), 'ledger-store-raw');
const URL = process.env.APP_URL || 'http://localhost:8099';

// 每种语言的设置、截图标题、置顶大图文字
const LANGS = {
  zh: {
    settings: { version: 1, lang: 'zh', currency: 'CNY' },
    tabs: ['明细', '统计', '我的'],
    prevMonth: '上个月',
    add: '记一笔',
    shots: [
      ['1-detail', '随手记一笔', '收入、支出、结余，一眼看清'],
      ['2-stats', '饼图看清钱花在哪', '分类占比和排行，自动统计'],
      ['3-daily', '每天花了多少', '每日柱状图，消费节奏一目了然'],
      ['4-add', '三秒记完一笔', '大号金额，分类图标一点就选'],
      ['5-me', '备份到文件，换手机不丢', '数据只在你手机上，支持导出表格'],
    ],
    feature: ['记账本', '简单 · 离线 · 不收集数据'],
    font: "'PingFang SC','WenQuanYi Micro Hei','Noto Sans CJK SC',sans-serif",
  },
  en: {
    settings: { version: 1, lang: 'en', currency: 'USD' },
    tabs: ['Records', 'Stats', 'Me'],
    prevMonth: 'Previous month',
    add: 'Add record',
    shots: [
      ['1-detail', 'Log in seconds', 'Income, spending and balance at a glance'],
      ['2-stats', 'See where it goes', 'Category breakdown, calculated for you'],
      ['3-daily', 'Track every day', 'A daily chart of your spending rhythm'],
      ['4-add', 'Big, simple input', 'Tap a category and you are done'],
      ['5-me', 'Back up to a file', 'Your data stays on your phone'],
    ],
    feature: ['Ledger', 'Simple · Offline · Private'],
    font: "'Helvetica Neue','DejaVu Sans',sans-serif",
  },
};

// 上个月的完整数据：每天都有记录，统计图才好看。用固定的伪随机数，每次生成结果一样。
function seed() {
  const now = new Date();
  const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const y = pm.getFullYear();
  const m = String(pm.getMonth() + 1).padStart(2, '0');
  const days = new Date(y, pm.getMonth() + 1, 0).getDate();
  let r = 7;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const out = [];
  const add = (type, category, amountCents, note, d) =>
    out.push({ id: 's' + out.length, type, category, amountCents, note, date: `${y}-${m}-${String(d).padStart(2, '0')}`, createdAt: out.length });
  add('income', '工资', 1200000, '', 10);
  add('income', '副业', 180000, '', 18);
  add('income', '理财', 3260, '', 25);
  add('expense', '居住', 180000, '', 1);
  add('expense', '通讯', 5800, '', 5);
  add('expense', '学习', 12800, '', 12);
  add('expense', '人情', 50000, '', 20);
  add('expense', '医疗', 4500, '', 23);
  add('expense', '购物', 19900, '', 15);
  for (let d = 1; d <= days; d++) {
    add('expense', '餐饮', 1500 + Math.round(rnd() * 3000), '', d);
    if (rnd() < 0.6) add('expense', '交通', 400 + Math.round(rnd() * 2000), '', d);
    if (rnd() < 0.25) add('expense', '购物', 2000 + Math.round(rnd() * 15000), '', d);
    if (rnd() < 0.15) add('expense', '娱乐', 3000 + Math.round(rnd() * 8000), '', d);
  }
  return out;
}

const dataUrl = (file, type = 'png') => `data:image/${type};base64,` + fs.readFileSync(file).toString('base64');

async function rawShots(browser, lang, cfg) {
  const dir = path.join(RAW, lang);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 720 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: lang === 'zh' ? 'zh-CN' : 'en-US',
  });
  const p = await ctx.newPage();
  await p.goto(URL);
  await p.evaluate(
    ([entries, settings]) => {
      localStorage.clear();
      localStorage.setItem('ledger.v1', JSON.stringify({ version: 1, entries }));
      localStorage.setItem('ledger.settings.v1', JSON.stringify(settings));
    },
    [seed(), cfg.settings],
  );
  await p.goto(URL);
  await p.waitForTimeout(3000);
  // 去掉浏览器才有的输入框焦点框
  const noFocus = () => p.addStyleTag({ content: '*:focus{outline:none !important}' });
  await noFocus();
  await p.getByLabel(cfg.prevMonth).first().click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(dir, '1-detail.png') });
  await p.getByText(cfg.tabs[1], { exact: true }).last().click();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(dir, '2-stats.png') });
  await p.mouse.move(195, 400);
  await p.mouse.wheel(0, 3000);
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(dir, '3-daily.png') });
  await p.getByText(cfg.tabs[2], { exact: true }).last().click();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(dir, '5-me.png') });
  await p.getByText(cfg.tabs[0], { exact: true }).last().click();
  await p.waitForTimeout(800);
  await p.getByLabel(cfg.add).click();
  await p.waitForTimeout(1500);
  await noFocus();
  await p.keyboard.type('35.8');
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(dir, '4-add.png') });
  await ctx.close();
  return dir;
}

async function compose(browser, lang, cfg, rawDir) {
  const dir = path.join(OUT, 'screenshots', lang);
  fs.mkdirSync(dir, { recursive: true });
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [name, title, sub] of cfg.shots) {
    await p.setContent(`<body style="margin:0;width:1080px;height:1920px;background:linear-gradient(160deg,#5C7CFA,#3B5BDB);font-family:${cfg.font};overflow:hidden">
      <div style="text-align:center;color:#fff;padding-top:110px"><div style="font-size:76px;font-weight:bold">${title}</div>
      <div style="font-size:40px;opacity:.85;margin-top:24px">${sub}</div></div>
      <img src="${dataUrl(path.join(rawDir, name + '.png'))}" style="display:block;width:820px;margin:90px auto 0;border-radius:56px;box-shadow:0 30px 80px rgba(0,0,0,.3);border:14px solid #1C2033"></body>`);
    await p.screenshot({ path: path.join(dir, name + '.jpg'), type: 'jpeg', quality: 88 });
  }
  await p.setViewportSize({ width: 1024, height: 500 });
  await p.setContent(`<body style="margin:0;width:1024px;height:500px;background:linear-gradient(135deg,#5C7CFA,#3B5BDB);font-family:${cfg.font};display:flex;align-items:center;justify-content:center;gap:56px;color:#fff">
    <img src="${dataUrl(path.join(ROOT, 'assets/icon.png'))}" style="width:230px;border-radius:52px;box-shadow:0 20px 50px rgba(0,0,0,.25)">
    <div><div style="font-size:92px;font-weight:bold">${cfg.feature[0]}</div><div style="font-size:38px;margin-top:16px;opacity:.9">${cfg.feature[1]}</div></div></body>`);
  await p.screenshot({ path: path.join(OUT, `feature-graphic-${lang}.jpg`), type: 'jpeg', quality: 90 });
  await p.close();
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const only = process.argv[2];
  for (const [lang, cfg] of Object.entries(LANGS)) {
    if (only && only !== lang) continue;
    const rawDir = await rawShots(browser, lang, cfg);
    await compose(browser, lang, cfg, rawDir);
    console.log(`${lang}: docs/store/screenshots/${lang}/、docs/store/feature-graphic-${lang}.jpg`);
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
