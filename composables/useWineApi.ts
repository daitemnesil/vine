import type { ScanResponse, WineCard } from '~/types/wine'

const MOCK_WINE: WineCard = {
  slug: 'saperavi-dolina-lefkadii',
  name: 'Саперави «Долина Лефкадии»',
  winery: 'Долина Лефкадии',
  region: 'Крым, Россия',
  grape: 'Саперави',
  vintage: 2021,
  color: 'red',
  description:
    'Глубокий рубиновый цвет, ароматы чёрной смородины, спелой вишни и лёгкие пряные ноты. Во вкусе — насыщенные танины и длительное послевкусие.',
  rating: 4.6,
  rskhScore: 83,
  foodPairing: ['мясо на гриле', 'сыры', 'баранина'],
  url: '/wine/saperavi-dolina-lefkadii'
}

export function useWineApi() {
  const config = useRuntimeConfig()
  const useMock = String(config.public.useMock) !== 'false'

  async function scanWine(
    form: FormData,
    onProgress?: (p: number) => void
  ): Promise<ScanResponse> {
    if (useMock) {
      for (let p = 15; p <= 85; p += 20) {
        await new Promise((r) => setTimeout(r, 200))
        onProgress?.(p)
      }
      await new Promise((r) => setTimeout(r, 300))
      onProgress?.(100)

      return {
        found: true,
        confidence: { top1: 0.94, top5: 0.98 },
        wine: MOCK_WINE,
        alternatives: []
      }
    }

    return await $fetch<ScanResponse>('/api/scan', {
      method: 'POST',
      body: form
    })
  }

  return { scanWine }
}