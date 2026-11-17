import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LegalDoc } from '@/i18n/legal';
import { colors } from '@/ui/theme';

/** 隐私政策、用户协议的全文。同意页和「我的」里的协议页面共用。 */
export function LegalDocument({ doc, bottomInset = 0 }: { doc: LegalDoc; bottomInset?: number }) {
  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bottomInset + 32 }]}>
      <Text style={styles.title}>{doc.title}</Text>
      <Text style={styles.meta}>{doc.meta}</Text>
      {doc.sections.map((s) => (
        <View key={s.heading} style={styles.section}>
          <Text style={styles.heading}>{s.heading}</Text>
          {s.paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

/** 自己画的顶栏：左边返回，中间标题。 */
export function LegalHeader({ title, backLabel, onBack, top }: { title: string; backLabel: string; onBack: () => void; top: number }) {
  return (
    <View style={[styles.header, { paddingTop: top }]}>
      <Text onPress={onBack} accessibilityRole="button" style={styles.back} suppressHighlighting>
        ‹ {backLabel}
      </Text>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.backSpace} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  meta: { marginTop: 6, fontSize: 12, color: colors.textMuted },
  section: { marginTop: 20, gap: 8 },
  heading: { fontSize: 16, fontWeight: '600', color: colors.text },
  paragraph: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  back: { width: 72, fontSize: 16, color: colors.primary },
  backSpace: { width: 72 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: colors.text },
});
