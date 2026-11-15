import { useLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  currencySymbol,
  defaultCurrency,
  DEFAULT_SETTINGS,
  type CurrencyCode,
  type Lang,
  type LangPref,
  type Settings,
} from '@/core/settings';
import { resolveLang, strings, type Strings } from '@/i18n';
import { loadSettings, saveSettings } from '@/services/settings';

interface SettingsState {
  settings: Settings;
  /** 实际使用的界面语言 */
  lang: Lang;
  /** 当前语言的翻译文本 */
  t: Strings;
  /** 实际使用的货币（手动选的，或自动推断的） */
  currency: CurrencyCode;
  symbol: string;
  /** 选"自动"时会用的货币，「我的」页面显示用 */
  autoCurrency: CurrencyCode;
  setLangPref: (lang: LangPref) => void;
  setCurrencyPref: (currency: CurrencyCode | null) => void;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // useLocales 在手机改了系统语言后会重新渲染，App 不用重启
  const locales = useLocales();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => {
      if (!alive) return;
      setSettings(s);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 读完以后才保存，否则默认值会覆盖掉存好的设置
  useEffect(() => {
    if (!loaded) return;
    saveSettings(settings).catch(() => {}); // 偏好没存上不影响记账，下次启动用默认值
  }, [settings, loaded]);

  const update = useCallback((patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch })), []);

  const setLangPref = useCallback((lang: LangPref) => update({ lang }), [update]);
  const setCurrencyPref = useCallback((currency: CurrencyCode | null) => update({ currency }), [update]);

  const value = useMemo(() => {
    const lang = resolveLang(
      settings.lang,
      locales.map((l) => l.languageCode),
    );
    const autoCurrency = defaultCurrency(locales[0]?.currencyCode, lang);
    const currency = settings.currency ?? autoCurrency;
    return {
      settings,
      lang,
      t: strings(lang),
      currency,
      symbol: currencySymbol(currency),
      autoCurrency,
      setLangPref,
      setCurrencyPref,
    };
  }, [settings, locales, setLangPref, setCurrencyPref]);

  // 设置读完前不渲染（只有几毫秒），免得先闪一下系统语言再切到手动选的语言
  if (!loaded) return null;
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings 必须在 SettingsProvider 里使用');
  return ctx;
}
