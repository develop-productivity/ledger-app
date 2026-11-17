// App 内显示的隐私政策和用户协议。和根目录的 PRIVACY.md、TERMS.md 内容保持一致，两处一起改。
// 政策有实质变化时，同时把 src/core/consent.ts 的 POLICY_VERSION 加 1。
import type { Lang } from '@/core/settings';

// ⚠️ 上架国内商店前必须改成能联系到开发者的邮箱（GitHub 在国内经常打不开）。由用户决定填哪个。
export const CONTACT = 'https://github.com/develop-productivity/ledger-app/issues';
export const UPDATED = '2026-11-17';

export type LegalDocId = 'privacy' | 'terms';

export interface LegalDoc {
  title: string;
  meta: string;
  sections: { heading: string; paragraphs: string[] }[];
}

const zhPrivacy: LegalDoc = {
  title: '隐私政策',
  meta: `更新日期：${UPDATED}　生效日期：${UPDATED}`,
  sections: [
    {
      heading: '一、适用范围',
      paragraphs: [
        '本政策适用于"记账本"App（英文名 Ledger，包名 com.developproductivity.ledger）。本 App 由个人开发者独立开发和维护（以下简称"开发者"或"我们"）。',
        '请你在使用前仔细阅读本政策。你点击"同意并继续"，即表示你已阅读并同意本政策。',
      ],
    },
    {
      heading: '二、我们不收集任何个人信息',
      paragraphs: [
        '本 App 不需要注册或登录，不收集、不使用、不向任何人提供你的个人信息。',
        '本 App 不读取你的通讯录、位置、相册、短信、通话记录，也不读取设备标识符（如 IMEI、Android ID、MAC 地址、OAID）。',
      ],
    },
    {
      heading: '三、你记录的数据只保存在你的手机上',
      paragraphs: [
        '你记录的金额、分类、备注、日期，以及语言、货币偏好和本政策的同意记录，只保存在本机的应用存储中，不会上传到任何服务器。开发者无法看到这些数据。',
        '本 App 关闭了 Android 系统的自动备份，你的数据不会被系统备份到云端。',
      ],
    },
    {
      heading: '四、网络',
      paragraphs: [
        '本 App 是单机应用：安装包中已经移除了网络权限，App 无法发送任何网络请求，所有功能在完全断网时都能正常使用。',
        '只有当你在"我的"页面点击"源代码"时，才会用你手机上的浏览器打开网页；之后的访问由浏览器和网站负责，不在本政策范围内。',
      ],
    },
    {
      heading: '五、系统权限',
      paragraphs: [
        '振动权限（VIBRATE）：由应用框架默认声明，本 App 不主动使用。',
        '应用内部权限（com.developproductivity.ledger.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION）：由 AndroidX 组件自动声明，只用于 App 内部的组件通信，其他 App 无法使用，不涉及个人信息。',
        '本 App 不申请网络、存储、相机、位置、通讯录等权限。备份、恢复时使用系统自带的文件选择器和分享面板，由你选择文件和位置，App 无法访问你选择范围以外的文件。',
      ],
    },
    {
      heading: '六、第三方组件（SDK）',
      paragraphs: [
        '本 App 使用以下开源组件，它们都在你的手机本地运行，不收集、不上传任何个人信息：',
        '· React Native、React（Meta Platforms, Inc.）：界面框架。',
        '· react-native-screens、react-native-safe-area-context（Software Mansion、Th3rdwave）：页面切换和避开刘海屏。',
        '· react-native-svg（开源社区）：绘制统计图表。',
        '· Expo 及其官方模块（650 Industries, Inc.）：expo-file-system 读写备份文件；expo-sharing 调用系统分享面板；expo-document-picker 调用系统文件选择器；expo-localization 读取系统语言和地区，用于显示对应的语言和货币符号；expo-router、expo-linking 负责页面导航和在浏览器中打开网页；expo-splash-screen、expo-status-bar、expo-font、@expo/vector-icons、expo-constants 用于启动图、状态栏、图标字体和显示版本号。',
        '· AsyncStorage（React Native 社区）：在本机保存你的记录和设置。',
      ],
    },
    {
      heading: '七、备份和导出',
      paragraphs: [
        '只有你点击"备份到文件"或"导出表格"时，App 才会生成文件，并保存到你选择的文件夹，或交给你在分享面板中选择的 App（如网盘、聊天软件）。文件保存在哪里、发给谁，由你决定，开发者收不到这些文件。',
      ],
    },
    {
      heading: '八、你的权利',
      paragraphs: [
        '查看和修改：你可以在 App 内随时查看、修改、删除每一条记录。',
        '导出：你可以在"我的"页面导出全部记录。',
        '删除全部数据：卸载 App，或在系统设置中清除 App 数据，会永久删除全部记录。',
        '撤回同意：你可以在"我的"→"撤回同意"中撤回对本政策的同意。撤回后需要重新同意才能继续使用，本机记录不会被删除。',
      ],
    },
    {
      heading: '九、未成年人',
      paragraphs: ['本 App 不面向 14 周岁以下的未成年人，也不收集未成年人的个人信息。'],
    },
    {
      heading: '十、政策更新',
      paragraphs: ['本政策有实质变化时，我们会更新本页面和更新日期，并在你下次打开 App 时重新征求你的同意。'],
    },
    {
      heading: '十一、联系我们',
      paragraphs: [`如对本政策有任何疑问，请通过以下方式联系开发者：${CONTACT}`],
    },
  ],
};

