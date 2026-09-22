<script setup lang="ts">
type ScanState = 'idle' | 'preview' | 'uploading' | 'error'

const state = ref<ScanState>('idle')
const error = ref<string | null>(null)
const previewUrl = ref<string | null>(null)
const file = ref<File | null>(null)
const progress = ref(0)

const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)

const MAX_SIZE = 15 * 1024 * 1024

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return

  if (!f.type.startsWith('image/')) {
    error.value = 'Это не изображение. Загрузите фото этикетки (JPG, PNG, HEIC).'
    state.value = 'error'
    input.value = ''
    return
  }
  if (f.size > MAX_SIZE) {
    error.value = 'Файл слишком большой. Максимум 15 МБ.'
    state.value = 'error'
    input.value = ''
    return
  }

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = f
  previewUrl.value = URL.createObjectURL(f)
  error.value = null
  progress.value = 0
  state.value = 'preview'
}

function reset() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  file.value = null
  error.value = null
  progress.value = 0
  state.value = 'idle'
  if (cameraInput.value) cameraInput.value.value = ''
  if (galleryInput.value) galleryInput.value.value = ''
}

async function submit() {
  if (!file.value) return
  state.value = 'uploading'
  progress.value = 0

  try {
    const form = new FormData()
    form.append('image', file.value)

    const { scanWine } = useWineApi()
    const res = await scanWine(form, (p) => (progress.value = p))

    if (!res.found || !res.wine) {
      await navigateTo({ path: '/not-found', query: { from: 'scan' } })
      return
    }
    await navigateTo(`/wine/${res.wine.slug}`)
  } catch (e: any) {
    error.value = e?.message ?? 'Не удалось отправить фото. Попробуйте ещё раз.'
    state.value = 'error'
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <section class="pt-[112px] pb-8 lg:pt-[144px] lg:pb-14">
    <div class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
      <div class="mx-auto max-w-xl text-center">
        <p class="eyebrow mb-3">Сканер</p>
        <h1 class="font-serif text-3xl text-ink sm:text-4xl lg:text-5xl">
          Сканировать вино
        </h1>
        <p class="mt-4 text-sm text-ink-soft sm:text-base">
          Сфотографируйте этикетку или загрузите из галереи — и мы найдём вино в каталоге «Своё Вино».
        </p>
      </div>

      <div class="mx-auto mt-8 max-w-xl rounded-3xl border border-ink/5 bg-white p-6 shadow-card sm:p-8 lg:mt-12">
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="onFile"
        />
        <input
          ref="galleryInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFile"
        />

        <!-- IDLE -->
        <div v-if="state === 'idle'" class="grid gap-3 sm:grid-cols-2">
          <button class="btn-wine w-full" @click="cameraInput?.click()">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            Сделать фото
          </button>

          <button class="btn-wine-outline w-full" @click="galleryInput?.click()">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10.5" r="1.5" />
              <path d="m4 17 5-5 4 4 3-2 4 4" />
            </svg>
            Выбрать из галереи
          </button>
        </div>

        <!-- PREVIEW -->
        <div v-else-if="state === 'preview' && previewUrl" class="flex flex-col items-center">
          <div class="relative w-full overflow-hidden rounded-2xl bg-cream-200">
            <img
              :src="previewUrl"
              alt="Превью этикетки"
              class="mx-auto max-h-[380px] w-auto object-contain"
            />
          </div>
          <p class="mt-3 max-w-full truncate text-xs text-ink-soft">{{ file?.name }}</p>

          <div class="mt-5 grid w-full gap-3 sm:grid-cols-2">
            <button class="btn-wine-outline w-full" @click="reset">
              Выбрать другое
            </button>
            <button class="btn-wine w-full" @click="submit">
              Найти вино
            </button>
          </div>
        </div>

        <!-- UPLOADING -->
        <div v-else-if="state === 'uploading'" class="flex flex-col items-center py-4">
          <div v-if="previewUrl" class="relative w-full overflow-hidden rounded-2xl">
            <img
              :src="previewUrl"
              alt=""
              class="mx-auto max-h-[320px] w-auto object-contain opacity-60"
            />
            <div class="absolute inset-0 flex items-center justify-center bg-white/40">
              <div class="h-10 w-10 animate-spin rounded-full border-2 border-[#8f3d42]/20 border-t-[#8f3d42]" />
            </div>
          </div>
          <p class="mt-5 text-sm text-ink">Ищем вино в каталоге…</p>
          <div class="mt-3 h-1 w-full max-w-xs overflow-hidden rounded-full bg-cream-200">
            <div class="h-full bg-[#8f3d42] transition-all" :style="{ width: `${progress}%` }" />
          </div>
        </div>

        <!-- ERROR -->
        <div v-else-if="state === 'error'" class="flex flex-col items-center py-4 text-center">
          <span class="flex h-12 w-12 items-center justify-center rounded-full bg-[#8f3d42]/10 text-[#8f3d42]">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 8v5M12 16h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <p class="mt-4 max-w-sm text-sm text-ink">{{ error }}</p>
          <button class="btn-wine mt-5" @click="reset">
            Попробовать снова
          </button>
        </div>
      </div>

      <p class="mx-auto mt-6 max-w-md text-center text-xs leading-relaxed text-ink-muted">
        Хороший результат получается при хорошем освещении и чётком изображении этикетки.
      </p>
    </div>
  </section>
</template>