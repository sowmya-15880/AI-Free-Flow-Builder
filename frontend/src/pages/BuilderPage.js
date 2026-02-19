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
};

function DragPreviewBox({ elementType }) {
  const Icon = ELEMENT_ICONS[elementType] || Type;
  return (
    <div className="drag-preview">
      <Icon size={14} />
      {elementType}
    </div>
  );
}

function BuilderInner() {
  const { state, dispatch } = useBuilder();
  const [activeDrag, setActiveDrag] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [activePanel, setActivePanel] = useState(null);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    const stored = sessionStorage.getItem('builderPage');
    if (stored) {
      try {
        const pageData = JSON.parse(stored);
        const genId = () => Math.random().toString(36).substring(2, 11);
        const ensured = {
          ...pageData,
          sections: (pageData.sections || []).map(s => ({
            ...s,
            id: s.id || genId(),
            elements: (s.elements || []).map(e => ({ ...e, id: e.id || genId() }))
          }))
        };
        dispatch({ type: 'SET_PAGE', payload: ensured });
      } catch (e) {
        console.error('Failed to parse stored page:', e);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    const handleKeyboard = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' });
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementId) {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
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

    if (activeData?.origin === 'sidebar') {
      let sectionId = overData?.sectionId;
      if (overData?.type === 'section') sectionId = overData.sectionId;
      if (overData?.type === 'canvas') {
        const sections = state.page.sections;
        sectionId = sections.length > 0 ? sections[sections.length - 1].id : null;
        if (!sectionId) { dispatch({ type: 'ADD_SECTION' }); return; }
      }
      if (sectionId) {
        dispatch({ type: 'ADD_ELEMENT', sectionId, elementType: activeData.elementType });
      }
      return;
    }

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
        dispatch({ type: 'MOVE_ELEMENT', elementId: active.id, toSectionId: overData.sectionId });
      }
      return;
    }

    if (activeData?.type === 'element' && overData?.type === 'section') {
      if (activeData.sectionId !== overData.sectionId) {
        dispatch({ type: 'MOVE_ELEMENT', elementId: active.id, toSectionId: overData.sectionId });
      }
    }
  }, [state.page.sections, dispatch]);

  const showProperties = !!state.selectedElementId || !!state.selectedSectionId;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="builder-layout" data-testid="builder-layout">
        <Toolbar device={device} setDevice={setDevice} onBack={() => navigate('/')} />
        <div className="builder-body">
          <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />
          <Canvas device={device} />
          {showProperties && <PropertiesPanel />}
        </div>
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
