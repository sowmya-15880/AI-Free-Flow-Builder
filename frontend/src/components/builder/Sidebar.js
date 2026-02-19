import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useBuilder } from '@/context/BuilderContext';
import {
  Search, ChevronDown, ChevronRight,
  Type, AlignLeft, Image, MousePointer2, FormInput,
  Star, MessageSquare, LayoutGrid, Minus, MoveVertical,
  Layout, Columns, Users, BarChart3, Megaphone, PanelBottom
} from 'lucide-react';

const ELEMENT_CATEGORIES = [
  {
    id: 'sections',
    label: 'Sections',
    icon: Layout,
    items: [
      { type: 'section-hero', label: 'Hero', icon: Layout },
      { type: 'section-features', label: 'Features', icon: Columns },
      { type: 'section-team', label: 'Team', icon: Users },
      { type: 'section-stats', label: 'Stats', icon: BarChart3 },
      { type: 'section-cta', label: 'CTA', icon: Megaphone },
      { type: 'section-footer', label: 'Footer', icon: PanelBottom },
    ]
  },
  {
    id: 'text',
    label: 'Text',
    icon: Type,
    items: [
      { type: 'heading', label: 'Heading', icon: Type },
      { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
    ]
  },
  {
    id: 'buttons',
    label: 'Buttons',
    icon: MousePointer2,
    items: [
      { type: 'button', label: 'Button', icon: MousePointer2 },
    ]
  },
  {
    id: 'media',
    label: 'Images',
    icon: Image,
    items: [
      { type: 'image', label: 'Image', icon: Image },
      { type: 'gallery', label: 'Gallery', icon: LayoutGrid },
    ]
  },
  {
    id: 'forms',
    label: 'Forms',
    icon: FormInput,
    items: [
      { type: 'form', label: 'Form', icon: FormInput },
    ]
  },
  {
    id: 'popups',
    label: 'Popups',
    icon: MessageSquare,
    items: [
      { type: 'popup', label: 'Popup', icon: MessageSquare },
    ]
  },
  {
    id: 'other',
    label: 'Layout',
    icon: Minus,
    items: [
      { type: 'icon', label: 'Icon', icon: Star },
      { type: 'divider', label: 'Divider', icon: Minus },
      { type: 'spacer', label: 'Spacer', icon: MoveVertical },
    ]
  },
];

const SECTION_TEMPLATES = {
  'section-hero': {
    type: 'hero',
    style: { backgroundColor: '#0f172a', padding: '80px 20px', textAlign: 'center' },
    elements: [
      { type: 'heading', content: 'Welcome to Our Platform', style: { fontSize: '48px', fontWeight: '800', color: '#ffffff', textAlign: 'center', padding: '8px 16px' } },
      { type: 'paragraph', content: 'The all-in-one solution for your business needs. Start building something amazing today.', style: { fontSize: '18px', color: '#94a3b8', textAlign: 'center', padding: '8px 16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' } },
      { type: 'button', content: 'Get Started Free', style: { backgroundColor: '#6366f1', color: '#ffffff', padding: '16px 36px', borderRadius: '8px', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'inline-block', margin: '16px auto', textAlign: 'center' } },
      { type: 'image', content: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', alt: 'Hero image' }, style: { width: '100%', maxWidth: '800px', borderRadius: '12px', margin: '24px auto 0', display: 'block' } },
    ]
  },
  'section-features': {
    type: 'features',
    style: { backgroundColor: '#ffffff', padding: '80px 20px', textAlign: 'center' },
    elements: [
      { type: 'heading', content: 'Our Features', style: { fontSize: '36px', fontWeight: '700', color: '#1a1a1a', textAlign: 'center', padding: '8px 16px' } },
      { type: 'paragraph', content: 'Everything you need to succeed in one powerful platform.', style: { fontSize: '17px', color: '#6b7280', textAlign: 'center', padding: '8px 16px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' } },
      { type: 'image', content: { src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80', alt: 'Features' }, style: { width: '100%', maxWidth: '700px', borderRadius: '12px', margin: '24px auto 0', display: 'block' } },
    ]
  },
  'section-team': {
    type: 'team',
    style: { backgroundColor: '#f8fafc', padding: '80px 20px', textAlign: 'center' },
    elements: [
      { type: 'heading', content: 'Meet Our Team', style: { fontSize: '36px', fontWeight: '700', color: '#1a1a1a', textAlign: 'center', padding: '8px 16px' } },
      { type: 'paragraph', content: 'The talented people behind our success.', style: { fontSize: '17px', color: '#6b7280', textAlign: 'center', padding: '8px 16px', lineHeight: '1.6' } },
      { type: 'gallery', content: { images: [
        { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80', alt: 'Team 1' },
        { src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80', alt: 'Team 2' },
        { src: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&q=80', alt: 'Team 3' },
      ]}, style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '24px 16px', maxWidth: '800px', margin: '0 auto' } },
    ]
  },
  'section-stats': {
    type: 'stats',
    style: { backgroundColor: '#1e293b', padding: '60px 20px', textAlign: 'center' },
    elements: [
      { type: 'heading', content: 'Trusted by Thousands', style: { fontSize: '36px', fontWeight: '700', color: '#ffffff', textAlign: 'center', padding: '8px 16px' } },
      { type: 'paragraph', content: '10,000+ businesses use our platform to grow.', style: { fontSize: '17px', color: '#94a3b8', textAlign: 'center', padding: '8px 16px', lineHeight: '1.6' } },
    ]
  },
  'section-cta': {
    type: 'cta',
    style: { backgroundColor: '#6366f1', padding: '80px 20px', textAlign: 'center' },
    elements: [
      { type: 'heading', content: 'Ready to Get Started?', style: { fontSize: '40px', fontWeight: '700', color: '#ffffff', textAlign: 'center', padding: '8px 16px' } },
      { type: 'paragraph', content: 'Join thousands of businesses already using our platform.', style: { fontSize: '17px', color: '#e0e7ff', textAlign: 'center', padding: '8px 16px', lineHeight: '1.6' } },
      { type: 'button', content: 'Start Free Trial', style: { backgroundColor: '#ffffff', color: '#6366f1', padding: '16px 36px', borderRadius: '8px', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'inline-block', margin: '16px auto' } },
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

function SidebarDraggableItem({ item }) {
  const { state, dispatch } = useBuilder();
  const isSection = item.type.startsWith('section-');

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${item.type}-${Date.now()}`,
    data: {
      origin: 'sidebar',
      elementType: isSection ? null : item.type,
      sectionTemplate: isSection ? item.type : null,
    },
    disabled: isSection,
  });

  const handleClick = () => {
    if (isSection) {
      const template = SECTION_TEMPLATES[item.type];
      if (template) {
        const genId = () => Math.random().toString(36).substring(2, 11);
        const section = {
          id: genId(),
          ...template,
          elements: template.elements.map(e => ({ ...e, id: genId() }))
        };
        dispatch({
          type: 'ADD_SECTION',
          section,
          afterIndex: state.page.sections.length > 0 ? state.page.sections.length - 1 : undefined
        });
      }
      return;
    }

    // Add element to selected section or first section
    const targetSectionId = state.selectedSectionId || state.page.sections[0]?.id;
    if (targetSectionId) {
      dispatch({ type: 'ADD_ELEMENT', sectionId: targetSectionId, elementType: item.type });
    } else {
      // No sections exist, create one first then add element
      dispatch({ type: 'ADD_SECTION' });
    }
  };

  const Icon = item.icon;

  return (
    <div
      ref={!isSection ? setNodeRef : undefined}
      className={`sidebar-item ${isDragging ? 'is-dragging' : ''}`}
      onClick={handleClick}
      data-testid={`sidebar-item-${item.type}`}
      {...(!isSection ? { ...attributes, ...listeners } : {})}
    >
      <Icon size={20} className="sidebar-item-icon" />
      <span className="sidebar-item-label">{item.label}</span>
    </div>
  );
}

export default function Sidebar() {
  const [openCategories, setOpenCategories] = useState(['text', 'sections']);
  const [search, setSearch] = useState('');

  const toggleCategory = (id) => {
    setOpenCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredCategories = ELEMENT_CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.label.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="builder-sidebar" data-testid="builder-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-search-wrapper">
          <Search size={14} className="sidebar-search-icon" />
          <input
            className="sidebar-search"
            placeholder="Search elements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="sidebar-search"
          />
        </div>
      </div>

      <div className="sidebar-categories">
        {filteredCategories.map(cat => (
          <div key={cat.id} className="sidebar-category">
            <div
              className="sidebar-category-header"
              onClick={() => toggleCategory(cat.id)}
              data-testid={`sidebar-category-${cat.id}`}
            >
              <div className="sidebar-category-title">
                <cat.icon size={14} className="sidebar-category-icon" />
                {cat.label}
              </div>
              {openCategories.includes(cat.id) ? (
                <ChevronDown size={14} style={{ color: 'var(--editor-text-secondary)' }} />
              ) : (
                <ChevronRight size={14} style={{ color: 'var(--editor-text-secondary)' }} />
              )}
            </div>

            {openCategories.includes(cat.id) && (
              <div className="sidebar-items">
                {cat.items.map(item => (
                  <SidebarDraggableItem key={item.type} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
