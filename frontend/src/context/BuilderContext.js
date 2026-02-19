import { createContext, useContext, useReducer, useCallback } from 'react';

const BuilderContext = createContext();

const generateId = () => Math.random().toString(36).substring(2, 11);

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

const MAX_HISTORY = 50;

const pushHistory = (state, newPage) => {
  const newHistory = [...state.history.slice(0, state.historyIndex + 1), JSON.parse(JSON.stringify(newPage))].slice(-MAX_HISTORY);
  return { history: newHistory, historyIndex: newHistory.length - 1 };
};

const builderReducer = (state, action) => {
  let newPage;

  switch (action.type) {
    case 'SET_PAGE': {
      newPage = action.payload;
      return {
        ...state, page: newPage,
        history: [JSON.parse(JSON.stringify(newPage))],
        historyIndex: 0,
        selectedElementId: null, selectedSectionId: null
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
      const element = action.element || createDefaultElement(action.elementType);
      newPage = {
        ...state.page,
        sections: state.page.sections.map(s =>
          s.id === action.sectionId ? { ...s, elements: [...s.elements, element] } : s
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
          elements: s.elements.map(e =>
            e.id === action.elementId ? { ...e, ...action.updates } : e
          )
        }))
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
          s.id === action.toSectionId ? { ...s, elements: [...s.elements, element] } : s
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
  page: { title: '', sections: [] },
  selectedElementId: null,
  selectedSectionId: null,
  history: [],
  historyIndex: -1
};

export const BuilderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  const getSelectedElement = useCallback(() => {
    if (!state.selectedElementId) return null;
    for (const section of state.page.sections) {
      const el = section.elements.find(e => e.id === state.selectedElementId);
      if (el) return el;
    }
    return null;
  }, [state.selectedElementId, state.page.sections]);

  const getSelectedSection = useCallback(() => {
    if (!state.selectedSectionId) return null;
    return state.page.sections.find(s => s.id === state.selectedSectionId) || null;
  }, [state.selectedSectionId, state.page.sections]);

  return (
    <BuilderContext.Provider value={{
      state, dispatch, undo, redo, canUndo, canRedo,
      getSelectedElement, getSelectedSection
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
