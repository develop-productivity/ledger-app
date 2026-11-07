import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryIcon } from '../../components/CategoryIcon';
import { LoadGate } from '../../components/LoadGate';
import { MonthSwitcher } from '../../components/MonthSwitcher';
import { useLedger } from '../../LedgerContext';
import {
  dateLabel,
  entriesOfMonth,
  formatCents,
  groupByDate,
  summarize,
  toDateString,
  type Entry,
} from '../../ledger';
import { colors, numberFont, radius, shadow } from '../../theme';

export default function DetailScreen() {
  return <LoadGate>{(entries) => <Detail entries={entries} />}</LoadGate>;
}

function Detail({ entries }: { entries: Entry[] }) {
  const { month, setMonth, remove } = useLedger();
  const insets = useSafeAreaInsets();
  const today = toDateString(new Date());

  const monthEntries = useMemo(() => entriesOfMonth(entries, month), [entries, month]);
  const sum = useMemo(() => summarize(monthEntries), [monthEntries]);
  const sections = useMemo(
    () =>
      groupByDate(monthEntries).map((g) => ({
        title: g.date,
        totals: summarize(g.items),
        data: g.items,
      })),
    [monthEntries],
  );

  const confirmDelete = (e: Entry) => {
    Alert.alert('删除这条记录？', `${e.category} ${formatCents(e.amountCents)}`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => remove(e.id) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <SectionList
        sections={sections}
        keyExtractor={(e) => e.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
            <MonthSwitcher month={month} onChange={setMonth} light />
            <Text style={styles.heroLabel}>本月结余</Text>
            <Text style={[styles.heroValue, numberFont]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCents(sum.balance)}
            </Text>
            <View style={styles.heroRow}>
              <HeroStat label="收入" value={sum.income} />
              <View style={styles.heroDivider} />
              <HeroStat label="支出" value={sum.expense} />
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionDate}>{dateLabel(section.title, today)}</Text>
            <Text style={[styles.sectionTotals, numberFont]}>
              {section.totals.expense > 0 ? `支 ${formatCents(section.totals.expense)}` : ''}
              {section.totals.expense > 0 && section.totals.income > 0 ? '   ' : ''}
              {section.totals.income > 0 ? `收 ${formatCents(section.totals.income)}` : ''}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/entry', params: { id: item.id } })}
            onLongPress={() => confirmDelete(item)}
            style={({ pressed }) => [
              styles.row,
              index === 0 && styles.rowFirst,
              index === section.data.length - 1 && styles.rowLast,
              pressed && { backgroundColor: colors.bg },
            ]}
          >
            <CategoryIcon type={item.type} name={item.category} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{item.category}</Text>
              {item.note ? (
                <Text style={styles.rowNote} numberOfLines={1}>
                  {item.note}
                </Text>
              ) : null}
            </View>
            <Text
              style={[styles.rowAmount, numberFont, { color: item.type === 'income' ? colors.income : colors.text }]}
            >
              {item.type === 'income' ? '+' : '-'}
              {formatCents(item.amountCents)}
            </Text>
            {index < section.data.length - 1 ? <View style={styles.separator} /> : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>这个月还没有记账</Text>
            <Text style={styles.emptyHint}>点右下角的 + 记第一笔</Text>
          </View>
        }
      />
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}
        onPress={() => router.push('/entry')}
        accessibilityLabel="记一笔"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={[styles.heroStatValue, numberFont]} numberOfLines={1} adjustsFontSizeToFit>
        {formatCents(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    marginBottom: 8,
  },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 20 },
  heroValue: { color: '#fff', fontSize: 36, fontWeight: '700', marginTop: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, alignSelf: 'stretch' },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: 'rgba(255,255,255,0.4)' },
  heroStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  heroStatValue: { color: '#fff', fontSize: 17, fontWeight: '600', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionDate: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  sectionTotals: { fontSize: 12, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  rowFirst: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  rowLast: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, color: colors.text },
  rowNote: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowAmount: { fontSize: 16, fontWeight: '600' },
  separator: {
    position: 'absolute',
    left: 66,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  empty: { alignItems: 'center', marginTop: 64, gap: 8 },
  emptyTitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  emptyHint: { fontSize: 13, color: colors.textMuted },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.25,
    shadowColor: colors.primary,
  },
});
