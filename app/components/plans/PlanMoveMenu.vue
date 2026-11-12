<script setup lang="ts">
import type { MoveTarget } from '~/utils/reorderPlans'

/**
 * Drag handle that doubles as a "Move" menu button.
 * - drag: handled by vuedraggable/SortableJS through the `handle` class
 * - click/tap (no movement): opens a menu with Move up/down/top/bottom
 * - keyboard: ArrowUp/ArrowDown on the focused handle move the plan directly
 */
const props = withDefaults(
  defineProps<{
    planId: string
    title: string
    index: number
    total: number
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'move', target: MoveTarget): void
}>()

interface MoveItem {
  target: MoveTarget
  label: string
  disabled: boolean
}

const open = ref<boolean>(false)
const handleRef = ref<HTMLButtonElement>()
const menuRef = ref<HTMLElement>()
const position = reactive<{ top: number; left: number }>({ top: 0, left: 0 })

const isFirst = computed<boolean>(() => props.index <= 0)
const isLast = computed<boolean>(() => props.index >= props.total - 1)
const items = computed<MoveItem[]>(() => [
  { target: 'up', label: 'Move up', disabled: isFirst.value },
  { target: 'down', label: 'Move down', disabled: isLast.value },
  { target: 'top', label: 'Move to top', disabled: isFirst.value },
  { target: 'bottom', label: 'Move to bottom', disabled: isLast.value },
])
const handleLabel = computed<string>(() => `Move "${props.title}"`)

const menuItems = (): HTMLElement[] =>
  Array.from(
    menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
  )

const placeMenu = () => {
  const handle = handleRef.value
  const menu = menuRef.value
  if (!handle || !menu) return
  const rect = handle.getBoundingClientRect()
  const gap = 4
  const margin = 8
  const height = menu.offsetHeight
  const width = menu.offsetWidth
  let top = rect.bottom + gap
  if (top + height > window.innerHeight - margin) {
    top = Math.max(margin, rect.top - gap - height)
  }
  const left = Math.min(
    Math.max(margin, rect.left),
    window.innerWidth - width - margin,
  )
  position.top = top
  position.left = left
}

const focusItem = (index: number) => {
  const list = menuItems()
  if (list.length === 0) return
  const i = (index + list.length) % list.length
  list[i]?.focus()
}

const openMenu = async () => {
  open.value = true
  await nextTick()
  placeMenu()
  const firstEnabled = items.value.findIndex((item) => !item.disabled)
  focusItem(firstEnabled === -1 ? 0 : firstEnabled)
}

const closeMenu = (returnFocus = true) => {
  if (!open.value) return
  open.value = false
  if (returnFocus) handleRef.value?.focus()
}

const onHandleClick = () => {
  if (open.value) closeMenu()
  else openMenu()
}

const onHandleKeydown = (e: KeyboardEvent) => {
  if (open.value) return
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
  e.preventDefault()
  if (props.disabled) return
  if (e.key === 'ArrowUp' && !isFirst.value) emit('move', 'up')
  if (e.key === 'ArrowDown' && !isLast.value) emit('move', 'down')
}

const onMenuKeydown = (e: KeyboardEvent) => {
  const list = menuItems()
  const current = list.indexOf(document.activeElement as HTMLElement)
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusItem(current + 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      focusItem(current - 1)
      break
    case 'Home':
      e.preventDefault()
      focusItem(0)
      break
    case 'End':
      e.preventDefault()
      focusItem(list.length - 1)
      break
    case 'Escape':
    case 'Tab':
      e.preventDefault()
      closeMenu()
      break
  }
}

const onItemClick = (item: MoveItem) => {
  if (item.disabled || props.disabled) return
  // focus goes back to the handle right away so it isn't lost while the order saves
  closeMenu()
  emit('move', item.target)
}

