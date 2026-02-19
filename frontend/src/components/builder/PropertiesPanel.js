import { useBuilder } from '@/context/BuilderContext';
import { X, AlignLeft, AlignCenter, AlignRight, Plus, Trash2 } from 'lucide-react';

const ICON_OPTIONS = [
  'Star', 'Heart', 'Zap', 'Shield', 'Globe', 'Rocket',
  'Award', 'Users', 'TrendingUp', 'CheckCircle', 'Mail', 'Phone',
  'Target', 'Clock', 'Settings', 'Layers'
];

function PropertyInput({ label, value, onChange, type = 'text', ...props }) {
  return (
    <div className="property-row">
      <label className="property-label">{label}</label>
      <input
        className="property-input"
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`property-${label.toLowerCase().replace(/\s+/g, '-')}`}
        {...props}
      />
    </div>
  );
}

function PropertyTextarea({ label, value, onChange }) {
  return (
    <div className="property-row">
      <label className="property-label">{label}</label>
      <textarea
        className="property-textarea"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`property-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
    </div>
  );
}

function PropertyColor({ label, value, onChange }) {
  return (
    <div className="property-row">
      <label className="property-label">{label}</label>
      <div className="property-color-row">
        <div className="property-color-swatch">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <input
          className="property-input"
          style={{ flex: 1 }}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          data-testid={`property-color-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
      </div>
    </div>
  );
}

