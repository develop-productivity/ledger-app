import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { backupFileName, csvFileName, mergeEntries, parseBackup, toBackupJson, toCsv } from '@/core/backup';
import { LoadGate } from '@/components/LoadGate';
import { choose, confirm, notify } from '@/services/dialog';
import { pickTextFile, saveTextFileToFolder, shareTextFile, type ExportOutcome } from '@/services/exporter';
import { useLedger } from '@/state/LedgerContext';
import type { Entry } from '@/core/ledger';
import { colors, radius, shadow } from '@/ui/theme';

const REPO = 'https://github.com/develop-productivity/ledger-app';
const PRIVACY = `${REPO}/blob/main/PRIVACY.md`;

const PARSE_ERRORS = {
  'not-json': '这不是记账本的备份文件。',
  'bad-format': '文件内容不完整或已损坏，没有导入任何记录。',
  'newer-version': '这份备份来自更新版本的记账本，请先升级 App 再恢复。',
} as const;

export default function MeScreen() {
  return <LoadGate>{(entries) => <Me entries={entries} />}</LoadGate>;
}

type Busy = 'backup' | 'restore' | 'csv' | null;

function Me({ entries }: { entries: Entry[] }) {
  const { mergeIn } = useLedger();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<Busy>(null);

  async function run(kind: Exclude<Busy, null>, task: () => Promise<void>) {
    if (busy) return;
    setBusy(kind);
    try {
      await task();
    } catch {
      notify('操作失败', '请再试一次。');
    } finally {
      setBusy(null);
    }
  }

  function afterExport(outcome: ExportOutcome, name: string) {
    if (outcome === 'unavailable') notify('无法分享', '这台设备不支持系统分享。');
    if (outcome === 'saved') notify('已保存', `文件 ${name} 已存到你选的文件夹。`);
  }

  function exportFile(kind: 'backup' | 'csv') {
    if (entries.length === 0) {
      notify('还没有记录', '记几笔之后再来导出吧。');
      return;
    }
    const now = new Date();
    const [name, text, mime] =
      kind === 'backup'
        ? [backupFileName(now), toBackupJson(entries, now), 'application/json']
        : [csvFileName(now), toCsv(entries), 'text/csv'];
    run(kind, async () => {
      // Android 的分享面板不一定有"存到本机"，所以多给一个"存到手机文件夹"
      const target =
        Platform.OS === 'android'
          ? await choose(kind === 'backup' ? '备份到哪里' : '导出到哪里', '', [
              { key: 'folder', text: '存到手机文件夹' },
              { key: 'share', text: '分享给其他 App' },
            ])
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
        notify('无法恢复', PARSE_ERRORS[parsed.reason]);
        return;
      }
      const preview = mergeEntries(entries, parsed.entries);
      if (preview.added === 0) {
        notify('没有新记录', `备份里的 ${parsed.entries.length} 条记录本机都已经有了。`);
        return;
      }
      const skipped = preview.same + preview.conflicts;
      const ok = await confirm(
        '恢复备份',
        `将新增 ${preview.added} 条记录${skipped ? `，跳过本机已有的 ${skipped} 条` : ''}。\n只新增，不会删除或修改本机的记录。`,
        '恢复',
      );
      if (!ok) return;
      mergeIn(parsed.entries);
      notify('恢复完成', `新增了 ${preview.added} 条记录。`);
    });
  }

  return (
    <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>我的</Text>

      <View style={styles.tip}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <Text style={styles.tipText}>
          数据只存在这台手机上，共 {entries.length} 条记录。卸载 App 或换手机前，先备份到文件。
        </Text>
      </View>

      <Text style={styles.section}>数据</Text>
      <View style={styles.card}>
        <Row
          icon="cloud-upload-outline"
          title="备份到文件"
          desc="存到手机、网盘，或发给自己"
          busy={busy === 'backup'}
          onPress={() => exportFile('backup')}
        />
        <Row
          icon="cloud-download-outline"
          title="从备份恢复"
          desc="选一个备份文件，把记录加回来"
          busy={busy === 'restore'}
          onPress={restore}
        />
        <Row
          icon="grid-outline"
          title="导出表格（CSV）"
          desc="用 Excel、WPS 打开"
          busy={busy === 'csv'}
          onPress={() => exportFile('csv')}
          last
        />
      </View>

      <Text style={styles.section}>关于</Text>
      <View style={styles.card}>
        <Row icon="information-circle-outline" title="版本" value={Constants.expoConfig?.version ?? '-'} />
        <Row icon="document-text-outline" title="隐私政策" onPress={() => Linking.openURL(PRIVACY)} />
        <Row icon="logo-github" title="源代码" onPress={() => Linking.openURL(REPO)} last />
      </View>
    </ScrollView>
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
});
