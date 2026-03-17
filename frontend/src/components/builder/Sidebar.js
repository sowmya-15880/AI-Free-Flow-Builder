import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useBuilder } from '@/context/BuilderContext';
import {
  Search, ChevronDown, ChevronRight, X,
  Type, AlignLeft, Image, MousePointer2, FormInput,
  Star, MessageSquare, LayoutGrid, Minus, MoveVertical,
  Layout, Columns, Users, Megaphone, PanelBottom,
  Layers, AppWindow, ShoppingCart
} from 'lucide-react';

const ICON_STRIP_ITEMS = [
  { id: 'sections', label: 'Sections', icon: Layout },
  { id: 'elements', label: 'Elements', icon: Layers },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'popups', label: 'Popups', icon: MessageSquare },
  { id: 'forms', label: 'Forms', icon: FormInput },
  { id: 'apps', label: 'Apps', icon: AppWindow },
  { id: 'ecommerce', label: 'E-Commerce', icon: ShoppingCart },
];

const SECTION_TEMPLATES = {
  'section-hero': {
    type: 'hero',
    style: { backgroundColor: '#0f172a', padding: '80px 20px', textAlign: 'center' },
    elements: [
      { type: 'heading', content: 'Welcome to Our Platform', style: { fontSize: '48px', fontWeight: '800', color: '#ffffff', textAlign: 'center', padding: '8px 16px' } },
      { type: 'paragraph', content: 'The all-in-one solution for your business needs. Start building something amazing today.', style: { fontSize: '18px', color: '#94a3b8', textAlign: 'center', padding: '8px 16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' } },
      { type: 'button', content: 'Get Started Free', style: { backgroundColor: '#e74c6f', color: '#ffffff', padding: '16px 36px', borderRadius: '8px', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'inline-block', margin: '16px auto', textAlign: 'center' } },
      { type: 'image', content: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', alt: 'Hero image' }, style: { width: '100%', maxWidth: '800px', borderRadius: '12px', margin: '24px auto 0', display: 'block' } },
    ]
  },
  'section-features': {
    type: 'features',
    style: { backgroundColor: '#ffffff', padding: '80px 20px', textAlign: 'center' },
    elements: [
      { type: 'heading', content: 'Our Features', style: { fontSize: '36px', fontWeight: '700', color: '#1a1a1a', textAlign: 'center', padding: '8px 16px' } },
      { type: 'paragraph', content: 'Everything you need to succeed in one powerful platform.', style: { fontSize: '17px', color: '#6b7280', textAlign: 'center', padding: '8px 16px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' } },
    ]
  },
  'section-team': {
    type: 'team',
    style: { backgroundColor: '#f8fafc', padding: '80px 20px', textAlign: 'center' },
    elements: [
      { type: 'heading', content: 'Meet Our Team', style: { fontSize: '36px', fontWeight: '700', color: '#1a1a1a', textAlign: 'center', padding: '8px 16px' } },
      { type: 'paragraph', content: 'The talented people behind our success.', style: { fontSize: '17px', color: '#6b7280', textAlign: 'center', padding: '8px 16px', lineHeight: '1.6' } },
    ]
  },
  'section-cta': {
    type: 'cta',
    style: { backgroundColor: '#e74c6f', padding: '80px 20px', textAlign: 'center' },
    elements: [
      { type: 'heading', content: 'Ready to Get Started?', style: { fontSize: '40px', fontWeight: '700', color: '#ffffff', textAlign: 'center', padding: '8px 16px' } },
      { type: 'button', content: 'Start Free Trial', style: { backgroundColor: '#ffffff', color: '#e74c6f', padding: '16px 36px', borderRadius: '8px', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'inline-block', margin: '16px auto' } },
    ]
  },
  'section-footer': {
    type: 'footer',
    style: { backgroundColor: '#0f172a', padding: '40px 20px', textAlign: 'center' },
    elements: [
      { type: 'paragraph', content: '2026 Your Company. All rights reserved.', style: { fontSize: '14px', color: '#64748b', textAlign: 'center', padding: '8px 16px' } },
    ]
  },
};

const PANEL_CONTENT = {
  sections: {
    title: 'Sections',
    categories: [
      {
        id: 'section-templates',
        label: 'Templates',
        items: [
          { type: 'section-hero', label: 'Hero', icon: Layout },
          { type: 'section-features', label: 'Features', icon: Columns },
          { type: 'section-team', label: 'Team', icon: Users },
          { type: 'section-cta', label: 'CTA', icon: Megaphone },
          { type: 'section-footer', label: 'Footer', icon: PanelBottom },
        ]
      }
    ]
  },
  elements: {
    title: 'Elements',
    categories: [
      { id: 'text', label: 'Text', items: [
        { type: 'heading', label: 'Heading', icon: Type },
        { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
      ]},
      { id: 'buttons', label: 'Buttons', items: [
        { type: 'button', label: 'Button', icon: MousePointer2 },
      ]},
      { id: 'images', label: 'Images', items: [
        { type: 'image', label: 'Image', icon: Image },
        { type: 'gallery', label: 'Gallery', icon: LayoutGrid },
      ]},
      { id: 'icons', label: 'Icons', items: [
        { type: 'icon', label: 'Icon', icon: Star },
      ]},
      { id: 'layout', label: 'Layout', items: [
        { type: 'divider', label: 'Divider', icon: Minus },
        { type: 'spacer', label: 'Spacer', icon: MoveVertical },
      ]},
    ]
  },
  media: {
    title: 'Media',
    categories: [
      { id: 'media-items', label: 'Media', items: [
        { type: 'image', label: 'Image', icon: Image },
        { type: 'gallery', label: 'Gallery', icon: LayoutGrid },
      ]},
    ]
  },
  popups: {
    title: 'Popups',
    categories: [
      { id: 'popup-items', label: 'Popups', items: [
        { type: 'popup', label: 'Popup', icon: MessageSquare },
      ]},
    ]
  },
  forms: {
    title: 'Forms',
    categories: [
      { id: 'form-items', label: 'Forms', items: [
        { type: 'form', label: 'Form', icon: FormInput },
      ]},
    ]
  },
  apps: {
    title: 'Apps',
    categories: [],
  },
  ecommerce: {
    title: 'E-Commerce',
    categories: [],
  },
};

function DraggableItem({ item }) {
  const { state, dispatch } = useBuilder();
  const isSection = item.type.startsWith('section-');

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${item.type}`,
    data: { origin: 'sidebar', elementType: isSection ? null : item.type },
    disabled: isSection,
  });

  const handleClick = () => {
    if (isSection) {
      const template = SECTION_TEMPLATES[item.type];
      if (template) {
        const genId = () => Math.random().toString(36).substring(2, 11);
        const section = {
          id: genId(), ...template,
          elements: template.elements.map(e => ({ ...e, id: genId() }))
        };
        dispatch({ type: 'ADD_SECTION', section,
          afterIndex: state.page.sections.length > 0 ? state.page.sections.length - 1 : undefined
        });
      }
      return;
    }
    const targetId = state.selectedSectionId || state.page.sections[0]?.id;
    if (targetId) {
      dispatch({ type: 'ADD_ELEMENT', sectionId: targetId, elementType: item.type });
    } else {
      dispatch({ type: 'ADD_SECTION' });
    }
  };

  const Icon = item.icon;
  return (
    <div
      ref={!isSection ? setNodeRef : undefined}
      className={`ep-item ${isDragging ? 'opacity-40' : ''}`}
      onClick={handleClick}
      data-testid={`sidebar-item-${item.type}`}
      {...(!isSection ? { ...attributes, ...listeners } : {})}
    >
      <Icon size={18} className="ep-item-icon" />
      <span className="ep-item-label">{item.label}</span>
    </div>
  );
}

function ElementsSubPanel({ panelId, onClose }) {
  const [openCats, setOpenCats] = useState(() => {
    const content = PANEL_CONTENT[panelId];
    return content?.categories?.map(c => c.id) || [];
  });
  const [search, setSearch] = useState('');
  const content = PANEL_CONTENT[panelId];
  if (!content) return null;

  const toggleCat = (id) => {
    setOpenCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const filtered = content.categories
    .map(cat => ({ ...cat, items: cat.items.filter(i => i.label.toLowerCase().includes(search.toLowerCase())) }))
    .filter(cat => cat.items.length > 0);

  return (
    <div className="elements-panel" data-testid="elements-panel">
      <div className="elements-panel-header">
        <span className="elements-panel-title">{content.title}</span>
        <button className="elements-panel-close" onClick={onClose} data-testid="elements-panel-close">
          <X size={16} />
        </button>
      </div>
      <div className="ep-search-wrapper">
        <Search size={13} className="ep-search-icon" />
        <input className="elements-panel-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} data-testid="sidebar-search" />
      </div>
      {filtered.length === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: '#8e8e96', fontSize: 13 }}>
          {content.categories.length === 0 ? 'Coming soon' : 'No results'}
        </div>
      )}
      {filtered.map(cat => (
        <div key={cat.id} className="ep-category">
          <div className="ep-category-header" onClick={() => toggleCat(cat.id)} data-testid={`sidebar-category-${cat.id}`}>
            <span className="ep-category-title">{cat.label}</span>
            {openCats.includes(cat.id) ? <ChevronDown size={13} style={{ color: '#8e8e96' }} /> : <ChevronRight size={13} style={{ color: '#8e8e96' }} />}
          </div>
          {openCats.includes(cat.id) && (
            <div className="ep-items">
              {cat.items.map(item => <DraggableItem key={item.type} item={item} />)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Sidebar({ activePanel, setActivePanel }) {
  const togglePanel = (id) => {
    setActivePanel(prev => prev === id ? null : id);
  };

  return (
    <div className={`builder-sidebar-shell ${activePanel ? 'is-open' : ''}`}>
      <div className="icon-strip" data-testid="builder-sidebar">
        {ICON_STRIP_ITEMS.map(item => (
          <button
            key={item.id}
            className={`icon-strip-btn ${activePanel === item.id ? 'active' : ''}`}
            onClick={() => togglePanel(item.id)}
            data-testid={`icon-strip-${item.id}`}
          >
            <item.icon size={18} />
            <span className="icon-label">{item.label}</span>
          </button>
        ))}
      </div>
      {activePanel && (
        <ElementsSubPanel key={activePanel} panelId={activePanel} onClose={() => setActivePanel(null)} />
      )}
    </div>
  );
}
