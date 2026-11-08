// 和系统打交道的部分：写文件、打开分享面板、选文件夹、选文件。格式和合并逻辑在 backup.ts 的纯函数里。
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type ExportOutcome = 'shared' | 'saved' | 'downloaded' | 'canceled' | 'unavailable';

/** 缓存目录里我们生成的文件都以这个开头（见 backup.ts 的文件名） */
const OUR_PREFIX = 'ledger-';

/** 删掉缓存目录里以前生成的备份和导出文件，免得完整账本的副本越积越多 */
function cleanCache() {
  try {
    for (const item of new Directory(Paths.cache).list()) {
      if (item instanceof File && item.name.startsWith(OUR_PREFIX)) item.delete();
    }
  } catch {
    // 清理失败不影响导出
  }
}

function download(name: string, text: string, mimeType: string): ExportOutcome {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

/** 写成文件，交给系统分享面板（网盘、微信、邮件、iOS 的「存储到文件」）。网页预览里改成浏览器下载。 */
export async function shareTextFile(name: string, text: string, mimeType: string): Promise<ExportOutcome> {
  if (Platform.OS === 'web') return download(name, text, mimeType);
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  cleanCache();
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
  return 'shared';
}

/** 只用于 Android：让用户选一个文件夹（如「下载」），直接存进去。有的手机分享面板里没有"存到本机"。 */
export async function saveTextFileToFolder(name: string, text: string, mimeType: string): Promise<ExportOutcome> {
  let dir: Directory;
  try {
    dir = await Directory.pickDirectoryAsync();
  } catch {
    return 'canceled'; // 用户关掉了文件夹选择器
  }
  const file = dir.createFile(name, mimeType);
  await file.write(text);
  return 'saved';
}

/** 让用户选一个文件，读出文本。取消时返回 null。 */
export async function pickTextFile(): Promise<string | null> {
  // 不限类型：从微信、网盘存下来的 .json，系统给的类型常常不是 application/json
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (Platform.OS === 'web') return asset.file ? asset.file.text() : null;
  const copy = new File(asset.uri);
  try {
    return await copy.text();
  } finally {
    try {
      copy.delete(); // 选中时复制进缓存的那一份，读完就删
    } catch {
      // 删除失败不影响恢复
    }
  }
}
