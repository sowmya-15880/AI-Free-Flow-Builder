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

function HeadingElement({ element }) {
  return <h2 style={element.style}>{element.content}</h2>;
}

function ParagraphElement({ element }) {
  return <p style={element.style}>{element.content}</p>;
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

function ButtonElement({ element }) {
  return (
    <div style={{ textAlign: element.style?.textAlign || 'left' }}>
      <span style={{ ...element.style, display: 'inline-block' }}>
        {element.content}
      </span>
    </div>
  );
}

function FormElement({ element }) {
  const content = typeof element.content === 'object' ? element.content : {};
  const fields = content.fields || [];
  const submitText = content.submitText || 'Submit';

  return (
    <div style={element.style}>
      {fields.map((field, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 5, fontSize: 14, color: '#374151' }}>
            {field.label}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              placeholder={field.placeholder}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
              readOnly
            />
          ) : (
            <input
              type={field.type || 'text'}
              placeholder={field.placeholder}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit' }}
              readOnly
            />
          )}
        </div>
      ))}
      <button
        style={{ background: '#6366f1', color: 'white', padding: '12px 28px', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
        type="button"
      >
        {submitText}
      </button>
    </div>
  );
}

function IconElement({ element }) {
  const content = typeof element.content === 'object' ? element.content : {};
  const iconName = content.name || 'Star';
  const size = content.size || 48;
  const IconComp = ICON_MAP[iconName] || LucideIcons.Star;

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

function PopupElement({ element }) {
  const [open, setOpen] = useState(false);
  const content = typeof element.content === 'object' ? element.content : {};

  return (
    <>
      <div style={{ textAlign: element.style?.textAlign || 'left' }}>
        <span
          style={{ ...element.style, display: 'inline-block' }}
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
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

const ElementRenderer = memo(function ElementRenderer({ element }) {
  switch (element.type) {
    case 'heading': return <HeadingElement element={element} />;
    case 'paragraph': return <ParagraphElement element={element} />;
    case 'image': return <ImageElement element={element} />;
    case 'button': return <ButtonElement element={element} />;
    case 'form': return <FormElement element={element} />;
    case 'icon': return <IconElement element={element} />;
    case 'gallery': return <GalleryElement element={element} />;
    case 'popup': return <PopupElement element={element} />;
    case 'divider': return <DividerElement element={element} />;
    case 'spacer': return <SpacerElement element={element} />;
    default: return <div style={element.style}>{typeof element.content === 'string' ? element.content : 'Unknown element'}</div>;
  }
});

export default ElementRenderer;
