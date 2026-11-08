import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { donutSegments } from '@/core/chart';
import { colors, numberFont } from '@/ui/theme';

export function DonutChart({
  data,
  size = 200,
  stroke = 26,
  title,
  value,
}: {
  data: { ratio: number; color: string }[];
  size?: number;
  stroke?: number;
  title: string;
  value: string;
}) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const segments = donutSegments(
    data.map((d) => d.ratio),
    r,
    2,
  );
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke={colors.bg} strokeWidth={stroke} fill="none" />
        {segments.map((s, i) => (
          <Circle
            key={i}
            cx={c}
            cy={c}
            r={r}
            stroke={data[i].color}
            strokeWidth={stroke}
            strokeDasharray={s.dashArray}
            strokeDashoffset={s.dashOffset}
            fill="none"
            transform={`rotate(-90 ${c} ${c})`}
          />
        ))}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, numberFont]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  title: { fontSize: 13, color: colors.textSecondary },
  value: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4 },
});
