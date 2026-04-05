const uid = () => Math.random().toString(36).slice(2, 11);

const createElement = (type, content, position, style = {}, extra = {}) => ({
  id: uid(),
  type,
  content,
  position,
  style,
  ...extra,
});

const createSection = ({ type, style, elements }) => ({
  id: uid(),
  type,
  style,
  elements,
});

const THEMES = {
  clean: {
    heroBg: '#0f172a',
    heroSub: '#cbd5e1',
    accent: '#0ea5e9',
    accentSoft: '#e0f2fe',
    sectionBg: '#ffffff',
    mutedBg: '#f8fafc',
    title: '#0f172a',
    body: '#475569',
  },
  executive: {
    heroBg: '#111827',
    heroSub: '#d1d5db',
    accent: '#14b8a6',
    accentSoft: '#ccfbf1',
    sectionBg: '#ffffff',
    mutedBg: '#f8fafc',
    title: '#111827',
    body: '#4b5563',
  },
  showcase: {
    heroBg: '#172554',
    heroSub: '#dbeafe',
    accent: '#f97316',
    accentSoft: '#ffedd5',
    sectionBg: '#ffffff',
    mutedBg: '#f8fafc',
    title: '#0f172a',
    body: '#475569',
  },
};

const STARTER_TEMPLATES = [
  {
    id: 'clean-saas',
    name: 'Clean Product',
    description: 'A polished product landing page with a strong hero and feature grid.',
    theme: 'clean',
    pageType: 'product_info',
    audience: 'Product teams and business buyers',
    productName: 'Northstar Suite',
    productDescription: 'A modern workspace for planning, shipping, and reviewing high-quality product work.',
  },
  {
    id: 'executive-leads',
    name: 'Lead Capture',
    description: 'A conversion-focused page with a clear value proposition and call-to-action.',
    theme: 'executive',
    pageType: 'lead_generation',
    audience: 'Growth teams and operations leads',
    productName: 'LeadBridge',
    productDescription: 'A practical system for collecting qualified leads, routing follow-ups, and tracking outcomes.',
  },
  {
    id: 'event-launch',
    name: 'Event Registration',
    description: 'A launch-style page for events, webinars, and registrations.',
    theme: 'showcase',
    pageType: 'webinar_registration',
    audience: 'Professionals looking for live sessions and useful takeaways',
    productName: 'Momentum Sessions',
    productDescription: 'A live event series featuring tactical sessions, demos, and real-world case studies.',
  },
];

const featureCopy = ({ productName, audience }) => [
  {
    title: 'Clear positioning',
    body: `${productName} opens with a focused message so ${audience.toLowerCase()} immediately understand the value.`
  },
  {
    title: 'Practical structure',
    body: 'Use sections for proof, workflow, and calls-to-action so the page is easy to scan and easy to edit later.'
  },
  {
    title: 'Builder-friendly layout',
    body: 'Every element is positioned so it loads cleanly into the canvas and can be moved or restyled without cleanup.'
  },
];

