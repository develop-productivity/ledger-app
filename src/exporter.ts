// 和系统打交道的部分：写文件、打开分享面板、选文件。格式和合并逻辑在 backup.ts 的纯函数里。
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type ShareOutcome = 'shared' | 'downloaded' | 'unavailable';

/** 把文本写成文件，交给系统分享面板；网页预览里改成浏览器下载。 */
export async function shareTextFile(name: string, text: string, mimeType: string): Promise<ShareOutcome> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'downloaded';
  }
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
  return 'shared';
}

/** 让用户选一个文件，读出文本。取消时返回 null。 */
export async function pickTextFile(): Promise<string | null> {
  // 不限类型：从微信、网盘存下来的 .json，系统给的类型常常不是 application/json
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (Platform.OS === 'web') return asset.file ? asset.file.text() : null;
  return new File(asset.uri).text();
}
