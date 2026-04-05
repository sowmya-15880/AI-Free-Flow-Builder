import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, LayoutGrid, Briefcase, Palette, ShoppingBag, Calendar, FilePlus2 } from 'lucide-react';
import { toast } from 'sonner';
import { importLandingPageJson } from '@/utils/importPageJson';
import { createBlankPage, createStarterPage, getStarterTemplates } from '@/utils/starterPages';

const PAGE_TYPE_OPTIONS = [
  {
    value: 'lead_generation',
    label: 'Lead Generation',
    audience: 'Growth marketers and small business owners',
    productName: 'LeadFlow Pro',
    productDescription: 'A practical system for collecting qualified leads, routing follow-ups, and tracking conversion outcomes.',
  },
  {
    value: 'product_info',
    label: 'Product Info',
    audience: 'Product evaluators and decision-makers',
    productName: 'Nimbus Suite',
    productDescription: 'A modern product suite for faster collaboration, delivery, and measurable outcomes.',
  },
  {
    value: 'webinar_registration',
    label: 'Webinar Registration',
    audience: 'Professionals looking for practical learning and live sessions',
    productName: 'Scale Masterclass Live',
    productDescription: 'A live webinar program with actionable frameworks, speaker sessions, and clear registration flows.',
  },
  {
    value: 'saas',
    label: 'SaaS',
    audience: 'Startup founders and software teams',
    productName: 'Orbit Cloud',
    productDescription: 'A product platform for analytics, automation, and campaign orchestration across growing teams.',
  },
];

const TEMPLATE_ICONS = {
  'clean-saas': Briefcase,
  'executive-leads': ShoppingBag,
  'event-launch': Calendar,
};

const PROMPT_PAGE_TEMPLATES = getStarterTemplates();

export default function PromptPage() {
  const [activeTab, setActiveTab] = useState('starters');
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

  const openInBuilder = (page, successMessage = 'Page loaded into builder.') => {
    sessionStorage.setItem('builderPage', JSON.stringify(page));
    toast.success(successMessage);
    navigate('/builder');
  };

  const handleBuild = (overrideConfig) => {
    const cfg = overrideConfig || {};
    const page = createStarterPage({
      pageType: cfg.pageType || cfg.page_type || selectedType,
      audience: cfg.audience || audience,
      productName: cfg.productName || cfg.product_name || productName,
      productDescription: cfg.productDescription || cfg.product_description || productDescription,
      prompt: cfg.prompt || prompt,
      theme: cfg.theme || 'clean',
    });
    openInBuilder(page, 'Starter page loaded into builder.');
  };

  const handleTemplateClick = (template) => {
    setLoading(true);
    setLoadingTemplate(template.id);
    requestAnimationFrame(() => {
      handleBuild(template);
      setLoading(false);
      setLoadingTemplate(null);
    });
  };

  const handleJsonUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileText = await file.text();
      const raw = JSON.parse(fileText);
      const importedPage = importLandingPageJson(raw);
      setUploadedFileName(file.name);
      openInBuilder(importedPage, 'JSON imported into builder successfully.');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to import JSON file.');
    } finally {
      event.target.value = '';
      setLoading(false);
    }
  };

  const handleBlankPage = () => {
    openInBuilder(createBlankPage(), 'Blank page opened in builder.');
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  return (
    <div className="prompt-page" data-testid="prompt-page">
      <div className="prompt-content prompt-content-wide">
        <div className="prompt-header-row">
          <div>
            <div className="prompt-badge" data-testid="prompt-badge">
              <LayoutGrid size={14} />
              Free Flow Builder
            </div>
            <h1 className="prompt-title">
              Build landing pages<br />
              with <span>full canvas control</span>
            </h1>
            <p className="prompt-subtitle">
              Start from a starter layout, upload an existing JSON file, or open a blank page and build directly in the editor.
            </p>
          </div>
        </div>

        <div className="prompt-tabs" data-testid="prompt-tabs">
          <button
            data-testid="tab-starters"
            className={`prompt-tab ${activeTab === 'starters' ? 'prompt-tab-active' : ''}`}
            onClick={() => setActiveTab('starters')}
          >
            <Palette size={16} />
            Starter Layouts
          </button>
          <button
            data-testid="tab-build"
            className={`prompt-tab ${activeTab === 'build' ? 'prompt-tab-active' : ''}`}
            onClick={() => setActiveTab('build')}
          >
            <FilePlus2 size={16} />
            Custom Setup
          </button>
        </div>

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

        {loading ? (
          <div className="prompt-loading" data-testid="prompt-loading">
            <div className="prompt-spinner" />
            <span>{loadingTemplate ? 'Loading starter layout...' : 'Preparing your page...'}</span>
            <span style={{ fontSize: 13, color: '#666' }}>Opening the builder with your latest page data</span>
          </div>
        ) : activeTab === 'starters' ? (
          <div className="template-gallery" data-testid="template-gallery">
            <div className="template-gallery-header">
              <p className="template-gallery-desc">Pick a starter layout and keep editing freely in the builder. Each layout opens as a normal page JSON document.</p>
              <button type="button" className="prompt-import-btn" onClick={handleBlankPage}>
                <FilePlus2 size={16} />
                Open Blank Page
              </button>
            </div>
            <div className="template-grid" data-testid="template-grid">
              {PROMPT_PAGE_TEMPLATES.map((template) => {
                const Icon = TEMPLATE_ICONS[template.id] || Briefcase;
                return (
                  <button
                    key={template.id}
                    data-testid={`template-card-${template.id}`}
                    className="template-card"
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="template-card-preview" style={{ background: template.theme === 'executive' ? 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' : template.theme === 'showcase' ? 'linear-gradient(135deg, #172554 0%, #ea580c 100%)' : 'linear-gradient(135deg, #0f172a 0%, #0ea5e9 100%)' }}>
                      <Icon size={32} strokeWidth={1.5} style={{ color: '#ffffff' }} />
                    </div>
                    <div className="template-card-body">
                      <h3 className="template-card-name">{template.name}</h3>
                      <p className="template-card-desc">{template.description}</p>
                      <div className="template-card-tags">
                        <span className="template-tag">Editable</span>
                        <span className="template-tag">Responsive</span>
                        <span className="template-tag">JSON-ready</span>
                      </div>
                    </div>
                    <div className="template-card-action">
                      <ArrowRight size={16} />
                      Open
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
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
                <label className="prompt-field-label">Product or Service Name</label>
                <input className="prompt-input" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Enter product name" />
              </div>
            </div>

            <div className="prompt-input-wrapper">
              <label className="prompt-field-label">Product or Service Description</label>
              <textarea className="prompt-textarea prompt-textarea-sm" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="Describe the offer in 1-3 lines" />
            </div>

            <div className="prompt-input-wrapper">
              <label className="prompt-field-label">Additional Notes (Optional)</label>
              <textarea
                data-testid="prompt-textarea"
                className="prompt-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Any extra direction? Tone, sections to emphasize, offer details, form fields, or proof points."
                autoFocus
              />
            </div>

            <button data-testid="generate-btn" className="prompt-generate-btn" onClick={() => handleBuild()}>
              <FilePlus2 size={18} />
              Build Starter Page
              <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
