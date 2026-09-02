import { ref } from 'vue'
import {
  projectToDetail,
  publicationToDetail,
  type DetailDoc,
} from '../lib/content'
import type { Project, Publication } from '../types'

/** The single "document window" that opens on top of the desktop. */
const doc = ref<DetailDoc | null>(null)

export function useDetail() {
  function openProject(p: Project) {
    doc.value = projectToDetail(p)
  }

  function openPublication(p: Publication) {
    doc.value = publicationToDetail(p)
  }

  function closeDetail() {
    doc.value = null
  }

  return { doc, openProject, openPublication, closeDetail }
}
