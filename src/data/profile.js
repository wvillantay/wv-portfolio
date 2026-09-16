/** All site copy and links live here. Components only read from this file. */
export const profile = {
  firstName: 'William',
  name: 'William Villantay',
  title: 'Software Engineer · AI · Data Analytics',
  logo: 'WV // Portfolio', // top-left wordmark, rendered verbatim (no trailing period)
  year: '2026',
  availability: 'Open to opportunities',
  email: 'williamvillantay@gmail.com',
  bio: 'A software engineer focused on building clean, scalable systems where AI and data meet real products — from robust backend pipelines to interfaces people actually enjoy using.',
  tiles: [
    { title: 'Software', sub: 'Engineering' },
    { title: 'AI Systems', sub: 'LLMs · ML' },
    { title: 'Data', sub: 'Analytics' },
  ],
  meta: [
    { k: 'Focus', v: 'AI · Data · Web' },
    { k: 'Status', v: 'Available 2026' },
    { k: 'Stack', v: 'React · Node · Python' },
  ],
}

/**
 * External profile links. A `null` value hides that action everywhere (nav, footer, contact),
 * so nothing can render as a dead link.
 *   resume: the PDF lives in public/resume/; the action opens it in a new tab
 */
export const links = {
  github: 'https://github.com/wvillantay',
  linkedin: 'https://www.linkedin.com/in/william-villantay-33715b1a7/',
  // public/resume/William-Villantay-Resume.pdf (= WilliamResume2026.pdf). Opens in a new tab.
  resume: '/resume/William-Villantay-Resume.pdf',
  email: 'williamvillantay@gmail.com',
}

/** Education, shown in the System Profile section. Exactly as on the resume. */
export const education = [
  {
    degree: 'M.S. in Information Technology',
    focus: 'Data Science Concentration',
    school: 'California State University, Fullerton',
    date: 'Expected May 2027',
  },
  {
    degree: 'B.S. in Computer Science',
    focus: null,
    school: 'California State University, Monterey Bay',
    date: 'May 2023',
  },
  {
    degree: 'A.S. in Computer Science',
    focus: null,
    school: 'Irvine Valley College',
    date: 'August 2021',
  },
]

export const nav = [
  { label: 'Home', href: '#home' },
  { label: 'Profile', href: '#about' },
  { label: 'Stack', href: '#stack' },
  { label: 'Work', href: '#work' },
  { label: 'Contact', href: '#contact' },
]

/** Technical skills — exactly the resume's three groups; nothing added. */
export const skills = [
  { category: 'Languages', items: ['JavaScript', 'Python', 'SQL', 'Java', 'C++', 'R', 'HTML/CSS'] },
  { category: 'Frameworks & Libraries', items: ['React', 'Node.js', 'Express', 'Pandas', 'NumPy'] },
  {
    category: 'Data & Tools',
    items: ['MongoDB', 'PostgreSQL', 'MySQL', 'Docker', 'Git/GitHub', 'Postman', 'Jupyter', 'RStudio'],
  },
]

/**
 * Project cards. Every card gets a "View Project" action (the in-site case study) plus,
 * independently, exactly one repository state:
 *   repo: 'https://…'  → "GitHub ↗" (new tab)
 *   repo: 'private'    → non-link "Private Repository" label
 *   repo: 'pending'    → non-link "GitHub Coming Soon" label (repository not prepared yet)
 *   repo: null         → no repository action at all (e.g. source no longer available)
 * plus "Live Demo ↗" only when `demo` is a URL, and a subtle `demoNote` line when set
 * (e.g. a private demo that can be shown during interviews). `badge` is a short marker shown
 * next to the index ("Featured" is added automatically when `featured` is true). `earlier: true`
 * moves a card out of the main grid into the compact "Earlier Engineering Work" block.
 *
 * `study` is the in-site case study. `role`, `award`, `where`, `status` and `year` render only
 * when set; `highlights` renders only when non-empty. Nothing here is invented — every field comes
 * from William's own descriptions / resume; leave a field null rather than guessing.
 */
