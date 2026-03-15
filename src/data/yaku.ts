import yakuConfig from './yaku-config.json'

export interface Yaku {
  id: string
  name: string
  han: number
  category: '无限制' | '门前清' | '副露后'
  desc: string
  tiles: string[]
  splitAt?: number[]
  mastery?: number
  isHu?: boolean
  isEffectOnly?: boolean
  isDealerOnly?: boolean
  isNonDealerOnly?: boolean
  note?: string
}

export const yakuData: Yaku[] = (yakuConfig.yaku as Yaku[]).map(y => ({
  ...y,
  mastery: 0
}))

const STORAGE_KEY = 'yaku-mastery'

export const setYakuMastery = (id: string, count: number) => {
  const yaku = yakuData.find(y => y.id === id)
  if (yaku) {
    yaku.mastery = count
    saveMastery()
    return true
  }
  return false
}

export const clearAllMastery = () => {
  yakuData.forEach(y => {
    y.mastery = 0
  })
  localStorage.removeItem(STORAGE_KEY)
}

const saveMastery = () => {
  const masteryMap: Record<string, number> = {}
  yakuData.forEach(y => {
    if (y.mastery) {
      masteryMap[y.id] = y.mastery
    }
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(masteryMap))
}

export const loadMastery = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const masteryMap = JSON.parse(stored)
    yakuData.forEach(y => {
      if (masteryMap[y.id] !== undefined) {
        y.mastery = masteryMap[y.id]
      }
    })
  }
}

export const autoCalculateSplitAt = (tiles: string[]): number[] => {
  if (tiles.length === 4) return []

  if (tiles.filter(t => 'w19b19s19d1234z123'.includes(t)).length === 13) {
    return [12]
  }

  if (tiles[0] === tiles[1] && tiles[1] === tiles[2] && 
      tiles[3] === tiles[4] && tiles[4] === tiles[5] && 
      tiles[6] === tiles[7] && tiles[7] === tiles[8] && 
      tiles[9] === tiles[10] && tiles[10] === tiles[11]) {
    if (tiles[12] === tiles[13]) {
      return [2, 5, 8, 11, 12]
    }
    return [2, 5, 8, 11, 12, 13]
  }

  const getTingSplitIndex = (t: string[]): number => {
    if (t.length < 13) return -1
    const counts: Record<string, number> = {}
    t.forEach(tile => counts[tile] = (counts[tile] || 0) + 1)
    const pairs = Object.entries(counts).filter(([_, c]) => c === 2)
    if (pairs.length === 0) return -1
    return t.indexOf(pairs[0][0])
  }

  const splitAt: number[] = []
  let i = 0
  while (i < tiles.length) {
    if (i + 2 < tiles.length && 
        tiles[i] === tiles[i+1] && tiles[i+1] === tiles[i+2]) {
      i += 3
      if (i < tiles.length) splitAt.push(i)
    } else if (i + 2 < tiles.length &&
        tiles[i+1] === tiles[i+2] && 
        Number(tiles[i][0]) + 1 === Number(tiles[i+1][0]) &&
        tiles[i][0] === tiles[i+1][0]) {
      i += 3
      if (i < tiles.length) splitAt.push(i)
    } else if (i + 2 < tiles.length &&
               Number(tiles[i][0]) + 1 === Number(tiles[i+1][0]) &&
               Number(tiles[i+1][0]) + 1 === Number(tiles[i+2][0]) &&
               tiles[i][0] === tiles[i+1][0] && tiles[i+1][0] === tiles[i+2][0]) {
      i += 3
      if (i < tiles.length) splitAt.push(i)
    } else {
      i++
    }
  }
  
  const tingSplit = getTingSplitIndex(tiles)
  if (!splitAt.includes(tingSplit)) {
    splitAt.push(tingSplit)
  }
  
  return [...new Set(splitAt)].sort((a, b) => a - b)
}
