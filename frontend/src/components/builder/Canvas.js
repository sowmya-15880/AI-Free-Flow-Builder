import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useBuilder } from '@/context/BuilderContext';
import ElementRenderer from '@/components/builder/ElementRenderer';
import { Plus, Trash2, GripVertical, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { buildSectionLayout, getElementPosition } from '@/utils/responsiveLayout';

// Hierarchy detection and helper utilities
const isHierarchicalPage = (page) => !!page?.elements && Object.keys(page.elements || {}).length > 0;

const getHierarchicalElement = (page, elementId) => {
  if (!isHierarchicalPage(page)) return null;
  return page.elements[elementId] || null;
};

const SNAP_GRID = 8;

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
const snap = (value) => Math.round(value / SNAP_GRID) * SNAP_GRID;
const createId = () => Math.random().toString(36).substring(2, 11);

const getSectionContentAtPoint = (x, y) => {
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  const stack = document.elementsFromPoint(x, y) || [];
  for (const el of stack) {
    const sectionContent = el.closest?.('.canvas-section-content[data-section-id]');
    if (sectionContent) return sectionContent;
  }
  return null;
};

const getNearestSectionContent = (x, y) => {
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  const sectionContents = Array.from(document.querySelectorAll('.canvas-section-content[data-section-id]'));
  if (!sectionContents.length) return null;

  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const sectionContent of sectionContents) {
    const rect = sectionContent.getBoundingClientRect();
    const clampedX = clamp(x, rect.left, rect.right);
    const clampedY = clamp(y, rect.top, rect.bottom);
    const dx = x - clampedX;
    const dy = y - clampedY;
    const distance = (dx * dx) + (dy * dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = sectionContent;
    }
  }
  return best;
};

const getNearestColumnElement = (x, y, sectionId) => {
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  const stack = document.elementsFromPoint(x, y) || [];
  for (const el of stack) {
    const columnEl = el.closest?.(`.canvas-element-wrapper[data-element-type="column"]`);
    if (columnEl && columnEl.dataset.parentRowId) return columnEl;
  }

  const columnEls = Array.from(document.querySelectorAll(`.canvas-section-content[data-section-id="${sectionId}"] .canvas-element-wrapper[data-element-type="column"]`));
  if (!columnEls.length) return null;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  columnEls.forEach((columnEl) => {
    const rect = columnEl.getBoundingClientRect();
    const clampedX = clamp(x, rect.left, rect.right);
    const clampedY = clamp(y, rect.top, rect.bottom);
    const dx = x - clampedX;
    const dy = y - clampedY;
    const distance = (dx * dx) + (dy * dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = columnEl;
    }
  });
  return best;
};

