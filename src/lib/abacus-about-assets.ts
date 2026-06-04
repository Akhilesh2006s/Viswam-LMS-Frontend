/** Public URLs for Know Abacus guide images (from legacy about-abacus.html). */
export const ABACUS_ABOUT_IMAGES = {
  parts: '/abacus/images/a.png',
  thumb: '/abacus/images/thumb-up.png',
  indexEarth: '/abacus/images/index-earth.png',
  indexAddition: '/abacus/images/index-addition.png',
  indexHeaven: '/abacus/images/index-heaven.png',
} as const;

export const ABACUS_PART_MARKERS = [
  { top: '24%', left: '15%', title: 'Frame', text: 'Frame: Holds the entire structure.' },
  { top: '25%', left: '64%', title: 'Heaven Beads', text: 'Heaven Beads: Each bead = 5.' },
  { top: '37%', left: '45%', title: 'Unit Bar', text: 'Unit Bar: Divider between heaven and earth beads.' },
  { top: '37%', left: '72%', title: 'Unit Dot', text: 'Unit Dot: Marks place value every three rods.' },
  { top: '26%', left: '72%', title: 'Rods', text: 'Rods: Vertical lines that hold the beads.' },
  { top: '96%', left: '62%', title: 'Earth Beads', text: 'Earth Beads: Each bead = 1.' },
] as const;

export const ABACUS_INDEX_FINGER_DIAGRAMS = [
  {
    src: ABACUS_ABOUT_IMAGES.indexEarth,
    alt: 'Subtraction of earth beads with index finger',
    caption: 'Subtraction of Earth beads with Index Finger',
  },
  {
    src: ABACUS_ABOUT_IMAGES.indexHeaven,
    alt: 'Heaven bead movement with index finger',
    caption: 'Addition / subtraction of Heaven beads with Index Finger',
  },
  {
    src: ABACUS_ABOUT_IMAGES.indexAddition,
    alt: 'Addition movement with index finger',
    caption: 'Addition of Earth beads with Index Finger',
  },
] as const;

export const ABACUS_THUMB_CAPTION = 'Addition of Earth beads with Thumb Finger';
