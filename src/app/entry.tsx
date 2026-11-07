import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryIcon } from '../components/CategoryIcon';
import { LoadGate } from '../components/LoadGate';
import { Segmented } from '../components/Segmented';
import { useLedger } from '../LedgerContext';
import {
  addDays,
  CATEGORIES,
  centsToInput,
  dateLabel,
  formatCents,
  newId,
  parseAmount,
  toDateString,
  type Entry,
  type EntryType,
} from '../ledger';
import { colors, numberFont, radius } from '../theme';

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <LoadGate>
      {(entries) => {
        const existing = id ? entries.find((e) => e.id === id) : undefined;
        if (id && !existing) {
          return (
            <View style={{ flex: 1 }}>
              <EntryHeader title="编辑" />
              <View style={styles.missing}>
                <Text style={styles.missingText}>这条记录已经不存在了</Text>
              </View>
            </View>
          );
        }
        return <EntryForm existing={existing} />;
      }}
    </LoadGate>
  );
}

// 自己画顶栏：各平台原生导航头对 headerLeft 的处理不一致，Web 上会被忽略
function EntryHeader({ title, onDelete }: { title: string; onDelete?: () => void }) {
  const insets = useSafeAreaInsets();
  // iOS 的 modal 是卡片式，不盖住状态栏，不需要再让出顶部安全区
  const top = Platform.OS === 'ios' ? 8 : insets.top + 8;
  return (
    <View style={[styles.header, { paddingTop: top }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="关闭" style={styles.headerSide}>
        <Ionicons name="close" size={26} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
        {onDelete ? (
          <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel="删除">
            <Ionicons name="trash-outline" size={22} color={colors.expense} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function EntryForm({ existing }: { existing?: Entry }) {
  const { save, remove } = useLedger();
  const insets = useSafeAreaInsets();
  const today = toDateString(new Date());

  const [type, setType] = useState<EntryType>(existing?.type ?? 'expense');
  const [amountText, setAmountText] = useState(existing ? centsToInput(existing.amountCents) : '');
  const [category, setCategory] = useState(existing?.category ?? CATEGORIES.expense[0]);
  const [date, setDate] = useState(existing?.date ?? today);
  const [note, setNote] = useState(existing?.note ?? '');
  const amountRef = useRef<ComponentRef<typeof TextInput>>(null);

  // 等弹窗动画结束再聚焦：动画中途聚焦，安卓上键盘可能弹不出来，Web 上页面会错位
  useEffect(() => {
    if (existing) return;
    const t = setTimeout(() => amountRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, [existing]);

  const switchType = (t: EntryType) => {
    setType(t);
    if (!CATEGORIES[t].includes(category)) setCategory(CATEGORIES[t][0]);
  };

  const submit = () => {
    const amountCents = parseAmount(amountText);
    if (amountCents === null) {
      Alert.alert('金额不对', '请输入大于 0 的数字，最多两位小数。');
      return;
    }
    const now = Date.now();
    save({
      id: existing?.id ?? newId(now),
      createdAt: existing?.createdAt ?? now,
      type,
      amountCents,
      category,
      date,
      note: note.trim(),
    });
    router.back();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('删除这条记录？', `${existing.category} ${formatCents(existing.amountCents)}`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          remove(existing.id);
          router.back();
        },
      },
    ]);
  };

  const accent = type === 'income' ? colors.income : colors.expense;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <EntryHeader title={existing ? '编辑' : '记一笔'} onDelete={existing ? confirmDelete : undefined} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Segmented
          options={[
            { value: 'expense', label: '支出' },
            { value: 'income', label: '收入' },
          ]}
          value={type}
          onChange={switchType}
        />

        <View style={[styles.amountBox, { borderColor: accent }]}>
          <Text style={[styles.currency, { color: accent }]}>¥</Text>
          <TextInput
            ref={amountRef}
            style={[styles.amountInput, numberFont, { color: accent }]}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={amountText}
            onChangeText={setAmountText}
            maxLength={12}
          />
        </View>

        <View style={styles.grid}>
          {CATEGORIES[type].map((c) => {
            const active = c === category;
            return (
              <Pressable key={c} style={styles.gridItem} onPress={() => setCategory(c)}>
                <CategoryIcon type={type} name={c} size={46} active={active} />
                <Text style={[styles.gridLabel, active && { color: colors.text, fontWeight: '600' }]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.field}>
          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.fieldLabel}>日期</Text>
          <View style={styles.dateStepper}>
            <Pressable hitSlop={10} onPress={() => setDate((d) => addDays(d, -1))} accessibilityLabel="前一天">
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
            </Pressable>
            <Text style={styles.dateText}>{dateLabel(date, today)}</Text>
            <Pressable
              hitSlop={10}
              disabled={date >= today}
              onPress={() => setDate((d) => addDays(d, 1))}
              accessibilityLabel="后一天"
            >
              <Ionicons name="chevron-forward" size={18} color={colors.primary} style={{ opacity: date >= today ? 0.3 : 1 }} />
            </Pressable>
          </View>
        </View>

        <View style={styles.field}>
          <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.noteInput}
            placeholder="添加备注"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.saveButton, { backgroundColor: accent }, pressed && { opacity: 0.85 }]}
          onPress={submit}
        >
          <Text style={styles.saveText}>保存</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  headerSide: { width: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: colors.text },
  body: { padding: 20, gap: 20 },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingBottom: 6,
  },
  currency: { fontSize: 28, fontWeight: '600', marginRight: 8 },
  amountInput: { flex: 1, minWidth: 0, fontSize: 40, fontWeight: '700', paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  gridItem: { width: '20%', alignItems: 'center', gap: 6 },
  gridLabel: { fontSize: 12, color: colors.textSecondary },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  fieldLabel: { fontSize: 15, color: colors.text, flex: 1 },
  dateStepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateText: { fontSize: 15, color: colors.text, minWidth: 92, textAlign: 'center' },
  noteInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.card },
  saveButton: { borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { color: colors.textSecondary },
});
