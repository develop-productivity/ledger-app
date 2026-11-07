import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { categoryMeta } from '../categories';
import type { EntryType } from '../ledger';
import { colors } from '../theme';

export function CategoryIcon({
  type,
  name,
  size = 40,
  active = true,
}: {
  type: EntryType;
  name: string;
  size?: number;
  active?: boolean;
}) {
  const { icon, color } = categoryMeta(type, name);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? color : colors.bg,
      }}
    >
      <Ionicons name={icon} size={size * 0.5} color={active ? '#fff' : colors.textSecondary} />
    </View>
  );
}
