// The JSON data files live at the repository root, one level above this app —
// that is the single source of truth, edit them there.
import { asset } from './asset'

import projectsRaw from '@data/projects.json'
import workRaw from '@data/work.json'
import educationRaw from '@data/education.json'
import publicationsRaw from '@data/publications_papers.json'

import type {
  Certification,
  EducationItem,
  Media,
  PdfRef,
  Project,
  Publication,
  WorkItem,
} from '../types'

/* --------------------------------------------------------------------------
 * Asset paths
 * The JSON files write paths as either "images/foo.png" or "/files/bar.pdf".
 * Everything is served out of /public, so normalise to a root-relative URL and
 * escape the spaces some of the filenames still carry.
 * ----------------------------------------------------------------------- */
export function assetUrl(path?: string | null): string {
  if (!path) return ''
  if (/^(https?:)?\/\//.test(path)) return path
  const clean = path.replace(/^\.?\//, '')
  return asset(clean.split('/').map(encodeURIComponent).join('/'))
}

export function pdfList(media?: Media): PdfRef[] {
  const pdf = media?.pdf
  if (!pdf) return []
  if (typeof pdf === 'string') return [{ src: pdf, label: 'Open PDF' }]
  return pdf
}

export function imageList(media?: Media): string[] {
  return (media?.images ?? []).filter(Boolean)
}

/**
 * `"imagefill": true` lets the image fill the card at its own aspect ratio —
 * nothing cropped, no letterbox bands. Use it for very wide or very tall
 * images that look wrong squeezed into the default 4:3 frame.
 */
export function imageFills(media?: Media): boolean {
  return media?.imagefill === true
}

/* --------------------------------------------------------------------------
 * YouTube
 * ----------------------------------------------------------------------- */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null
  const patterns = [
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/,
    /youtube\.com\/shorts\/([\w-]{6,})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1] ?? null
  }
  return null
}

/* --------------------------------------------------------------------------
 * Projects
 * ----------------------------------------------------------------------- */
export const EXTRACURRICULAR_TAG = 'Extracurricular'

/** Tags as rendered: the JSON tags plus the synthetic Extracurricular tag. */
export function projectTags(p: Project): string[] {
  const tags = [...(p.tags ?? [])]
  if (p.extracurricular && !tags.includes(EXTRACURRICULAR_TAG)) {
    tags.push(EXTRACURRICULAR_TAG)
  }
  return tags
}

/**
 * Favourites first, then newest first. Undated entries (the "and many more"
 * card) always sink to the bottom.
 */
function byFavouriteThenDate(a: Project, b: Project): number {
  const fav = Number(!!b.favorite) - Number(!!a.favorite)
  if (fav !== 0) return fav

  const undatedA = a.year == null
  const undatedB = b.year == null
  if (undatedA !== undatedB) return undatedA ? 1 : -1
  if (undatedA && undatedB) return 0

  return (b.year as number) - (a.year as number)
}

export const projects: Project[] = [...(projectsRaw.projects as Project[])].sort(
  byFavouriteThenDate,
)

export const favouriteProjects: Project[] = projects.filter((p) => p.favorite)

/** Every tag in use, most-used first, so the filter bar reads sensibly. */
export const allProjectTags: string[] = (() => {
  const counts = new Map<string, number>()
  for (const p of projects) {
    for (const t of projectTags(p)) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
})()

/* --------------------------------------------------------------------------
 * Work / education / publications
 * ----------------------------------------------------------------------- */
export const work: WorkItem[] = [...(workRaw.experience as WorkItem[])].sort(
  (a, b) => (b.endYear ?? 9999) - (a.endYear ?? 9999) || b.startYear - a.startYear,
)

export const education: EducationItem[] = [
  ...(educationRaw.education as EducationItem[]),
].sort((a, b) => b.startYear - a.startYear)

export const certifications: Certification[] = educationRaw.certifications as Certification[]

export const publications: Publication[] = [
  ...(publicationsRaw.publications as Publication[]),
].sort((a, b) => b.year - a.year)

export function projectById(id?: string | null): Project | undefined {
  if (!id) return undefined
  return projects.find((p) => p.id === id)
}

/* --------------------------------------------------------------------------
 * A single shape the detail window can render, whatever it was built from.
 * ----------------------------------------------------------------------- */
export interface DetailDoc {
  id: string
  kicker: string
  title: string
  subtitle?: string | null
  year?: number | null
  favorite?: boolean
  tags: string[]
  summary?: string
  description?: string
  highlights: string[]
  technologies: string[]
  media?: Media
  links: string[]
  award?: string | null
  meta: { label: string; value: string }[]
}

export function projectToDetail(p: Project): DetailDoc {
  return {
    id: p.id,
    kicker: p.type === 'thesis' ? 'THESIS' : 'PROJECT',
    title: p.title,
    subtitle: p.subtitle,
    year: p.year,
    favorite: p.favorite,
    tags: projectTags(p),
    summary: p.summary,
    description: p.description,
    highlights: p.highlights ?? [],
    technologies: p.technologies ?? [],
    media: p.media,
    links: p.links ?? [],
    award: null,
    meta: [
      ...(p.year ? [{ label: 'Year', value: String(p.year) }] : []),
      ...(p.team ? [{ label: 'Team', value: p.team }] : []),
      ...(p.extracurricular ? [{ label: 'Context', value: 'Extracurricular / side project' }] : []),
    ],
  }
}

export function publicationToDetail(pub: Publication): DetailDoc {
  return {
    id: pub.id,
    kicker: pub.typeLabel.toUpperCase(),
    title: pub.title,
    subtitle: pub.venue,
    year: pub.year,
    favorite: false,
    tags: pub.tags ?? [],
    summary: pub.summary,
    description: '',
    highlights: pub.highlights ?? [],
    technologies: [],
    media: pub.media,
    links: pub.links ?? [],
    award: pub.award ? `${pub.award.title} — ${pub.award.publication ?? ''} ${pub.award.year ?? ''}`.trim() : null,
    meta: [
      { label: 'Type', value: pub.typeLabel },
      ...(pub.venue ? [{ label: 'Venue', value: pub.venue }] : []),
      { label: 'Year', value: String(pub.year) },
      ...(pub.authors?.length ? [{ label: 'Authors', value: pub.authors.join(', ') }] : []),
    ],
  }
}
