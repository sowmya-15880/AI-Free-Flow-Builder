import { useBuilder } from '@/context/BuilderContext';
import { X, AlignLeft, AlignCenter, AlignRight, Plus, Trash2 } from 'lucide-react';

const ICON_OPTIONS = [
  'Star', 'Heart', 'Zap', 'Shield', 'Globe', 'Rocket',
  'Award', 'Users', 'TrendingUp', 'CheckCircle', 'Mail', 'Phone',
  'Target', 'Clock', 'Settings', 'Layers'
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

function AlignPicker({ value, onChange }) {
  return (
    <div className="fp-row">
      <label className="fp-label">Text Align</label>
      <div className="fp-align-group">
        {[{ v: 'left', i: AlignLeft }, { v: 'center', i: AlignCenter }, { v: 'right', i: AlignRight }].map(({ v, i: Icon }) => (
          <button key={v} className={`fp-align-btn ${value === v ? 'active' : ''}`} onClick={() => onChange(v)} data-testid={`align-${v}`}><Icon size={13} /></button>
        ))}
      </div>
    </div>
  );
}

function HeadingProps({ el, us, uc }) {
  return <>
    <div className="fp-section"><div className="fp-section-title">Content</div><PropTextarea label="Text" value={el.content} onChange={uc} /></div>
    <div className="fp-section"><div className="fp-section-title">Typography</div>
      <PropInput label="Font Size" value={el.style?.fontSize} onChange={v => us('fontSize', v)} />
      <PropSelect label="Font Weight" value={el.style?.fontWeight} onChange={v => us('fontWeight', v)} options={[{ value: '400', label: 'Normal' }, { value: '500', label: 'Medium' }, { value: '600', label: 'Semibold' }, { value: '700', label: 'Bold' }, { value: '800', label: 'Extra Bold' }]} />
      <PropColor label="Color" value={el.style?.color} onChange={v => us('color', v)} />
      <AlignPicker value={el.style?.textAlign} onChange={v => us('textAlign', v)} />
    </div>
    <div className="fp-section"><div className="fp-section-title">Spacing</div>
      <PropInput label="Padding" value={el.style?.padding} onChange={v => us('padding', v)} />
      <PropInput label="Margin" value={el.style?.margin} onChange={v => us('margin', v)} />
    </div>
  </>;
}

function ParagraphProps({ el, us, uc }) {
  return <>
    <div className="fp-section"><div className="fp-section-title">Content</div><PropTextarea label="Text" value={el.content} onChange={uc} /></div>
    <div className="fp-section"><div className="fp-section-title">Typography</div>
      <PropInput label="Font Size" value={el.style?.fontSize} onChange={v => us('fontSize', v)} />
      <PropColor label="Color" value={el.style?.color} onChange={v => us('color', v)} />
      <PropInput label="Line Height" value={el.style?.lineHeight} onChange={v => us('lineHeight', v)} />
      <AlignPicker value={el.style?.textAlign} onChange={v => us('textAlign', v)} />
    </div>
    <div className="fp-section"><div className="fp-section-title">Spacing</div>
      <PropInput label="Max Width" value={el.style?.maxWidth} onChange={v => us('maxWidth', v)} />
      <PropInput label="Padding" value={el.style?.padding} onChange={v => us('padding', v)} />
    </div>
  </>;
}

function ImageProps({ el, us, dispatch }) {
  const c = typeof el.content === 'object' ? el.content : { src: el.content, alt: '' };
  const uic = (k, v) => dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { content: { ...c, [k]: v } } });
  return <>
    <div className="fp-section"><div className="fp-section-title">Image</div>
      <PropInput label="Image URL" value={c.src} onChange={v => uic('src', v)} />
      <PropInput label="Alt Text" value={c.alt} onChange={v => uic('alt', v)} />
    </div>
    <div className="fp-section"><div className="fp-section-title">Size</div>
      <PropInput label="Width" value={el.style?.width} onChange={v => us('width', v)} />
      <PropInput label="Max Width" value={el.style?.maxWidth} onChange={v => us('maxWidth', v)} />
      <PropInput label="Border Radius" value={el.style?.borderRadius} onChange={v => us('borderRadius', v)} />
    </div>
  </>;
}

function ButtonProps({ el, us, uc }) {
  return <>
    <div className="fp-section"><div className="fp-section-title">Content</div><PropInput label="Button Text" value={el.content} onChange={uc} /></div>
    <div className="fp-section"><div className="fp-section-title">Style</div>
      <PropColor label="Background" value={el.style?.backgroundColor} onChange={v => us('backgroundColor', v)} />
      <PropColor label="Text Color" value={el.style?.color} onChange={v => us('color', v)} />
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
  return <>
    <div className="fp-section"><div className="fp-section-title">Form Fields</div>
      {fields.map((f, i) => (
        <div key={i} style={{ marginBottom: 10, padding: 8, background: '#f4f4f7', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#8e8e96' }}>Field {i + 1}</span>
            <button className="element-action-btn danger" onClick={() => ufc({ ...c, fields: fields.filter((_, j) => j !== i) })} style={{ width: 20, height: 20 }}><Trash2 size={10} /></button>
          </div>
          <PropInput label="Label" value={f.label} onChange={v => { const nf = [...fields]; nf[i] = { ...nf[i], label: v }; ufc({ ...c, fields: nf }); }} />
          <PropInput label="Placeholder" value={f.placeholder} onChange={v => { const nf = [...fields]; nf[i] = { ...nf[i], placeholder: v }; ufc({ ...c, fields: nf }); }} />
        </div>
      ))}
      <button onClick={() => ufc({ ...c, fields: [...fields, { label: 'New Field', type: 'text', placeholder: '' }] })}
        style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', padding: '6px 10px', borderRadius: 5, background: 'transparent', border: '1px dashed #d0d0d6', color: '#8e8e96', cursor: 'pointer', fontSize: 11 }}
        data-testid="add-form-field-btn"><Plus size={12} /> Add Field</button>
    </div>
    <div className="fp-section"><div className="fp-section-title">Submit</div>
      <PropInput label="Button Text" value={c.submitText} onChange={v => ufc({ ...c, submitText: v })} />
    </div>
  </>;
}

function IconProps({ el, dispatch, us }) {
  const c = typeof el.content === 'object' ? el.content : {};
  const uic = (k, v) => dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { content: { ...c, [k]: v } } });
  return <div className="fp-section"><div className="fp-section-title">Icon</div>
    <PropSelect label="Icon" value={c.name || 'Star'} onChange={v => uic('name', v)} options={ICON_OPTIONS.map(i => ({ value: i, label: i }))} />
    <PropInput label="Size" value={c.size} onChange={v => uic('size', parseInt(v) || 48)} type="number" />
    <PropColor label="Color" value={el.style?.color} onChange={v => us('color', v)} />
    <AlignPicker value={el.style?.textAlign} onChange={v => us('textAlign', v)} />
  </div>;
}

