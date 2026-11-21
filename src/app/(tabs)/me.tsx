import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { backupFileName, csvFileName, mergeEntries, parseBackup, toBackupJson, toCsv } from '@/core/backup';
import { formatCrashReport, type CrashLog } from '@/core/crashlog';
import { LoadGate } from '@/components/LoadGate';
import { Segmented } from '@/components/Segmented';
import { CURRENCIES, currencySymbol, type CurrencyCode, type LangPref } from '@/core/settings';
import { csvLabels } from '@/i18n';
import { clearCrashLogs, loadCrashLogs } from '@/services/crashlog';
import { choose, confirm, notify } from '@/services/dialog';
import { pickTextFile, saveTextFileToFolder, shareTextFile, type ExportOutcome } from '@/services/exporter';
import { useConsent } from '@/state/ConsentContext';
import { useLedger } from '@/state/LedgerContext';
import { useSettings } from '@/state/SettingsContext';
import type { Entry } from '@/core/ledger';
import { colors, radius, shadow } from '@/ui/theme';

const REPO = 'https://github.com/develop-productivity/ledger-app';

export default function MeScreen() {
  return <LoadGate>{(entries) => <Me entries={entries} />}</LoadGate>;
}

type Busy = 'backup' | 'restore' | 'csv' | 'crashlog' | null;

function Me({ entries }: { entries: Entry[] }) {
  const { mergeIn } = useLedger();
  const { lang, t } = useSettings();
  const { withdraw } = useConsent();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<Busy>(null);
  const [crashes, setCrashes] = useState<CrashLog[]>([]);

  // 每次切回这一页都重新读：App 运行中崩溃后，不用重启也能看到新记录
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadCrashLogs().then((logs) => alive && setCrashes(logs));
      return () => {
        alive = false;
      };
    }, []),
  );

  async function run(kind: Exclude<Busy, null>, task: () => Promise<void>) {
    if (busy) return;
    setBusy(kind);
    try {
      await task();
    } catch {
      notify(t.me.failTitle, t.me.failBody);
    } finally {
      setBusy(null);
    }
  }

  function afterExport(outcome: ExportOutcome, name: string) {
    if (outcome === 'unavailable') notify(t.me.shareUnavailableTitle, t.me.shareUnavailableBody);
    if (outcome === 'saved') notify(t.me.savedTitle, t.me.savedBody(name));
  }

  function exportFile(kind: 'backup' | 'csv') {
    if (entries.length === 0) {
      notify(t.me.emptyTitle, t.me.emptyBody);
      return;
    }
    const now = new Date();
    const [name, text, mime] =
      kind === 'backup'
        ? [backupFileName(now), toBackupJson(entries, now), 'application/json']
        : [csvFileName(now), toCsv(entries, csvLabels(lang)), 'text/csv'];
    run(kind, async () => {
      // Android 的分享面板不一定有"存到本机"，所以多给一个"存到手机文件夹"
      const target =
        Platform.OS === 'android'
          ? await choose(
              kind === 'backup' ? t.me.whereBackup : t.me.whereExport,
              '',
              [
                { key: 'folder', text: t.me.toFolder },
                { key: 'share', text: t.me.toShare },
              ],
              t.common.cancel,
            )
          : 'share';
      if (target === null) return;
      const outcome =
        target === 'folder' ? await saveTextFileToFolder(name, text, mime) : await shareTextFile(name, text, mime);
      afterExport(outcome, name);
    });
  }

  function restore() {
    run('restore', async () => {
      const text = await pickTextFile();
      if (text === null) return;
      const parsed = parseBackup(text);
      if (!parsed.ok) {
        notify(t.me.restoreFailTitle, t.me.parseErrors[parsed.reason]);
        return;
      }
      const preview = mergeEntries(entries, parsed.entries);
      if (preview.added === 0) {
        notify(t.me.noNewTitle, t.me.noNewBody(parsed.entries.length));
        return;
      }
      const skipped = preview.same + preview.conflicts;
      const ok = await confirm(t.me.restoreTitle, t.me.restoreBody(preview.added, skipped), {
        ok: t.me.restoreOk,
        cancel: t.common.cancel,
      });
      if (!ok) return;
      mergeIn(parsed.entries);
      notify(t.me.restoreDoneTitle, t.me.restoreDoneBody(preview.added));
    });
  }

  async function confirmWithdraw() {
    const ok = await confirm(t.me.withdrawTitle, t.me.withdrawBody, {
      ok: t.me.withdrawOk,
      cancel: t.common.cancel,
      destructive: true,
    });
    if (ok) await withdraw();
  }

  function diagnosticFile() {
    // 和备份一样：缓存里不留旧副本；网页预览没有文件系统，只返回文本
    const name = 'ledger-diagnostics.txt';
    const text = formatCrashReport(crashes);
    if (Platform.OS !== 'web') {
      const file = new File(Paths.cache, name);
      if (file.exists) file.delete();
      file.create({ overwrite: true });
      file.write(text);
    }
    return { name, text };
  }

  function exportDiagnostics() {
    run('crashlog', async () => {
      const { name, text } = diagnosticFile();
      const target =
        Platform.OS === 'android'
          ? await choose(
              t.me.whereExport,
              '',
              [
                { key: 'folder', text: t.me.toFolder },
                { key: 'share', text: t.me.toShare },
              ],
              t.common.cancel,
            )
          : 'share';
      if (target === null) return;
      const outcome =
        target === 'folder' ? await saveTextFileToFolder(name, text, 'text/plain') : await shareTextFile(name, text, 'text/plain');
      afterExport(outcome, name);
    });
  }

  async function clearDiagnostics() {
    const ok = await confirm(t.me.crashLogClearTitle, t.me.crashLogClearBody, {
      ok: t.me.crashLogClear,
      cancel: t.common.cancel,
      destructive: true,
    });
    if (!ok) return;
    try {
      await clearCrashLogs();
      setCrashes([]);
    } catch {
      notify(t.me.failTitle, t.me.failBody);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{t.me.title}</Text>

      <View style={styles.tip}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <Text style={styles.tipText}>{t.me.tip(entries.length)}</Text>
      </View>

      <Text style={styles.section}>{t.me.sectionData}</Text>
      <View style={styles.card}>
        <Row
          icon="cloud-upload-outline"
          title={t.me.backup}
          desc={t.me.backupDesc}
          busy={busy === 'backup'}
          onPress={() => exportFile('backup')}
        />
        <Row
          icon="cloud-download-outline"
          title={t.me.restore}
          desc={t.me.restoreDesc}
          busy={busy === 'restore'}
          onPress={restore}
        />
        <Row
          icon="grid-outline"
          title={t.me.csv}
          desc={t.me.csvDesc}
          busy={busy === 'csv'}
          onPress={() => exportFile('csv')}
          last
        />
      </View>

      <Text style={styles.section}>{t.me.sectionPrefs}</Text>
      <Prefs />

      <Text style={styles.section}>{t.me.sectionDiagnostics}</Text>
      <View style={styles.card}>
        <Row
          icon={crashes.length ? 'warning-outline' : 'checkmark-circle-outline'}
          title={t.me.crashLog}
          desc={t.me.crashLogDesc}
          value={crashes.length ? t.me.crashLogCount(crashes.length) : t.me.crashLogNone}
          busy={busy === 'crashlog'}
          onPress={exportDiagnostics}
          last={crashes.length === 0}
        />
        {crashes.length > 0 ? (
          <Row
            icon="trash-outline"
            title={t.me.crashLogClear}
            desc={t.me.crashLogClearDesc}
            onPress={clearDiagnostics}
            last
          />
        ) : null}
      </View>

      <Text style={styles.section}>{t.me.sectionAbout}</Text>
      <View style={styles.card}>
        <Row icon="information-circle-outline" title={t.me.version} value={Constants.expoConfig?.version ?? '-'} />
        <Row icon="document-text-outline" title={t.me.privacy} onPress={() => router.push('/legal/privacy')} />
        <Row icon="reader-outline" title={t.me.terms} onPress={() => router.push('/legal/terms')} />
        <Row icon="logo-github" title={t.me.source} onPress={() => Linking.openURL(REPO)} />
        <Row icon="close-circle-outline" title={t.me.withdraw} onPress={confirmWithdraw} last />
      </View>
    </ScrollView>
  );
}

