import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { monthLabel, shiftMonth, toMonthKey } from '@/core/ledger';
import { colors } from '@/ui/theme';

export function MonthSwitcher({
  month,
  onChange,
  light = false,
}: {
  month: string;
  onChange: (month: string) => void;
  light?: boolean;
}) {
  const atCurrent = month >= toMonthKey(new Date());
  const tint = light ? '#fff' : colors.text;
  return (
    <View style={styles.row}>
      <Pressable hitSlop={12} onPress={() => onChange(shiftMonth(month, -1))} accessibilityLabel="上个月">
        <Ionicons name="chevron-back" size={20} color={tint} />
      </Pressable>
      <Text style={[styles.label, { color: tint }]}>{monthLabel(month)}</Text>
      <Pressable
        hitSlop={12}
        disabled={atCurrent}
        onPress={() => onChange(shiftMonth(month, 1))}
        accessibilityLabel="下个月"
      >
        <Ionicons name="chevron-forward" size={20} color={tint} style={{ opacity: atCurrent ? 0.3 : 1 }} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  label: { fontSize: 17, fontWeight: '600', minWidth: 96, textAlign: 'center' },
});
