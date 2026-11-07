import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { breakdown, dailyTotals } from '../../chart';
import { categoryMeta } from '../../categories';
import { CategoryIcon } from '../../components/CategoryIcon';
import { DonutChart } from '../../components/DonutChart';
import { LoadGate } from '../../components/LoadGate';
import { MonthSwitcher } from '../../components/MonthSwitcher';
import { Segmented } from '../../components/Segmented';
import { useLedger } from '../../LedgerContext';
import { entriesOfMonth, formatCents, toDateString, type Entry, type EntryType } from '../../ledger';
import { colors, numberFont, radius, shadow } from '../../theme';

export default function StatsScreen() {
  return <LoadGate>{(entries) => <Stats entries={entries} />}</LoadGate>;
}

function Stats({ entries }: { entries: Entry[] }) {
  const { month, setMonth } = useLedger();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<EntryType>('expense');

  const monthEntries = useMemo(() => entriesOfMonth(entries, month), [entries, month]);
  const slices = useMemo(() => breakdown(monthEntries, type), [monthEntries, type]);
  const days = useMemo(() => dailyTotals(monthEntries, month, type), [monthEntries, month, type]);
  const total = slices.reduce((s, x) => s + x.cents, 0);
  const label = type === 'expense' ? '支出' : '收入';

  return (
    <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>统计</Text>
        <MonthSwitcher month={month} onChange={setMonth} />
      </View>
      <Segmented
        options={[
          { value: 'expense', label: '支出' },
          { value: 'income', label: '收入' },
        ]}
        value={type}
        onChange={setType}
      />

      {total === 0 ? (
        <View style={[styles.card, styles.empty]}>
          <Ionicons name="pie-chart-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>这个月没有{label}记录</Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, { alignItems: 'center' }]}>
            <DonutChart
              data={slices.map((s) => ({ ratio: s.ratio, color: categoryMeta(type, s.category).color }))}
              title={`总${label}`}
              value={formatCents(total)}
            />
            <Text style={styles.caption}>
              共 {monthEntries.filter((e) => e.type === type).length} 笔，最多的是「{slices[0].category}」
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{label}排行</Text>
            {slices.map((s) => {
              const { color } = categoryMeta(type, s.category);
              return (
                <View key={s.category} style={styles.rankRow}>
                  <CategoryIcon type={type} name={s.category} size={34} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={styles.rankLine}>
                      <Text style={styles.rankName}>
                        {s.category}
                        <Text style={styles.rankPct}>  {(s.ratio * 100).toFixed(1)}%</Text>
                      </Text>
                      <Text style={[styles.rankAmount, numberFont]}>{formatCents(s.cents)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${s.ratio * 100}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>每日{label}</Text>
            <DailyBars days={days} month={month} color={type === 'expense' ? colors.expense : colors.income} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function DailyBars({ days, month, color }: { days: number[]; month: string; color: string }) {
  const max = Math.max(...days, 1);
  const today = toDateString(new Date());
  const ticks = [1, 10, 20, days.length];
  return (
    <View>
      <View style={styles.bars}>
        {days.map((v, i) => {
          const isToday = `${month}-${String(i + 1).padStart(2, '0')}` === today;
          return (
            <View key={i} style={styles.barCol}>
              <View
                style={{
                  height: v === 0 ? 2 : Math.max((v / max) * 100, 4),
                  borderRadius: 2,
                  backgroundColor: v === 0 ? colors.border : color,
                  opacity: isToday || v === 0 ? 1 : 0.75,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.ticks}>
        {ticks.map((d) => (
          <Text
            key={d}
            style={[styles.tick, { left: `${((d - 0.5) / days.length) * 100}%` }]}
          >
            {d}
          </Text>
        ))}
      </View>
      <Text style={styles.barMax}>最高一天 {formatCents(max)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, ...shadow },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12 },
  caption: { marginTop: 14, fontSize: 13, color: colors.textSecondary },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rankLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rankName: { fontSize: 14, color: colors.text },
  rankPct: { fontSize: 12, color: colors.textMuted },
  rankAmount: { fontSize: 14, fontWeight: '600', color: colors.text },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.bg, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 104, gap: 2 },
  barCol: { flex: 1, justifyContent: 'flex-end' },
  ticks: { height: 14, marginTop: 6 },
  tick: { position: 'absolute', width: 24, marginLeft: -12, fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  barMax: { marginTop: 8, fontSize: 12, color: colors.textMuted },
});
