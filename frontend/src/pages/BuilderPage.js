import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { BuilderProvider, useBuilder, createDefaultElement } from '@/context/BuilderContext';
import Toolbar from '@/components/builder/Toolbar';
import Sidebar from '@/components/builder/Sidebar';
import Canvas from '@/components/builder/Canvas';
import PropertiesPanel from '@/components/builder/PropertiesPanel';
import ElementRenderer from '@/components/builder/ElementRenderer';
import { Type, Image, MousePointer2, FormInput, Star, LayoutGrid } from 'lucide-react';
import { buildSectionLayout, getElementPosition } from '@/utils/responsiveLayout';

const ELEMENT_ICONS = {
  heading: Type, paragraph: Type, image: Image, button: MousePointer2,
  form: FormInput, icon: Star, popup: MousePointer2, gallery: LayoutGrid,
};
const SNAP_GRID = 8;

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
const snap = (value) => Math.round(value / SNAP_GRID) * SNAP_GRID;

const getSectionContentAtPoint = (x, y) => {
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  const stack = document.elementsFromPoint(x, y) || [];
  for (const el of stack) {
    const sectionContent = el.closest?.('.canvas-section-content[data-section-id]');
    if (sectionContent) return sectionContent;
  }
  return null;
};

const projectDropPosition = (sectionContent, pointer) => {
  if (!sectionContent || !pointer) return null;
  const rect = sectionContent.getBoundingClientRect();
  const maxX = Math.max(0, rect.width - 24);
  const maxY = Math.max(0, rect.height - 24);
  return {
    x: snap(clamp(pointer.x - rect.left, 0, maxX)),
    y: snap(clamp(pointer.y - rect.top, 0, maxY)),
  };
};

function PreviewSurface({ page, device }) {
  const deviceClass = device === 'tablet' ? 'device-tablet' : device === 'mobile' ? 'device-mobile' : '';

  return (
    <div className="builder-preview" data-testid="builder-preview">
      <div className={`canvas-paper preview-paper ${deviceClass}`} data-testid="preview-paper">
        {(page.sections || []).map((section) => {
          const layout = buildSectionLayout(section, device);
          return (
          <section key={section.id} className="preview-section" style={section.style}>
            <div className="preview-section-content" style={{ minHeight: `${layout.minHeight}px` }}>
              {layout.orderedElements.map((rawElement, index) => {
                const element = layout.elementById[rawElement.id] || rawElement;
                const pos = layout.positionById[rawElement.id] || getElementPosition(element, index);
                return (
                  <div
                    key={rawElement.id}
                    className="preview-element"
                    style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                  >
                    <ElementRenderer element={element} />
                  </div>
                );
              })}
            </div>
          </section>
        );
        })}
      </div>
    </div>
  );
}

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
  const [insertOpen, setInsertOpen] = useState(false);
  const [isSidebarDragActive, setIsSidebarDragActive] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const lastPointerRef = useRef(null);
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
    const dragData = event.active.data.current;
    setActiveDrag(dragData);

    if (dragData?.origin === 'sidebar') {
      setIsSidebarDragActive(true);
      setInsertOpen(false);
    }
  }, []);

  const handleDragMove = useCallback((event) => {
    const clientX = event?.activatorEvent?.clientX;
    const clientY = event?.activatorEvent?.clientY;
    if (typeof clientX === 'number' && typeof clientY === 'number') {
      lastPointerRef.current = { x: clientX, y: clientY };
    }
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveDrag(null);
    setIsSidebarDragActive(false);
    const activeData = active.data.current;
    const overData = over?.data?.current;
    const translatedRect = event?.active?.rect?.current?.translated;
    const pointerFromRect = translatedRect
      ? { x: translatedRect.left + (translatedRect.width / 2), y: translatedRect.top + (translatedRect.height / 2) }
      : null;
    const pointerFromEvent = pointerFromRect
      || lastPointerRef.current
      || (event.activatorEvent && typeof event.activatorEvent.clientX === 'number'
        ? { x: event.activatorEvent.clientX, y: event.activatorEvent.clientY }
        : null);

    if (activeData?.origin === 'sidebar') {
      let sectionId = overData?.sectionId;
      let projectedPos = null;

      if (pointerFromEvent) {
        const sectionContent = getSectionContentAtPoint(pointerFromEvent.x, pointerFromEvent.y);
        if (sectionContent?.dataset?.sectionId) {
          sectionId = sectionContent.dataset.sectionId;
          projectedPos = projectDropPosition(sectionContent, pointerFromEvent);
        }
      }

      if (overData?.type === 'section') sectionId = overData.sectionId;
      if (overData?.type === 'canvas') {
        const sections = state.page.sections;
        sectionId = sections.length > 0 ? sections[sections.length - 1].id : null;
        if (!sectionId) { dispatch({ type: 'ADD_SECTION' }); return; }
      }

      if (!projectedPos && sectionId && pointerFromEvent) {
        const fallbackSectionContent = document.querySelector(`.canvas-section-content[data-section-id="${sectionId}"]`);
        projectedPos = projectDropPosition(fallbackSectionContent, pointerFromEvent);
      }

      if (sectionId) {
        const newElement = createDefaultElement(activeData.elementType);
        if (projectedPos) {
          newElement.position = projectedPos;
        }
        dispatch({ type: 'ADD_ELEMENT', sectionId, element: newElement });
      } else if (state.page.sections[0]?.id) {
        dispatch({ type: 'ADD_ELEMENT', sectionId: state.page.sections[0].id, elementType: activeData.elementType });
      } else {
        const newSectionId = Math.random().toString(36).substring(2, 11);
        dispatch({
          type: 'ADD_SECTION',
          section: {
            id: newSectionId,
            type: 'custom',
            style: { backgroundColor: '#ffffff', padding: '60px 20px' },
            elements: [],
          }
        });
        dispatch({ type: 'ADD_ELEMENT', sectionId: newSectionId, elementType: activeData.elementType });
      }
      lastPointerRef.current = null;
      return;
    }

    lastPointerRef.current = null;

    if (!over) return;

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

  const handleDragCancel = useCallback(() => {
    setActiveDrag(null);
    setIsSidebarDragActive(false);
    lastPointerRef.current = null;
  }, []);

  const showProperties = !!state.selectedElementId || !!state.selectedSectionId;
  const toggleInsertPanel = () => {
    setInsertOpen((prev) => {
      const next = !prev;
      setActivePanel((current) => (next ? (current || 'elements') : null));
      return next;
    });
  };

  const handleSidebarPanelChange = (nextPanelOrUpdater) => {
    setActivePanel((prev) => {
      const nextPanel = typeof nextPanelOrUpdater === 'function'
        ? nextPanelOrUpdater(prev)
        : nextPanelOrUpdater;
      setInsertOpen(Boolean(nextPanel));
      return nextPanel;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="builder-layout" data-testid="builder-layout">
        <Toolbar
          device={device}
          setDevice={setDevice}
          onBack={() => navigate('/')}
          insertOpen={insertOpen}
          onToggleInsert={toggleInsertPanel}
          isPreview={isPreview}
          onTogglePreview={() => setIsPreview((prev) => !prev)}
        />
        <div className="builder-body">
          {isPreview ? (
            <PreviewSurface page={state.page} device={device} />
          ) : (
            <>
              <Sidebar activePanel={activePanel} setActivePanel={handleSidebarPanelChange} />
              <Canvas
                device={device}
                onCanvasInteract={() => {
                  setActivePanel(null);
                  setInsertOpen(false);
                }}
              />
              {showProperties && <PropertiesPanel />}
            </>
          )}
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
