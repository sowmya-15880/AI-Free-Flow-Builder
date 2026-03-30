import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { initRustCanvasEngine, tryApplyRustMutation } from '@/lib/rustCanvasEngine';
import { estimateElementSize } from '@/utils/responsiveLayout';

const BuilderContext = createContext();

const generateId = () => Math.random().toString(36).substring(2, 11);
const SNAP_GRID = 8;
const DEFAULT_LEFT = 24;
const DEFAULT_TOP_BASE = 36;
const DEFAULT_TOP_GAP = 120;
const COLLISION_GAP = 16;
const SECTION_WIDTH_HINT = 760;

const snapToGrid = (value) => Math.round(value / SNAP_GRID) * SNAP_GRID;
const getDefaultPosition = (index = 0) => ({
  x: DEFAULT_LEFT,
  y: DEFAULT_TOP_BASE + (index * DEFAULT_TOP_GAP),
});

// Helper: Check if page uses hierarchical (Zoho) format
const isHierarchicalPage = (page) => !!page?.elements && Object.keys(page.elements || {}).length > 0;

// Helper: Get element from hierarchy or flat structure
const getElementById = (page, elementId) => {
  if (isHierarchicalPage(page) && page.elements[elementId]) {
    return page.elements[elementId];
  }
  // Search in flat structure
  for (const section of page.sections || []) {
    const el = section.elements?.find(e => e.id === elementId);
    if (el) return el;
  }
  return null;
};

// Helper: Get all children of an element (for hierarchical rendering)
const getElementChildren = (page, elementId) => {
  if (!isHierarchicalPage(page)) return [];
  const element = page.elements[elementId];
  if (!element) return [];
  
  const childIds = [
    ...(element.children || []),
    ...(element.columns || []),
    ...(element.elements || [])
  ];
  
  return childIds.map(id => page.elements[id]).filter(Boolean);
};

// Helper: Get device-specific style for an element
const getDeviceStyle = (element, device = 'desktop') => {
  const baseStyle = element?.style || {};
  if (device === 'mobile' && element?.mobile_style) {
    return { ...baseStyle, ...element.mobile_style };
  }
  if (device === 'tablet' && element?.tablet_style) {
    return { ...baseStyle, ...element.tablet_style };
  }
  return baseStyle;
};

const ensureElementPosition = (element, index = 0) => {
  if (element?.position && typeof element.position.x === 'number' && typeof element.position.y === 'number') {
    return {
      ...element,
      position: {
        x: snapToGrid(element.position.x),
        y: snapToGrid(element.position.y),
      }
    };
  }
  const defaultPos = getDefaultPosition(index);
  return { ...element, position: defaultPos };
};

const isSurfaceElement = (element) => !!element?.surface;
const isBlockingElement = (element) => !isSurfaceElement(element) && element?.type !== 'spacer';

const buildRect = (element, position, widthHint = SECTION_WIDTH_HINT) => {
  const size = estimateElementSize(element, widthHint);
  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  };
};

const rectsOverlap = (a, b) => (
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y
);

const resolveElementCollisions = (elements = [], prioritizedElementId = null) => {
  const positioned = elements.map((element, index) => ensureElementPosition(element, index));
  const sorted = [...positioned].sort((left, right) => {
    if (prioritizedElementId && left.id !== right.id) {
      if (left.id === prioritizedElementId) return 1;
      if (right.id === prioritizedElementId) return -1;
    }
    const leftPos = left.position || getDefaultPosition(0);
    const rightPos = right.position || getDefaultPosition(0);
    if (leftPos.y !== rightPos.y) return leftPos.y - rightPos.y;
    return leftPos.x - rightPos.x;
  });

  const resolved = [];
  const blockingRects = [];

  sorted.forEach((element) => {
    if (!isBlockingElement(element)) {
      resolved.push(element);
      return;
    }

    let nextPosition = {
      x: snapToGrid(element.position.x),
      y: snapToGrid(element.position.y),
    };
    let nextRect = buildRect(element, nextPosition);
    let overlap = blockingRects.find((rect) => rectsOverlap(nextRect, rect));

    while (overlap) {
      nextPosition = {
        ...nextPosition,
        y: snapToGrid(overlap.y + overlap.height + COLLISION_GAP),
      };
      nextRect = buildRect(element, nextPosition);
      overlap = blockingRects.find((rect) => rectsOverlap(nextRect, rect));
    }

    const resolvedElement = {
      ...element,
      position: nextPosition,
    };

    resolved.push(resolvedElement);
    blockingRects.push(nextRect);
  });

  return resolved;
};

