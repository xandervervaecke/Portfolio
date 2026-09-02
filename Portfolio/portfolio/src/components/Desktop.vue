<script setup lang="ts">
import { computed } from 'vue'
import Win95Window from './Win95Window.vue'
import PixelIcon from './PixelIcon.vue'
import HomePane from './panes/HomePane.vue'
import ProjectsPane from './panes/ProjectsPane.vue'
import EducationPane from './panes/EducationPane.vue'
import WorkPane from './panes/WorkPane.vue'
import { useDesktop } from '../composables/useDesktop'

const {
  activeTab,
  activeTabDef,
  maximized,
  closing,
  tabs,
  openTab,
  dismiss,
  toggleMaximize,
} = useDesktop()

const PANES = {
  home: HomePane,
  projects: ProjectsPane,
  education: EducationPane,
  work: WorkPane,
} as const

const pane = computed(() => PANES[activeTab.value])
</script>

<template>
  <div class="desk" :class="{ 'is-max': maximized, 'is-closing': closing }">
    <Win95Window
      :title="activeTabDef.path"
      :icon="activeTabDef.icon"
      minimizable
      maximizable
      :maximized="maximized"
      @close="dismiss()"
      @minimize="dismiss()"
      @maximize="toggleMaximize()"
    >
      <div class="chrome">
        <!-- Tab strip -->
        <div class="tabstrip" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab"
            :class="{ 'is-active': activeTab === tab.id }"
            role="tab"
            :aria-selected="activeTab === tab.id"
            type="button"
            @click="openTab(tab.id)"
          >
            <PixelIcon :name="tab.icon" :size="13" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Page -->
        <div class="page bevel-inset w95-scroll">
          <div class="page__inner">
            <component :is="pane" :key="activeTab" />
          </div>
        </div>
      </div>
    </Win95Window>
  </div>
</template>

<style scoped>
.desk {
  position: fixed;
  /* Tight to the viewport — the window is the page, so margin here is just
   * space the content does not get. */
  inset: 10px 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 0 10px;
  pointer-events: none;
  animation: zoom-open 0.26s var(--ease-snap) both;
}

.desk.is-closing {
  animation: zoom-close 0.22s var(--ease-snap) both;
}

.desk :deep(> *) {
  pointer-events: auto;
  width: 100%;
  max-width: var(--shell-wide);
  max-height: 100%;
}

.desk.is-max {
  inset: 6px 0;
  padding: 0 6px;
}

.desk.is-max :deep(> *) {
  max-width: none;
  box-shadow: none;
}

.chrome {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 6px 8px 8px;
  background: var(--face);
}

/* --- tabs --------------------------------------------------------------- */

.tabstrip {
  flex: 0 0 auto;
  display: flex;
  gap: 2px;
  padding: 4px 2px 0;
  position: relative;
  z-index: 2;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabstrip::-webkit-scrollbar {
  display: none;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 14px 6px;
  margin-bottom: -2px;
  cursor: pointer;
  white-space: nowrap;
  background: var(--face);
  color: var(--ink-soft);
  border: 2px solid;
  border-top-color: var(--hi);
  border-left-color: var(--hi);
  border-right-color: var(--lo);
  border-bottom-color: var(--lo);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  position: relative;
  top: 3px;
  transition:
    top 0.16s var(--ease-snap),
    background-color 0.16s linear,
    color 0.16s linear;
}

.tab:hover {
  background: var(--face-light);
  color: var(--ink);
  top: 1px;
}

.tab.is-active {
  top: 0;
  padding: 7px 18px 8px;
  color: var(--ink);
  font-weight: 700;
  background: var(--face-light);
  border-bottom-color: var(--face-light);
  z-index: 3;
}

.tab:focus-visible {
  outline: 1px dotted #000;
  outline-offset: -4px;
}

/* --- page --------------------------------------------------------------- */

.page {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--paper);
  background-image:
    linear-gradient(rgba(0, 0, 60, 0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 60, 0.028) 1px, transparent 1px);
  background-size: 22px 22px;
}

.page__inner {
  padding: 34px clamp(20px, 3.4vw, 46px) 54px;
}

@media (max-width: 760px) {
  .desk {
    inset: 10px 0;
    padding: 0 8px;
  }

  .tab span {
    display: none;
  }

  .tab {
    padding: 6px 14px;
  }

  .tab.is-active {
    padding: 8px 16px;
  }

  .page__inner {
    padding: 22px 16px 40px;
  }
}
</style>
