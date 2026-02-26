export interface KoyomiEvent {
  id: string
  date: string
  rokuyo: string | null
  lucky_days: string[]
  unlucky_days: string[]
  lunar_phase: string | null
  solar_term: string | null
  eto: string | null
  notes: string | null
}

export interface KoyomiScore {
  id: string
  date: string
  category: string
  score: number
  reason: string | null
}

export interface KoyomiVoidTime {
  id: string
  start_at: string
  end_at: string
}

export interface CalendarDay {
  date: string
  dayOfMonth: number
  isCurrentMonth: boolean
  event?: KoyomiEvent
  scores: KoyomiScore[]
  voidTimes: KoyomiVoidTime[]
}

export const LUCKY_DAY_COLORS: Record<string, string> = {
  '一粒万倍日': 'bg-amber-100 text-amber-800 border-amber-300',
  '天赦日': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '寅の日': 'bg-orange-100 text-orange-800 border-orange-300',
  '巳の日': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  '甲子の日': 'bg-blue-100 text-blue-800 border-blue-300',
  '辰の日': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  '己巳の日': 'bg-emerald-200 text-emerald-900 border-emerald-400',
}

export const ROKUYO_COLORS: Record<string, string> = {
  '大安': 'text-red-600 font-semibold',
  '友引': 'text-orange-600',
  '先勝': 'text-blue-600',
  '先負': 'text-blue-500',
  '仏滅': 'text-gray-400',
  '赤口': 'text-gray-500',
}

export const UNLUCKY_COLORS: Record<string, string> = {
  '不成就日': 'bg-gray-200 text-gray-600 border-gray-300',
}

export const SCORE_CATEGORIES: Record<string, string> = {
  'overall': '総合運',
  'business': '起業・仕事運',
  'finance': '金運',
  'moving': '引越し',
  'marriage': '結婚・入籍',
  'travel': '旅行',
}
