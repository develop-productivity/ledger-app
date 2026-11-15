import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LedgerProvider } from '@/state/LedgerContext';
import { SettingsProvider } from '@/state/SettingsContext';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <LedgerProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="entry"
              options={{
                presentation: 'modal',
                headerShown: false,
                contentStyle: { backgroundColor: colors.card },
              }}
            />
          </Stack>
        </LedgerProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
