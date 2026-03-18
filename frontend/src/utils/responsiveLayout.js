const SNAP_GRID = 8;

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
const snap = (value) => Math.round(value / SNAP_GRID) * SNAP_GRID;

const parsePx = (value, fallback) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/-?\d+(\.\d+)?/);
    if (match) return Number(match[0]);
  }
  return fallback;
};

const parseLineHeight = (value, fontSize, multiplier) => {
  if (typeof value === 'number') {
    if (value <= 10) return Math.max(fontSize * value, fontSize);
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.endsWith('px')) return Math.max(parsePx(trimmed, fontSize * multiplier), fontSize);
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      if (numeric <= 10) return Math.max(fontSize * numeric, fontSize);
      return numeric;
    }
  }
  return fontSize * multiplier;
};

export const getElementPosition = (element, index) => {
  if (element?.position && typeof element.position.x === 'number' && typeof element.position.y === 'number') {
    return element.position;
  }
  return { x: 24, y: 36 + index * 120 };
};

export const estimateElementSize = (element, widthHint = 760) => {
  const style = element?.style || {};
  const type = (element?.type || '').toLowerCase();
  const content = element?.content;

  const width = clamp(parsePx(style.maxWidth, widthHint), 120, widthHint);

  if (type === 'image') {
    const imageWidth = clamp(parsePx(style.maxWidth, parsePx(style.width, widthHint)), 140, widthHint);
    const imageHeight = clamp(parsePx(style.height, imageWidth * 0.62), 110, 520);
    return { width: imageWidth, height: imageHeight };
  }

  if (type === 'gallery') {
    const columnsMatch = String(style.gridTemplateColumns || '').match(/repeat\((\d+)/i);
    const cols = clamp(columnsMatch ? Number(columnsMatch[1]) : 3, 1, 4);
    const gap = parsePx(style.gap, 12);
    const itemW = Math.max(72, (width - ((cols - 1) * gap)) / cols);
    const images = Array.isArray(content?.images) ? content.images.length : 3;
    const rows = Math.max(1, Math.ceil(images / cols));
    return { width, height: Math.max(110, (rows * itemW) + ((rows - 1) * gap)) };
  }

  if (type === 'form') {
    const fields = Array.isArray(content?.fields) ? content.fields.length : 3;
    return { width, height: 120 + (fields * 72) };
  }

  if (type === 'box') {
    return {
      width: clamp(parsePx(style.width, width), 80, widthHint),
      height: Math.max(40, parsePx(style.height, 160)),
    };
  }

  if (type === 'row' || type === 'column') {
    return {
      width: clamp(parsePx(style.width, width), 120, widthHint),
      height: Math.max(48, parsePx(style.height, 220)),
    };
  }

  if (type === 'button' || type === 'popup') {
    const text = typeof content === 'string' ? content : (content?.triggerText || 'Button');
    const fontSize = parsePx(style.fontSize, 16);
    const hPad = parsePx(style.padding, 28);
    const vPad = parsePx(style.padding, 12);
    const forceFullWidth = String(style.width || '').trim() === '100%';
    const buttonW = forceFullWidth
      ? width
      : clamp((text.length * (fontSize * 0.56)) + (hPad * 2), 120, Math.min(width, 320));
    return { width: buttonW, height: Math.max(42, (vPad * 2) + (fontSize * 1.2)) };
  }

  if (type === 'divider') {
    return { width, height: 18 };
  }

  if (type === 'spacer') {
    return { width, height: parsePx(style.height, 40) };
  }

  const fontSize = parsePx(style.fontSize, type === 'heading' ? 34 : 17);
  const lineHeight = parseLineHeight(style.lineHeight, fontSize, type === 'heading' ? 1.15 : 1.6);
  const text = typeof content === 'string' ? content : JSON.stringify(content || '');
  const charsPerLine = Math.max(14, width / Math.max(7, fontSize * (type === 'heading' ? 0.52 : 0.5)));
  const lineCount = clamp(Math.ceil((text.length || 1) / charsPerLine), 1, 20);
  const padding = type === 'heading' ? 20 : 16;
  return { width, height: Math.max(32, (lineCount * lineHeight) + padding) };
};

const withResponsiveStyle = (element, device, innerWidth) => {
  const style = { ...(element.style || {}) };

  if (device === 'mobile' && typeof style.fontSize === 'string' && style.fontSize.endsWith('px')) {
    const px = Number(style.fontSize.replace('px', ''));
    if (!Number.isNaN(px)) style.fontSize = `${Math.max(14, Math.min(px, element.type === 'heading' ? 56 : 22))}px`;
  }

  style.margin = '0';
  style.maxWidth = `${innerWidth}px`;
  if (element.type === 'image' || element.type === 'gallery' || element.type === 'form') {
    style.width = '100%';
  }
  if (element.type === 'heading' || element.type === 'paragraph') {
    style.textAlign = style.textAlign || 'left';
  }
  if (device === 'mobile' && (element.type === 'button' || element.type === 'popup')) {
    style.width = '100%';
    style.display = 'block';
    style.maxWidth = `${innerWidth}px`;
    style.textAlign = 'center';
    style.margin = '0 auto';
  }

  return { ...element, style };
};

export const buildSectionLayout = (section, device = 'desktop') => {
  const elements = section?.elements || [];
  if (device === 'desktop') {
    const maxBottom = elements.reduce((acc, el, idx) => {
      const pos = getElementPosition(el, idx);
      return Math.max(acc, pos.y + estimateElementSize(el, 760).height + 18);
    }, 0);
    return {
      orderedElements: elements,
      positionById: Object.fromEntries(elements.map((el, idx) => [el.id, getElementPosition(el, idx)])),
      elementById: Object.fromEntries(elements.map((el) => [el.id, el])),
      minHeight: Math.max(420, maxBottom + 36),
    };
  }

  const canvasWidth = device === 'tablet' ? 820 : 420;
  const sidePad = device === 'tablet' ? 24 : 14;
  const innerWidth = canvasWidth - (sidePad * 2);
  const gap = device === 'tablet' ? 18 : 14;

  const ordered = [...elements].sort((a, b) => {
    const pa = getElementPosition(a, 0);
    const pb = getElementPosition(b, 0);
    if (pa.y !== pb.y) return pa.y - pb.y;
    return pa.x - pb.x;
  });

  let currentY = 20;
  const positionById = {};
  const elementById = {};
  for (const element of ordered) {
    const responsiveElement = withResponsiveStyle(element, device, innerWidth);
    const size = estimateElementSize(responsiveElement, innerWidth);
    positionById[element.id] = { x: sidePad, y: snap(currentY) };
    elementById[element.id] = responsiveElement;
    currentY += size.height + gap;
  }

  return {
    orderedElements: ordered,
    positionById,
    elementById,
    minHeight: Math.max(240, snap(currentY + 20)),
  };
};
