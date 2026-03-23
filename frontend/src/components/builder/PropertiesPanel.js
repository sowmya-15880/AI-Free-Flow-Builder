import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import {
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  SlidersHorizontal,
  Type,
  Circle,
  Code,
  Eye,
  FileCode2,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';

const ICON_OPTIONS = [
  'Star', 'Heart', 'Zap', 'Shield', 'Globe', 'Rocket',
  'Award', 'Users', 'TrendingUp', 'CheckCircle', 'Mail', 'Phone',
  'Target', 'Clock', 'Settings', 'Layers'
];

const PANEL_TABS = [
  { id: 'style', icon: SlidersHorizontal, label: 'Style' },
  { id: 'typography', icon: Type, label: 'Text' },
  { id: 'shape', icon: Circle, label: 'Shape' },
  { id: 'css', icon: Code, label: 'CSS' },
  { id: 'visibility', icon: Eye, label: 'Visibility' },
  { id: 'js', icon: FileCode2, label: 'JS' },
];

function PropInput({ label, value, onChange, type = 'text', ...props }) {
  return (
    <div className="fp-row">
      <label className="fp-label">{label}</label>
      <input className="fp-input" type={type} value={value || ''} onChange={e => onChange(e.target.value)} data-testid={`property-${label.toLowerCase().replace(/\s+/g, '-')}`} {...props} />
    </div>
  );
}

function PropTextarea({ label, value, onChange }) {
  return (
    <div className="fp-row">
      <label className="fp-label">{label}</label>
      <textarea className="fp-textarea" value={value || ''} onChange={e => onChange(e.target.value)} data-testid={`property-${label.toLowerCase().replace(/\s+/g, '-')}`} />
    </div>
  );
}

function PropColor({ label, value, onChange }) {
  return (
    <div className="fp-row">
      <label className="fp-label">{label}</label>
      <div className="fp-color-row">
        <div className="fp-color-swatch"><input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} /></div>
        <input className="fp-input" style={{ flex: 1 }} value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#000000" />
      </div>
    </div>
  );
}

