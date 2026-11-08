import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/ui/theme';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.item, active && styles.active]}>
            <Text style={[styles.text, active && styles.activeText]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.sm, padding: 3 },
  item: { flex: 1, paddingVertical: 7, borderRadius: radius.sm - 2, alignItems: 'center' },
  active: { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  text: { fontSize: 14, color: colors.textSecondary },
  activeText: { color: colors.text, fontWeight: '600' },
});