// Helper: Create default element with all necessary properties
export const createDefaultElement = (type) => {
  const id = generateId();
  const defaults = {
    heading: {
      id, type: 'heading', content: 'New Heading',
      style: { fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left', padding: '8px 16px' }
    },
    paragraph: {
      id, type: 'paragraph', content: 'Enter your paragraph text here. Click to edit this content and make it your own.',
      style: { fontSize: '16px', color: '#4b5563', lineHeight: '1.7', textAlign: 'left', padding: '8px 16px' }
    },
    image: {
      id, type: 'image',
      content: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', alt: 'Placeholder image' },
      style: { width: '100%', maxWidth: '600px', borderRadius: '8px', margin: '0 auto', display: 'block' }
    },
    button: {
      id, type: 'button', content: 'Click Me',
      style: { backgroundColor: '#6366f1', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'inline-block', textAlign: 'center', margin: '8px 16px' }
    },
    form: {
      id, type: 'form',
      content: {
        fields: [
          { label: 'Full Name', type: 'text', placeholder: 'Enter your name' },
          { label: 'Email Address', type: 'email', placeholder: 'Enter your email' },
          { label: 'Message', type: 'textarea', placeholder: 'Your message...' }
        ],
        submitText: 'Send Message'
      },
      style: { padding: '28px', backgroundColor: '#f8fafc', borderRadius: '12px', maxWidth: '500px', margin: '0 auto' }
    },
    icon: {
      id, type: 'icon',
      content: { name: 'Star', size: 48 },
      style: { color: '#6366f1', textAlign: 'center', padding: '16px' }
    },
    popup: {
      id, type: 'popup',
      content: { triggerText: 'Open Popup', title: 'Popup Title', body: 'This is the popup content. Edit it in the properties panel.' },
      style: { backgroundColor: '#6366f1', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', display: 'inline-block', margin: '8px 16px', cursor: 'pointer', fontWeight: '600' }
    },
    gallery: {
      id, type: 'gallery',
      content: {
        images: [
          { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80', alt: 'Gallery 1' },
          { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80', alt: 'Gallery 2' },
          { src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&q=80', alt: 'Gallery 3' },
        ]
      },
      style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px' }
    },
    row: {
      id, type: 'row', surface: true,
      content: { columnRatio: '6:6', equalColumnHeight: false, verticalAlign: 'top', align: 'left', stretchFullWidth: false },
      style: { width: '960px', height: '220px', backgroundColor: 'transparent', border: '1px dashed rgba(120, 134, 156, 0.5)', borderRadius: '8px' }
    },
    column: {
      id, type: 'column', surface: true,
      content: { ratio: 6, index: 0 },
      style: { width: '460px', height: '220px', backgroundColor: 'transparent', border: '1px dashed rgba(120, 134, 156, 0.4)', borderRadius: '8px' }
    },
    box: {
      id, type: 'box', surface: true,
      content: { tone: 'light' },
      style: { width: '420px', height: '240px', backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.35)', boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)' }
    },
    divider: {
      id, type: 'divider', content: '',
      style: { borderTop: '1px solid #e5e7eb', margin: '16px 0', width: '100%' }
    },
    spacer: {
      id, type: 'spacer', content: '',
      style: { height: '40px', width: '100%' }
    },
  };
  return defaults[type] || defaults.paragraph;
};

// Flat structure conversion helpers
const resolveSectionLayout = (section, prioritizedElementId = null) => ({
  ...section,
  elements: resolveElementCollisions(section.elements || [], prioritizedElementId),
});

const ensurePagePositions = (page) => ({
  ...page,
  sections: (page.sections || []).map((section) => resolveSectionLayout(section)),
});

const MAX_HISTORY = 50;

const pushHistory = (state, newPage) => {
  const newHistory = [...state.history.slice(0, state.historyIndex + 1), JSON.parse(JSON.stringify(newPage))].slice(-MAX_HISTORY);
  return { history: newHistory, historyIndex: newHistory.length - 1 };
};

const builderReducer = (state, action) => {
  let newPage;

  switch (action.type) {
    case 'SET_PAGE': {
      const page = action.payload || { title: '', sections: [] };
      // Always use flat structure - imported pages should be pre-converted
      newPage = ensurePagePositions({
        title: page.title || '',
        sections: (page.sections || []).map(s => ({
          ...s,
          id: s.id || generateId(),
          type: s.type || 'custom',
          style: s.style || { backgroundColor: '#ffffff', padding: '0' },
          elements: (s.elements || []).map((el, idx) => ({
            ...el,
            id: el.id || generateId(),
            type: el.type === 'text' ? 'paragraph' : el.type,
            position: el.position || { x: 24, y: 36 + idx * 120 },
          })),
        })),
      });
      return {
        ...state,
        page: newPage,
        history: [JSON.parse(JSON.stringify(newPage))],
        historyIndex: 0,
        selectedElementId: null,
        selectedSectionId: null,
        deviceView: 'desktop',
      };
    }

    case 'SET_DEVICE_VIEW': {
      // Change device view (desktop, tablet, mobile)
      return {
        ...state,
        deviceView: action.device || 'desktop'
      };
    }

    case 'ADD_ELEMENT_TO_HIERARCHY': {
      // Add element to parent in hierarchical structure
      const { parentId, element: newElement } = action;
      const element = newElement || createDefaultElement(action.elementType);
      element.id = element.id || generateId();
      element.parent_id = parentId;

      newPage = {
        ...state.page,
        elements: {
          ...state.page.elements,
          [element.id]: element
        }
      };

      // Add to parent's children list
      if (parentId && newPage.elements[parentId]) {
        const parent = newPage.elements[parentId];
        const elemType = parent.element_type;
        if (elemType === 'row' && element.element_type === 'column') {
          parent.columns = [...(parent.columns || []), element.id];
        } else if (elemType === 'column') {
          parent.elements = [...(parent.elements || []), element.id];
        } else if (elemType === 'box') {
          parent.children = [...(parent.children || []), element.id];
        }
      }

      return {
        ...state,
        page: newPage,
        ...pushHistory(state, newPage),
        selectedElementId: element.id
      };
    }

    case 'UPDATE_ELEMENT_HIERARCHY': {
      // Update element in hierarchical structure
      const { elementId, updates } = action;
      const element = state.page.elements[elementId];
      if (!element) return state;

      const updated = { ...element, ...updates };
      if (updates.style) {
        updated.style = { ...element.style, ...updates.style };
      }

      newPage = {
        ...state.page,
        elements: {
          ...state.page.elements,
          [elementId]: updated
        }
      };

      return {
        ...state,
        page: newPage,
        ...pushHistory(state, newPage)
      };
    }

    case 'DELETE_ELEMENT_HIERARCHY': {
      // Delete element and all children from hierarchical structure
      const { elementId } = action;
      const toDelete = [elementId];
      const newElements = { ...state.page.elements };

      // Collect all descendants
      const collectDescendants = (id) => {
        const el = newElements[id];
        if (!el) return;
        [...(el.children || []), ...(el.columns || []), ...(el.elements || [])].forEach(childId => {
          toDelete.push(childId);
          collectDescendants(childId);
        });
      };
      collectDescendants(elementId);

      // Remove from parent
      const element = newElements[elementId];
      if (element?.parent_id) {
        const parent = newElements[element.parent_id];
        if (parent) {
          parent.children = (parent.children || []).filter(id => id !== elementId);
          parent.columns = (parent.columns || []).filter(id => id !== elementId);
          parent.elements = (parent.elements || []).filter(id => id !== elementId);
        }
      }

      // Delete all
      toDelete.forEach(id => delete newElements[id]);

      newPage = { ...state.page, elements: newElements };
      return {
        ...state,
        page: newPage,
        ...pushHistory(state, newPage),
        selectedElementId: null
      };
    }

    case 'SET_PAGE_FROM_RUST': {
      newPage = action.payload;
      return {
        ...state,
        page: newPage,
        ...pushHistory(state, newPage),
        selectedElementId: action.selectedElementId !== undefined ? action.selectedElementId : state.selectedElementId,
        selectedSectionId: action.selectedSectionId !== undefined ? action.selectedSectionId : state.selectedSectionId,
      };
    }

    case 'ADD_SECTION': {
      const newSection = action.section || {
        id: generateId(),
        type: 'custom',
        style: { backgroundColor: '#ffffff', padding: '60px 20px' },
        elements: []
      };
      if (!newSection.id) newSection.id = generateId();
      const idx = action.afterIndex !== undefined ? action.afterIndex + 1 : state.page.sections.length;
      const sections = [...state.page.sections];
      sections.splice(idx, 0, newSection);
      newPage = { ...state.page, sections };
      return { ...state, page: newPage, ...pushHistory(state, newPage), selectedSectionId: newSection.id };
    }

    case 'REMOVE_SECTION': {
      newPage = { ...state.page, sections: state.page.sections.filter(s => s.id !== action.sectionId) };
      return { ...state, page: newPage, ...pushHistory(state, newPage), selectedSectionId: null, selectedElementId: null };
    }

    case 'ADD_ELEMENT': {
      const targetSection = state.page.sections.find(s => s.id === action.sectionId);
      const newIndex = targetSection?.elements?.length || 0;
      const baseElement = action.element || createDefaultElement(action.elementType);
      const element = ensureElementPosition(baseElement, newIndex);
      newPage = {
        ...state.page,
        sections: state.page.sections.map(s =>
          s.id === action.sectionId ? resolveSectionLayout({ ...s, elements: [...s.elements, element] }, element.id) : s
        )
      };
      return { ...state, page: newPage, ...pushHistory(state, newPage), selectedElementId: element.id, selectedSectionId: action.sectionId };
    }

    case 'REMOVE_ELEMENT': {
      newPage = {
        ...state.page,
        sections: state.page.sections.map(s => ({
          ...s, elements: s.elements.filter(e => e.id !== action.elementId)
        }))
      };
      return { ...state, page: newPage, ...pushHistory(state, newPage), selectedElementId: null };
    }

    case 'UPDATE_ELEMENT': {
      newPage = {
        ...state.page,
        sections: state.page.sections.map(s => ({
          ...s,
          elements: s.elements.map(e => {
            if (e.id !== action.elementId) return e;
            const nextElement = { ...e, ...action.updates };
            if (action.updates?.style) {
              nextElement.style = { ...e.style, ...action.updates.style };
            }
            if (action.updates?.content && typeof action.updates.content === 'object' && !Array.isArray(action.updates.content)) {
              nextElement.content = typeof e.content === 'object' && e.content !== null
                ? { ...e.content, ...action.updates.content }
                : action.updates.content;
            }
            return nextElement;
          })
        })).map((section) => (
          section.elements.some((element) => element.id === action.elementId)
            ? resolveSectionLayout(section, action.elementId)
            : section
        ))
      };
      return { ...state, page: newPage, ...pushHistory(state, newPage) };
    }

    case 'MOVE_ELEMENT_POSITION': {
      newPage = {
        ...state.page,
        sections: state.page.sections.map(s => {
          if (!s.elements.some((e) => e.id === action.elementId)) return s;
          return resolveSectionLayout({
            ...s,
            elements: s.elements.map(e =>
              e.id === action.elementId
                ? { ...e, position: { x: snapToGrid(action.x), y: snapToGrid(action.y) } }
                : e
            )
          }, action.elementId);
        })
      };
      return { ...state, page: newPage, ...pushHistory(state, newPage) };
    }

    case 'UPDATE_SECTION_STYLE': {
      newPage = {
        ...state.page,
        sections: state.page.sections.map(s =>
          s.id === action.sectionId ? { ...s, style: { ...s.style, ...action.style } } : s
        )
      };
      return { ...state, page: newPage, ...pushHistory(state, newPage) };
    }

    case 'REORDER_SECTIONS': {
      const secs = [...state.page.sections];
      const [moved] = secs.splice(action.oldIndex, 1);
      secs.splice(action.newIndex, 0, moved);
      newPage = { ...state.page, sections: secs };
      return { ...state, page: newPage, ...pushHistory(state, newPage) };
    }

    case 'REORDER_ELEMENTS': {
      newPage = {
        ...state.page,
        sections: state.page.sections.map(s => {
          if (s.id !== action.sectionId) return s;
          const els = [...s.elements];
          const [movedEl] = els.splice(action.oldIndex, 1);
          els.splice(action.newIndex, 0, movedEl);
          return { ...s, elements: els };
        })
      };
      return { ...state, page: newPage, ...pushHistory(state, newPage) };
    }

    case 'MOVE_ELEMENT': {
      let element = null;
      const withoutEl = state.page.sections.map(s => {
        const found = s.elements.find(e => e.id === action.elementId);
        if (found) element = found;
        return { ...s, elements: s.elements.filter(e => e.id !== action.elementId) };
      });
      if (!element) return state;
      newPage = {
        ...state.page,
        sections: withoutEl.map(s =>
          s.id === action.toSectionId
            ? resolveSectionLayout({ ...s, elements: [...s.elements, element] }, element.id)
            : resolveSectionLayout(s)
        )
      };
      return { ...state, page: newPage, ...pushHistory(state, newPage) };
    }

    case 'SELECT_ELEMENT':
      return { ...state, selectedElementId: action.elementId, selectedSectionId: action.sectionId || null };

    case 'DESELECT':
      return { ...state, selectedElementId: null, selectedSectionId: null };

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const ni = state.historyIndex - 1;
      return { ...state, page: JSON.parse(JSON.stringify(state.history[ni])), historyIndex: ni };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const ni = state.historyIndex + 1;
      return { ...state, page: JSON.parse(JSON.stringify(state.history[ni])), historyIndex: ni };
    }

    default:
      return state;
  }
};

const initialState = {
  page: { title: '', sections: [], elements: {} },
  selectedElementId: null,
  selectedSectionId: null,
  deviceView: 'desktop',
  history: [],
  historyIndex: -1
};

export const BuilderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  const pageRef = useRef(state.page);

  useEffect(() => {
    initRustCanvasEngine();
  }, []);

  useEffect(() => {
    pageRef.current = state.page;
  }, [state.page]);

  const dispatchWithEngine = useCallback((action) => {
    if (!action || typeof action.type !== 'string') {
      return;
    }

    const currentPage = pageRef.current;
    let rustAction = action;

    if (action.type === 'ADD_ELEMENT' && action.sectionId) {
      const targetSection = currentPage.sections.find((s) => s.id === action.sectionId);
      const newIndex = targetSection?.elements?.length || 0;
      const baseElement = action.element || createDefaultElement(action.elementType);
      const normalizedElement = ensureElementPosition(baseElement, newIndex);
      rustAction = { ...action, element: normalizedElement };
    }

    const rustPage = tryApplyRustMutation(currentPage, rustAction);

    if (rustPage) {
      dispatch({
        type: 'SET_PAGE_FROM_RUST',
        payload: rustPage,
        selectedElementId: rustAction.type === 'ADD_ELEMENT' ? rustAction.element?.id : undefined,
        selectedSectionId: rustAction.type === 'ADD_ELEMENT' ? rustAction.sectionId : undefined,
      });
      return;
    }

    dispatch(action);
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  const getSelectedElement = useCallback(() => {
    if (!state.selectedElementId) return null;
    
    // Check hierarchical structure first
    if (isHierarchicalPage(state.page)) {
      return getElementById(state.page, state.selectedElementId);
    }
    
    // Fall back to flat structure
    for (const section of state.page.sections) {
      const el = section.elements.find(e => e.id === state.selectedElementId);
      if (el) return el;
    }
    return null;
  }, [state.selectedElementId, state.page]);

  const getSelectedSection = useCallback(() => {
    if (!state.selectedSectionId) return null;
    return state.page.sections.find(s => s.id === state.selectedSectionId) || null;
  }, [state.selectedSectionId, state.page.sections]);

  const getElementStyleForDevice = useCallback((element) => {
    return getDeviceStyle(element, state.deviceView);
  }, [state.deviceView]);

  const getSelectedElementChildren = useCallback((elementId) => {
    if (!isHierarchicalPage(state.page)) return [];
    return getElementChildren(state.page, elementId);
  }, [state.page]);

  return (
    <BuilderContext.Provider value={{
      state, dispatch: dispatchWithEngine, undo, redo, canUndo, canRedo,
      getSelectedElement, getSelectedSection, getElementStyleForDevice, getSelectedElementChildren,
      deviceView: state.deviceView
    }}>
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = () => {
  const context = useContext(BuilderContext);
  if (!context) throw new Error('useBuilder must be used within BuilderProvider');
  return context;
};
