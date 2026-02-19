import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Wand2, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EXAMPLE_PROMPTS = [
  "SaaS product for project management",
  "Fitness coaching membership site",
  "Creative design agency portfolio",
  "Online food delivery startup",
  "AI-powered writing assistant tool",
  "Real estate property listings",
];

export default function PromptPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for your landing page');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/generate-page`, { prompt: prompt.trim() });
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
            <div className="prompt-input-wrapper">
              <textarea
                data-testid="prompt-textarea"
                className="prompt-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your landing page... e.g., 'A modern SaaS landing page for a project management tool with a hero section, features grid, testimonials, pricing, and a CTA section'"
                autoFocus
              />
            </div>

            <button
              data-testid="generate-btn"
              className="prompt-generate-btn"
              onClick={handleGenerate}
              disabled={!prompt.trim()}
            >
              <Wand2 size={18} />
              Generate Landing Page
              <ArrowRight size={16} />
            </button>

            <div className="prompt-examples">
              <p className="prompt-examples-label">Try an example</p>
              <div className="prompt-chips">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex}
                    className="prompt-chip"
                    data-testid={`prompt-chip-${ex.split(' ').slice(0, 2).join('-').toLowerCase()}`}
                    onClick={() => setPrompt(ex)}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
