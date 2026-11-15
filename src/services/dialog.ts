// 弹窗：手机上用系统 Alert；网页预览里 Alert 不显示，改用浏览器自带的弹窗。按钮文字由调用方按语言传入。
import { Alert, Platform } from 'react-native';

export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export function confirm(
  title: string,
  message: string,
  buttons: { ok: string; cancel: string; destructive?: boolean },
): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: buttons.cancel, style: 'cancel', onPress: () => resolve(false) },
        { text: buttons.ok, style: buttons.destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}

/** 让用户在几个选项里选一个，取消时返回 null。只在手机上用（网页预览不需要选）。 */
export function choose<K extends string>(
  title: string,
  message: string,
  options: { key: K; text: string }[],
  cancelText: string,
): Promise<K | null> {
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        ...options.map((o) => ({ text: o.text, onPress: () => resolve(o.key) })),
        { text: cancelText, style: 'cancel' as const, onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    ),
  );
}
