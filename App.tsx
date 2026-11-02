import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  CATEGORIES,
  entriesOfMonth,
  formatCents,
  groupByDate,
  newId,
  parseAmount,
  shiftMonth,
  summarize,
  toDateString,
  toMonthKey,
  type Entry,
  type EntryType,
} from './src/ledger';
import { loadEntries, saveEntries } from './src/storage';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <Ledger />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Ledger() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [month, setMonth] = useState(() => toMonthKey(new Date()));

  useEffect(() => {
    loadEntries()
      .then(({ entries, recovered }) => {
        setEntries(entries);
        if (recovered) {
          Alert.alert('数据无法读取', '原数据已备份，账本从空白开始。');
        }
      })
      .catch(() => {
        Alert.alert('读取失败', '请重启 App 再试。');
      });
  }, []);

  // entries 为 null 时还没读完，不能保存，否则会用空列表覆盖已有数据
  useEffect(() => {
    if (entries === null) return;
    saveEntries(entries).catch(() => Alert.alert('保存失败', '这次修改可能没有存下来。'));
  }, [entries]);

  const monthEntries = useMemo(() => entriesOfMonth(entries ?? [], month), [entries, month]);
  const sum = useMemo(() => summarize(monthEntries), [monthEntries]);
  const sections = useMemo(
    () => groupByDate(monthEntries).map((g) => ({ title: g.date, data: g.items })),
    [monthEntries],
  );

  if (entries === null) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  const add = (e: Omit<Entry, 'id' | 'createdAt' | 'date'>) => {
    const now = new Date();
    const entry: Entry = { ...e, id: newId(now.getTime()), createdAt: now.getTime(), date: toDateString(now) };
    setEntries((prev) => [...(prev ?? []), entry]);
    setMonth(toMonthKey(now));
  };

  const confirmDelete = (e: Entry) => {
    Alert.alert('删除这条记录？', `${e.category} ${formatCents(e.amountCents)}`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => setEntries((prev) => (prev ?? []).filter((x) => x.id !== e.id)),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.monthBar}>
        <Pressable hitSlop={12} onPress={() => setMonth((m) => shiftMonth(m, -1))}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{month}</Text>
        <Pressable hitSlop={12} onPress={() => setMonth((m) => shiftMonth(m, 1))}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Stat label="收入" value={sum.income} color={COLORS.income} />
        <Stat label="支出" value={sum.expense} color={COLORS.expense} />
        <Stat label="结余" value={sum.balance} color={COLORS.text} />
      </View>

      <EntryForm onSubmit={add} />

      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => <Text style={styles.dateHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => confirmDelete(item)} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.category}>{item.category}</Text>
              {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            </View>
            <Text style={[styles.amount, { color: item.type === 'income' ? COLORS.income : COLORS.expense }]}>
              {item.type === 'income' ? '+' : '-'}
              {formatCents(item.amountCents)}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>这个月还没有记录</Text>}
      />
    </KeyboardAvoidingView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{formatCents(value)}</Text>
    </View>
  );
}

function EntryForm({ onSubmit }: { onSubmit: (e: Omit<Entry, 'id' | 'createdAt' | 'date'>) => void }) {
  const [type, setType] = useState<EntryType>('expense');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [note, setNote] = useState('');

  const switchType = (t: EntryType) => {
    setType(t);
    setCategory(CATEGORIES[t][0]);
  };

  const submit = () => {
    const amountCents = parseAmount(amountText);
    if (amountCents === null) {
      Alert.alert('金额不对', '请输入大于 0 的数字，最多两位小数。');
      return;
    }
    onSubmit({ type, amountCents, category, note: note.trim() });
    setAmountText('');
    setNote('');
  };

  return (
    <View style={styles.form}>
      <View style={styles.chips}>
        {(['expense', 'income'] as const).map((t) => (
          <Chip key={t} label={t === 'expense' ? '支出' : '收入'} active={type === t} onPress={() => switchType(t)} />
        ))}
      </View>
      <View style={styles.chips}>
        {CATEGORIES[type].map((c) => (
          <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="金额"
          keyboardType="decimal-pad"
          value={amountText}
          onChangeText={setAmountText}
        />
        <TextInput
          style={[styles.input, { flex: 2 }]}
          placeholder="备注（可选）"
          value={note}
          onChangeText={setNote}
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>记一笔</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const COLORS = {
  text: '#1f2328',
  muted: '#6e7781',
  income: '#1a7f37',
  expense: '#cf222e',
  accent: '#0969da',
  border: '#d0d7de',
  bg: '#f6f8fa',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  monthBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingVertical: 12 },
  arrow: { fontSize: 28, color: COLORS.accent, paddingHorizontal: 8 },
  month: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  summary: { flexDirection: 'row', paddingVertical: 12, marginHorizontal: 16, borderRadius: 12, backgroundColor: COLORS.bg },
  statLabel: { fontSize: 12, color: COLORS.muted },
  statValue: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  form: { padding: 16, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { color: COLORS.text },
  chipTextActive: { color: '#fff' },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16 },
  button: { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  dateHeader: { backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingVertical: 4, color: COLORS.muted, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.border },
  category: { fontSize: 16, color: COLORS.text },
  note: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '600' },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
});
