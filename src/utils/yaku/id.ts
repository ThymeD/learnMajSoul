const LEGACY_YAKU_ID_MAP: Record<string, string> = {
  'yakuhai-自风': 'yakuhai-jikaze',
  'yakuhai-场风': 'yakuhai-bakaze'
}

/**
 * 统一役种 ID，兼容历史命名
 */
export function normalizeYakuId(id: string): string {
  return LEGACY_YAKU_ID_MAP[id] || id
}