function FreeFlowElement({ element, index, sectionId, sectionRef, onGuideChange, isIsolatedTarget, renderPosition, isResponsiveFlow }) {
  const { state, dispatch } = useBuilder();
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const dragStateRef = useRef(null);
  const [dragPosition, setDragPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [measuredSize, setMeasuredSize] = useState(null);
  const isSelected = state.selectedElementId === element.id;

  const currentPosition = dragPosition || renderPosition || getElementPosition(element, index);
  const isSurfaceElement = !!element.surface;

  useLayoutEffect(() => {
    if (isSurfaceElement || !contentRef.current) {
      setMeasuredSize(null);
      return undefined;
    }

    const node = contentRef.current;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      setMeasuredSize({
        width: snap(Math.ceil(rect.width)),
        height: snap(Math.ceil(rect.height)),
      });
    };

    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [element, isSurfaceElement]);

  const projectPositionInSection = (sectionEl, clientX, clientY) => {
    if (!sectionEl) return null;
    const sectionRect = sectionEl.getBoundingClientRect();
    const dragState = dragStateRef.current;
    const elementRect = wrapperRef.current?.getBoundingClientRect();
    const elWidth = elementRect?.width || dragState?.elementWidth || 240;
    const elHeight = elementRect?.height || dragState?.elementHeight || 120;
    const offsetX = dragState?.grabOffsetX ?? Math.min(24, elWidth / 2);
    const offsetY = dragState?.grabOffsetY ?? Math.min(24, elHeight / 2);
    const maxX = Math.max(0, sectionRect.width - elWidth);
    const maxY = Math.max(0, sectionRect.height - elHeight);

    return {
      x: snap(clamp(clientX - sectionRect.left - offsetX, 0, maxX)),
      y: snap(clamp(clientY - sectionRect.top - offsetY, 0, maxY)),
    };
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_ELEMENT', elementId: element.id, sectionId });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_ELEMENT', elementId: element.id });
  };
  const handleInlineContentChange = (nextContent) => {
    dispatch({ type: 'UPDATE_ELEMENT', elementId: element.id, updates: { content: nextContent } });
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    const pos = getElementPosition(element, index);
    const newEl = {
      ...element,
      id: Math.random().toString(36).substring(2, 11),
      content: typeof element.content === 'object' ? JSON.parse(JSON.stringify(element.content)) : element.content,
      style: { ...element.style },
      position: { x: pos.x + 24, y: pos.y + 24 },
    };
    dispatch({ type: 'ADD_ELEMENT', sectionId, element: newEl });
  };

  const stopDragging = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
    dragStateRef.current = null;
    setIsDragging(false);
    onGuideChange({ visible: false, x: 0, y: 0 });
  };

  const handlePointerMove = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    const projected = projectPositionInSection(sectionRef.current, event.clientX, event.clientY);
    if (!projected) return;
    const nextX = projected.x;
    const nextY = projected.y;
    const targetSectionContent =
      getSectionContentAtPoint(event.clientX, event.clientY) ||
      getNearestSectionContent(event.clientX, event.clientY);

    dragState.lastX = nextX;
    dragState.lastY = nextY;
    dragState.lastSectionId = targetSectionContent?.dataset?.sectionId || sectionId;
    setDragPosition({ x: nextX, y: nextY });
    onGuideChange({ visible: true, x: nextX, y: nextY });
  };

  const handlePointerUp = (event) => {
    event.preventDefault();
    const dragState = dragStateRef.current;
    const targetSectionContent =
      getSectionContentAtPoint(event.clientX, event.clientY) ||
      getNearestSectionContent(event.clientX, event.clientY);
    const targetSectionId =
      dragState?.lastSectionId ||
      targetSectionContent?.dataset?.sectionId ||
      sectionId;
    const nextPos = dragState
      ? { x: dragState.lastX ?? dragState.startX, y: dragState.lastY ?? dragState.startY }
      : (dragPosition || getElementPosition(element, index));

    if (targetSectionId !== sectionId) {
      const sectionForDrop =
        targetSectionContent ||
        document.querySelector(`.canvas-section-content[data-section-id="${targetSectionId}"]`) ||
        sectionRef.current;
      const targetProjectedPos = projectPositionInSection(sectionForDrop, event.clientX, event.clientY);
      const projectedX = targetProjectedPos?.x ?? nextPos.x;
      const projectedY = targetProjectedPos?.y ?? nextPos.y;
      const targetColumn = getNearestColumnElement(event.clientX, event.clientY, targetSectionId);

      dispatch({ type: 'MOVE_ELEMENT', elementId: element.id, toSectionId: targetSectionId });
      dispatch({ type: 'MOVE_ELEMENT_POSITION', elementId: element.id, x: projectedX, y: projectedY });
      if (targetColumn?.dataset?.elementId) {
        dispatch({
          type: 'UPDATE_ELEMENT',
          elementId: element.id,
          updates: {
            parentColumnId: targetColumn.dataset.elementId,
            parentRowId: targetColumn.dataset.parentRowId || null,
          },
        });
      }
      setDragPosition(null);
      stopDragging();
      return;
    }

    const targetColumn = getNearestColumnElement(event.clientX, event.clientY, sectionId);
    dispatch({ type: 'MOVE_ELEMENT_POSITION', elementId: element.id, x: nextPos.x, y: nextPos.y });
    if (targetColumn?.dataset?.elementId) {
      dispatch({
        type: 'UPDATE_ELEMENT',
        elementId: element.id,
        updates: {
          parentColumnId: targetColumn.dataset.elementId,
          parentRowId: targetColumn.dataset.parentRowId || null,
        },
      });
    }
    setDragPosition(null);
    stopDragging();
  };

  const handleDragStart = (event) => {
    if (isResponsiveFlow) return;
    event.preventDefault();
    event.stopPropagation();
    dispatch({ type: 'SELECT_ELEMENT', elementId: element.id, sectionId });

    const pos = getElementPosition(element, index);
    const elementRect = wrapperRef.current?.getBoundingClientRect();
    const fallbackWidth = 240;
    const fallbackHeight = 120;
    const elementLeft = elementRect?.left ?? (event.clientX - 24);
    const elementTop = elementRect?.top ?? (event.clientY - 24);
    const elementWidth = elementRect?.width ?? fallbackWidth;
    const elementHeight = elementRect?.height ?? fallbackHeight;
    dragStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: pos.x,
      startY: pos.y,
      lastX: pos.x,
      lastY: pos.y,
      elementWidth,
      elementHeight,
      grabOffsetX: clamp(event.clientX - elementLeft, 0, elementWidth),
      grabOffsetY: clamp(event.clientY - elementTop, 0, elementHeight),
    };

    setIsDragging(true);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleImagePointerDown = (event) => {
    if (element.type !== 'image') return;
    if (event.button !== 0) return;
    if (event.target.closest('.element-actions') || event.target.closest('.element-drag-handle')) return;
    handleDragStart(event);
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        width: measuredSize && !isSurfaceElement ? `${measuredSize.width}px` : undefined,
        minHeight: measuredSize && !isSurfaceElement ? `${measuredSize.height}px` : undefined,
      }}
      className={`canvas-element-wrapper free-flow ${element.surface ? 'is-surface-element' : 'is-leaf-element'} element-type-${element.type} ${isSelected ? 'is-selected' : ''} ${isIsolatedTarget ? 'is-isolated-target' : ''} ${isDragging ? 'is-dragging-free' : ''} ${isResponsiveFlow ? 'responsive-locked' : ''}`}
      onClick={handleSelect}
      onPointerDown={handleImagePointerDown}
      data-testid={`canvas-element-${element.id}`}
      data-element-id={element.id}
      data-element-type={element.type}
      data-parent-row-id={element.parentRowId || ''}
      data-parent-column-id={element.parentColumnId || ''}
    >
      {isSurfaceElement && (
        <button className="surface-select-chip" onClick={handleSelect} type="button" title={`Select ${element.type}`}>
          {element.type}
        </button>
      )}

      <div className="element-drag-handle" onPointerDown={handleDragStart} title="Drag to move">
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

      <div ref={contentRef} className={`canvas-element-content ${isSurfaceElement ? 'is-surface-content' : 'is-leaf-content'}`}>
        <ElementRenderer element={element} editable={isSelected} onContentChange={handleInlineContentChange} />
      </div>
    </div>
  );
}

