import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { installCrashHandler } from '@/services/crashlog';
import { ConsentProvider } from '@/state/ConsentContext';
import { LedgerProvider } from '@/state/LedgerContext';
import { SettingsProvider } from '@/state/SettingsContext';
import { colors } from '@/ui/theme';

// 越早注册越好：启动阶段的错误也能记下来。日志只存本机，不联网。
installCrashHandler();

// 顺序有讲究：设置（界面语言）→ 同意页 → 账本数据。没同意之前不读账本数据。
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SettingsProvider>
        <ConsentProvider>
          <LedgerProvider>
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
              <Stack.Screen name="legal/[doc]" options={{ headerShown: false }} />
            </Stack>
          </LedgerProvider>
        </ConsentProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