function PopupProps({ el, dispatch, us }) {
  const c = typeof el.content === 'object' ? el.content : {};
  const upc = (k, v) => dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { content: { ...c, [k]: v } } });
  return <>
    <div className="fp-section"><div className="fp-section-title">Trigger</div>
      <PropInput label="Trigger Text" value={c.triggerText} onChange={v => upc('triggerText', v)} />
      <PropColor label="Background" value={el.style?.backgroundColor} onChange={v => us('backgroundColor', v)} />
    </div>
    <div className="fp-section"><div className="fp-section-title">Popup Content</div>
      <PropInput label="Title" value={c.title} onChange={v => upc('title', v)} />
      <PropTextarea label="Body" value={c.body} onChange={v => upc('body', v)} />
    </div>
  </>;
}

function GalleryProps({ el, dispatch, us }) {
  const c = typeof el.content === 'object' ? el.content : {};
  const imgs = c.images || [];
  const ugi = (ni) => dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { content: { ...c, images: ni } } });
  return <>
    <div className="fp-section"><div className="fp-section-title">Layout</div>
      <PropInput label="Columns" value={el.style?.gridTemplateColumns?.match(/\d+/)?.[0] || '3'} onChange={v => us('gridTemplateColumns', `repeat(${parseInt(v) || 3}, 1fr)`)} type="number" />
      <PropInput label="Gap" value={el.style?.gap} onChange={v => us('gap', v)} />
    </div>
    <div className="fp-section"><div className="fp-section-title">Images ({imgs.length})</div>
      {imgs.map((img, i) => (
        <div key={i} style={{ marginBottom: 8, padding: 6, background: '#f4f4f7', borderRadius: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: '#8e8e96' }}>Image {i + 1}</span>
            <button className="element-action-btn danger" onClick={() => ugi(imgs.filter((_, j) => j !== i))} style={{ width: 18, height: 18 }}><Trash2 size={9} /></button>
          </div>
          <PropInput label="URL" value={img.src} onChange={v => { const n = [...imgs]; n[i] = { ...n[i], src: v }; ugi(n); }} />
        </div>
      ))}
      <button onClick={() => ugi([...imgs, { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80', alt: 'New' }])}
        style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', padding: '6px 10px', borderRadius: 5, background: 'transparent', border: '1px dashed #d0d0d6', color: '#8e8e96', cursor: 'pointer', fontSize: 11 }}
        data-testid="add-gallery-image-btn"><Plus size={12} /> Add Image</button>
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

export default function PropertiesPanel() {
  const { state, dispatch, getSelectedElement, getSelectedSection } = useBuilder();
  const el = getSelectedElement();
  const section = getSelectedSection();
  const handleClose = () => dispatch({ type: 'DESELECT' });

  const us = (k, v) => {
    if (!el) return;
    dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { style: { ...el.style, [k]: v } } });
  };
  const uc = (v) => {
    if (!el) return;
    dispatch({ type: 'UPDATE_ELEMENT', elementId: el.id, updates: { content: v } });
  };

  const typeName = el ? el.type.charAt(0).toUpperCase() + el.type.slice(1) : 'Section';

  return (
    <div className="floating-properties" data-testid="properties-panel">
      <div className="fp-header">
        <span className="fp-title">{typeName}</span>
        <button className="fp-close" onClick={handleClose} data-testid="properties-close-btn"><X size={15} /></button>
      </div>
      {el?.type === 'heading' && <HeadingProps el={el} us={us} uc={uc} />}
      {el?.type === 'paragraph' && <ParagraphProps el={el} us={us} uc={uc} />}
      {el?.type === 'image' && <ImageProps el={el} us={us} dispatch={dispatch} />}
      {el?.type === 'button' && <ButtonProps el={el} us={us} uc={uc} />}
      {el?.type === 'form' && <FormProps el={el} dispatch={dispatch} />}
      {el?.type === 'icon' && <IconProps el={el} dispatch={dispatch} us={us} />}
      {el?.type === 'popup' && <PopupProps el={el} dispatch={dispatch} us={us} />}
      {el?.type === 'gallery' && <GalleryProps el={el} dispatch={dispatch} us={us} />}
      {el?.type === 'divider' && <div className="fp-section"><PropInput label="Border" value={el.style?.borderTop} onChange={v => us('borderTop', v)} /></div>}
      {el?.type === 'spacer' && <div className="fp-section"><PropInput label="Height" value={el.style?.height} onChange={v => us('height', v)} /></div>}
      {!el && section && <SectionProps section={section} dispatch={dispatch} />}
    </div>
  );
}
