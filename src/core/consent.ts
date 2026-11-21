// 隐私政策同意记录。政策有实质变化时把 POLICY_VERSION 加 1，所有用户下次打开要重新同意。
export const POLICY_VERSION = 1;

export interface ConsentRecord {
  version: 1;
  policyVersion: number;
  acceptedAt: string;
}

export function makeConsent(now: Date, policyVersion = POLICY_VERSION): ConsentRecord {
  return { version: 1, policyVersion, acceptedAt: now.toISOString() };
}

/** 读不懂就当没同意：宁可多问一次，也不能没同意就进入 */
export function parseConsent(raw: string | null): ConsentRecord | null {
  if (raw === null) return null;
  try {
    const d = JSON.parse(raw);
    if (d?.version !== 1 || !Number.isInteger(d.policyVersion) || typeof d.acceptedAt !== 'string') return null;
    return { version: 1, policyVersion: d.policyVersion, acceptedAt: d.acceptedAt };
  } catch {
    return null;
  }
}

export function needsConsent(record: ConsentRecord | null, policyVersion = POLICY_VERSION): boolean {
  return record === null || record.policyVersion < policyVersion;
}
