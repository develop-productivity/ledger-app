import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LedgerProvider } from '../LedgerContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