const onOutsidePointer = (e: PointerEvent) => {
  const target = e.target as Node | null
  if (!target) return
  if (menuRef.value?.contains(target) || handleRef.value?.contains(target))
    return
  closeMenu(false)
}
// keep the menu attached to its handle; close only once the handle leaves the viewport
const onViewportChange = () => {
  const rect = handleRef.value?.getBoundingClientRect()
  if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) {
    closeMenu(false)
    return
  }
  placeMenu()
}

watch(open, (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) {
    document.addEventListener('pointerdown', onOutsidePointer, true)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
  } else {
    document.removeEventListener('pointerdown', onOutsidePointer, true)
    window.removeEventListener('scroll', onViewportChange, true)
    window.removeEventListener('resize', onViewportChange)
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.removeEventListener('pointerdown', onOutsidePointer, true)
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
})
</script>

<template>
  <button
    ref="handleRef"
    type="button"
    class="handle flex items-center justify-center size-7 -m-1.5 shrink-0 rounded-md cursor-grab text-dark-3/80 dark:text-light-3/80 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-warning"
    :data-move-handle="planId"
    aria-haspopup="menu"
    :aria-expanded="open"
    :aria-label="handleLabel"
    @click.stop="onHandleClick"
    @keydown="onHandleKeydown"
  >
    <svg
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      fill="currentColor"
      class="min-w-xs h-xs"
    >
      <!-- !Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
      <path
        d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"
      />
    </svg>
  </button>
  <!-- inside <main> so the open menu stays within a landmark -->
  <Teleport to="#main">
    <div
      v-if="open"
      ref="menuRef"
      role="menu"
      :aria-label="handleLabel"
      class="fixed z-50 min-w-48 p-1 rounded-md shadow-lg ring-1 ring-black/5 bg-light-1 dark:bg-dark-3"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
      @keydown="onMenuKeydown"
    >
      <button
        v-for="item in items"
        :key="item.target"
        type="button"
        role="menuitem"
        tabindex="-1"
        :aria-disabled="item.disabled ? 'true' : undefined"
        class="flex gap-2.5 items-center w-full px-3 py-2.5 rounded text-left text-dark-3 dark:text-light-3 hover:bg-warning/25 focus:bg-warning/25 focus:outline-none aria-disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent"
        @click="onItemClick(item)"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
          :viewBox="
            item.target === 'up' || item.target === 'down'
              ? '0 0 448 512'
              : '0 0 384 512'
          "
          fill="currentColor"
          class="size-3.5"
        >
          <!-- !Font Awesome Free 6 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free -->
          <path
            v-if="item.target === 'up'"
            transform="rotate(180 224 256)"
            d="M224 416c-8.188 0-16.38-3.125-22.62-9.375l-192-192c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L224 338.8l169.4-169.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-192 192C240.4 412.9 232.2 416 224 416z"
          />
          <path
            v-else-if="item.target === 'down'"
            d="M224 416c-8.188 0-16.38-3.125-22.62-9.375l-192-192c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L224 338.8l169.4-169.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-192 192C240.4 412.9 232.2 416 224 416z"
          />
          <path
            v-else-if="item.target === 'top'"
            d="M24 32h336c13.3 0 24 10.7 24 24s-10.7 24-24 24H24C10.7 80 0 69.3 0 56s10.7-24 24-24zm185 105 128 128c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-87-87V456c0 13.3-10.7 24-24 24s-24-10.7-24-24V211.9l-87 87c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l128-128c9.4-9.4 24.6-9.4 33.9 0z"
          />
          <path
            v-else
            d="M24 480h336c13.3 0 24-10.7 24-24s-10.7-24-24-24H24c-13.3 0-24 10.7-24 24s10.7 24 24 24zm185-105 128-128c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-87 87V56c0-13.3-10.7-24-24-24s-24 10.7-24 24v244.1l-87-87c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l128 128c9.4 9.4 24.6 9.4 33.9 0z"
          />
        </svg>
        <span>{{ item.label }}</span>
      </button>
    </div>
  </Teleport>
</template>