export const work = [
  {
    slug: 'omen-v',
    index: '01',
    title: 'Omen V',
    tag: 'Electron · JavaScript · Node.js · Anthropic SDK · Picovoice',
    desc: 'AI desktop command dashboard — an Electron desktop AI assistant that integrates Anthropic’s Claude API with voice-triggered controls and project tools.',
    // The full working repository stays private. When the sanitized public showcase repo
    // exists, point this at it (the private repo is https://github.com/wvillantay/Omen-V).
    repo: 'private',
    demo: null,
    featured: true,
    study: {
      role: null,
      award: null,
      status: 'In development',
      year: '2026 – Present',
      stack: ['Electron', 'JavaScript', 'Node.js', 'Anthropic SDK', 'Picovoice'],
      overview:
        'Omen is an AI desktop command dashboard: an Electron desktop AI assistant that integrates Anthropic’s Claude API with voice-triggered controls and project tools. The full working implementation is private; a sanitized public showcase repository is planned.',
      capabilities: [
        'Integrates Anthropic’s Claude API into a desktop assistant',
        'Voice-triggered controls (Picovoice) and project tools',
        'Approval-gated actions',
        'Multi-agent review coordination',
        'Persistent execution records',
        'Automated tests across desktop workflows',
      ],
      highlights: [],
    },
  },
  {
    slug: 'pack-battles',
    index: '02',
    title: 'Pack Battles',
    tag: 'React · Node.js · Express · MongoDB',
    desc: 'Competitive TCG pack-opening platform with battles, inventory, upgrades, trading, events, and account systems.',
    repo: 'private', // stays private permanently
    demo: null,
    demoNote: 'Demo available during interviews',
    featured: true,
    study: {
      role: 'Founder & Full-Stack Developer',
      award: null,
      status: null,
      year: '2023 – Present',
      stack: ['React', 'Node.js', 'Express', 'MongoDB'],
      overview:
        'Pack Battles is a full-stack trading-card-game platform built around pack opening, founded and built end to end: authentication, inventory, pack openings, battles, upgrades, trading, and administrative workflows, with responsive React interfaces connected to Node/Express services and MongoDB. The repository is private; a private demo is available during interviews.',
      capabilities: [
        'Authentication and player inventory',
        'Pack openings, battles, upgrades and trading',
        'Administrative workflows',
        'Responsive React interfaces connected to Node/Express services and MongoDB',
        'Activity logging and automated email notifications',
      ],
      highlights: [],
    },
  },
  {
    slug: 'logistics-ocr-extractor',
    index: '03',
    title: 'Logistics OCR Extractor',
    tag: 'Python · Tesseract · OCR · Image Processing',
    desc: 'Python/Tesseract OCR pipeline that extracts logistics information from images — preprocessing, OCR, text cleanup, validation, and accuracy handling.',
    repo: 'https://github.com/wvillantay/logistics-ocr-extractor',
    demo: null,
    featured: false,
    study: {
      role: null,
      status: null,
      year: null,
      stack: ['Python', 'Tesseract', 'OCR', 'Image processing'],
      overview:
        'A Python and Tesseract OCR project focused on extracting logistics information from images. The pipeline covers image preprocessing, OCR, text cleanup, validation, and accuracy handling.',
      capabilities: [
        'Image preprocessing ahead of recognition',
        'OCR with Tesseract',
        'Text cleanup of the raw OCR output',
        'Validation of the extracted information',
        'Accuracy handling',
      ],
      highlights: [],
    },
  },
  {
    slug: 'warehouse-vision-counter',
    index: '04',
    title: 'Warehouse Vision Counter',
    tag: 'Python · Computer Vision · Tesseract · Automation',
    desc: 'Python computer-vision project focused on warehouse visual counting and recognition workflows.',
    repo: 'https://github.com/wvillantay/warehouse-vision-counter',
    demo: null,
    featured: false,
    study: {
      role: null,
      status: null,
      year: null,
      stack: ['Python', 'Computer vision', 'Tesseract', 'Automation'],
      overview:
        'A Python computer-vision project focused on warehouse visual counting and recognition workflows.',
      capabilities: ['Visual counting workflows', 'Visual recognition workflows'],
      highlights: [],
    },
  },
  {
    slug: 'portfolio-engine',
    index: '05',
    title: 'Portfolio Engine',
    tag: 'React · GSAP · Tailwind CSS · Lenis',
    desc: 'Interactive developer portfolio with a scroll-scrubbed portrait sequence, GSAP motion system, responsive design, and cinematic transitions.',
    repo: 'private',
    demo: null,
    featured: false,
    study: {
      role: null,
      status: null,
      year: '2026',
      stack: ['React 19', 'Vite', 'Tailwind CSS v4', 'GSAP ScrollTrigger', 'Lenis'],
      overview:
        'This site. A pinned hero scrubs a 119-frame portrait sequence directly from scroll position, with a system-style loader, a cinematic handoff into the profile section, and a motion system built on GSAP ScrollTrigger and Lenis.',
      capabilities: [
        'Scroll-scrubbed frame sequence with eased pacing and a held final frame',
        'Real preload progress in the loader; nothing animates until every frame is decoded',
        'Float-rendered, dithered studio backdrop with no gradient banding',
        'Responsive from phone to desktop with the head kept in frame at every size',
      ],
      highlights: [],
    },
  },
  {
    slug: 'parking-availability-prototype',
    index: '06',
    title: 'Parking Availability Prototype',
    tag: 'C++ · Computer Vision',
    badge: '2nd Place', // full award text is in the case study
    desc: 'Camera-based prototype that identified license plates and updated an application with occupied and available parking spaces.',
    repo: null, // source no longer available — no repository state is shown
    demo: null,
    featured: false,
    earlier: true, // rendered in the "Earlier Engineering Work" block, not the main grid
    study: {
      role: 'Team Captain',
      award: '2nd Place, Irvine 36-Hour Hackathon',
      where: null,
      status: null,
      year: '2021',
      stack: ['C++', 'Computer vision'],
      overview:
        'A camera-based prototype built at the Irvine 36-Hour Hackathon, where the team took 2nd place. It identified license plates from the camera and updated an application with occupied and available parking spaces.',
      capabilities: [
        'Camera-based license-plate identification',
        'Occupied and available parking spaces',
        'Updates an application with the current availability',
      ],
      highlights: [],
    },
  },
  {
    slug: 'robotic-rover-arm',
    index: '07',
    title: 'Robotic Rover Arm',
    tag: 'Python · Applied Kinematics',
    desc: 'Forward and inverse kinematics for a rover arm — computing the gripper’s 3D position and converting target coordinates into joint angles.',
    repo: null, // source no longer available — no repository state is shown
    demo: null,
    featured: false,
    earlier: true, // rendered in the "Earlier Engineering Work" block, not the main grid
    study: {
      role: 'Team Captain',
      award: null,
      where: 'Irvine Valley College',
      status: null,
      year: '2021',
      stack: ['Python', 'Applied kinematics'],
      overview:
        'A robotic arm for a rover, with the kinematics implemented in Python. Forward kinematics calculates the gripper’s 3D position from the joint angles; inverse kinematics converts a target coordinate into the joint angles needed to reach it, using trigonometry and physics-based equations.',
      capabilities: [
        'Forward kinematics: joint angles → gripper 3D position',
        'Inverse kinematics: target coordinates → joint angles',
        'Trigonometry and physics-based equations for the arm model',
      ],
      highlights: [],
    },
  },
]
