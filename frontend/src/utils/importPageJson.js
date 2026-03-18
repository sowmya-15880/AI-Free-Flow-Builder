const GRID = 8;
const PAGE_WIDTH = 1120;
const SECTION_SIDE_PADDING = 32;

const snap = (value) => Math.max(0, Math.round((Number(value) || 0) / GRID) * GRID);
const makeId = (prefix = 'imp') => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const decodeHtml = (value) => {
  if (!value) return '';
  const text = String(value)
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
  return text;
};

const toPx = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = parseFloat(String(value).replace('px', ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseLineHeight = (value, fontSize, multiplier) => {
  if (typeof value === 'number') {
    if (value <= 10) return Math.max(fontSize * value, fontSize);
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return fontSize * multiplier;
    if (trimmed.endsWith('px')) return Math.max(toPx(trimmed, fontSize * multiplier), fontSize);
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      if (numeric <= 10) return Math.max(fontSize * numeric, fontSize);
      return numeric;
    }
  }
  return fontSize * multiplier;
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

const hasShadow = (element) => Array.isArray(element?.box_shadow)
  && element.box_shadow.some((shadow) => shadow && String(shadow.color || '').trim());

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

const buildBorder = (element) => {
  const border = element?.border;
  if (!border) return undefined;
  const style = border.style || '';
  const color = border.color || '';
  const width = border.width?.even_width || border.width?.top || '';
  if (!style || !color || !width) return undefined;
  return `${toPx(width, 1)}px ${style} ${color}`;
};

const getRadius = (element, fallback = 12) => `${toPx(element?.border?.radius?.size, fallback)}px`;

const hasVisualSurface = (element) => {
  const background = element?.background || {};
  return background.type === 'image'
    || (background.type === 'color' && !!background?.color?.background_color)
    || !!buildBorder(element)
    || hasShadow(element);
};

const createSurfaceElement = ({
  id,
  x,
  y,
  width,
  height,
  element,
  kind = 'box',
  content = {},
  meta = {},
}) => {
  const background = element?.background || {};
  const style = {
    width: `${Math.max(80, width)}px`,
    height: `${Math.max(32, height)}px`,
    backgroundColor: background?.color?.background_color || 'transparent',
    borderRadius: getRadius(element, 12),
    border: buildBorder(element),
    boxShadow: buildShadow(element),
  };
  if (background.type === 'image' && background.image?.image_url) {
    style.backgroundImage = `url(${background.image.image_url})`;
    style.backgroundSize = background.image.image_size || 'cover';
    style.backgroundPosition = (background.image.image_position || 'center').replace(/-/g, ' ');
    style.backgroundRepeat = 'no-repeat';
  }
  return {
    id: id || makeId(kind),
    type: kind,
    content: '',
    position: { x: snap(x), y: snap(y) },
    surface: true,
    ...meta,
    content,
    style,
  };
};

const estimateElementHeight = (element) => {
  if (!element) return 80;
  switch (element.type) {
    case 'heading': {
      const fontSize = toPx(element.style?.fontSize, 36);
      const lineHeight = parseLineHeight(element.style?.lineHeight, fontSize, 1.2);
      const chars = String(element.content || '').length;
      const approxLines = Math.max(1, Math.ceil(chars / 28));
      return Math.max(64, Math.ceil(lineHeight * approxLines) + 12);
    }
    case 'paragraph': {
      const fontSize = toPx(element.style?.fontSize, 16);
      const lineHeight = parseLineHeight(element.style?.lineHeight, fontSize, 1.6);
      const chars = String(element.content || '').length;
      const approxLines = Math.max(1, Math.ceil(chars / 52));
      return Math.max(48, Math.ceil(lineHeight * approxLines) + 8);
    }
    case 'button':
      return 56;
    case 'image':
      return Math.max(180, toPx(element.style?.height, toPx(element.style?.maxWidth, 280) * 0.68));
    case 'form':
      return 240;
    case 'box':
      return Math.max(40, toPx(element.style?.height, 160));
    case 'icon':
      return 72;
    case 'spacer':
      return toPx(element.style?.height, 40);
    default:
      return 80;
  }
};

const extractFontSize = (typography, fallback) => {
  return `${toPx(typography?.font?.size, fallback)}px`;
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
    padding: getPaddingShorthand(element.spacing?.padding),
  };
  if (background.type === 'image' && background.image?.image_url) {
    style.backgroundImage = `url(${background.image.image_url})`;
    style.backgroundSize = background.image.image_size || 'cover';
    style.backgroundPosition = (background.image.image_position || 'center').replace('-', ' ');
    style.backgroundRepeat = 'no-repeat';
  }
  return style;
};

const mapLeafNode = (node, x, y, width, meta = {}) => {
  const element = node.element || {};
  const spacing = getNodeSpacing(node);
  const marginTop = getSpacingValue(spacing.margin, 'top');
  const marginBottom = getSpacingValue(spacing.margin, 'bottom');
  const nextY = y + marginTop;
  const baseStyle = {
    textAlign: element.align || 'left',
  };

  if (node.type === 'heading') {
    const content = decodeHtml(element.content || 'Imported heading');
    const mapped = {
      id: makeId('heading'),
      type: 'heading',
      content,
      ...meta,
      position: { x: snap(x), y: snap(nextY) },
      style: {
        ...baseStyle,
        fontSize: extractFontSize(element.typography, 36),
        fontWeight: extractFontWeight(element.typography, 700),
        color: element.typography?.color || '#111827',
        lineHeight: element.typography?.line_height || '1.2',
        maxWidth: `${Math.max(240, width - 16)}px`,
      },
    };
    return { element: mapped, consumedHeight: estimateElementHeight(mapped) + marginTop + marginBottom + 12 };
  }

  if (node.type === 'text') {
    const content = decodeHtml(element.content || 'Imported text');
    const mapped = {
      id: makeId('paragraph'),
      type: 'paragraph',
      content,
      ...meta,
      position: { x: snap(x), y: snap(nextY) },
      style: {
        ...baseStyle,
        fontSize: extractFontSize(element.typography, 16),
        fontWeight: extractFontWeight(element.typography, 400),
        color: element.typography?.color || '#4b5563',
        lineHeight: element.typography?.line_height || '1.6',
        maxWidth: `${Math.max(240, width - 16)}px`,
      },
    };
    return { element: mapped, consumedHeight: estimateElementHeight(mapped) + marginTop + marginBottom + 10 };
  }

  if (node.type === 'button') {
    const content = decodeHtml(element.content || 'Click Here');
    const mapped = {
      id: makeId('button'),
      type: 'button',
      content,
      ...meta,
      position: { x: snap(x), y: snap(nextY) },
      style: {
        backgroundColor: element.background?.color?.background_color || element.button_bg?.color || '#2563eb',
        color: element.typography?.color || '#ffffff',
        padding: '12px 24px',
        borderRadius: `${toPx(element.border?.radius?.size, 12)}px`,
        fontSize: extractFontSize(element.typography, 15),
        fontWeight: extractFontWeight(element.typography, 700),
        textAlign: element.align || 'center',
        display: 'inline-block',
        border: buildBorder(element),
        boxShadow: buildShadow(element),
      },
    };
    return { element: mapped, consumedHeight: estimateElementHeight(mapped) + marginTop + marginBottom + 10 };
  }

  if (node.type === 'image') {
    const src = element.src || element.image_url || '';
    if (!src) return { element: null, consumedHeight: 0 };
    const maxWidth = Math.min(width - 16, toPx(element.desktop_width || element.width, width - 16) || (width - 16));
    const explicitHeight = toPx(element.desktop_height || element.height, 0);
    const mapped = {
      id: makeId('image'),
      type: 'image',
      ...meta,
      content: {
        src,
        alt: element.alt || 'Imported image',
      },
      position: { x: snap(x), y: snap(nextY) },
      style: {
        width: `${Math.max(180, maxWidth)}px`,
        maxWidth: `${Math.max(180, maxWidth)}px`,
        height: explicitHeight ? `${explicitHeight}px` : 'auto',
        borderRadius: element.style === 'circle' ? '999px' : `${toPx(element.border?.radius?.size, 12)}px`,
        display: 'block',
        objectFit: element.size === 'fit' ? 'contain' : 'cover',
        border: buildBorder(element),
        boxShadow: buildShadow(element),
      },
    };
    return { element: mapped, consumedHeight: estimateElementHeight(mapped) + marginTop + marginBottom + 16 };
  }

  if (node.type === 'lpform') {
    const mapped = {
      id: makeId('form'),
      type: 'form',
      ...meta,
      content: {
        fields: [
          { label: 'Name', type: 'text', placeholder: 'Enter your name' },
          { label: 'Email', type: 'email', placeholder: 'Enter your email' },
        ],
        submitText: 'Submit',
      },
      position: { x: snap(x), y: snap(nextY) },
      style: {
        padding: '24px',
        backgroundColor: element.input_bg?.color || '#ffffff',
        borderRadius: `${toPx(element.input_border?.radius?.size, 16)}px`,
        maxWidth: `${Math.max(280, width - 16)}px`,
        buttonBackgroundColor: element.button_bg?.color || '#2CB24C',
        buttonTextColor: element.button_typography?.color || '#ffffff',
        inputBackgroundColor: element.input_bg?.color || 'rgba(255,255,255,0.7)',
        inputTextColor: element.input_typography?.color || '#111827',
        inputBorderColor: element.input_border?.color || '#d1d5db',
        inputBorderRadius: `${toPx(element.input_border?.radius?.size, 12)}px`,
        border: buildBorder(element),
        boxShadow: buildShadow(element),
      },
    };
    return { element: mapped, consumedHeight: estimateElementHeight(mapped) + marginTop + marginBottom + 20 };
  }

  if (node.type === 'iconHeading') {
    const content = decodeHtml(element.heading_content || 'Imported item');
    const mapped = {
      id: makeId('heading'),
      type: 'heading',
      content,
      ...meta,
      position: { x: snap(x), y: snap(nextY) },
      style: {
        ...baseStyle,
        fontSize: extractFontSize(element.typography, 20),
        fontWeight: extractFontWeight(element.typography, 600),
        color: element.typography?.color || '#111827',
        lineHeight: element.typography?.line_height || '1.35',
        maxWidth: `${Math.max(180, width - 16)}px`,
      },
    };
    return { element: mapped, consumedHeight: estimateElementHeight(mapped) + marginTop + marginBottom + 8 };
  }

  if (node.type === 'spacer') {
    const height = toPx(element.height, 40);
    const mapped = {
      id: makeId('spacer'),
      type: 'spacer',
      content: '',
      ...meta,
      position: { x: snap(x), y: snap(nextY) },
      style: { height: `${height}px`, width: '100%' },
    };
    return { element: mapped, consumedHeight: height + marginTop + marginBottom };
  }

  return { element: null, consumedHeight: 0 };
};

const convertGraphPage = (rawPage) => {
  const elementsById = rawPage.elements || {};

  const processNode = (nodeId, layout, acc, parentMeta = {}) => {
    const node = elementsById[nodeId];
    if (!node) return 0;

    if (node.type === 'row') {
      const columns = node.columns || [];
      const nodeElement = node.element || {};
      const rowSpacing = getNodeSpacing(node);
      const marginTop = getSpacingValue(rowSpacing.margin, 'top');
      const marginBottom = getSpacingValue(rowSpacing.margin, 'bottom');
      const paddingLeft = getSpacingValue(rowSpacing.padding, 'left');
      const paddingRight = getSpacingValue(rowSpacing.padding, 'right');
      const paddingTop = getSpacingValue(rowSpacing.padding, 'top');
      const paddingBottom = getSpacingValue(rowSpacing.padding, 'bottom');
      const innerX = layout.x + paddingLeft;
      const innerWidth = Math.max(260, layout.width - paddingLeft - paddingRight);
      const ratios = parseRatioList(node.element?.column_ratio, columns.length);
      const ratioSum = ratios.reduce((sum, value) => sum + value, 0) || columns.length || 1;
      const rowId = node.elementId || makeId('row');
      const rowElement = createSurfaceElement({
        id: rowId,
        x: layout.x,
        y: layout.y + marginTop,
        width: layout.width,
        height: 48,
        element: nodeElement,
        kind: 'row',
        content: {
          columnIds: [],
          columnRatio: node.element?.column_ratio || Array.from({ length: columns.length }, () => 1).join(':'),
          equalColumnHeight: !!nodeElement.equal_column_height,
          verticalAlign: nodeElement.vertical_alignment || 'top',
          align: nodeElement.align || 'left',
          stretchFullWidth: !!nodeElement.stretch_full_width,
        },
        meta: parentMeta,
      });
      acc.push(rowElement);
      let offsetX = innerX;
      let rowHeight = 0;
      const columnIds = [];

      columns.forEach((columnId, index) => {
        const columnWidth = Math.round((innerWidth * ratios[index]) / ratioSum);
        const columnNode = elementsById[columnId];
        const resolvedColumnId = columnNode?.elementId || columnId || makeId('column');
        const consumed = processNode(
          columnId,
          { x: offsetX, y: layout.y + marginTop + paddingTop, width: columnWidth },
          acc,
          { ...parentMeta, parentRowId: rowId, columnRatio: ratios[index], columnIndex: index, explicitColumnId: resolvedColumnId }
        );
        rowHeight = Math.max(rowHeight, consumed);
        columnIds.push(resolvedColumnId);
        offsetX += columnWidth;
      });

      const totalRowHeight = rowHeight + paddingBottom;
      rowElement.content = { ...rowElement.content, columnIds };
      rowElement.style = {
        ...rowElement.style,
        width: `${Math.max(120, layout.width)}px`,
        height: `${Math.max(48, totalRowHeight)}px`,
      };

      return totalRowHeight + marginTop + marginBottom + paddingTop;
    }

    if (node.type === 'column' || node.type === 'box') {
      const children = node.elements || [];
      const nodeElement = node.element || {};
      const spacing = getNodeSpacing(node);
      const marginTop = getSpacingValue(spacing.margin, 'top');
      const marginBottom = getSpacingValue(spacing.margin, 'bottom');
      const paddingTop = getSpacingValue(spacing.padding, 'top');
      const paddingBottom = getSpacingValue(spacing.padding, 'bottom');
      const paddingLeft = getSpacingValue(spacing.padding, 'left');
      const paddingRight = getSpacingValue(spacing.padding, 'right');
      let cursorY = layout.y + marginTop + paddingTop;
      const innerX = layout.x + paddingLeft;
      const innerWidth = Math.max(220, layout.width - paddingLeft - paddingRight);
      const surfaceId = node.type === 'column'
        ? (parentMeta.explicitColumnId || node.elementId || makeId(node.type))
        : (node.elementId || makeId(node.type));
      const elementType = node.type === 'column' ? 'column' : 'box';
      const surfaceElement = createSurfaceElement({
        id: surfaceId,
        x: layout.x,
        y: layout.y + marginTop,
        width: layout.width,
        height: 48,
        element: nodeElement,
        kind: elementType,
        content: node.type === 'column'
          ? {
              ratio: parentMeta.columnRatio || 1,
              index: parentMeta.columnIndex || 0,
              parentRowId: parentMeta.parentRowId || null,
            }
          : {},
        meta: {
          parentRowId: parentMeta.parentRowId || null,
          parentColumnId: node.type === 'box' ? parentMeta.parentColumnId || null : null,
          parentBoxId: node.type === 'box' ? parentMeta.parentBoxId || null : null,
        },
      });
      acc.push(surfaceElement);

      children.forEach((childId) => {
        const childNode = elementsById[childId];
        if (!childNode) return;
        if (childNode.type === 'row' || childNode.type === 'column' || childNode.type === 'box') {
          const childMeta = node.type === 'column'
            ? {
                ...parentMeta,
                parentRowId: parentMeta.parentRowId || null,
                parentColumnId: surfaceId,
                explicitColumnId: null,
              }
            : {
                ...parentMeta,
                parentColumnId: parentMeta.parentColumnId || null,
                parentBoxId: surfaceId,
                explicitColumnId: null,
              };
          const consumed = processNode(childId, { x: innerX, y: cursorY, width: innerWidth }, acc, childMeta);
          cursorY += consumed + 12;
          return;
        }
        const mapped = mapLeafNode(childNode, innerX, cursorY, innerWidth, {
          parentRowId: parentMeta.parentRowId || null,
          parentColumnId: node.type === 'column' ? surfaceId : parentMeta.parentColumnId || null,
          parentBoxId: node.type === 'box' ? surfaceId : parentMeta.parentBoxId || null,
        });
        if (mapped.element) acc.push(mapped.element);
        cursorY += mapped.consumedHeight || 0;
      });

      const totalHeight = Math.max(0, cursorY - layout.y + paddingBottom + marginBottom);
      surfaceElement.style = {
        ...surfaceElement.style,
        width: `${Math.max(120, layout.width)}px`,
        height: `${Math.max(48, totalHeight - marginTop - marginBottom)}px`,
      };

      return totalHeight;
    }

    const mapped = mapLeafNode(node, layout.x, layout.y, layout.width, parentMeta);
    if (mapped.element) acc.push(mapped.element);
    return mapped.consumedHeight || 0;
  };

  const sections = (rawPage.sections || []).map((sectionId, sectionIndex) => {
    const sectionNode = elementsById[sectionId];
    if (!sectionNode) {
      return {
        id: makeId('section'),
        type: 'custom',
        style: { backgroundColor: '#ffffff', padding: '48px 24px' },
        elements: [],
      };
    }

    const importedElements = [];
    const rows = sectionNode.rows || [];
    let cursorY = 32;
    const contentWidth = PAGE_WIDTH - (SECTION_SIDE_PADDING * 2);

    rows.forEach((rowId) => {
      const consumed = processNode(rowId, { x: SECTION_SIDE_PADDING, y: cursorY, width: contentWidth }, importedElements);
      cursorY += consumed + 20;
    });

    return {
      id: sectionNode.element?.section_id || sectionNode.elementId || makeId(`section-${sectionIndex + 1}`),
      type: sectionNode.type || 'custom',
      style: deriveSectionStyle(sectionNode),
      elements: importedElements,
    };
  });

  const firstHeading = sections
    .flatMap((section) => section.elements)
    .find((element) => element.type === 'heading' && element.content);

  return {
    title: decodeHtml(firstHeading?.content || rawPage.title || 'Imported Landing Page'),
    sections,
  };
};

const normalizeBuilderPage = (page) => {
  const sections = (page.sections || []).map((section, sectionIndex) => ({
    id: section.id || makeId(`section-${sectionIndex + 1}`),
    type: section.type || 'custom',
    style: section.style || { backgroundColor: '#ffffff', padding: '48px 24px' },
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

  if (Array.isArray(page.sections) && page.sections.every((section) => section && typeof section === 'object' && !Array.isArray(section))) {
    return normalizeBuilderPage(page);
  }

  if (page.type === 'page' && Array.isArray(page.sections) && page.elements && typeof page.elements === 'object') {
    return convertGraphPage(page);
  }

  throw new Error('Unsupported landing page JSON format.');
};
