export interface WineCard {
  slug: string
  name: string
  winery: string
  region: string
  grape?: string
  vintage?: number
  color?: 'red' | 'white' | 'rose' | 'sparkling'
  description: string
  rating?: number
  rskhScore?: number
  image?: string
  foodPairing?: string[]
  url?: string
}

export interface ScanResponse {
  found: boolean
  confidence: { top1: number; top5: number }
  wine?: WineCard
  alternatives?: WineCard[]
}