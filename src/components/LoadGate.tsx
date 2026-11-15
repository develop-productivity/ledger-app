import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLedger } from '@/state/LedgerContext';
import { useSettings } from '@/state/SettingsContext';
import type { Entry } from '@/core/ledger';
import { colors, radius } from '@/ui/theme';

export function LoadGate({ children }: { children: (entries: Entry[]) => ReactNode }) {
  const { entries, loadFailed, reload } = useLedger();
  const { t } = useSettings();
  if (loadFailed) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{t.load.failed}</Text>
        <Pressable style={styles.button} onPress={reload}>
          <Text style={styles.buttonText}>{t.load.retry}</Text>
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
