---
name: Desktop Scrapbook
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#464653'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#767684'
  outline-variant: '#c6c5d5'
  surface-tint: '#4b53bc'
  primary: '#00003c'
  on-primary: '#ffffff'
  primary-container: '#000080'
  on-primary-container: '#777eea'
  inverse-primary: '#bfc2ff'
  secondary: '#5d5e5f'
  on-secondary: '#ffffff'
  secondary-container: '#e0dfdf'
  on-secondary-container: '#626363'
  tertiary: '#090b0c'
  on-tertiary: '#ffffff'
  tertiary-container: '#202222'
  on-tertiary-container: '#888989'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bfc2ff'
  on-primary-fixed: '#00006e'
  on-primary-fixed-variant: '#3239a3'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Anybody
    fontSize: 80px
    fontWeight: '900'
    lineHeight: 80px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Anybody
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 32px
  window-title:
    fontFamily: Source Sans 3
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
spacing:
  grid-unit: 8px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 64px
  window-padding: 4px
---

## Brand & Style

This design system is a high-fidelity collision between 1995 computing and physical zine culture. It creates a nostalgic, "analog-digital" hybrid personality that is playful yet structured. The target audience is the creative industry—agencies, collectors, and fellow designers who appreciate subverted retro aesthetics.

The visual style is a mix of **Brutalism** and **Tactile Collage**. It utilizes the rigid, 3D-beveled logic of early GUI environments and breaks it with organic, hand-drawn disruptions like torn paper edges, ink bleeds, and masking tape textures. The emotional response should be one of "digital archaeology"—as if the user discovered a lost operating system printed on heavy-weight construction paper.

## Colors

The palette is strictly anchored in the 8-bit era, supplemented by high-contrast "print" neutrals.

- **Primary (#000080):** Classic Windows "Navy." Used exclusively for active window title bars and highlighted text states.
- **Secondary (#C0C0C0):** The iconic "Silver" UI grey. This is the base color for all 3D-beveled containers, buttons, and taskbars.
- **Background/Paper (#FFFFFF):** A stark white, often overlaid with a subtle paper grain or blue-line grid texture to simulate physical media.
- **Ink Black (#000000):** Used for sharp typography, 1px borders, and hand-drawn skeletal elements.
- **Muted Accents:** Use a desaturated teal (#008080) for desktop backgrounds and a "legal pad" yellow (#FFF9C4) for sticky-note callouts.

## Typography

The typography strategy pairs expressive, heavy-weight headlines with utilitarian, system-inspired fonts.

- **Headlines:** Use **Anybody** in its widest, boldest weights. It should look like it was block-printed onto the page. Use all-caps for section headers to mimic the "PORTFOLIO" branding in the reference.
- **Body:** **Source Sans 3** provides a clean, professional counterpoint that mimics the readability of MS Sans Serif without the pixelation artifacts that hinder modern accessibility.
- **Labels & UI:** **JetBrains Mono** is used for "technical" metadata, file paths, and button labels to reinforce the OS aesthetic.

All text should feel "stamped" or "typed." Avoid smooth gradients; use solid black or primary blue for all type.

## Layout & Spacing

The layout is a **fixed-width "Scrapbook" grid** (typically 1200px max) centered on the screen. Content is organized into independent "Window" containers that can overlap slightly to create a collage effect.

- **Vertical Rhythm:** Based on an 8px grid unit. 
- **Windows:** Each content section (About, Work, Contact) must be contained within a 1995-style window. 
- **The "One-Pager" Flow:** While the windows appear independent, they are anchored to a central vertical axis. As the user scrolls, new windows "pop up" or are "dragged" into view.
- **Responsive Reflow:** On mobile, windows lose their overlapping properties and stack vertically. The "torn paper" dividers should be used to separate these stacked sections.

## Elevation & Depth

Depth is achieved through **3D Bevels** and **Physical Layering**, rather than modern soft shadows.

1.  **3D Beveling:** Use the classic 2px border technique. 
    - *Raised:* Top/Left = White, Bottom/Right = Dark Grey (#808080).
    - *Pressed:* Top/Left = Dark Grey, Bottom/Right = White.
2.  **Torn Edges:** Use SVG masks on the top and bottom of main section containers to create a "ripped paper" look.
3.  **No Soft Shadows:** If a shadow is required for a floating window, use a solid 100% opacity black offset (e.g., 4px 4px 0px #000).
4.  **Tape Accents:** Use semi-transparent rectangular overlays at the corners of windows to simulate masking tape holding the "digital" window to the "paper" background.

## Shapes

The design system strictly adheres to **Sharp (0px)** corners. The only organic shapes allowed are:
- **Hand-drawn arrows** and circles used for annotations (as seen in the reference).
- **Torn paper edges** which serve as the primary organic contrast to the rigid squareness of the OS windows.
- **Pixelated Icons:** Icons should be 32x32 pixel art style, never smooth SVGs.

## Components

- **Windows:** The core container. Must include a title bar (Navy #000080), a title in white Source Sans 3, and the "X" close button (non-functional or "scroll to top" functional).
- **Buttons:** Grey (#C0C0C0) with a 2px "Raised" bevel. On hover/active, change to "Pressed" bevel.
- **Input Fields:** Inset bevel (white background, dark grey top/left inner border). Use JetBrains Mono for typed text.
- **Checkboxes:** Standard 12px square with a 1px black border and a pixelated "X" for the checked state.
- **Taskbar:** A fixed-bottom bar in #C0C0C0 containing the "Start" button (Logo) and currently active section titles.
- **Collage Elements:** 
    - **Hand-sketched arrows:** To point from text to images.
    - **Grid Paper:** Applied as a background-image pattern to the body.
    - **Dithered Images:** All photos should have a slight "Newsprint" or "Dithered" filter to match the paper-on-OS aesthetic.