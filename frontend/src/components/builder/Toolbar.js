import { useState, useRef, useEffect } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { exportJSON, exportHTML } from '@/utils/exportUtils';
import {
  ArrowLeft, Undo2, Redo2, Monitor, Tablet, Smartphone,
  Download, FileJson, FileCode, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

export default function Toolbar({ device, setDevice, onBack }) {
  const { state, undo, redo, canUndo, canRedo } = useBuilder();
  const [showPublish, setShowPublish] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowPublish(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExportJSON = () => {
    exportJSON(state.page);
    toast.success('JSON file downloaded!');
    setShowPublish(false);
  };

  const handleExportHTML = () => {
    exportHTML(state.page);
    toast.success('HTML file downloaded!');
    setShowPublish(false);
  };

  return (
    <div className="builder-toolbar" data-testid="builder-toolbar">
      <div className="toolbar-left">
        <button className="toolbar-back-btn" onClick={onBack} data-testid="toolbar-back-btn">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <div className="toolbar-divider" />
        <button
          className="toolbar-btn"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          data-testid="toolbar-undo-btn"
        >
          <Undo2 size={16} />
        </button>
        <button
          className="toolbar-btn"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          data-testid="toolbar-redo-btn"
        >
          <Redo2 size={16} />
        </button>
      </div>

      <div className="toolbar-center">
        <button
          className={`toolbar-btn ${device === 'desktop' ? 'active' : ''}`}
          onClick={() => setDevice('desktop')}
          title="Desktop view"
          data-testid="toolbar-desktop-btn"
        >
          <Monitor size={16} />
        </button>
        <button
          className={`toolbar-btn ${device === 'tablet' ? 'active' : ''}`}
          onClick={() => setDevice('tablet')}
          title="Tablet view"
          data-testid="toolbar-tablet-btn"
        >
          <Tablet size={16} />
        </button>
        <button
          className={`toolbar-btn ${device === 'mobile' ? 'active' : ''}`}
          onClick={() => setDevice('mobile')}
          title="Mobile view"
          data-testid="toolbar-mobile-btn"
        >
          <Smartphone size={16} />
        </button>
      </div>

      <div className="toolbar-right" style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          className="publish-btn"
          onClick={() => setShowPublish(!showPublish)}
          data-testid="publish-btn"
        >
          <Download size={16} />
          Publish
          <ChevronDown size={14} />
        </button>
        {showPublish && (
          <div className="publish-dropdown" data-testid="publish-dropdown">
            <button className="publish-dropdown-item" onClick={handleExportJSON} data-testid="export-json-btn">
              <FileJson size={16} style={{ color: '#6366f1' }} />
              Download JSON
            </button>
            <button className="publish-dropdown-item" onClick={handleExportHTML} data-testid="export-html-btn">
              <FileCode size={16} style={{ color: '#10b981' }} />
              Download HTML
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