export const createStarterPage = ({
  pageType = 'product_info',
  audience = 'Product teams and business buyers',
  productName = 'Northstar Suite',
  productDescription = 'A polished platform for showcasing your product and guiding visitors to the next step.',
  prompt = '',
  theme = 'clean',
} = {}) => {
  const palette = THEMES[theme] || THEMES.clean;
  const productLabel = productName.trim() || 'Product Name';
  const audienceLabel = audience.trim() || 'Your audience';
  const description = productDescription.trim() || 'A polished platform for showcasing your product and guiding visitors to the next step.';
  const notes = prompt.trim();
  const pageTitle = `${productLabel} Landing Page`;
  const heroEyebrow = pageType === 'webinar_registration' ? 'Upcoming Session' : pageType === 'lead_generation' ? 'Lead Generation' : 'Product Overview';

  const heroSection = createSection({
    type: 'hero',
    style: {
      backgroundColor: palette.heroBg,
      padding: '72px 0 88px',
      minHeight: '680px',
    },
    elements: [
      createElement('paragraph', heroEyebrow.toUpperCase(), { x: 72, y: 72 }, {
        fontSize: '14px', color: palette.accentSoft, letterSpacing: '0.16em', fontWeight: '700', textTransform: 'uppercase'
      }),
      createElement('heading', `${productLabel} helps ${audienceLabel.toLowerCase()} move faster`, { x: 72, y: 114 }, {
        fontSize: '62px', lineHeight: '1.08', fontWeight: '800', color: '#ffffff', maxWidth: '560px'
      }),
      createElement('paragraph', description, { x: 72, y: 352 }, {
        fontSize: '20px', lineHeight: '1.7', color: palette.heroSub, maxWidth: '560px'
      }),
      createElement('button', 'Get Started', { x: 72, y: 504 }, {
        backgroundColor: palette.accent,
        color: '#ffffff',
        padding: '16px 34px',
        borderRadius: '14px',
        fontWeight: '700',
        fontSize: '16px',
        border: 'none',
        boxShadow: `0 18px 40px ${palette.accent}33`,
      }),
      createElement('button', 'Book a Demo', { x: 256, y: 504 }, {
        backgroundColor: 'transparent',
        color: '#ffffff',
        padding: '16px 34px',
        borderRadius: '14px',
        fontWeight: '700',
        fontSize: '16px',
        border: '1px solid rgba(255,255,255,0.22)',
      }),
      createElement('image', {
        src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
        alt: `${productLabel} hero visual`,
      }, { x: 700, y: 94 }, {
        width: '500px',
        height: '420px',
        objectFit: 'cover',
        borderRadius: '28px',
        boxShadow: '0 28px 56px rgba(15, 23, 42, 0.32)',
      }),
    ],
  });

  const features = featureCopy({ productName: productLabel, audience: audienceLabel });
  const featureSection = createSection({
    type: 'features',
    style: {
      backgroundColor: palette.sectionBg,
      padding: '84px 0',
      minHeight: '640px',
    },
    elements: [
      createElement('heading', 'Why teams choose this layout', { x: 72, y: 60 }, {
        fontSize: '42px', fontWeight: '800', color: palette.title, maxWidth: '520px'
      }),
      createElement('paragraph', 'A practical starter page with a clear hero, supporting proof, and room to keep shaping the story inside the builder.', { x: 72, y: 140 }, {
        fontSize: '18px', lineHeight: '1.7', color: palette.body, maxWidth: '680px'
      }),
      ...features.flatMap((feature, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const x = 72 + column * 360;
        const y = 260 + row * 220;
        return [
          createElement('box', { tone: 'light' }, { x, y }, {
            width: '320px',
            height: '180px',
            backgroundColor: palette.mutedBg,
            borderRadius: '22px',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)',
          }, { surface: true }),
          createElement('heading', feature.title, { x: x + 28, y: y + 24 }, {
            fontSize: '24px', fontWeight: '700', color: palette.title, maxWidth: '260px'
          }),
          createElement('paragraph', feature.body, { x: x + 28, y: y + 78 }, {
            fontSize: '15px', lineHeight: '1.72', color: palette.body, maxWidth: '260px'
          }),
        ];
      }),
    ],
  });

  const workflowSection = createSection({
    type: 'workflow',
    style: {
      backgroundColor: palette.mutedBg,
      padding: '88px 0',
      minHeight: '620px',
    },
    elements: [
      createElement('heading', 'Built to keep momentum high', { x: 72, y: 76 }, {
        fontSize: '42px', fontWeight: '800', color: palette.title, maxWidth: '520px'
      }),
      createElement('paragraph', notes || 'Use this starter as a working draft, then move elements freely, restyle sections, and export the finished page when you are ready.', { x: 72, y: 152 }, {
        fontSize: '18px', lineHeight: '1.7', color: palette.body, maxWidth: '560px'
      }),
      createElement('image', {
        src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
        alt: 'Collaborative workspace',
      }, { x: 760, y: 82 }, {
        width: '420px', height: '340px', objectFit: 'cover', borderRadius: '26px'
      }),
      createElement('paragraph', '1. Start with a starter layout or imported JSON', { x: 72, y: 320 }, {
        fontSize: '16px', color: palette.title, fontWeight: '700'
      }),
      createElement('paragraph', '2. Move, duplicate, and edit elements directly on the canvas', { x: 72, y: 366 }, {
        fontSize: '16px', color: palette.title, fontWeight: '700'
      }),
      createElement('paragraph', '3. Preview responsive layouts and export JSON or HTML', { x: 72, y: 412 }, {
        fontSize: '16px', color: palette.title, fontWeight: '700'
      }),
    ],
  });

  const ctaSection = createSection({
    type: 'cta',
    style: {
      backgroundColor: palette.sectionBg,
      padding: '84px 0 104px',
      minHeight: '420px',
    },
    elements: [
      createElement('heading', `Ready to shape ${productLabel}?`, { x: 72, y: 72 }, {
        fontSize: '48px', fontWeight: '800', color: palette.title, maxWidth: '620px'
      }),
      createElement('paragraph', 'This page is intentionally editable. Swap content, move sections, add rows or columns, and export the result when the story feels right.', { x: 72, y: 154 }, {
        fontSize: '18px', lineHeight: '1.7', color: palette.body, maxWidth: '720px'
      }),
      createElement('button', 'Open Builder and Edit', { x: 72, y: 264 }, {
        backgroundColor: palette.accent,
        color: '#ffffff',
        padding: '16px 36px',
        borderRadius: '14px',
        fontWeight: '700',
        fontSize: '16px',
        border: 'none',
      }),
    ],
  });

  return {
    title: pageTitle,
    sections: [heroSection, featureSection, workflowSection, ctaSection],
  };
};

export const getStarterTemplates = () => STARTER_TEMPLATES;

export const createBlankPage = () => ({
  title: 'Untitled Landing Page',
  sections: [
    createSection({
      type: 'custom',
      style: { backgroundColor: '#ffffff', padding: '64px 0', minHeight: '720px' },
      elements: [
        createElement('heading', 'Start building your page', { x: 72, y: 72 }, {
          fontSize: '48px', fontWeight: '800', color: '#0f172a', maxWidth: '540px'
        }),
        createElement('paragraph', 'Use the left sidebar to add sections, rows, columns, media, forms, and content blocks. You can also import an existing JSON file to keep working from a saved document.', { x: 72, y: 156 }, {
          fontSize: '18px', lineHeight: '1.72', color: '#475569', maxWidth: '700px'
        }),
      ],
    }),
  ],
});
