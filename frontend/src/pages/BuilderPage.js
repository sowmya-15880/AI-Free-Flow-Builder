import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { BuilderProvider, useBuilder } from '@/context/BuilderContext';
import Toolbar from '@/components/builder/Toolbar';
import Sidebar from '@/components/builder/Sidebar';
import Canvas from '@/components/builder/Canvas';
import PropertiesPanel from '@/components/builder/PropertiesPanel';
import { Type, Image, MousePointer2, FormInput, Star, LayoutGrid } from 'lucide-react';

const ELEMENT_ICONS = {
  heading: Type, paragraph: Type, image: Image, button: MousePointer2,
  form: FormInput, icon: Star, popup: MousePointer2, gallery: LayoutGrid,
  divider: Type, spacer: Type,
};

const ELEMENT_LABELS = {
  heading: 'Heading', paragraph: 'Paragraph', image: 'Image', button: 'Button',
  form: 'Form', icon: 'Icon', popup: 'Popup', gallery: 'Gallery',
  divider: 'Divider', spacer: 'Spacer',
};

function DragPreviewBox({ elementType }) {
  const Icon = ELEMENT_ICONS[elementType] || Type;
  return (
    <div className="drag-preview">
      <Icon size={16} />
      {ELEMENT_LABELS[elementType] || elementType}
    </div>
  );
}

function BuilderInner() {
  const { state, dispatch } = useBuilder();
  const [activeDrag, setActiveDrag] = useState(null);
  const [device, setDevice] = useState('desktop');
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    const stored = sessionStorage.getItem('builderPage');
    if (stored) {
      try {
        const pageData = JSON.parse(stored);
        // Ensure all sections and elements have IDs
        const ensureIds = (page) => {
          const genId = () => Math.random().toString(36).substring(2, 11);
          return {
            ...page,
            sections: (page.sections || []).map(s => ({
              ...s,
              id: s.id || genId(),
              elements: (s.elements || []).map(e => ({ ...e, id: e.id || genId() }))
            }))
          };
        };
        dispatch({ type: 'SET_PAGE', payload: ensureIds(pageData) });
      } catch (e) {
        console.error('Failed to parse stored page:', e);
      }
    }
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch({ type: 'REDO' });
        } else {
          dispatch({ type: 'UNDO' });
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedElementId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          dispatch({ type: 'REMOVE_ELEMENT', elementId: state.selectedElementId });
        }
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'DESELECT' });
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [dispatch, state.selectedElementId]);

  const handleDragStart = useCallback((event) => {
    setActiveDrag(event.active.data.current);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveDrag(null);
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Sidebar item dropped on section or element
    if (activeData?.origin === 'sidebar') {
      let sectionId = overData?.sectionId;
      if (overData?.type === 'section') sectionId = overData.sectionId;
      if (overData?.type === 'canvas') {
        // Dropped on empty canvas - add section with element
        const sections = state.page.sections;
        if (sections.length > 0) {
          sectionId = sections[sections.length - 1].id;
        } else {
          dispatch({ type: 'ADD_SECTION' });
          return;
        }
      }
      if (sectionId) {
        dispatch({ type: 'ADD_ELEMENT', sectionId, elementType: activeData.elementType });
      }
      return;
    }

    // Element reorder within a section
    if (activeData?.type === 'element' && overData?.type === 'element') {
      if (activeData.sectionId === overData.sectionId && active.id !== over.id) {
        const section = state.page.sections.find(s => s.id === activeData.sectionId);
        if (section) {
          const oldIndex = section.elements.findIndex(e => e.id === active.id);
          const newIndex = section.elements.findIndex(e => e.id === over.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            dispatch({ type: 'REORDER_ELEMENTS', sectionId: activeData.sectionId, oldIndex, newIndex });
          }
        }
      } else if (activeData.sectionId !== overData.sectionId) {
        // Move element to a different section
        dispatch({ type: 'MOVE_ELEMENT', elementId: active.id, toSectionId: overData.sectionId });
      }
      return;
    }

    // Element dropped on section (move to that section)
    if (activeData?.type === 'element' && overData?.type === 'section') {
      if (activeData.sectionId !== overData.sectionId) {
        dispatch({ type: 'MOVE_ELEMENT', elementId: active.id, toSectionId: overData.sectionId });
      }
    }
  }, [state.page.sections, dispatch]);

  const hasProperties = !!state.selectedElementId || !!state.selectedSectionId;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`builder-layout ${hasProperties ? 'has-properties' : ''}`} data-testid="builder-layout">
        <Toolbar device={device} setDevice={setDevice} onBack={() => navigate('/')} />
        <Sidebar />
        <Canvas device={device} />
        {hasProperties && <PropertiesPanel />}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeDrag?.origin === 'sidebar' && <DragPreviewBox elementType={activeDrag.elementType} />}
      </DragOverlay>
    </DndContext>
  );
}

export default function BuilderPage() {
  return (
    <BuilderProvider>
      <BuilderInner />
    </BuilderProvider>
  );
}
