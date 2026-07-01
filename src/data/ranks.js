import { Compass, Map, Anchor, BookOpen, Waves, Gem } from 'lucide-react'

export const RANKS = [
  { id: 'wanderer', label: 'Wanderer', arabic: 'مسافر', minXP: 0, color: '#78716C', icon: Compass },
  { id: 'nomad', label: 'Nomad', arabic: 'بدوي', minXP: 75, color: '#B8860B', icon: Map },
  { id: 'merchant', label: 'Merchant', arabic: 'تاجر', minXP: 250, color: '#C27D38', icon: Anchor },
  { id: 'chronicler', label: 'Chronicler', arabic: 'مؤرخ', minXP: 600, color: '#C1122F', icon: BookOpen },
  { id: 'pearldiver', label: 'Pearl Diver', arabic: 'غواص لؤلؤ', minXP: 1200, color: '#1E40AF', icon: Waves },
  { id: 'dilmun', label: 'Dilmun Pearl', arabic: 'لؤلؤة دلمون', minXP: 2200, color: '#6D28D9', icon: Gem },
]

export function getRank(xp) {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r
  }
  return rank
}

export function getNextRank(xp) {
  for (const r of RANKS) {
    if (xp < r.minXP) return r
  }
  return null
}
