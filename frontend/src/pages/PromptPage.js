import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Wand2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

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

function buildModernPrompt({ pageType, audience, productName, productDescription, customNotes }) {
  return `Create a modern, high-quality, conversion-focused landing page.

Design Style:
- Clean, minimal, premium
- Inspired by Stripe, Linear, Vercel, Apple, Notion
- Large bold typography
- Generous whitespace
- Smooth scrolling sections
- Rounded corners (12-16px)
- Subtle shadows and soft glow effects
- Professional UI spacing (8px grid system)

Color System:
- Neutral base (white or deep charcoal)
- One primary accent gradient (blue -> purple or purple -> pink)
- Subtle hover animations
- Micro-interactions on buttons and cards

Structure:
1. Hero Section
2. Social Proof
3. Features Section
4. Problem -> Solution Section
5. How It Works
6. Pricing or Plans (optional if applicable)
7. FAQ Section
8. Final CTA Section

Tone:
Clear, confident, modern, benefit-driven.
Avoid fluff. Focus on clarity and value.

Selected Type:
${pageType}

Target Audience:
${audience}

Product/Service:
${productName}
${productDescription}

Additional Notes:
${customNotes || 'None'}
`;
}

export default function PromptPage() {
  const [selectedType, setSelectedType] = useState(PAGE_TYPE_OPTIONS[0].value);
  const [audience, setAudience] = useState(PAGE_TYPE_OPTIONS[0].audience);
  const [productName, setProductName] = useState(PAGE_TYPE_OPTIONS[0].productName);
  const [productDescription, setProductDescription] = useState(PAGE_TYPE_OPTIONS[0].productDescription);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const applyTypeDefaults = (typeValue) => {
    const selected = PAGE_TYPE_OPTIONS.find((option) => option.value === typeValue);
    if (!selected) return;
    setSelectedType(selected.value);
    setAudience(selected.audience);
    setProductName(selected.productName);
    setProductDescription(selected.productDescription);
  };

  const handleGenerate = async () => {
    if (!audience.trim() || !productName.trim() || !productDescription.trim()) {
      toast.error('Please fill audience, product name and description');
      return;
    }
    setLoading(true);
    try {
      const finalPrompt = buildModernPrompt({
        pageType: selectedType,
        audience: audience.trim(),
        productName: productName.trim(),
        productDescription: productDescription.trim(),
        customNotes: prompt.trim(),
      });

      const res = await axios.post(`${API}/generate-page`, {
        prompt: finalPrompt,
        page_type: selectedType,
        audience: audience.trim(),
        product_name: productName.trim(),
        product_description: productDescription.trim(),
        variant_hint: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      const pageData = res.data.page;
      // Store in sessionStorage and navigate to builder
      sessionStorage.setItem('builderPage', JSON.stringify(pageData));
      navigate('/builder');
      toast.success('Landing page generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to generate page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  return (
    <div className="prompt-page" data-testid="prompt-page">
      <div className="prompt-content">
        <div className="prompt-badge" data-testid="prompt-badge">
          <Sparkles size={14} />
          AI-Powered Page Builder
        </div>

        <h1 className="prompt-title">
          Build Landing Pages<br />
          with <span>AI Magic</span>
        </h1>

        <p className="prompt-subtitle">
          Describe your perfect landing page and watch it come to life.
          Edit every element, drag to reorder, and publish when ready.
        </p>

        {loading ? (
          <div className="prompt-loading" data-testid="prompt-loading">
            <div className="prompt-spinner" />
            <span>Crafting your landing page...</span>
            <span style={{ fontSize: 13, color: '#666' }}>This may take 15-30 seconds</span>
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
                <input
                  className="prompt-input"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Who is this page for?"
                />
              </div>

              <div className="prompt-field">
                <label className="prompt-field-label">Product/Service Name</label>
                <input
                  className="prompt-input"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
            </div>

            <div className="prompt-input-wrapper">
              <label className="prompt-field-label">Product/Service Description</label>
              <textarea
                className="prompt-textarea prompt-textarea-sm"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe your product/service in 1-3 lines"
              />
            </div>

            <div className="prompt-input-wrapper">
              <label className="prompt-field-label">Additional Requirements (Optional)</label>
              <textarea
                data-testid="prompt-textarea"
                className="prompt-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Any extra direction? (brand voice, CTAs, offers, sections to emphasize)"
                autoFocus
              />
            </div>

            <button
              data-testid="generate-btn"
              className="prompt-generate-btn"
              onClick={handleGenerate}
            >
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
