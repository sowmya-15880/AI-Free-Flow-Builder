import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Wand2, ArrowRight, Upload, LayoutGrid, Zap, Globe, ShoppingBag, GraduationCap, Utensils, Dumbbell, Calendar, Briefcase, Palette } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { importLandingPageJson } from '@/utils/importPageJson';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PAGE_TYPE_OPTIONS = [
  {
    value: 'lead_generation',
    label: 'Lead Generation',
    audience: 'Growth marketers and small business owners',
    productName: 'LeadFlow Pro',
    productDescription: 'An AI platform that captures, qualifies, and converts high-intent leads.',
  },
  {
    value: 'product_info',
    label: 'Product Info',
    audience: 'Product evaluators and decision-makers',
    productName: 'Nimbus Suite',
    productDescription: 'A modern product suite for faster collaboration, delivery, and outcomes.',
  },
  {
    value: 'webinar_registration',
    label: 'Webinar Registration',
    audience: 'Professionals looking for practical learning and live sessions',
    productName: 'Scale Masterclass Live',
    productDescription: 'A webinar program with actionable growth frameworks and live Q&A.',
  },
  {
    value: 'saas',
    label: 'SaaS',
    audience: 'Startup founders and SaaS teams',
    productName: 'Orbit Cloud',
    productDescription: 'A SaaS platform for analytics, automation, and campaign orchestration.',
  },
];