function CanvasSection({ section, index, device, isHierarchical, pageElements }) {
  const { state, dispatch } = useBuilder();
  const isSelected = state.selectedSectionId === section.id && !state.selectedElementId;
  const hasSelectedElement = !!state.selectedElementId;
  const selectedElementInSection = isHierarchical
    ? (section.rows || []).some(rowId => {
        const row = pageElements[rowId];
        if (!row) return false;
        return (row.columns || []).some(colId => {
          const col = pageElements[colId];
          return col && (col.elements || []).includes(state.selectedElementId);
        });
      })
    : section.elements.some((element) => element.id === state.selectedElementId);
  
  const sectionContentRef = useRef(null);
  const [guide, setGuide] = useState({ visible: false, x: 0, y: 0 });

  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: { type: 'section', sectionId: section.id }
  });

  const handleSelectSection = (e) => {
    if (e.target === e.currentTarget || e.target.closest('.canvas-section') === e.currentTarget) {
      dispatch({ type: 'SELECT_ELEMENT', elementId: null, sectionId: section.id });
    }
  };

  // Render hierarchical structure (rows → columns → elements) with proper containers
  const renderHierarchicalContent = () => {
    const rows = (section.rows || []).map(rowId => pageElements[rowId]).filter(Boolean);
    if (rows.length === 0) {
      return (
        <div className="empty-section" data-testid={`empty-section-${section.id}`}>
          <Plus size={18} style={{ color: '#b0b0b8' }} />
          <span>No rows in this section</span>
        </div>
      );
    }

    return rows.map((row, rowIdx) => {
      const rowStyle = {
        ...row.style,
        display: 'flex',
        flexDirection: 'row',
        gap: '16px',
        padding: '16px',
        marginBottom: '16px',
        width: '100%',
        minHeight: '100px',
        border: state.selectedElementId === row.id ? '2px solid #6366f1' : '1px solid #e5e7eb',
        borderRadius: '6px',
        backgroundColor: state.selectedElementId === row.id ? '#f0f4ff' : '#fafafa',
        cursor: 'pointer',
        position: 'relative',
        zIndex: state.selectedElementId === row.id ? 10 : 1,
      };

      return (
        <div
          key={row.id}
          className="hierarchical-row"
          data-element-id={row.id}
          data-element-type="row"
          style={rowStyle}
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: 'SELECT_ELEMENT', elementId: row.id, sectionId });
          }}
          data-testid={`hierarchical-row-${row.id}`}
        >
          {/* Row label */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '0',
              fontSize: '11px',
              fontWeight: '600',
              color: '#8e8e96',
              textTransform: 'uppercase',
              backgroundColor: '#ffffff',
              padding: '2px 6px',
              borderRadius: '3px',
            }}
          >
            Row
          </div>

          {/* Row actions */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              display: 'flex',
              gap: '2px',
            }}
          >
            <button
              className="element-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'DELETE_ELEMENT_HIERARCHY', elementId: row.id });
              }}
              title="Delete row"
              type="button"
              style={{ padding: '4px' }}
            >
              <Trash2 size={11} />
            </button>
          </div>

          {/* Columns inside row */}
          {(row.columns || []).map((colId, colIdx) => {
            const column = pageElements[colId];
            if (!column) return null;

            const colStyle = {
              ...column.style,
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: '80px',
              padding: '12px',
              border: state.selectedElementId === column.id ? '2px solid #ec4899' : '1px dashed #cbd5e1',
              borderRadius: '4px',
              backgroundColor: state.selectedElementId === column.id ? '#fce7f3' : '#f8fafc',
              position: 'relative',
              zIndex: state.selectedElementId === column.id ? 10 : 2,
            };

            return (
              <div
                key={column.id}
                className="hierarchical-column"
                data-element-id={column.id}
                data-element-type="column"
                style={colStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'SELECT_ELEMENT', elementId: column.id, sectionId });
                }}
                data-testid={`hierarchical-column-${column.id}`}
              >
                {/* Column label */}
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '500',
                    color: '#94a3b8',
                    marginBottom: '4px',
                  }}
                >
                  Col
                </div>

                {/* Column actions */}
                <button
                  className="element-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'DELETE_ELEMENT_HIERARCHY', elementId: column.id });
                  }}
                  title="Delete column"
                  type="button"
                  style={{ position: 'absolute', top: '2px', right: '2px', padding: '2px' }}
                >
                  <Trash2 size={10} />
                </button>

                {/* Elements inside column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(column.elements || []).map((elemId, elemIdx) => {
                    const element = pageElements[elemId];
                    if (!element) return null;
                    const elementData = element.element || element;
                    return (
                      <HierarchicalElement
                        key={element.id}
                        element={element}
                        elementData={elementData}
                        sectionId={section.id}
                        rowId={row.id}
                        columnId={column.id}
                      />
                    );
                  })}
                  {(!column.elements || column.elements.length === 0) && (
                    <div style={{ color: '#cbd5e1', fontSize: '12px', fontStyle: 'italic', padding: '8px' }}>
                      Drop elements here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    });
  };

  // Render flat structure (original)
  const layout = useMemo(() => isHierarchical ? null : buildSectionLayout(section, device), [section, device, isHierarchical]);
  const sectionHeight = layout?.minHeight || 400;
  const isResponsiveFlow = device !== 'desktop';

  const cloneCurrentSection = (event) => {
    event.stopPropagation();
    if (isHierarchical) {
      // For hierarchical, clone structure is more complex
      // TODO: Implement hierarchical section cloning
      return;
    }
    const clonedElements = section.elements.map((element) => ({
      ...JSON.parse(JSON.stringify(element)),
      id: createId(),
    }));
    const clonedSection = {
      ...JSON.parse(JSON.stringify(section)),
      id: createId(),
      elements: clonedElements,
    };
    dispatch({ type: 'ADD_SECTION', section: clonedSection, afterIndex: index });
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

        <div
          ref={sectionContentRef}
          className={`canvas-section-content ${hasSelectedElement ? 'has-active-element' : ''} ${isHierarchical ? 'hierarchical-content' : ''}`}
          data-section-id={section.id}
          style={{ minHeight: `${sectionHeight}px` }}
        >
          {isHierarchical ? renderHierarchicalContent() : (
            <>
              {guide.visible && (
                <>
                  <div className="snap-guide-v" style={{ left: `${guide.x}px` }} />
                  <div className="snap-guide-h" style={{ top: `${guide.y}px` }} />
                </>
              )}

              {layout.orderedElements.map((rawElement, elementIndex) => {
                const element = layout.elementById[rawElement.id] || rawElement;
                const renderPosition = layout.positionById[rawElement.id] || getElementPosition(element, elementIndex);
                return (
                  <FreeFlowElement
                    key={rawElement.id}
                    element={element}
                    index={elementIndex}
                    sectionId={section.id}
                    sectionRef={sectionContentRef}
                    onGuideChange={setGuide}
                    isIsolatedTarget={selectedElementInSection && state.selectedElementId === rawElement.id}
                    renderPosition={renderPosition}
                    isResponsiveFlow={isResponsiveFlow}
                  />
                );
              })}

              {section.elements.length === 0 && (
                <div className="empty-section" data-testid={`empty-section-${section.id}`}>
                  <Plus size={18} style={{ color: '#b0b0b8' }} />
                  <span>Drag elements here or click from sidebar</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="add-section-bar">
        <button
          className="seam-icon-btn add"
          onClick={e => { e.stopPropagation(); dispatch({ type: 'ADD_SECTION', afterIndex: index }); }}
          title="Add section"
          data-testid={`add-section-after-${index}`}
        >
          <Plus size={13} />
        </button>
        <button
          className="seam-icon-btn clone"
          onClick={cloneCurrentSection}
          title="Clone section above"
          data-testid={`clone-section-after-${index}`}
        >
          <Copy size={12} />
        </button>
      </div>
    </>
  );
}

// Hierarchical element component with proper sizing/positioning
function HierarchicalElement({ element, elementData, sectionId, rowId, columnId }) {
  const { state, dispatch } = useBuilder();
  const wrapperRef = useRef(null);
  const isSelected = state.selectedElementId === element.id;

  const handleSelect = (e) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_ELEMENT', elementId: element.id, sectionId });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_ELEMENT_HIERARCHY', elementId: element.id });
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    const newElement = {
      ...JSON.parse(JSON.stringify(element)),
      id: Math.random().toString(36).substring(2, 11),
      parent_id: element.parent_id
    };
    dispatch({ type: 'ADD_ELEMENT_TO_HIERARCHY', parentId: columnId, element: newElement });
  };

  const handleInlineContentChange = (nextContent) => {
    dispatch({
      type: 'UPDATE_ELEMENT_HIERARCHY',
      elementId: element.id,
      updates: { content: nextContent }
    });
  };

  const elementStyle = {
    ...element.style,
    padding: '8px',
    border: isSelected ? '2px solid #10b981' : '1px solid #e5e7eb',
    borderRadius: '4px',
    backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
    cursor: 'pointer',
    position: 'relative',
    zIndex: isSelected ? 10 : 3,
    minHeight: '40px',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease',
  };

  return (
    <div
      ref={wrapperRef}
      className="hierarchical-element"
      data-element-id={element.id}
      data-element-type={element.element_type}
      style={elementStyle}
      onClick={handleSelect}
      data-testid={`hierarchical-element-${element.id}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
        <div style={{ flex: 1 }}>
          <ElementRenderer element={elementData} editable={isSelected} onContentChange={handleInlineContentChange} />
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            className="element-action-btn"
            onClick={handleDuplicate}
            title="Duplicate"
            type="button"
            style={{ padding: '2px', opacity: 0.6, ':hover': { opacity: 1 } }}
          >
            <Copy size={10} />
          </button>
          <button
            className="element-action-btn danger"
            onClick={handleDelete}
            title="Delete"
            type="button"
            style={{ padding: '2px', opacity: 0.6, ':hover': { opacity: 1 } }}
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Canvas({ device, onCanvasInteract }) {
  const { state, dispatch, deviceView } = useBuilder();
  const isHierarchical = isHierarchicalPage(state.page);

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
    <div
      className="builder-canvas"
      onPointerDownCapture={() => onCanvasInteract?.()}
      onClick={handleCanvasClick}
      data-testid="builder-canvas"
    >
      <div ref={setNodeRef} className={`canvas-paper ${deviceClass}`} data-testid="canvas-paper">
        {state.page.sections.length > 0 ? (
          state.page.sections.map((section, index) => (
            <CanvasSection
              key={section.id}
              section={section}
              index={index}
              device={device}
              isHierarchical={isHierarchical}
              pageElements={state.page.elements || {}}
            />
          ))
        ) : (
          <div className="canvas-empty" data-testid="canvas-empty">
            <Plus size={28} className="canvas-empty-icon" />
            <p>Your canvas is empty</p>
            <p style={{ fontSize: 13, color: '#b0b0b8' }}>Add sections from the sidebar or import page JSON</p>
            <button className="add-section-btn" onClick={() => dispatch({ type: 'ADD_SECTION' })} style={{ marginTop: 6 }} data-testid="add-first-section-btn">
              <Plus size={13} /> Add Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
