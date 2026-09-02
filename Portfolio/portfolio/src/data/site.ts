import { asset } from '../lib/asset'

/**
 * Everything about *you* that isn't in the JSON data files.
 * Edit here — nothing below is hardcoded anywhere else.
 */

export const site = {
  name: 'Xander Vervaecke',
  firstName: 'Xander',
  title: 'PhD Researcher — Visual Computing',
  role: 'Computer Scientist',
  location: 'Alken, Belgium',

  /** The blue callout at the top of the About pane. */
  lede:
    'PhD researcher in Computer Science at Hasselt University, specialising in Visual Computing.',

  /** Body paragraphs under the lede. */
  bio: [ 
    "Motivated PHD researcher in Computer Science (Visual computing & AI) with practical experience developing applied AI systems in both industry and research environments. Strong focus on AI systems, Visual Computing and anything 3D. Enjoys taking on challenging problems.",
    'Outside of my studies I build audio visualisers, try to improve my 3D artistic skills, build AI implementations and fiddle with small hardware projects.',
  ],

  /**
   * Your photo on the About tab. Save it as  images/portrait.jpg  in the
   * repository root (same folder as the project images) and it appears —
   * no code change needed. Use a different name or extension here if you
   * prefer; set it to null to keep the "PHOTO.BMP not found" frame.
   * Portrait orientation works best: the frame is 4:5.
   */
  portrait: asset('/images/portrait.jpg') as string | null,

  /** Shown in the "TECH STACK" panel on the About pane. */
  stack: [
    'Python',
    'C# / C++',
    'OpenGL / WebGL',
    'GLSL Shaders',
    'PyTorch',
    'Vue / TypeScript',
    'Three.js',
    'Generative AI',
  ],

  /** Public contact details. */
  contact: {
    email: 'vervaeckexander3@gmail.com',
    // TODO(Xander): drop in your real LinkedIn URL.
    linkedin: 'https://www.linkedin.com/in/xander-vervaecke/',
    linkedinLabel: 'linkedin.com/in/xander-vervaecke',
  },

  cv: [
    { label: 'CV (English)', src: asset('/cv/CV_Xander_Vervaecke_Engels.pdf') },
    { label: 'CV (Nederlands)', src: asset('/cv/CV_Xander_Vervaecke_Nederlands.pdf') },
  ],

  /**
   * The 3D hero is built from the models in the repo-root  models/  folder.
   * Camera, layout, lighting and animation speeds all live in
   * src/three/sceneConfig.ts .
   */
}