const zhTerms: LegalDoc = {
  title: '用户协议',
  meta: `更新日期：${UPDATED}　生效日期：${UPDATED}`,
  sections: [
    {
      heading: '一、服务内容',
      paragraphs: ['"记账本"是一款免费的本地记账工具，提供记账、统计、备份恢复和导出功能。本 App 不需要注册，不联网，不含广告和付费内容。'],
    },
    {
      heading: '二、使用规则',
      paragraphs: ['你应当遵守法律法规使用本 App，不得用于任何违法用途。'],
    },
    {
      heading: '三、数据和备份',
      paragraphs: [
        '你的记录只保存在你的手机上。设备损坏、丢失、卸载 App 或清除 App 数据都可能导致记录丢失，请定期使用"备份到文件"自行备份。',
        '开发者无法访问你的数据，也无法帮你找回丢失的记录。',
      ],
    },
    {
      heading: '四、免责声明',
      paragraphs: [
        '本 App 按"现状"提供。统计结果仅供个人参考，不构成任何财务、税务或投资建议。',
        '在法律允许的范围内，开发者不对因使用或无法使用本 App 造成的数据丢失或其他损失承担责任。',
      ],
    },
    {
      heading: '五、知识产权',
      paragraphs: ['本 App 的软件著作权归开发者所有。'],
    },
    {
      heading: '六、协议变更和联系方式',
      paragraphs: [
        '本协议有变化时，我们会更新本页面和更新日期。',
        `如有疑问，请联系开发者：${CONTACT}`,
      ],
    },
  ],
};

const enPrivacy: LegalDoc = {
  title: 'Privacy Policy',
  meta: `Updated ${UPDATED} · Effective ${UPDATED}`,
  sections: [
    {
      heading: '1. Scope',
      paragraphs: [
        'This policy applies to the Ledger app ("记账本", package com.developproductivity.ledger), developed and maintained by an independent developer ("we").',
        'By tapping "Agree and continue", you confirm that you have read and agree to this policy.',
      ],
    },
    {
      heading: '2. We collect no personal data',
      paragraphs: [
        'The app needs no account or sign-in. It does not collect, use or share any personal data.',
        'It does not access your contacts, location, photos, messages or call logs, and it does not read device identifiers (such as IMEI, Android ID, MAC address or OAID).',
      ],
    },
    {
      heading: '3. Your records stay on your phone',
      paragraphs: [
        'The amounts, categories, notes and dates you enter, your language and currency preferences, and your consent record are stored only in the app\'s local storage. They are never uploaded to any server, and the developer cannot see them.',
        'Android system auto-backup is turned off for this app, so your data is not backed up to the cloud by the system.',
      ],
    },
    {
      heading: '4. Network',
      paragraphs: [
        'Ledger is an offline app: the network permission is removed from the installation package, so the app cannot make any network request. Every feature works with no connection at all.',
        'Only when you tap "Source code" on the Me page does the app open a web page in your browser. What happens after that is handled by your browser and the website and is outside this policy.',
      ],
    },
    {
      heading: '5. System permissions',
      paragraphs: [
        'Vibrate (VIBRATE): declared by default by the app framework; the app does not actively use it.',
        'Internal permission (com.developproductivity.ledger.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION): declared automatically by AndroidX for communication between the app\'s own components. Other apps cannot use it, and it involves no personal data.',
        'The app does not request network, storage, camera, location or contacts permissions. Backup and restore use the system file picker and share sheet: you choose the files and locations, and the app cannot access anything else.',
      ],
    },
    {
      heading: '6. Third-party components (SDKs)',
      paragraphs: [
        'The app uses the following open-source components. They run locally on your phone and collect or upload no personal data:',
        '· React Native and React (Meta Platforms, Inc.): UI framework.',
        '· react-native-screens and react-native-safe-area-context (Software Mansion, Th3rdwave): screen transitions and safe areas.',
        '· react-native-svg (open-source community): drawing charts.',
        '· Expo and its official modules (650 Industries, Inc.): expo-file-system reads and writes backup files; expo-sharing opens the system share sheet; expo-document-picker opens the system file picker; expo-localization reads the system language and region to show the matching language and currency symbol; expo-router and expo-linking handle navigation and opening web pages in the browser; expo-splash-screen, expo-status-bar, expo-font, @expo/vector-icons and expo-constants provide the splash screen, status bar, icon fonts and version number.',
        '· AsyncStorage (React Native community): stores your records and settings on the device.',
      ],
    },
    {
      heading: '7. Backup and export',
      paragraphs: [
        'A file is created only when you tap "Back up to a file" or "Export spreadsheet (CSV)". It is saved to the folder you choose, or handed to the app you pick in the share sheet. You decide where it goes; the developer never receives it.',
      ],
    },
    {
      heading: '8. Your rights',
      paragraphs: [
        'View and edit: you can view, edit or delete any record in the app at any time.',
        'Export: you can export all records from the Me page.',
        'Delete everything: uninstalling the app, or clearing its data in system settings, permanently deletes all records.',
        'Withdraw consent: go to Me → "Withdraw consent". You will need to agree again to keep using the app; your records are not deleted.',
      ],
    },
    {
      heading: '9. Children',
      paragraphs: ['The app is not directed at children under 14 and collects no data from them.'],
    },
    {
      heading: '10. Changes',
      paragraphs: ['If this policy changes materially, we will update this page and the date above, and ask for your consent again the next time you open the app.'],
    },
    {
      heading: '11. Contact',
      paragraphs: [`Questions about this policy: ${CONTACT}`],
    },
  ],
};