function PropSelect({ label, value, onChange, options }) {
  return (
    <div className="fp-row">
      <label className="fp-label">{label}</label>
      <select className="fp-select" value={value || ''} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function PropToggle({ label, checked, onChange }) {
  return (
    <div className="fp-row fp-row-toggle">
      <label className="fp-label">{label}</label>
      <label className="fp-switch">
        <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="fp-switch-slider" />
      </label>
    </div>
  );
}

function AlignPicker({ value, onChange }) {
  return (
    <div className="fp-row">
      <label className="fp-label">Align</label>
      <div className="fp-align-group">
        {[{ v: 'left', i: AlignLeft }, { v: 'center', i: AlignCenter }, { v: 'right', i: AlignRight }].map(({ v, i: Icon }) => (
          <button key={v} className={`fp-align-btn ${value === v ? 'active' : ''}`} onClick={() => onChange(v)} data-testid={`align-${v}`} type="button"><Icon size={13} /></button>
        ))}
      </div>
    </div>
  );
}

function HeadingProps({ el, us }) {
  return <>
    <div className="fp-section"><div className="fp-section-title">Heading</div>
      <PropSelect label="Tag" value={el.style?.tag || 'h2'} onChange={v => us('tag', v)} options={[{ value: 'h1', label: 'Heading 1' }, { value: 'h2', label: 'Heading 2' }, { value: 'h3', label: 'Heading 3' }, { value: 'h4', label: 'Heading 4' }]} />
      <AlignPicker value={el.style?.textAlign} onChange={v => us('textAlign', v)} />
      <PropSelect label="Heading Style" value={el.style?.headingStyle || 'none'} onChange={v => us('headingStyle', v)} options={[{ value: 'none', label: 'None' }, { value: 'thin', label: 'Thin' }, { value: 'boxed', label: 'Boxed' }]} />
    </div>
    <div className="fp-section"><div className="fp-section-title">Typography</div>
      <PropInput label="Font Size" value={el.style?.fontSize} onChange={v => us('fontSize', v)} />
      <PropSelect label="Weight" value={el.style?.fontWeight} onChange={v => us('fontWeight', v)} options={[{ value: '400', label: 'Normal' }, { value: '500', label: 'Medium' }, { value: '600', label: 'Semibold' }, { value: '700', label: 'Bold' }, { value: '800', label: 'Extra Bold' }]} />
      <PropColor label="Color" value={el.style?.color} onChange={v => us('color', v)} />
    </div>
  </>;
}

function ParagraphProps({ el, us }) {
  return <>
    <div className="fp-section"><div className="fp-section-title">Paragraph</div>
      <AlignPicker value={el.style?.textAlign} onChange={v => us('textAlign', v)} />
    </div>
    <div className="fp-section"><div className="fp-section-title">Typography</div>
      <PropInput label="Font Size" value={el.style?.fontSize} onChange={v => us('fontSize', v)} />
      <PropColor label="Color" value={el.style?.color} onChange={v => us('color', v)} />
      <PropInput label="Line Height" value={el.style?.lineHeight} onChange={v => us('lineHeight', v)} />
    </div>
  </>;
}

function ImageProps({ el, us, dispatch }) {
  const c = typeof el.content === 'object' ? el.content : { src: el.content, alt: '' };
  const uic = (k, v) => dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { content: { ...c, [k]: v } } });
  const widthPercent = parseInt(String(el.style?.width || '').replace('%', ''), 10) || 100;
  return <>
    <div className="fp-section"><div className="fp-section-title">Image</div>
      <PropInput label="Image URL" value={c.src} onChange={v => uic('src', v)} />
      <PropInput label="Alt Text" value={c.alt} onChange={v => uic('alt', v)} />
    </div>
    <div className="fp-section"><div className="fp-section-title">Resize</div>
      <div className="fp-row">
        <label className="fp-label">Width (%)</label>
        <input
          className="fp-range"
          type="range"
          min="10"
          max="100"
          step="1"
          value={Math.min(100, Math.max(10, widthPercent))}
          onChange={(e) => us('width', `${e.target.value}%`)}
        />
        <div className="fp-range-value">{Math.min(100, Math.max(10, widthPercent))}%</div>
      </div>
      <PropInput label="Height" value={el.style?.height} onChange={v => us('height', v)} placeholder="auto / 300px" />
      <PropSelect
        label="Fit"
        value={el.style?.objectFit || 'cover'}
        onChange={v => us('objectFit', v)}
        options={[
          { value: 'cover', label: 'Cover' },
          { value: 'contain', label: 'Contain' },
          { value: 'fill', label: 'Fill' },
        ]}
      />
    </div>
    <div className="fp-section"><div className="fp-section-title">Size</div>
      <PropInput label="Width" value={el.style?.width} onChange={v => us('width', v)} />
      <PropInput label="Max Width" value={el.style?.maxWidth} onChange={v => us('maxWidth', v)} />
      <PropInput label="Border Radius" value={el.style?.borderRadius} onChange={v => us('borderRadius', v)} />
    </div>
  </>;
}

function ButtonProps({ el, us }) {
  return <>
    <div className="fp-section"><div className="fp-section-title">Button</div>
      <PropColor label="Background" value={el.style?.backgroundColor} onChange={v => us('backgroundColor', v)} />
      <PropColor label="Text Color" value={el.style?.color} onChange={v => us('color', v)} />
    </div>
    <div className="fp-section"><div className="fp-section-title">Sizing</div>
      <PropInput label="Font Size" value={el.style?.fontSize} onChange={v => us('fontSize', v)} />
      <PropInput label="Padding" value={el.style?.padding} onChange={v => us('padding', v)} />
      <PropInput label="Border Radius" value={el.style?.borderRadius} onChange={v => us('borderRadius', v)} />
    </div>
  </>;
}