const TEMPLATES = [
  {
    id: 'saas-dark',
    name: 'SaaS Dark',
    description: 'Dark neon theme with bold gradients. Perfect for SaaS & dev tools.',
    icon: Zap,
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
    accent: '#818cf8',
    tags: ['Dark', 'SaaS', 'Neon'],
    config: {
      prompt: 'Dark theme with neon indigo/violet accents, bold gradients, glass-morphism cards, glowing CTAs. Make it look like a premium dev tool landing page.',
      page_type: 'saas',
      audience: 'Startup founders and SaaS teams',
      product_name: 'NovaDev',
      product_description: 'A next-gen developer platform with AI-powered code generation, real-time collaboration, and instant cloud deployments.',
      style_hint: 'dark_neon',
    },
  },
  {
    id: 'gradient-saas',
    name: 'Gradient SaaS',
    description: 'Purple-blue gradients with soft shadows. Clean and modern SaaS look.',
    icon: Globe,
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)',
    accent: '#a78bfa',
    tags: ['Gradient', 'Modern', 'SaaS'],
    config: {
      prompt: 'Gradient SaaS style with purple-to-blue gradients, soft shadows, rounded cards, floating UI mockups. Clean and aspirational design.',
      page_type: 'saas',
      audience: 'Product teams and business leaders',
      product_name: 'CloudSync Pro',
      product_description: 'An intelligent cloud platform that unifies your data, automates workflows, and delivers real-time insights across every department.',
      style_hint: 'gradient_saas',
    },
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Clean minimal white with sharp typography. Startup-ready & elegant.',
    icon: Briefcase,
    gradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    accent: '#0f172a',
    tags: ['Clean', 'Minimal', 'Startup'],
    config: {
      prompt: 'Clean minimal white design with sharp black typography, lots of whitespace, subtle gray accents, refined card layouts. Inspired by Linear, Stripe, Notion.',
      page_type: 'product_info',
      audience: 'Product evaluators and early adopters',
      product_name: 'Refine Studio',
      product_description: 'A minimalist project management tool that cuts the noise. Focus on what matters with elegant task flows and smart automation.',
      style_hint: 'minimal_white',
    },
  },
  {
    id: 'playful-creative',
    name: 'Playful Creative',
    description: 'Colorful illustrations with playful UI. Great for apps & creative tools.',
    icon: Palette,
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fda4af 50%, #c084fc 100%)',
    accent: '#ec4899',
    tags: ['Playful', 'Creative', 'Colorful'],
    config: {
      prompt: 'Playful illustration-based design with warm pastel colors (yellow, pink, lavender), rounded playful shapes, bouncy typography, fun badges and tags. Think onboarding or productivity app.',
      page_type: 'product_info',
      audience: 'Creative professionals and designers',
      product_name: 'DesignHub',
      product_description: 'A creative collaboration platform where teams brainstorm, design, and ship beautiful products together with AI-powered design suggestions.',
      style_hint: 'playful_creative',
    },
  },
  {
    id: 'food-delivery',
    name: 'Food & Restaurant',
    description: 'Warm tones with appetizing visuals. Built for food businesses.',
    icon: Utensils,
    gradient: 'linear-gradient(135deg, #1c1917 0%, #44403c 50%, #78716c 100%)',
    accent: '#f59e0b',
    tags: ['Food', 'Dark', 'Warm'],
    config: {
      prompt: 'Dark theme with warm amber/orange accents for a premium food delivery or restaurant landing page. Rich imagery sections, menu card grids, customer review cards with avatars, order CTA buttons.',
      page_type: 'lead_generation',
      audience: 'Foodies and busy professionals who value quality meals',
      product_name: 'HealthyEat',
      product_description: 'A premium meal delivery service offering chef-crafted, nutritionally balanced meals delivered fresh to your door every day.',
      style_hint: 'food_dark',
    },
  },
  {
    id: 'fitness-energy',
    name: 'Fitness & Health',
    description: 'High-energy design with bold typography. Made for fitness brands.',
    icon: Dumbbell,
    gradient: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #292524 100%)',
    accent: '#22c55e',
    tags: ['Fitness', 'Bold', 'Energy'],
    config: {
      prompt: 'High-energy fitness theme with dark background, neon green accents, bold uppercase typography, action-shot imagery, progress stats, trainer profile cards, workout plan pricing cards.',
      page_type: 'lead_generation',
      audience: 'Fitness enthusiasts and health-conscious individuals',
      product_name: 'FitForge',
      product_description: 'An AI-powered fitness platform with personalized workout plans, nutrition tracking, and live coaching sessions that adapt to your goals.',
      style_hint: 'fitness_energy',
    },
  },
  {
    id: 'event-conference',
    name: 'Event & Conference',
    description: 'Dynamic event layout with speaker profiles and countdown.',
    icon: Calendar,
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #86198f 100%)',
    accent: '#e879f9',
    tags: ['Event', 'Conference', 'Dynamic'],
    config: {
      prompt: 'Conference/event landing page with deep purple theme, speaker profile grid (circular avatars + names + titles), event schedule cards, countdown-style stat numbers, registration CTA, sponsor logos section.',
      page_type: 'webinar_registration',
      audience: 'Industry professionals and conference attendees',
      product_name: 'TechSummit 2026',
      product_description: 'The premier technology conference bringing together 5,000+ innovators, 50+ speakers, and 3 days of cutting-edge workshops and networking.',
      style_hint: 'event_conference',
    },
  },
  {
    id: 'ecommerce-shop',
    name: 'E-Commerce',
    description: 'Product-focused layout with shopping cards and deals.',
    icon: ShoppingBag,
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    accent: '#f97316',
    tags: ['Shop', 'Products', 'Commerce'],
    config: {
      prompt: 'E-commerce landing page with dark navy theme and orange accents. Product showcase card grid (with pricing, ratings, tags), featured deals banner, customer review section with star ratings, free shipping badge, newsletter signup form at bottom.',
      page_type: 'product_info',
      audience: 'Online shoppers looking for quality products at great prices',
      product_name: 'LuxCart',
      product_description: 'A curated online marketplace featuring premium products with 24-hour delivery, easy returns, and exclusive member discounts up to 50% off.',
      style_hint: 'ecommerce_shop',
    },
  },
  {
    id: 'education-course',
    name: 'Education & Courses',
    description: 'Knowledge-focused with course cards and instructor profiles.',
    icon: GraduationCap,
    gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    accent: '#34d399',
    tags: ['Education', 'Courses', 'Learning'],
    config: {
      prompt: 'Education platform with deep emerald/teal theme, course catalog card grid (with duration, level, rating), instructor profile section with avatar photos, student testimonials, pricing table for plans, progress stats section.',
      page_type: 'product_info',
      audience: 'Lifelong learners and career-switchers',
      product_name: 'SkillForge Academy',
      product_description: 'An online learning platform with expert-led courses, hands-on projects, and industry certifications that help you advance your career.',
      style_hint: 'education_course',
    },
  },
];

