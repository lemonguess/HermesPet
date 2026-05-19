export type OutfitId = 'normal' | 'dark'

export interface OutfitPreset {
  id: OutfitId
  parts: Record<string, number>
  params: Record<string, number>
}

const DARK_PARTS = [
  'Part20',
  'Part30',
  'Part36',
  'Part39',
  'Part40',
  'Part87',
  'Part86',
  'Part89',
  'Part76',
  'Part77',
  'Part78',
  'Part90',
  'Part79',
  'Part80',
  'Part81',
  'Part58',
  'Part88',
  'Part75',
  'Part74',
  'Part73',
  'Part69',
  'Part70',
  'Part72',
  'Part71',
]

const CLOTHING_PARAMS = ['Param23', 'Param33', 'Param34', 'Param35', 'Param36', 'Param37', 'Param29', 'Param38', 'Param39']

function mapValues(keys: string[], value: number): Record<string, number> {
  return Object.fromEntries(keys.map(key => [key, value]))
}

const PRESETS: Record<OutfitId, OutfitPreset> = {
  normal: {
    id: 'normal',
    parts: {
      Part28: 1,
      ...mapValues(DARK_PARTS, 0),
    },
    params: mapValues(CLOTHING_PARAMS, 0),
  },
  dark: {
    id: 'dark',
    parts: {
      Part28: 0,
      ...mapValues(DARK_PARTS, 1),
    },
    params: mapValues(CLOTHING_PARAMS, 1),
  },
}

export function getOutfitPreset(id: OutfitId): OutfitPreset {
  return PRESETS[id]
}
