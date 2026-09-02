export interface PdfRef {
  src: string
  label: string
}

export interface Media {
  thumbnail?: string | null
  images?: string[] | null
  /**
   * true  → the image is cropped to completely fill its frame.
   * false → the whole image is shown, letterboxed inside the frame (default).
   */
  imagefill?: boolean
  video?: string | null
  pdf?: string | PdfRef[] | null
}

export interface Project {
  id: string
  title: string
  subtitle?: string | null
  favorite?: boolean
  category?: string | string[]
  type?: string
  tags?: string[]
  year?: number | null
  extracurricular?: boolean
  isPlaceholder?: boolean
  summary?: string
  description?: string
  highlights?: string[]
  technologies?: string[]
  team?: string
  media?: Media
  links?: string[]
}

export interface WorkItem {
  id: string
  company: string
  companyNote?: string | null
  role: string
  period: string
  startYear: number
  endYear?: number | null
  highlights: string[]
  technologies?: string[]
  image?: string | null
}

export interface EducationItem {
  id: string
  institution: string
  location?: string
  degree: string
  field?: string | null
  period: string
  startYear: number
  endYear?: number | null
  current?: boolean
  highlights?: string[]
}

export interface Certification {
  id: string
  title: string
  issuer?: string | null
  year?: number | null
}

export interface Publication {
  id: string
  title: string
  shortTitle?: string
  type: string
  typeLabel: string
  venue?: string
  year: number
  authors?: string[]
  tags?: string[]
  summary?: string
  highlights?: string[]
  award?: {
    title: string
    publication?: string
    year?: number
    url?: string | null
  } | null
  media?: Media
  links?: string[]
  relatedProjectId?: string | null
}

export type TabId = 'home' | 'projects' | 'education' | 'work'