function Prefs() {
  const { settings, t, autoCurrency, setLangPref, setCurrencyPref } = useSettings();
  const chips: { code: CurrencyCode | null; label: string }[] = [
    { code: null, label: t.me.currencyAuto(currencySymbol(autoCurrency)) },
    ...CURRENCIES.map((c) => ({ code: c.code, label: `${c.symbol} ${c.code}` })),
  ];
  return (
    <View style={[styles.card, styles.prefs]}>
      <View style={styles.prefRow}>
        <Text style={styles.prefTitle}>{t.me.language}</Text>
        {/* 语言名用它自己的语言写，切错了也认得出来 */}
        <Segmented<LangPref>
          options={[
            { value: 'system', label: t.me.langSystem },
            { value: 'zh', label: '中文' },
            { value: 'en', label: 'English' },
          ]}
          value={settings.lang}
          onChange={setLangPref}
        />
      </View>
      <View style={styles.prefRow}>
        <Text style={styles.prefTitle}>{t.me.currency}</Text>
        <View style={styles.chips}>
          {chips.map((c) => {
            const active = c.code === settings.currency;
            return (
              <Pressable
                key={c.code ?? 'auto'}
                onPress={() => setCurrencyPref(c.code)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Row(props: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  desc?: string;
  value?: string;
  busy?: boolean;
  last?: boolean;
  onPress?: () => void;
}) {
  const { icon, title, desc, value, busy, last, onPress } = props;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && onPress && styles.pressed]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
      </View>
      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 10, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 6 },
  tip: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 14,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.text },
  section: { marginTop: 12, marginLeft: 4, fontSize: 13, color: colors.textSecondary },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 16, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { opacity: 0.6 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, color: colors.text },
  rowDesc: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  rowValue: { fontSize: 14, color: colors.textSecondary },
  prefs: { paddingVertical: 14, gap: 16 },
  prefRow: { gap: 8 },
  prefTitle: { fontSize: 15, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
});
