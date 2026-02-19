import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilder } from '@/context/BuilderContext';
import ElementRenderer from '@/components/builder/ElementRenderer';
import { Plus, Trash2, GripVertical, Copy, ArrowUp, ArrowDown, Move } from 'lucide-react';

function SortableElement({ element, sectionId }) {
  const { state, dispatch } = useBuilder();
  const isSelected = state.selectedElementId === element.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: element.id,
    data: { type: 'element', sectionId, elementId: element.id }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_ELEMENT', elementId: element.id, sectionId });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_ELEMENT', elementId: element.id });
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    const newEl = {
      ...element,
      id: Math.random().toString(36).substring(2, 11),
      content: typeof element.content === 'object' ? JSON.parse(JSON.stringify(element.content)) : element.content,
      style: { ...element.style }
    };
    dispatch({ type: 'ADD_ELEMENT', sectionId, element: newEl });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-element-wrapper ${isSelected ? 'is-selected' : ''} ${isDragging ? 'is-dragging-free' : ''}`}
      onClick={handleSelect}
      data-testid={`canvas-element-${element.id}`}
    >
      <div className="element-drag-handle" {...attributes} {...listeners} title="Drag to move">
        <GripVertical size={11} />
      </div>

      <div className="element-actions">
        <button className="element-action-btn" onClick={handleDuplicate} title="Duplicate" data-testid={`duplicate-element-${element.id}`}>
          <Copy size={11} />
        </button>
        <button className="element-action-btn danger" onClick={handleDelete} title="Delete" data-testid={`delete-element-${element.id}`}>
          <Trash2 size={11} />
        </button>
      </div>

      <ElementRenderer element={element} />
    </div>
  );
}

function CanvasSection({ section, index }) {
  const { state, dispatch } = useBuilder();
  const isSelected = state.selectedSectionId === section.id && !state.selectedElementId;

  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: { type: 'section', sectionId: section.id }
  });

  const handleSelectSection = (e) => {
    if (e.target === e.currentTarget || e.target.closest('.canvas-section') === e.currentTarget) {
      dispatch({ type: 'SELECT_ELEMENT', elementId: null, sectionId: section.id });
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={`canvas-section ${isSelected ? 'is-selected' : ''} ${isOver ? 'is-drop-target' : ''}`}
        style={section.style}
        onClick={handleSelectSection}
        data-testid={`canvas-section-${section.id}`}
      >
        <span className="section-label">{section.type || 'Section'}</span>

        <div className="section-actions">
          {index > 0 && (
            <button className="section-action-btn" onClick={e => { e.stopPropagation(); dispatch({ type: 'REORDER_SECTIONS', oldIndex: index, newIndex: index - 1 }); }} title="Move up" data-testid={`section-move-up-${section.id}`}>
              <ArrowUp size={11} />
            </button>
          )}
          {index < state.page.sections.length - 1 && (
            <button className="section-action-btn" onClick={e => { e.stopPropagation(); dispatch({ type: 'REORDER_SECTIONS', oldIndex: index, newIndex: index + 1 }); }} title="Move down" data-testid={`section-move-down-${section.id}`}>
              <ArrowDown size={11} />
            </button>
          )}
          <button className="section-action-btn" onClick={e => { e.stopPropagation(); dispatch({ type: 'REMOVE_SECTION', sectionId: section.id }); }} title="Delete" data-testid={`section-delete-${section.id}`}>
            <Trash2 size={11} />
          </button>
        </div>

        <SortableContext items={section.elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
          {section.elements.map(element => (
            <SortableElement key={element.id} element={element} sectionId={section.id} />
          ))}
        </SortableContext>

        {section.elements.length === 0 && (
          <div className="empty-section" data-testid={`empty-section-${section.id}`}>
            <Plus size={18} style={{ color: '#b0b0b8' }} />
            <span>Drag elements here or click from sidebar</span>
          </div>
        )}
      </div>

      <div className="add-section-bar">
        <button className="add-section-btn" onClick={e => { e.stopPropagation(); dispatch({ type: 'ADD_SECTION', afterIndex: index }); }} data-testid={`add-section-after-${index}`}>
          <Plus size={13} /> Add Section
        </button>
      </div>
    </>
  );
}

export default function Canvas({ device }) {
  const { state, dispatch } = useBuilder();

  const { setNodeRef } = useDroppable({
    id: 'canvas-root',
    data: { type: 'canvas' }
  });

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('canvas-paper')) {
      dispatch({ type: 'DESELECT' });
    }
  };

  const deviceClass = device === 'tablet' ? 'device-tablet' : device === 'mobile' ? 'device-mobile' : '';

  return (
    <div className="builder-canvas" onClick={handleCanvasClick} data-testid="builder-canvas">
      <div ref={setNodeRef} className={`canvas-paper ${deviceClass}`} data-testid="canvas-paper">
        {state.page.sections.length > 0 ? (
          state.page.sections.map((section, index) => (
            <CanvasSection key={section.id} section={section} index={index} />
          ))
        ) : (
          <div className="canvas-empty" data-testid="canvas-empty">
            <Plus size={28} className="canvas-empty-icon" />
            <p>Your canvas is empty</p>
            <p style={{ fontSize: 11, color: '#b0b0b8' }}>Add sections from the sidebar or generate with AI</p>
            <button className="add-section-btn" onClick={() => dispatch({ type: 'ADD_SECTION' })} style={{ marginTop: 6 }} data-testid="add-first-section-btn">
              <Plus size={13} /> Add Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