function FormProps({ el, dispatch }) {
  const c = typeof el.content === 'object' ? el.content : {};
  const fields = c.fields || [];
  const ufc = (nc) => dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { content: nc } });
  const us = (k, v) => dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { style: { ...el.style, [k]: v } } });
  return <>
    <div className="fp-section"><div className="fp-section-title">Form Fields</div>
      {fields.map((f, i) => (
        <div key={i} style={{ marginBottom: 10, padding: 8, background: '#f4f4f7', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#8e8e96' }}>Field {i + 1}</span>
            <button className="element-action-btn danger" onClick={() => ufc({ ...c, fields: fields.filter((_, j) => j !== i) })} style={{ width: 20, height: 20 }} type="button"><Trash2 size={10} /></button>
          </div>
        </div>
      ))}
      <button onClick={() => ufc({ ...c, fields: [...fields, { label: 'New Field', type: 'text', placeholder: '' }] })}
        style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', padding: '6px 10px', borderRadius: 5, background: 'transparent', border: '1px dashed #d0d0d6', color: '#8e8e96', cursor: 'pointer', fontSize: 11 }}
        data-testid="add-form-field-btn"
        type="button"
      ><Plus size={12} /> Add Field</button>
    </div>
    <div className="fp-section"><div className="fp-section-title">Appearance</div>
      <PropColor label="Form Background" value={el.style?.backgroundColor} onChange={v => us('backgroundColor', v)} />
      <PropInput label="Border Radius" value={el.style?.borderRadius} onChange={v => us('borderRadius', v)} />
      <PropColor label="Button Background" value={el.style?.buttonBackgroundColor} onChange={v => us('buttonBackgroundColor', v)} />
      <PropColor label="Button Text" value={el.style?.buttonTextColor} onChange={v => us('buttonTextColor', v)} />
      <PropColor label="Input Background" value={el.style?.inputBackgroundColor} onChange={v => us('inputBackgroundColor', v)} />
      <PropColor label="Input Text" value={el.style?.inputTextColor} onChange={v => us('inputTextColor', v)} />
      <PropColor label="Input Border" value={el.style?.inputBorderColor} onChange={v => us('inputBorderColor', v)} />
    </div>
  </>;
}

function BoxProps({ el, us }) {
  return <>
    <div className="fp-section"><div className="fp-section-title">Box</div>
      <PropColor label="Background" value={el.style?.backgroundColor} onChange={v => us('backgroundColor', v)} />
      <PropInput label="Width" value={el.style?.width} onChange={v => us('width', v)} />
      <PropInput label="Height" value={el.style?.height} onChange={v => us('height', v)} />
      <PropInput label="Border Radius" value={el.style?.borderRadius} onChange={v => us('borderRadius', v)} />
      <PropInput label="Border" value={el.style?.border} onChange={v => us('border', v)} />
      <PropInput label="Shadow" value={el.style?.boxShadow} onChange={v => us('boxShadow', v)} />
    </div>
  </>;
}

const ROW_RATIO_OPTIONS = [
  '12', '6:6', '4:8', '8:4', '3:3:3:3', '3:6:3', '2:8:2', '4:4:4',
];

function RowProps({ el, dispatch }) {
  const updateRow = (updates) => dispatch({ type: 'UPDATE_ROW_LAYOUT', rowId: el.id, updates });
  const activeRatio = el.content?.columnRatio || '12';
  return <>
    <div className="fp-section">
      <div className="fp-section-title">Ratio</div>
      <div className="fp-ratio-grid">
        {ROW_RATIO_OPTIONS.map((ratio) => (
          <button
            key={ratio}
            className={`fp-ratio-btn ${activeRatio === ratio ? 'active' : ''}`}
            onClick={() => updateRow({ columnRatio: ratio })}
            type="button"
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
    <div className="fp-section">
      <div className="fp-section-title">Layout</div>
      <PropToggle label="Equal column height" checked={el.content?.equalColumnHeight} onChange={(value) => updateRow({ equalColumnHeight: value })} />
      <PropSelect label="Vertical Alignment" value={el.content?.verticalAlign || 'top'} onChange={(value) => updateRow({ verticalAlign: value })} options={[
        { value: 'top', label: 'Top' },
        { value: 'center', label: 'Center' },
        { value: 'bottom', label: 'Bottom' },
      ]} />
      <PropSelect label="Align" value={el.content?.align || 'left'} onChange={(value) => updateRow({ align: value })} options={[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]} />
      <PropToggle label="Stretch Full Width" checked={el.content?.stretchFullWidth} onChange={(value) => updateRow({ stretchFullWidth: value })} />
      <PropInput label="Row Width" value={el.style?.width} onChange={(value) => updateRow({ width: value })} />
      <PropInput label="Row Height" value={el.style?.height} onChange={(value) => updateRow({ height: value })} />
    </div>
  </>;
}

function ColumnProps({ el, us }) {
  return <>
    <div className="fp-section">
      <div className="fp-section-title">Column</div>
      <PropInput label="Width" value={el.style?.width} onChange={(value) => us('width', value)} />
      <PropInput label="Height" value={el.style?.height} onChange={(value) => us('height', value)} />
      <PropColor label="Background" value={el.style?.backgroundColor} onChange={(value) => us('backgroundColor', value)} />
      <PropInput label="Border Radius" value={el.style?.borderRadius} onChange={(value) => us('borderRadius', value)} />
    </div>
  </>;
}

function IconProps({ el, dispatch, us }) {
  const c = typeof el.content === 'object' ? el.content : {};
  const uic = (k, v) => dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { content: { ...c, [k]: v } } });
  return <div className="fp-section"><div className="fp-section-title">Icon</div>
    <PropSelect label="Icon" value={c.name || 'Star'} onChange={v => uic('name', v)} options={ICON_OPTIONS.map(i => ({ value: i, label: i }))} />
    <PropInput label="Size" value={c.size} onChange={v => uic('size', parseInt(v, 10) || 48)} type="number" />
    <PropColor label="Color" value={el.style?.color} onChange={v => us('color', v)} />
    <AlignPicker value={el.style?.textAlign} onChange={v => us('textAlign', v)} />
  </div>;
}

function PopupProps({ el, dispatch, us }) {
  return <>
    <div className="fp-section"><div className="fp-section-title">Trigger</div>
      <PropColor label="Background" value={el.style?.backgroundColor} onChange={v => us('backgroundColor', v)} />
    </div>
  </>;
}

function GalleryProps({ el, dispatch, us }) {
  const c = typeof el.content === 'object' ? el.content : {};
  const imgs = c.images || [];
  const ugi = (ni) => dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { content: { ...c, images: ni } } });
  return <>
    <div className="fp-section"><div className="fp-section-title">Layout</div>
      <PropInput label="Columns" value={el.style?.gridTemplateColumns?.match(/\d+/)?.[0] || '3'} onChange={v => us('gridTemplateColumns', `repeat(${parseInt(v, 10) || 3}, 1fr)`)} type="number" />
      <PropInput label="Gap" value={el.style?.gap} onChange={v => us('gap', v)} />
    </div>
    <div className="fp-section"><div className="fp-section-title">Images ({imgs.length})</div>
      {imgs.map((img, i) => (
        <div key={i} style={{ marginBottom: 8, padding: 6, background: '#f4f4f7', borderRadius: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: '#8e8e96' }}>Image {i + 1}</span>
            <button className="element-action-btn danger" onClick={() => ugi(imgs.filter((_, j) => j !== i))} style={{ width: 18, height: 18 }} type="button"><Trash2 size={9} /></button>
          </div>
          <PropInput label="URL" value={img.src} onChange={v => { const n = [...imgs]; n[i] = { ...n[i], src: v }; ugi(n); }} />
        </div>
      ))}
      <button onClick={() => ugi([...imgs, { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80', alt: 'New' }])}
        style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', padding: '6px 10px', borderRadius: 5, background: 'transparent', border: '1px dashed #d0d0d6', color: '#8e8e96', cursor: 'pointer', fontSize: 11 }}
        data-testid="add-gallery-image-btn"
        type="button"
      ><Plus size={12} /> Add Image</button>
    </div>
  </>;
}

function SectionProps({ section, dispatch }) {
  const uss = (k, v) => dispatch({ type: 'UPDATE_SECTION_STYLE', sectionId: section.id, style: { [k]: v } });
  return <div className="fp-section"><div className="fp-section-title">Section Style</div>
    <PropColor label="Background" value={section.style?.backgroundColor} onChange={v => uss('backgroundColor', v)} />
    <PropInput label="Padding" value={section.style?.padding} onChange={v => uss('padding', v)} />
    <AlignPicker value={section.style?.textAlign} onChange={v => uss('textAlign', v)} />
  </div>;
}

function InactiveTabState({ label }) {
  return (
    <div className="fp-empty-state">
      <div className="fp-empty-title">{label}</div>
      <div className="fp-empty-text">This panel will be enabled in the next iteration.</div>
    </div>
  );
}

export default function PropertiesPanel() {
  const { state, dispatch, getSelectedElement, getSelectedSection, deviceView } = useBuilder();
  const [activeTab, setActiveTab] = useState('style');
  const [selectedDevice, setSelectedDevice] = useState('desktop'); // Device override: desktop, tablet, mobile
  const [panelPos, setPanelPos] = useState({ left: 0, top: 0 });
  const [panelReady, setPanelReady] = useState(false);
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const el = getSelectedElement();
  const section = getSelectedSection();
  const isHierarchical = !!el && !!el.parent_id ? true : state.page.elements && Object.keys(state.page.elements).length > 0;
  
  const handleClose = () => dispatch({ type: 'DESELECT' });

  const us = (k, v) => {
    if (!el) return;
    
    if (isHierarchical) {
      // For hierarchical elements, use device-specific update
      if (selectedDevice === 'tablet') {
        dispatch({
          type: 'UPDATE_ELEMENT_HIERARCHY',
          elementId: el.id,
          updates: {
            tablet_style: { ...el.tablet_style, [k]: v }
          }
        });
      } else if (selectedDevice === 'mobile') {
        dispatch({
          type: 'UPDATE_ELEMENT_HIERARCHY',
          elementId: el.id,
          updates: {
            mobile_style: { ...el.mobile_style, [k]: v }
          }
        });
      } else {
        dispatch({
          type: 'UPDATE_ELEMENT_HIERARCHY',
          elementId: el.id,
          updates: {
            style: { ...el.style, [k]: v }
          }
        });
      }
    } else {
      // For flat elements, update normally (device overrides not yet supported for flat)
      dispatch({
        type: 'UPDATE_ELEMENT',
        elementId: el.id,
        updates: { style: { ...el.style, [k]: v } }
      });
    }
  };
  
  const typeName = el ? el.type.charAt(0).toUpperCase() + el.type.slice(1) : 'Section';
  const currentTabLabel = useMemo(() => PANEL_TABS.find((t) => t.id === activeTab)?.label || 'Style', [activeTab]);

  useEffect(() => {
    const canvasRect = document.querySelector('.builder-canvas')?.getBoundingClientRect();
    const panelRect = panelRef.current?.getBoundingClientRect();
    if (!canvasRect || !panelRect) return;

    const left = Math.max(canvasRect.left + 12, canvasRect.right - panelRect.width - 24);
    const top = Math.max(canvasRect.top + 12, canvasRect.top + 72);
    setPanelPos({ left, top });
    setPanelReady(true);
  }, []);

  const handlePanelPointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag) return;

    const panelRect = panelRef.current?.getBoundingClientRect();
    if (!panelRect) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    let nextLeft = drag.originLeft + deltaX;
    let nextTop = drag.originTop + deltaY;

    const minLeft = drag.canvasRect.left + 8;
    const maxLeft = drag.canvasRect.right - panelRect.width - 8;
    const minTop = drag.canvasRect.top + 8;
    const maxTop = drag.canvasRect.bottom - panelRect.height - 8;

    nextLeft = Math.min(Math.max(nextLeft, minLeft), Math.max(minLeft, maxLeft));
    nextTop = Math.min(Math.max(nextTop, minTop), Math.max(minTop, maxTop));

    setPanelPos({ left: nextLeft, top: nextTop });
  }, []);

  const handlePanelPointerUp = useCallback(() => {
    window.removeEventListener('pointermove', handlePanelPointerMove);
    window.removeEventListener('pointerup', handlePanelPointerUp);
    dragRef.current = null;
  }, [handlePanelPointerMove]);

  const handlePanelPointerDown = useCallback((event) => {
    if (event.button !== 0) return;
    if (event.target.closest('.fp-close')) return;

    const canvasRect = document.querySelector('.builder-canvas')?.getBoundingClientRect();
    if (!canvasRect) return;

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originLeft: panelPos.left,
      originTop: panelPos.top,
      canvasRect,
    };

    window.addEventListener('pointermove', handlePanelPointerMove);
    window.addEventListener('pointerup', handlePanelPointerUp);
  }, [panelPos.left, panelPos.top, handlePanelPointerMove, handlePanelPointerUp]);

  useEffect(() => () => {
    window.removeEventListener('pointermove', handlePanelPointerMove);
    window.removeEventListener('pointerup', handlePanelPointerUp);
    dragRef.current = null;
  }, [handlePanelPointerMove, handlePanelPointerUp]);

  const renderContent = () => {
    if (activeTab !== 'style' && activeTab !== 'typography') {
      return <InactiveTabState label={currentTabLabel} />;
    }

    if (el?.type === 'row') return <RowProps el={el} dispatch={dispatch} />;
    if (el?.type === 'column') return <ColumnProps el={el} us={us} />;
    if (el?.type === 'heading') return <HeadingProps el={el} us={us} />;
    if (el?.type === 'paragraph') return <ParagraphProps el={el} us={us} />;
    if (el?.type === 'image') return <ImageProps el={el} us={us} dispatch={dispatch} />;
    if (el?.type === 'button') return <ButtonProps el={el} us={us} />;
    if (el?.type === 'form') return <FormProps el={el} dispatch={dispatch} />;
    if (el?.type === 'box') return <BoxProps el={el} us={us} />;
    if (el?.type === 'icon') return <IconProps el={el} dispatch={dispatch} us={us} />;
    if (el?.type === 'popup') return <PopupProps el={el} dispatch={dispatch} us={us} />;
    if (el?.type === 'gallery') return <GalleryProps el={el} dispatch={dispatch} us={us} />;
    if (el?.type === 'divider') return <div className="fp-section"><PropInput label="Border" value={el.style?.borderTop} onChange={v => us('borderTop', v)} /></div>;
    if (el?.type === 'spacer') return <div className="fp-section"><PropInput label="Height" value={el.style?.height} onChange={v => us('height', v)} /></div>;
    if (!el && section) return <SectionProps section={section} dispatch={dispatch} />;
    return <div className="fp-empty-state"><div className="fp-empty-title">No selection</div></div>;
  };

  return (
    <div
      ref={panelRef}
      className="floating-properties"
      data-testid="properties-panel"
      style={panelReady ? { left: `${panelPos.left}px`, top: `${panelPos.top}px`, right: 'auto' } : undefined}
    >
      <div className="fp-header" onPointerDown={handlePanelPointerDown}>
        <span className="fp-title">{typeName}</span>
        <button className="fp-close" onClick={handleClose} data-testid="properties-close-btn" type="button"><X size={18} /></button>
      </div>

      {el && (
        <div className="fp-device-selector" style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
          <button
            className={`fp-device-btn ${selectedDevice === 'desktop' ? 'active' : ''}`}
            onClick={() => setSelectedDevice('desktop')}
            title="Desktop styles"
            type="button"
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 4,
              border: `1px solid ${selectedDevice === 'desktop' ? '#6366f1' : '#d1d5db'}`,
              background: selectedDevice === 'desktop' ? '#f0f4ff' : '#ffffff',
              color: selectedDevice === 'desktop' ? '#6366f1' : '#6b7280',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <Monitor size={14} /> Desktop
          </button>
          <button
            className={`fp-device-btn ${selectedDevice === 'tablet' ? 'active' : ''}`}
            onClick={() => setSelectedDevice('tablet')}
            title="Tablet styles (override)"
            type="button"
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 4,
              border: `1px solid ${selectedDevice === 'tablet' ? '#6366f1' : '#d1d5db'}`,
              background: selectedDevice === 'tablet' ? '#f0f4ff' : '#ffffff',
              color: selectedDevice === 'tablet' ? '#6366f1' : '#6b7280',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <Tablet size={14} /> Tablet
          </button>
          <button
            className={`fp-device-btn ${selectedDevice === 'mobile' ? 'active' : ''}`}
            onClick={() => setSelectedDevice('mobile')}
            title="Mobile styles (override)"
            type="button"
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 4,
              border: `1px solid ${selectedDevice === 'mobile' ? '#6366f1' : '#d1d5db'}`,
              background: selectedDevice === 'mobile' ? '#f0f4ff' : '#ffffff',
              color: selectedDevice === 'mobile' ? '#6366f1' : '#6b7280',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <Smartphone size={14} /> Mobile
          </button>
        </div>
      )}

      <div className="fp-body">
        <div className="fp-tab-rail">
          {PANEL_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`fp-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              title={tab.label}
            >
              <tab.icon size={18} />
            </button>
          ))}
        </div>
        <div className="fp-content-pane">{renderContent()}</div>
      </div>
    </div>
  );
}
