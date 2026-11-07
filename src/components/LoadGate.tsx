import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLedger } from '../LedgerContext';
import type { Entry } from '../ledger';
import { colors, radius } from '../theme';

export function LoadGate({ children }: { children: (entries: Entry[]) => ReactNode }) {
  const { entries, loadFailed, reload } = useLedger();
  if (loadFailed) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>读取失败</Text>
        <Pressable style={styles.button} onPress={reload}>
          <Text style={styles.buttonText}>重试</Text>
        </Pressable>
      </View>
    );
  }
  if (entries === null) return <ActivityIndicator style={styles.center} color={colors.primary} />;
  return <>{children(entries)}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  text: { color: colors.textSecondary, fontSize: 15 },
  button: { marginTop: 16, backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 24, paddingVertical: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
