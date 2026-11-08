// 弹窗：手机上用系统 Alert；网页预览里 Alert 不显示，改用浏览器自带的弹窗
import { Alert, Platform } from 'react-native';

export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export function confirm(title: string, message: string, okText: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: '取消', style: 'cancel', onPress: () => resolve(false) },
      { text: okText, onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}

/** 让用户在几个选项里选一个，取消时返回 null。只在手机上用（网页预览不需要选）。 */
export function choose<K extends string>(
  title: string,
  message: string,
  options: { key: K; text: string }[],
): Promise<K | null> {
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        ...options.map((o) => ({ text: o.text, onPress: () => resolve(o.key) })),
        { text: '取消', style: 'cancel' as const, onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    ),
  );
}
