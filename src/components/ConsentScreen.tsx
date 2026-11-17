import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegalDocument, LegalHeader } from '@/components/LegalDocument';
import { legalDoc, type LegalDocId } from '@/i18n/legal';
import { choose, notify } from '@/services/dialog';
import { useSettings } from '@/state/SettingsContext';
import { colors, radius } from '@/ui/theme';

/** 首次启动的同意页。用户同意之前，App 不读账本数据，也不显示任何其他页面。 */
export function ConsentScreen({ onAgree }: { onAgree: () => void }) {
  const { lang, t } = useSettings();
  const insets = useSafeAreaInsets();
  const [reading, setReading] = useState<LegalDocId | null>(null);

  // 同意前导航还没挂载，没人处理 Android 返回键：看协议时按返回键，回到同意页，而不是退出 App
  useEffect(() => {
    if (!reading) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setReading(null);
      return true;
    });
    return () => sub.remove();
  }, [reading]);

  // 协议全文在同意页内显示：这时还没同意，不能进入 App 的其他页面
  if (reading) {
    const doc = legalDoc(lang, reading);
    return (
      <View style={styles.page}>
        <LegalHeader title={doc.title} backLabel={t.legal.back} onBack={() => setReading(null)} top={insets.top + 8} />
        <LegalDocument doc={doc} bottomInset={insets.bottom} />
      </View>
    );
  }

  const disagree = async () => {
    if (Platform.OS !== 'android') {
      // iOS 不允许 App 自己退出；网页预览里也只提示
      notify(t.consent.needTitle, t.consent.needBody);
      return;
    }
    const choice = await choose(t.consent.needTitle, t.consent.needBody, [{ key: 'exit', text: t.consent.exit }], t.consent.back);
    if (choice === 'exit') BackHandler.exitApp();
  };

  return (
    <View style={[styles.page, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.logo}>
          <Ionicons name="shield-checkmark" size={44} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t.consent.welcome}</Text>
        <Text style={styles.intro}>{t.consent.intro}</Text>
        <View style={styles.links}>
          <Pressable onPress={() => setReading('terms')} accessibilityRole="link">
            <Text style={styles.link}>{t.consent.terms}</Text>
          </Pressable>
          <Pressable onPress={() => setReading('privacy')} accessibilityRole="link">
            <Text style={styles.link}>{t.consent.privacy}</Text>
          </Pressable>
        </View>
      </ScrollView>
      <View style={styles.buttons}>
        <Pressable style={({ pressed }) => [styles.agree, pressed && { opacity: 0.85 }]} onPress={onAgree}>
          <Text style={styles.agreeText}>{t.consent.agree}</Text>
        </Pressable>
        <Pressable style={styles.disagree} onPress={disagree}>
          <Text style={styles.disagreeText}>{t.consent.disagree}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.card },
  body: { paddingHorizontal: 28, alignItems: 'center' },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  intro: { marginTop: 16, fontSize: 15, lineHeight: 24, color: colors.textSecondary, alignSelf: 'stretch' },
  links: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignSelf: 'stretch' },
  link: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  buttons: { paddingHorizontal: 24, gap: 8 },
  agree: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  agreeText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  disagree: { paddingVertical: 12, alignItems: 'center' },
  disagreeText: { color: colors.textMuted, fontSize: 15 },
});