const enTerms: LegalDoc = {
  title: 'Terms of Use',
  meta: `Updated ${UPDATED} · Effective ${UPDATED}`,
  sections: [
    {
      heading: '1. The service',
      paragraphs: ['Ledger is a free, local expense-tracking tool with records, charts, backup, restore and export. It needs no account, makes no network requests, and has no ads or paid content.'],
    },
    {
      heading: '2. Acceptable use',
      paragraphs: ['You must use the app in compliance with applicable laws.'],
    },
    {
      heading: '3. Your data and backups',
      paragraphs: [
        'Your records are stored only on your phone. A damaged or lost device, uninstalling the app or clearing its data can delete them. Please back up regularly with "Back up to a file".',
        'The developer cannot access your data and cannot recover lost records.',
      ],
    },
    {
      heading: '4. Disclaimer',
      paragraphs: [
        'The app is provided "as is". Its statistics are for personal reference only and are not financial, tax or investment advice.',
        'To the extent permitted by law, the developer is not liable for data loss or other damages caused by using or being unable to use the app.',
      ],
    },
    {
      heading: '5. Intellectual property',
      paragraphs: ['The copyright of the app belongs to the developer.'],
    },
    {
      heading: '6. Changes and contact',
      paragraphs: ['If these terms change, we will update this page and the date above.', `Questions: ${CONTACT}`],
    },
  ],
};

const DOCS: Record<Lang, Record<LegalDocId, LegalDoc>> = {
  zh: { privacy: zhPrivacy, terms: zhTerms },
  en: { privacy: enPrivacy, terms: enTerms },
};

export function legalDoc(lang: Lang, id: LegalDocId): LegalDoc {
  return DOCS[lang][id];
}

/** 生成根目录的 PRIVACY.md、TERMS.md（中英双语）。单测会检查文件和这里一致。 */
export function legalMarkdown(id: LegalDocId): string {
  const zh = DOCS.zh[id];
  const en = DOCS.en[id];
  const part = (doc: LegalDoc) =>
    [`## ${doc.title}`, '', doc.meta, '', ...doc.sections.flatMap((s) => [`### ${s.heading}`, '', ...s.paragraphs.flatMap((p) => [p, ''])])].join('\n');
  return [
    `# ${zh.title} / ${en.title}`,
    '',
    '<!-- 由 src/i18n/legal.ts 生成，不要手改。改 legal.ts 后运行：UPDATE_LEGAL=1 npx jest tests/i18n/legal.test.ts -->',
    '',
    part(zh),
    part(en),
  ].join('\n').trimEnd() + '\n';
}

export function isLegalDocId(x: unknown): x is LegalDocId {
  return x === 'privacy' || x === 'terms';
}
