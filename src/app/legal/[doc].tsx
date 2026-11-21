import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegalDocument, LegalHeader } from '@/components/LegalDocument';
import { isLegalDocId, legalDoc } from '@/i18n/legal';
import { useSettings } from '@/state/SettingsContext';
import { colors } from '@/ui/theme';

/** 「我的」里打开的隐私政策、用户协议：/legal/privacy、/legal/terms */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const { lang, t } = useSettings();
  const insets = useSafeAreaInsets();
  const d = legalDoc(lang, isLegalDocId(doc) ? doc : 'privacy');
  const back = () => (router.canGoBack() ? router.back() : router.replace('/me'));
  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <LegalHeader title={d.title} backLabel={t.legal.back} onBack={back} top={insets.top + 8} />
      <LegalDocument doc={d} bottomInset={insets.bottom} />
    </View>
  );
}