function buildModernPrompt({ pageType, audience, productName, productDescription, customNotes, styleHint }) {
  return `Create a stunning, production-ready landing page.

${customNotes ? `USER'S SPECIFIC REQUIREMENTS:\n${customNotes}\n` : ''}
Selected Type: ${pageType}
Target Audience: ${audience}
Product/Service: ${productName}
Description: ${productDescription}
${styleHint ? `Visual Style Preference: ${styleHint}` : ''}
`;
}

export default function PromptPage() {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedType, setSelectedType] = useState(PAGE_TYPE_OPTIONS[0].value);
  const [audience, setAudience] = useState(PAGE_TYPE_OPTIONS[0].audience);
  const [productName, setProductName] = useState(PAGE_TYPE_OPTIONS[0].productName);
  const [productDescription, setProductDescription] = useState(PAGE_TYPE_OPTIONS[0].productDescription);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const applyTypeDefaults = (typeValue) => {
    const selected = PAGE_TYPE_OPTIONS.find((option) => option.value === typeValue);
    if (!selected) return;
    setSelectedType(selected.value);
    setAudience(selected.audience);
    setProductName(selected.productName);
    setProductDescription(selected.productDescription);
  };

  const handleGenerate = async (overrideConfig) => {
    const cfg = overrideConfig || {};
    const fAudience = cfg.audience || audience;
    const fProductName = cfg.product_name || productName;
    const fProductDesc = cfg.product_description || productDescription;
    const fPageType = cfg.page_type || selectedType;

    if (!fAudience.trim() || !fProductName.trim() || !fProductDesc.trim()) {
      toast.error('Please fill audience, product name and description');
      return;
    }

    setLoading(true);
    if (cfg.templateId) setLoadingTemplate(cfg.templateId);

    try {
      const finalPrompt = buildModernPrompt({
        pageType: fPageType,
        audience: fAudience.trim(),
        productName: fProductName.trim(),
        productDescription: fProductDesc.trim(),
        customNotes: cfg.prompt || prompt.trim(),
        styleHint: cfg.style_hint || '',
      });

      const res = await axios.post(`${API}/generate-page`, {
        prompt: finalPrompt,
        page_type: fPageType,
        audience: fAudience.trim(),
        product_name: fProductName.trim(),
        product_description: fProductDesc.trim(),
        variant_hint: `${cfg.style_hint || 'custom'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      const pageData = res.data.page;
      sessionStorage.setItem('builderPage', JSON.stringify(pageData));
      navigate('/builder');
      toast.success('Landing page generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to generate page. Please try again.');
    } finally {
      setLoading(false);
      setLoadingTemplate(null);
    }
  };

  const handleTemplateClick = (template) => {
    handleGenerate({ ...template.config, templateId: template.id });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleJsonUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileText = await file.text();
      const raw = JSON.parse(fileText);
      const importedPage = importLandingPageJson(raw);
      sessionStorage.setItem('builderPage', JSON.stringify(importedPage));
      setUploadedFileName(file.name);
      toast.success('JSON imported into builder successfully.');
      navigate('/builder');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to import JSON file.');
    } finally {
      event.target.value = '';
      setLoading(false);
    }
  };

  return (
    <div className="prompt-page" data-testid="prompt-page">
      <div className="prompt-content prompt-content-wide">
        <div className="prompt-header-row">
          <div>
            <div className="prompt-badge" data-testid="prompt-badge">
              <Sparkles size={14} />
              AI-Powered Page Builder
            </div>
            <h1 className="prompt-title">
              Build Landing Pages<br />
              with <span>AI Magic</span>
            </h1>
            <p className="prompt-subtitle">
              Choose a template to get started instantly, or generate a custom page from your description.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="prompt-tabs" data-testid="prompt-tabs">
          <button
            data-testid="tab-templates"
            className={`prompt-tab ${activeTab === 'templates' ? 'prompt-tab-active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <LayoutGrid size={16} />
            Templates
          </button>
          <button
            data-testid="tab-generate"
            className={`prompt-tab ${activeTab === 'generate' ? 'prompt-tab-active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <Wand2 size={16} />
            Custom Generate
          </button>
        </div>

        {loading ? (
          <div className="prompt-loading" data-testid="prompt-loading">
            <div className="prompt-spinner" />
            <span>{loadingTemplate ? 'Building your template...' : 'Crafting your landing page...'}</span>
            <span style={{ fontSize: 13, color: '#666' }}>This may take 15-30 seconds</span>
          </div>
        ) : activeTab === 'templates' ? (
          /* ---- TEMPLATE GALLERY ---- */
          <div className="template-gallery" data-testid="template-gallery">
            <div className="template-gallery-header">
              <p className="template-gallery-desc">Pick a style and we'll generate a full landing page. Every template is AI-powered and fully editable.</p>
              <div className="prompt-import-bar">
                <button type="button" className="prompt-import-btn" onClick={handleUploadClick}>
                  <Upload size={16} />
                  Upload JSON
                </button>
                <span className="prompt-import-note">
                  {uploadedFileName ? `Imported: ${uploadedFileName}` : 'Or import existing JSON'}
                </span>
                <input ref={fileInputRef} type="file" accept=".json,application/json" className="prompt-file-input" onChange={handleJsonUpload} />
              </div>
            </div>
            <div className="template-grid" data-testid="template-grid">
              {TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    data-testid={`template-card-${template.id}`}
                    className="template-card"
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="template-card-preview" style={{ background: template.gradient }}>
                      <Icon size={32} strokeWidth={1.5} style={{ color: template.accent }} />
                    </div>
                    <div className="template-card-body">
                      <h3 className="template-card-name">{template.name}</h3>
                      <p className="template-card-desc">{template.description}</p>
                      <div className="template-card-tags">
                        {template.tags.map((tag) => (
                          <span key={tag} className="template-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="template-card-action">
                      <ArrowRight size={16} />
                      Generate
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ---- CUSTOM GENERATE FORM ---- */
          <>
            <div className="prompt-import-bar">
              <button type="button" className="prompt-import-btn" onClick={handleUploadClick}>
                <Upload size={16} />
                Upload Landing Page JSON
              </button>
              <span className="prompt-import-note">
                {uploadedFileName ? `Imported: ${uploadedFileName}` : 'Supports builder JSON and structured landing page JSON files'}
              </span>
              <input ref={fileInputRef} type="file" accept=".json,application/json" className="prompt-file-input" onChange={handleJsonUpload} />
            </div>

            <div className="prompt-form-grid">
              <div className="prompt-field">
                <label className="prompt-field-label">Page Type</label>
                <select
                  className="prompt-select"
                  value={selectedType}
                  onChange={(e) => applyTypeDefaults(e.target.value)}
                  data-testid="prompt-page-type"
                >
                  {PAGE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="prompt-field">
                <label className="prompt-field-label">Target Audience</label>
                <input className="prompt-input" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Who is this page for?" />
              </div>

              <div className="prompt-field">
                <label className="prompt-field-label">Product/Service Name</label>
                <input className="prompt-input" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Enter product name" />
              </div>
            </div>

            <div className="prompt-input-wrapper">
              <label className="prompt-field-label">Product/Service Description</label>
              <textarea className="prompt-textarea prompt-textarea-sm" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="Describe your product/service in 1-3 lines" />
            </div>

            <div className="prompt-input-wrapper">
              <label className="prompt-field-label">Additional Requirements (Optional)</label>
              <textarea
                data-testid="prompt-textarea"
                className="prompt-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Any extra direction? (brand voice, CTAs, offers, sections to emphasize, add a feedback form...)"
                autoFocus
              />
            </div>

            <button data-testid="generate-btn" className="prompt-generate-btn" onClick={() => handleGenerate()}>
              <Wand2 size={18} />
              Generate Landing Page
              <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