function PropertySelect({ label, value, onChange, options }) {
  return (
    <div className="property-row">
      <label className="property-label">{label}</label>
      <select
        className="property-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`property-select-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function AlignmentPicker({ value, onChange }) {
  return (
    <div className="property-row">
      <label className="property-label">Text Align</label>
      <div className="property-inline-group">
        {[
          { val: 'left', icon: AlignLeft },
          { val: 'center', icon: AlignCenter },
          { val: 'right', icon: AlignRight },
        ].map(({ val, icon: Icon }) => (
          <button
            key={val}
            className={`property-inline-btn ${value === val ? 'active' : ''}`}
            onClick={() => onChange(val)}
            data-testid={`align-${val}`}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}

function HeadingProperties({ element, updateStyle, updateContent }) {
  return (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Content</div>
        <PropertyTextarea label="Text" value={element.content} onChange={updateContent} />
      </div>
      <div className="properties-section">
        <div className="properties-section-title">Typography</div>
        <PropertyInput label="Font Size" value={element.style?.fontSize} onChange={(v) => updateStyle('fontSize', v)} placeholder="32px" />
        <PropertySelect label="Font Weight" value={element.style?.fontWeight} onChange={(v) => updateStyle('fontWeight', v)}
          options={[
            { value: '400', label: 'Normal' }, { value: '500', label: 'Medium' },
            { value: '600', label: 'Semibold' }, { value: '700', label: 'Bold' },
            { value: '800', label: 'Extra Bold' },
          ]}
        />
        <PropertyColor label="Color" value={element.style?.color} onChange={(v) => updateStyle('color', v)} />
        <AlignmentPicker value={element.style?.textAlign} onChange={(v) => updateStyle('textAlign', v)} />
      </div>
      <div className="properties-section">
        <div className="properties-section-title">Spacing</div>
        <PropertyInput label="Padding" value={element.style?.padding} onChange={(v) => updateStyle('padding', v)} placeholder="8px 16px" />
        <PropertyInput label="Margin" value={element.style?.margin} onChange={(v) => updateStyle('margin', v)} placeholder="0" />
      </div>
    </>
  );
}

function ParagraphProperties({ element, updateStyle, updateContent }) {
  return (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Content</div>
        <PropertyTextarea label="Text" value={element.content} onChange={updateContent} />
      </div>
      <div className="properties-section">
        <div className="properties-section-title">Typography</div>
        <PropertyInput label="Font Size" value={element.style?.fontSize} onChange={(v) => updateStyle('fontSize', v)} placeholder="16px" />
        <PropertyColor label="Color" value={element.style?.color} onChange={(v) => updateStyle('color', v)} />
        <PropertyInput label="Line Height" value={element.style?.lineHeight} onChange={(v) => updateStyle('lineHeight', v)} placeholder="1.6" />
        <AlignmentPicker value={element.style?.textAlign} onChange={(v) => updateStyle('textAlign', v)} />
      </div>
      <div className="properties-section">
        <div className="properties-section-title">Spacing</div>
        <PropertyInput label="Max Width" value={element.style?.maxWidth} onChange={(v) => updateStyle('maxWidth', v)} placeholder="600px" />
        <PropertyInput label="Padding" value={element.style?.padding} onChange={(v) => updateStyle('padding', v)} placeholder="8px 16px" />
        <PropertyInput label="Margin" value={element.style?.margin} onChange={(v) => updateStyle('margin', v)} placeholder="0 auto" />
      </div>
    </>
  );
}

function ImageProperties({ element, updateStyle, dispatch }) {
  const content = typeof element.content === 'object' ? element.content : { src: element.content, alt: '' };

  const updateImageContent = (key, value) => {
    dispatch({
      type: 'UPDATE_ELEMENT', elementId: element.id,
      updates: { content: { ...content, [key]: value } }
    });
  };

  return (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Image</div>
        <PropertyInput label="Image URL" value={content.src} onChange={(v) => updateImageContent('src', v)} />
        <PropertyInput label="Alt Text" value={content.alt} onChange={(v) => updateImageContent('alt', v)} />
      </div>
      <div className="properties-section">
        <div className="properties-section-title">Size</div>
        <PropertyInput label="Width" value={element.style?.width} onChange={(v) => updateStyle('width', v)} placeholder="100%" />
        <PropertyInput label="Max Width" value={element.style?.maxWidth} onChange={(v) => updateStyle('maxWidth', v)} placeholder="600px" />
        <PropertyInput label="Border Radius" value={element.style?.borderRadius} onChange={(v) => updateStyle('borderRadius', v)} placeholder="8px" />
      </div>
    </>
  );
}

function ButtonProperties({ element, updateStyle, updateContent }) {
  return (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Content</div>
        <PropertyInput label="Button Text" value={element.content} onChange={updateContent} />
      </div>
      <div className="properties-section">
        <div className="properties-section-title">Style</div>
        <PropertyColor label="Background" value={element.style?.backgroundColor} onChange={(v) => updateStyle('backgroundColor', v)} />
        <PropertyColor label="Text Color" value={element.style?.color} onChange={(v) => updateStyle('color', v)} />
        <PropertyInput label="Font Size" value={element.style?.fontSize} onChange={(v) => updateStyle('fontSize', v)} placeholder="15px" />
        <PropertyInput label="Padding" value={element.style?.padding} onChange={(v) => updateStyle('padding', v)} placeholder="12px 28px" />
        <PropertyInput label="Border Radius" value={element.style?.borderRadius} onChange={(v) => updateStyle('borderRadius', v)} placeholder="8px" />
      </div>
    </>
  );
}

function FormProperties({ element, dispatch }) {
  const content = typeof element.content === 'object' ? element.content : {};
  const fields = content.fields || [];

  const updateFormContent = (newContent) => {
    dispatch({ type: 'UPDATE_ELEMENT', elementId: element.id, updates: { content: newContent } });
  };

  const addField = () => {
    updateFormContent({
      ...content,
      fields: [...fields, { label: 'New Field', type: 'text', placeholder: 'Enter value' }]
    });
  };

  const removeField = (index) => {
    updateFormContent({ ...content, fields: fields.filter((_, i) => i !== index) });
  };

  const updateField = (index, key, value) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    updateFormContent({ ...content, fields: newFields });
  };

  return (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Form Fields</div>
        {fields.map((field, i) => (
          <div key={i} style={{ marginBottom: 12, padding: 10, background: 'var(--editor-surface)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--editor-text-secondary)' }}>Field {i + 1}</span>
              <button className="element-action-btn danger" onClick={() => removeField(i)} style={{ width: 22, height: 22 }}>
                <Trash2 size={10} />
              </button>
            </div>
            <PropertyInput label="Label" value={field.label} onChange={(v) => updateField(i, 'label', v)} />
            <PropertySelect label="Type" value={field.type} onChange={(v) => updateField(i, 'type', v)}
              options={[
                { value: 'text', label: 'Text' }, { value: 'email', label: 'Email' },
                { value: 'tel', label: 'Phone' }, { value: 'number', label: 'Number' },
                { value: 'textarea', label: 'Textarea' },
              ]}
            />
            <PropertyInput label="Placeholder" value={field.placeholder} onChange={(v) => updateField(i, 'placeholder', v)} />
          </div>
        ))}
        <button
          onClick={addField}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px',
            borderRadius: 6, background: 'transparent', border: '1px dashed var(--editor-border)',
            color: 'var(--editor-text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500
          }}
          data-testid="add-form-field-btn"
        >
          <Plus size={14} /> Add Field
        </button>
      </div>
      <div className="properties-section">
        <div className="properties-section-title">Submit Button</div>
        <PropertyInput label="Button Text" value={content.submitText} onChange={(v) => updateFormContent({ ...content, submitText: v })} />
      </div>
    </>
  );
}

function IconProperties({ element, dispatch, updateStyle }) {
  const content = typeof element.content === 'object' ? element.content : {};

  const updateIconContent = (key, value) => {
    dispatch({
      type: 'UPDATE_ELEMENT', elementId: element.id,
      updates: { content: { ...content, [key]: value } }
    });
  };

  return (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Icon</div>
        <PropertySelect label="Icon" value={content.name || 'Star'} onChange={(v) => updateIconContent('name', v)}
          options={ICON_OPTIONS.map(i => ({ value: i, label: i }))}
        />
        <PropertyInput label="Size" value={content.size} onChange={(v) => updateIconContent('size', parseInt(v) || 48)} type="number" />
        <PropertyColor label="Color" value={element.style?.color} onChange={(v) => updateStyle('color', v)} />
        <AlignmentPicker value={element.style?.textAlign} onChange={(v) => updateStyle('textAlign', v)} />
      </div>
    </>
  );
}

function PopupProperties({ element, dispatch, updateStyle }) {
  const content = typeof element.content === 'object' ? element.content : {};

  const updatePopupContent = (key, value) => {
    dispatch({
      type: 'UPDATE_ELEMENT', elementId: element.id,
      updates: { content: { ...content, [key]: value } }
    });
  };

  return (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Popup Trigger</div>
        <PropertyInput label="Trigger Text" value={content.triggerText} onChange={(v) => updatePopupContent('triggerText', v)} />
        <PropertyColor label="Background" value={element.style?.backgroundColor} onChange={(v) => updateStyle('backgroundColor', v)} />
        <PropertyColor label="Text Color" value={element.style?.color} onChange={(v) => updateStyle('color', v)} />
      </div>
      <div className="properties-section">
        <div className="properties-section-title">Popup Content</div>
        <PropertyInput label="Title" value={content.title} onChange={(v) => updatePopupContent('title', v)} />
        <PropertyTextarea label="Body" value={content.body} onChange={(v) => updatePopupContent('body', v)} />
      </div>
    </>
  );
}

function GalleryProperties({ element, dispatch, updateStyle }) {
  const content = typeof element.content === 'object' ? element.content : {};
  const images = content.images || [];

  const updateGalleryImages = (newImages) => {
    dispatch({
      type: 'UPDATE_ELEMENT', elementId: element.id,
      updates: { content: { ...content, images: newImages } }
    });
  };

  const addImage = () => {
    updateGalleryImages([...images, { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80', alt: 'New image' }]);
  };

  const removeImage = (index) => {
    updateGalleryImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index, key, value) => {
    const newImgs = [...images];
    newImgs[index] = { ...newImgs[index], [key]: value };
    updateGalleryImages(newImgs);
  };

  return (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Gallery Layout</div>
        <PropertyInput label="Columns" value={element.style?.gridTemplateColumns?.match(/\d+/)?.[0] || '3'}
          onChange={(v) => updateStyle('gridTemplateColumns', `repeat(${parseInt(v) || 3}, 1fr)`)} type="number"
        />
        <PropertyInput label="Gap" value={element.style?.gap} onChange={(v) => updateStyle('gap', v)} placeholder="12px" />
      </div>
      <div className="properties-section">
        <div className="properties-section-title">Images ({images.length})</div>
        {images.map((img, i) => (
          <div key={i} style={{ marginBottom: 10, padding: 8, background: 'var(--editor-surface)', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--editor-text-secondary)' }}>Image {i + 1}</span>
              <button className="element-action-btn danger" onClick={() => removeImage(i)} style={{ width: 20, height: 20 }}>
                <Trash2 size={10} />
              </button>
            </div>
            <PropertyInput label="URL" value={img.src} onChange={(v) => updateImage(i, 'src', v)} />
            <PropertyInput label="Alt" value={img.alt} onChange={(v) => updateImage(i, 'alt', v)} />
          </div>
        ))}
        <button
          onClick={addImage}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px',
            borderRadius: 6, background: 'transparent', border: '1px dashed var(--editor-border)',
            color: 'var(--editor-text-secondary)', cursor: 'pointer', fontSize: 12
          }}
          data-testid="add-gallery-image-btn"
        >
          <Plus size={14} /> Add Image
        </button>
      </div>
    </>
  );
}

function SectionProperties({ section, dispatch }) {
  const updateSectionStyle = (key, value) => {
    dispatch({ type: 'UPDATE_SECTION_STYLE', sectionId: section.id, style: { [key]: value } });
  };

  return (
    <>
      <div className="properties-section">
        <div className="properties-section-title">Section Style</div>
        <PropertyColor label="Background" value={section.style?.backgroundColor} onChange={(v) => updateSectionStyle('backgroundColor', v)} />
        <PropertyInput label="Padding" value={section.style?.padding} onChange={(v) => updateSectionStyle('padding', v)} placeholder="60px 20px" />
        <AlignmentPicker value={section.style?.textAlign} onChange={(v) => updateSectionStyle('textAlign', v)} />
      </div>
    </>
  );
}

function DividerProperties({ element, updateStyle }) {
  return (
    <div className="properties-section">
      <div className="properties-section-title">Divider</div>
      <PropertyInput label="Border" value={element.style?.borderTop} onChange={(v) => updateStyle('borderTop', v)} placeholder="1px solid #e5e7eb" />
      <PropertyInput label="Margin" value={element.style?.margin} onChange={(v) => updateStyle('margin', v)} placeholder="16px 0" />
    </div>
  );
}

function SpacerProperties({ element, updateStyle }) {
  return (
    <div className="properties-section">
      <div className="properties-section-title">Spacer</div>
      <PropertyInput label="Height" value={element.style?.height} onChange={(v) => updateStyle('height', v)} placeholder="40px" />
    </div>
  );
}

export default function PropertiesPanel() {
  const { state, dispatch, getSelectedElement, getSelectedSection } = useBuilder();
  const element = getSelectedElement();
  const section = getSelectedSection();

  const handleClose = () => dispatch({ type: 'DESELECT' });

  const updateStyle = (key, value) => {
    if (!element) return;
    dispatch({
      type: 'UPDATE_ELEMENT',
      elementId: element.id,
      updates: { style: { ...element.style, [key]: value } }
    });
  };

  const updateContent = (value) => {
    if (!element) return;
    dispatch({ type: 'UPDATE_ELEMENT', elementId: element.id, updates: { content: value } });
  };

  const elementType = element?.type?.charAt(0).toUpperCase() + element?.type?.slice(1);

  return (
    <div className="properties-panel" data-testid="properties-panel">
      <div className="properties-header">
        <span className="properties-title">
          {element ? elementType : section ? 'Section' : 'Properties'}
        </span>
        <button className="properties-close" onClick={handleClose} data-testid="properties-close-btn">
          <X size={16} />
        </button>
      </div>

      {element && element.type === 'heading' && <HeadingProperties element={element} updateStyle={updateStyle} updateContent={updateContent} />}
      {element && element.type === 'paragraph' && <ParagraphProperties element={element} updateStyle={updateStyle} updateContent={updateContent} />}
      {element && element.type === 'image' && <ImageProperties element={element} updateStyle={updateStyle} dispatch={dispatch} />}
      {element && element.type === 'button' && <ButtonProperties element={element} updateStyle={updateStyle} updateContent={updateContent} />}
      {element && element.type === 'form' && <FormProperties element={element} dispatch={dispatch} />}
      {element && element.type === 'icon' && <IconProperties element={element} dispatch={dispatch} updateStyle={updateStyle} />}
      {element && element.type === 'popup' && <PopupProperties element={element} dispatch={dispatch} updateStyle={updateStyle} />}
      {element && element.type === 'gallery' && <GalleryProperties element={element} dispatch={dispatch} updateStyle={updateStyle} />}
      {element && element.type === 'divider' && <DividerProperties element={element} updateStyle={updateStyle} />}
      {element && element.type === 'spacer' && <SpacerProperties element={element} updateStyle={updateStyle} />}
      {!element && section && <SectionProperties section={section} dispatch={dispatch} />}
    </div>
  );
}
