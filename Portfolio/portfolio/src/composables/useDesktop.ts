import { computed, ref, watch } from 'vue'
import type { TabId } from '../types'

export interface TabDef {
  id: TabId
  label: string
  short: string
  /** Fake DOS path shown in the window title bar. */
  path: string
  icon: 'person' | 'folder' | 'school' | 'work'
}

export const TABS: TabDef[] = [
  { id: 'home', label: 'About', short: 'About', path: 'C:\\PORTFOLIO\\ABOUT_ME.EXE', icon: 'person' },
  {
    id: 'projects',
    label: 'Projects',
    short: 'Projects',
    path: 'C:\\PROJECTS\\GALLERY.EXE',
    icon: 'folder',
  },
  {
    id: 'education',
    label: 'Education',
    short: 'Education',
    path: 'C:\\RECORDS\\EDUCATION.EXE',
    icon: 'school',
  },
  {
    id: 'work',
    label: 'Work Experience',
    short: 'Experience',
    path: 'C:\\RESUME\\EXPERIENCE.TXT',
    icon: 'work',
  },
]

const VALID = new Set<string>(TABS.map((t) => t.id))

/* --- shared module-level state ------------------------------------------ */

const desktopOpen = ref(false)
const activeTab = ref<TabId>('home')
const maximized = ref(false)
/** Set while the window is animating shut, so we can play the close frames. */
const closing = ref(false)

const activeTabDef = computed<TabDef>(() => TABS.find((t) => t.id === activeTab.value) ?? TABS[0]!)

function readHash(): TabId | null {
  const raw = window.location.hash.replace(/^#\/?/, '')
  return VALID.has(raw) ? (raw as TabId) : null
}

function writeHash(tab: TabId | null) {
  const next = tab ? `#/${tab}` : ' '
  if (tab) {
    if (window.location.hash !== next) history.replaceState(null, '', next)
  } else if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

let hashBound = false

export function useDesktop() {
  function openTab(tab: TabId) {
    activeTab.value = tab
    closing.value = false
    desktopOpen.value = true
  }

  function open() {
    openTab(activeTab.value)
  }

  /** Close and minimise both fall back to the 3D scene, as designed. */
  function dismiss() {
    if (!desktopOpen.value || closing.value) return
    closing.value = true
    window.setTimeout(() => {
      desktopOpen.value = false
      closing.value = false
      maximized.value = false
    }, 220)
  }

  function toggleMaximize() {
    maximized.value = !maximized.value
  }

  /** Deep links (#/projects) and body scroll locking. */
  function bind() {
    if (hashBound) return
    hashBound = true

    const fromHash = readHash()
    if (fromHash) {
      activeTab.value = fromHash
      desktopOpen.value = true
    }

    window.addEventListener('hashchange', () => {
      const tab = readHash()
      if (tab) openTab(tab)
      else dismiss()
    })

    watch(
      [desktopOpen, activeTab],
      ([isOpen, tab]) => {
        writeHash(isOpen ? tab : null)
        document.body.style.overflow = isOpen ? '' : 'hidden'
      },
      { immediate: true },
    )
  }

  return {
    desktopOpen,
    activeTab,
    activeTabDef,
    maximized,
    closing,
    tabs: TABS,
    open,
    openTab,
    dismiss,
    toggleMaximize,
    bind,
  }
}
