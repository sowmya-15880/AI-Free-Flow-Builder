const GRID = 8;
const PAGE_WIDTH = 1120;
const SECTION_SIDE_PADDING = 32;

const snap = (value) => Math.max(0, Math.round((Number(value) || 0) / GRID) * GRID);
const makeId = (prefix = 'imp') => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const decodeHtml = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\u200b/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const toPx = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = parseFloat(String(value).replace('px', ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getSpacingValue = (spacing, edge) => {
  if (!spacing || typeof spacing !== 'object') return 0;
  if (spacing.even && spacing.size !== undefined && spacing.size !== '') return toPx(spacing.size, 0);
  return toPx(spacing[edge], 0);
};

const getPaddingShorthand = (spacing) => {
  if (!spacing || typeof spacing !== 'object') return '48px 24px';
  if (spacing.even && spacing.size !== undefined && spacing.size !== '') {
    const size = toPx(spacing.size, 0);
    return `${size}px`;
  }
  const top = getSpacingValue(spacing, 'top');
  const right = getSpacingValue(spacing, 'right');
  const bottom = getSpacingValue(spacing, 'bottom');
  const left = getSpacingValue(spacing, 'left');
  if (!top && !right && !bottom && !left) return '48px 24px';
  return `${top || 0}px ${right || 0}px ${bottom || 0}px ${left || 0}px`;
};

const parseRatioList = (ratio, count) => {
  if (!ratio || typeof ratio !== 'string') return Array.from({ length: count }, () => 1);
  const parts = ratio.split(':').map((part) => parseFloat(part) || 1);
  if (parts.length !== count) return Array.from({ length: count }, () => 1);
  return parts;
};

const getNodeSpacing = (node) => {
  const element = node?.element || {};
  return element.spacing || {};
};

const buildBorder = (element) => {
  const border = element?.border;
  if (!border) return undefined;
  const style = border.style || '';
  const color = border.color || '';
  const width = border.width?.even_width || border.width?.top || '';
  if (!style || !color || !width) return undefined;
  return `${toPx(width, 1)}px ${style} ${color}`;
};

const buildShadow = (element) => {
  const shadow = Array.isArray(element?.box_shadow) ? element.box_shadow[0] : null;
  if (!shadow || !shadow.color) return undefined;
  const x = toPx(shadow.offset_x, 0);
  const y = toPx(shadow.offset_y, 0);
  const blur = toPx(shadow.blur, 0);
  const spread = toPx(shadow.spread, 0);
  const inset = shadow.inset ? ' inset' : '';
  return `${x}px ${y}px ${blur}px ${spread}px ${shadow.color}${inset}`;
};

const getBackgroundColor = (element) => element?.background?.color?.background_color || '';

const getColorLuminance = (color) => {
  if (!color || typeof color !== 'string') return 1;
  const trimmed = color.trim();
  let r, g, b;
  if (trimmed.startsWith('#')) {
    const hex = trimmed.replace('#', '');
    const normalized = hex.length === 3
      ? hex.split('').map((c) => c + c).join('')
      : hex;
    if (normalized.length !== 6) return 1;
    r = parseInt(normalized.slice(0, 2), 16);
    g = parseInt(normalized.slice(2, 4), 16);
    b = parseInt(normalized.slice(4, 6), 16);
  } else {
    const match = trimmed.match(/rgba?\(([^)]+)\)/i);
    if (!match) return 1;
    const parts = match[1].split(',').map((p) => p.trim());
    if (parts.length < 3) return 1;
    r = Number(parts[0]);
    g = Number(parts[1]);
    b = Number(parts[2]);
  }
  const normalize = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (0.2126 * normalize(r)) + (0.7152 * normalize(g)) + (0.0722 * normalize(b));
};

const inferTone = ({ backgroundColor = '', hasImage = false, parentTone = 'light' }) => {
  if (hasImage) return 'dark';
  if (!backgroundColor) return parentTone;
  return getColorLuminance(backgroundColor) < 0.34 ? 'dark' : 'light';
};

const getLeafColor = (explicitColor, tone, fallbackLight = '#111827', fallbackDark = '#ffffff') => (
  explicitColor && explicitColor.trim() ? explicitColor : (tone === 'dark' ? fallbackDark : fallbackLight)
);

const getLeafFontSize = ({ nodeType, typography, width, tone }) => {
  const explicit = typography?.font?.size;
  if (explicit) return `${toPx(explicit, nodeType === 'heading' ? 36 : 16)}px`;
  if (nodeType === 'heading') {
    if (width >= 460) return tone === 'dark' ? '52px' : '40px';
    if (width >= 320) return '32px';
    return '26px';
  }
  return width >= 440 ? '18px' : '16px';
};

const extractFontWeight = (typography, fallback = 600) => {
  const value = typography?.font?.weight;
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : value;
};

const deriveSectionStyle = (sectionNode) => {
  const element = sectionNode?.element || {};
  const background = element.background || {};
  const backgroundColor = background?.color?.background_color || '#ffffff';
  const style = {
    backgroundColor,
    padding: '0',
  };
  if (background.type === 'image' && background.image?.image_url) {
    style.backgroundImage = `url(${background.image.image_url})`;
    style.backgroundSize = background.image.image_size || 'cover';
    style.backgroundPosition = (background.image.image_position || 'center').replace(/-/g, ' ');
    style.backgroundRepeat = 'no-repeat';
  }
  return style;
};

/**
 * Convert a hierarchical Zoho-style page JSON into a flat free-flow builder format.
 * All elements become absolutely positioned on the canvas with drag handles.
 */
const convertGraphPage = (rawPage) => {
  const elementsById = rawPage.elements || {};
  const contentWidth = PAGE_WIDTH - (SECTION_SIDE_PADDING * 2);

  const mapLeafNode = (node, x, y, width, tone) => {
    const element = node.element || {};
    const spacing = getNodeSpacing(node);
    const marginTop = getSpacingValue(spacing.margin, 'top');

    if (node.type === 'heading') {
      const content = decodeHtml(element.content || 'Imported heading');
      return {
        element: {
          id: makeId('heading'),
          type: 'heading',
          content,
          position: { x: snap(x), y: snap(y + marginTop) },
          style: {
            fontSize: getLeafFontSize({ nodeType: 'heading', typography: element.typography, width, tone }),
            fontWeight: extractFontWeight(element.typography, 700),
            color: getLeafColor(element.typography?.color, tone),
            lineHeight: element.typography?.line_height || '1.16',
            letterSpacing: '-0.02em',
            textAlign: element.align || 'left',
            maxWidth: `${Math.max(260, width)}px`,
          },
        },
        height: 80,
      };
    }

    if (node.type === 'text') {
      const content = decodeHtml(element.content || 'Imported text');
      return {
        element: {
          id: makeId('paragraph'),
          type: 'paragraph',
          content,
          position: { x: snap(x), y: snap(y + marginTop) },
          style: {
            fontSize: getLeafFontSize({ nodeType: 'text', typography: element.typography, width, tone }),
            fontWeight: extractFontWeight(element.typography, 400),
            color: getLeafColor(element.typography?.color, tone, '#4b5563', 'rgba(255,255,255,0.82)'),
            lineHeight: element.typography?.line_height || '1.6',
            textAlign: element.align || 'left',
            maxWidth: `${Math.max(240, width)}px`,
          },
        },
        height: 60,
      };
    }

    if (node.type === 'button') {
      const content = decodeHtml(element.content || 'Click Here');
      return {
        element: {
          id: makeId('button'),
          type: 'button',
          content,
          position: { x: snap(x), y: snap(y + marginTop) },
          style: {
            backgroundColor: element.background?.color?.background_color || element.button_bg?.color || (tone === 'dark' ? '#ffffff' : '#2563eb'),
            color: element.typography?.color || (tone === 'dark' ? '#111827' : '#ffffff'),
            padding: '12px 28px',
            borderRadius: `${toPx(element.border?.radius?.size, 8)}px`,
            fontSize: getLeafFontSize({ nodeType: 'button', typography: element.typography, width, tone }),
            fontWeight: extractFontWeight(element.typography, 700),
            textAlign: 'center',
            border: buildBorder(element),
          },
        },
        height: 56,
      };
    }

    if (node.type === 'image') {
      const src = element.src || element.image_url || '';
      if (!src) return { element: null, height: 0 };
      const maxWidth = Math.min(width, toPx(element.desktop_width || element.width, width));
      return {
        element: {
          id: makeId('image'),
          type: 'image',
          content: { src, alt: element.alt || 'Imported image' },
          position: { x: snap(x), y: snap(y + marginTop) },
          style: {
            width: `${Math.max(180, maxWidth)}px`,
            maxWidth: `${Math.max(180, maxWidth)}px`,
            borderRadius: element.style === 'circle' ? '999px' : `${toPx(element.border?.radius?.size, 12)}px`,
            objectFit: element.size === 'fit' ? 'contain' : 'cover',
            border: buildBorder(element),
            boxShadow: buildShadow(element),
          },
        },
        height: Math.max(180, toPx(element.desktop_height || element.height, maxWidth * 0.6)),
      };
    }

    if (node.type === 'lpform') {
      return {
        element: {
          id: makeId('form'),
          type: 'form',
          content: {
            fields: [
              { label: 'Name', type: 'text', placeholder: 'Enter your name' },
              { label: 'Email', type: 'email', placeholder: 'Enter your email' },
            ],
            submitText: 'Submit',
          },
          position: { x: snap(x), y: snap(y + marginTop) },
          style: {
            padding: '24px 20px',
            backgroundColor: element.input_bg?.color || '#ffffff',
            borderRadius: `${toPx(element.input_border?.radius?.size, 12)}px`,
            maxWidth: `${Math.max(280, width)}px`,
            buttonBackgroundColor: element.button_bg?.color || '#2CB24C',
            buttonTextColor: element.button_typography?.color || '#ffffff',
            inputBackgroundColor: element.input_bg?.color || '#ffffff',
            inputTextColor: '#111827',
            inputBorderColor: element.input_border?.color || '#d1d5db',
          },
        },
        height: 240,
      };
    }

    if (node.type === 'spacer') {
      const height = toPx(element.height, 40);
      return {
        element: {
          id: makeId('spacer'),
          type: 'spacer',
          content: '',
          position: { x: snap(x), y: snap(y + marginTop) },
          style: { height: `${height}px`, width: '100%' },
        },
        height,
      };
    }

    if (node.type === 'iconHeading') {
      const content = decodeHtml(element.heading_content || 'Imported item');
      return {
        element: {
          id: makeId('heading'),
          type: 'heading',
          content,
          position: { x: snap(x), y: snap(y + marginTop) },
          style: {
            fontSize: '18px',
            fontWeight: extractFontWeight(element.typography, 600),
            color: getLeafColor(element.typography?.color, tone),
            lineHeight: '1.35',
            textAlign: element.align || 'left',
            maxWidth: `${Math.max(200, width)}px`,
          },
        },
        height: 40,
      };
    }

    return { element: null, height: 0 };
  };

  const sections = (rawPage.sections || []).map((sectionId, sectionIndex) => {
    const sectionNode = elementsById[sectionId];
    if (!sectionNode) {
      return {
        id: makeId('section'),
        type: 'custom',
        style: { backgroundColor: '#ffffff', padding: '0' },
        elements: [],
      };
    }

    const sectionStyle = deriveSectionStyle(sectionNode);
    const sectionTone = inferTone({
      backgroundColor: sectionStyle.backgroundColor,
      hasImage: !!sectionStyle.backgroundImage,
      parentTone: 'light',
    });

    const flatElements = [];
    const rows = sectionNode.rows || [];
    let cursorY = 32;

    rows.forEach((rowId) => {
      const rowNode = elementsById[rowId];
      if (!rowNode) return;

      const columns = rowNode.columns || [];
      const ratios = parseRatioList(rowNode.element?.column_ratio, columns.length);
      const ratioSum = ratios.reduce((s, v) => s + v, 0) || 1;

      let colOffsetX = SECTION_SIDE_PADDING;
      let maxColHeight = 0;

      columns.forEach((colId, colIdx) => {
        const colNode = elementsById[colId];
        if (!colNode) return;

        const colWidth = Math.round((contentWidth * ratios[colIdx]) / ratioSum);
        const children = colNode.elements || [];
        let innerY = cursorY;

        children.forEach((childId) => {
          const childNode = elementsById[childId];
          if (!childNode) return;

          // Handle nested boxes
          if (childNode.type === 'box') {
            const boxChildren = childNode.elements || [];
            boxChildren.forEach((boxChildId) => {
              const boxChild = elementsById[boxChildId];
              if (!boxChild) return;
              const mapped = mapLeafNode(boxChild, colOffsetX + 16, innerY, colWidth - 32, sectionTone);
              if (mapped.element) {
                flatElements.push(mapped.element);
                innerY += mapped.height + 12;
              }
            });
            return;
          }

          // Handle nested rows
          if (childNode.type === 'row') {
            const nestedCols = childNode.columns || [];
            const nestedRatios = parseRatioList(childNode.element?.column_ratio, nestedCols.length);
            const nestedRatioSum = nestedRatios.reduce((s, v) => s + v, 0) || 1;
            let nestedX = colOffsetX;
            let nestedMaxH = 0;

            nestedCols.forEach((ncId, ncIdx) => {
              const ncNode = elementsById[ncId];
              if (!ncNode) return;
              const ncWidth = Math.round((colWidth * nestedRatios[ncIdx]) / nestedRatioSum);
              let ncY = innerY;
              (ncNode.elements || []).forEach((ncChildId) => {
                const ncChild = elementsById[ncChildId];
                if (!ncChild) return;
                const mapped = mapLeafNode(ncChild, nestedX, ncY, ncWidth - 16, sectionTone);
                if (mapped.element) {
                  flatElements.push(mapped.element);
                  ncY += mapped.height + 12;
                }
              });
              nestedMaxH = Math.max(nestedMaxH, ncY - innerY);
              nestedX += ncWidth;
            });
            innerY += nestedMaxH + 16;
            return;
          }

          const mapped = mapLeafNode(childNode, colOffsetX, innerY, colWidth - 16, sectionTone);
          if (mapped.element) {
            flatElements.push(mapped.element);
            innerY += mapped.height + 12;
          }
        });

        maxColHeight = Math.max(maxColHeight, innerY - cursorY);
        colOffsetX += colWidth;
      });

      cursorY += maxColHeight + 24;
    });

    return {
      id: sectionNode.element?.section_id || sectionNode.elementId || makeId(`section-${sectionIndex + 1}`),
      type: sectionNode.type || 'custom',
      style: sectionStyle,
      elements: flatElements,
    };
  });

  const firstHeading = sections
    .flatMap((s) => s.elements)
    .find((el) => el.type === 'heading' && el.content);

  return {
    title: decodeHtml(firstHeading?.content || rawPage.title || 'Imported Landing Page'),
    sections,
  };
};

const normalizeBuilderPage = (page) => {
  const sections = (page.sections || []).map((section, sectionIndex) => ({
    id: section.id || makeId(`section-${sectionIndex + 1}`),
    type: section.type || 'custom',
    style: section.style || { backgroundColor: '#ffffff', padding: '0' },
    elements: (section.elements || []).map((element, elementIndex) => ({
      ...element,
      id: element.id || makeId(element.type || `element-${elementIndex + 1}`),
      type: element.type === 'text' ? 'paragraph' : element.type,
      position: element.position || { x: 24, y: 36 + (elementIndex * 120) },
    })),
  }));

  return {
    title: page.title || 'Imported Landing Page',
    sections,
  };
};

export const importLandingPageJson = (raw) => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid JSON document.');
  }

  const page = raw.page && typeof raw.page === 'object' ? raw.page : raw;

  // Check for flat builder format first (sections with element arrays)
  if (Array.isArray(page.sections) && page.sections.every((section) => section && typeof section === 'object' && !Array.isArray(section))) {
    // Check if it's actually a Zoho hierarchical format (sections are string IDs referencing elements map)
    if (page.type === 'page' && page.elements && typeof page.elements === 'object' && page.sections.length > 0 && typeof page.sections[0] === 'string') {
      return convertGraphPage(page);
    }
    return normalizeBuilderPage(page);
  }

  // Zoho hierarchical format
  if (page.type === 'page' && Array.isArray(page.sections) && page.elements && typeof page.elements === 'object') {
    return convertGraphPage(page);
  }

  throw new Error('Unsupported landing page JSON format.');
};
