import { memo, useState } from 'react';
import * as LucideIcons from 'lucide-react';

const ICON_MAP = {
  Star: LucideIcons.Star,
  Heart: LucideIcons.Heart,
  Zap: LucideIcons.Zap,
  Shield: LucideIcons.Shield,
  Globe: LucideIcons.Globe,
  Rocket: LucideIcons.Rocket,
  Award: LucideIcons.Award,
  Users: LucideIcons.Users,
  TrendingUp: LucideIcons.TrendingUp,
  CheckCircle: LucideIcons.CheckCircle,
  Mail: LucideIcons.Mail,
  Phone: LucideIcons.Phone,
  Target: LucideIcons.Target,
  Clock: LucideIcons.Clock,
  Settings: LucideIcons.Settings,
  Layers: LucideIcons.Layers,
};

function commitTextUpdate(nextValue, onContentChange, fallbackValue = '') {
  if (!onContentChange) return;
  const normalized = (nextValue || '').replace(/\u00a0/g, ' ').trim();
  onContentChange(normalized || fallbackValue || '');
}

function HeadingElement({ element, editable, onContentChange }) {
  const Tag = element.style?.tag || 'h2';
  return (
    <Tag
      className="inline-text-editable"
      style={element.style}
      contentEditable={!!editable}
      suppressContentEditableWarning
      onBlur={(e) => commitTextUpdate(e.currentTarget.textContent, onContentChange, element.content)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    >
      {element.content}
    </Tag>
  );
}

function ParagraphElement({ element, editable, onContentChange }) {
  return (
    <p
      className="inline-text-editable"
      style={element.style}
      contentEditable={!!editable}
      suppressContentEditableWarning
      onBlur={(e) => commitTextUpdate(e.currentTarget.textContent, onContentChange, element.content)}
    >
      {element.content}
    </p>
  );
}

function ImageElement({ element }) {
  const src = typeof element.content === 'object' ? element.content.src : element.content;
  const alt = typeof element.content === 'object' ? element.content.alt : '';
  return (
    <img
      src={src}
      alt={alt}
      style={element.style}
      onError={(e) => {
        e.target.style.background = '#f1f5f9';
        e.target.style.minHeight = '200px';
        e.target.alt = 'Image failed to load';
      }}
    />
  );
}

function BoxElement({ element }) {
  return <div className="layout-surface-inner" style={element.style} />;
}

function RowElement({ element }) {
  return <div className="layout-surface-inner layout-row-inner" style={element.style} />;
}

function ColumnElement({ element }) {
  return <div className="layout-surface-inner layout-column-inner" style={element.style} />;
}

function ButtonElement({ element, editable, onContentChange }) {
  return (
    <div style={{ textAlign: element.style?.textAlign || 'left' }}>
      <span
        className="inline-text-editable"
        style={{ ...element.style, display: 'inline-block' }}
        contentEditable={!!editable}
        suppressContentEditableWarning
        onBlur={(e) => commitTextUpdate(e.currentTarget.textContent, onContentChange, element.content)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      >
        {element.content}
      </span>
    </div>
  );
}

function FormElement({ element, editable, onContentChange }) {
  const content = typeof element.content === 'object' ? element.content : {};
  const fields = content.fields || [];
  const submitText = content.submitText || 'Submit';
  const style = element.style || {};
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${style.inputBorderColor || '#d1d5db'}`,
    borderRadius: style.inputBorderRadius || 6,
    fontSize: 14,
    fontFamily: 'inherit',
    background: style.inputBackgroundColor || '#ffffff',
    color: style.inputTextColor || '#111827',
  };
  const updateSubmitText = (nextValue) => {
    if (!onContentChange) return;
    onContentChange({
      ...content,
      submitText: (nextValue || '').replace(/\u00a0/g, ' ').trim() || 'Submit',
    });
  };

  return (
    <div style={style}>
      {fields.map((field, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 5, fontSize: 14, color: style.inputTextColor || '#374151' }}>
            {field.label}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              placeholder={field.placeholder}
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              readOnly
            />
          ) : (
            <input
              type={field.type || 'text'}
              placeholder={field.placeholder}
              style={inputStyle}
              readOnly
            />
          )}
        </div>
      ))}
      <div
        className="inline-text-editable"
        style={{
          background: style.buttonBackgroundColor || '#6366f1',
          color: style.buttonTextColor || 'white',
          padding: '12px 28px',
          border: 'none',
          borderRadius: style.inputBorderRadius || 999,
          fontSize: 15,
          fontWeight: 600,
          width: '100%',
          fontFamily: 'inherit',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
        contentEditable={!!editable}
        suppressContentEditableWarning
        onBlur={(e) => updateSubmitText(e.currentTarget.textContent)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      >
        {submitText}
      </div>
    </div>
  );
}

function IconElement({ element }) {
  const content = typeof element.content === 'object' ? element.content : {};
  const iconName = content.name || 'Star';
  const size = content.size || 48;
  const IconComp = ICON_MAP[iconName] || LucideIcons.Star;

  if (content.svg) {
    return (
      <div
        className="inline-svg-icon"
        style={element.style}
        dangerouslySetInnerHTML={{ __html: content.svg }}
      />
    );
  }

  return (
    <div style={element.style}>
      <IconComp size={size} />
    </div>
  );
}

function GalleryElement({ element }) {
  const content = typeof element.content === 'object' ? element.content : {};
  const images = content.images || [];

  return (
    <div style={element.style}>
      {images.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt || ''}
          style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '1' }}
          onError={(e) => {
            e.target.style.background = '#f1f5f9';
            e.target.style.minHeight = '120px';
          }}
        />
      ))}
    </div>
  );
}

function PopupElement({ element, editable, onContentChange }) {
  const [open, setOpen] = useState(false);
  const content = typeof element.content === 'object' ? element.content : {};
  const updateTriggerText = (nextValue) => {
    if (!onContentChange) return;
    onContentChange({
      ...content,
      triggerText: (nextValue || '').replace(/\u00a0/g, ' ').trim() || 'Open Popup',
    });
  };

  return (
    <>
      <div style={{ textAlign: element.style?.textAlign || 'left' }}>
        <span
          className="inline-text-editable"
          style={{ ...element.style, display: 'inline-block' }}
          onClick={(e) => {
            e.stopPropagation();
            if (!editable) setOpen(true);
          }}
          contentEditable={!!editable}
          suppressContentEditableWarning
          onBlur={(e) => updateTriggerText(e.currentTarget.textContent)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        >
          {content.triggerText || 'Open Popup'}
        </span>
      </div>
      {open && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
          }}
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          <div
            style={{
              background: 'white', borderRadius: 12, padding: 32, maxWidth: 500,
              width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: '#1a1a1a' }}>
              {content.title || 'Popup Title'}
            </h3>
            <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
              {content.body || 'Popup content goes here.'}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              style={{
                background: '#6366f1', color: 'white', padding: '10px 24px',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DividerElement({ element }) {
  return <hr style={element.style} />;
}

function SpacerElement({ element }) {
  return <div style={element.style} />;
}

function RowElement({ element, children }) {
  // Row container - typically horizontal layout with columns
  return (
    <div style={{ ...element.style, display: 'flex', flexDirection: 'row', ...element.style }}>
      {children || <p style={{ color: '#999', fontSize: 12 }}>Row: Add columns</p>}
    </div>
  );
}

function ColumnElement({ element, children }) {
  // Column container - typically vertical layout within a row
  return (
    <div style={{ ...element.style, display: 'flex', flexDirection: 'column', flex: 1, ...element.style }}>
      {children || <p style={{ color: '#999', fontSize: 12 }}>Column: Add elements</p>}
    </div>
  );
}

const ElementRenderer = memo(function ElementRenderer({ element, editable = false, onContentChange = null }) {
  switch (element.type) {
    case 'row': return <RowElement element={element} />;
    case 'column': return <ColumnElement element={element} />;
    case 'box': return <BoxElement element={element} />;
    case 'row': return <RowElement element={element} />;
    case 'column': return <ColumnElement element={element} />;
    case 'heading': return <HeadingElement element={element} editable={editable} onContentChange={onContentChange} />;
    case 'paragraph': return <ParagraphElement element={element} editable={editable} onContentChange={onContentChange} />;
    case 'image': return <ImageElement element={element} />;
    case 'button': return <ButtonElement element={element} editable={editable} onContentChange={onContentChange} />;
    case 'form': return <FormElement element={element} editable={editable} onContentChange={onContentChange} />;
    case 'icon': return <IconElement element={element} />;
    case 'gallery': return <GalleryElement element={element} />;
    case 'popup': return <PopupElement element={element} editable={editable} onContentChange={onContentChange} />;
    case 'divider': return <DividerElement element={element} />;
    case 'spacer': return <SpacerElement element={element} />;
    default: return <div style={element.style}>{typeof element.content === 'string' ? element.content : 'Unknown element'}</div>;
  }
});

export default ElementRenderer;
