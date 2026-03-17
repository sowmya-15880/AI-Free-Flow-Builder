import { useState, useRef, useEffect } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { exportJSON, exportHTML } from '@/utils/exportUtils';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Folder,
  Settings,
  Paintbrush,
  Eye,
  PieChart,
  MoreVertical,
  Download,
  FileJson,
  FileCode,
  ChevronDown,
  FlaskConical,
  CircleDot,
} from 'lucide-react';
import { toast } from 'sonner';

const TOP_NAV_ITEMS = [
  { id: 'insert', label: 'INSERT', icon: CircleDot },
  { id: 'optimize', label: 'OPTIMIZE', icon: FlaskConical },
  { id: 'integrations', label: 'INTEGRATIONS', icon: PieChart },
];

export default function Toolbar({ device, setDevice, onBack, insertOpen, onToggleInsert, isPreview, onTogglePreview }) {
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
    toast.success('JSON file downloaded');
    setShowPublish(false);
  };

  const handleExportHTML = () => {
    exportHTML(state.page);
    toast.success('HTML file downloaded');
    setShowPublish(false);
  };

  return (
    <div className="builder-toolbar" data-testid="builder-toolbar">
      <div className="toolbar-left">
        <button className="toolbar-back-btn" onClick={onBack} data-testid="toolbar-back-btn" title="Back">
          <ArrowLeft size={18} />
        </button>

        <div className="toolbar-nav-group">
          {TOP_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`toolbar-nav-btn ${item.id === 'insert' && insertOpen ? 'active' : ''}`}
              type="button"
              onClick={() => {
                if (item.id === 'insert' && onToggleInsert) {
                  onToggleInsert();
                }
              }}
            >
              <item.icon size={15} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
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

      <div className="toolbar-right" ref={dropdownRef}>
        <button className="toolbar-btn" title="Folders" type="button">
          <Folder size={15} />
        </button>
        <button className="toolbar-btn" title="Settings" type="button">
          <Settings size={15} />
        </button>
        <button className="toolbar-btn" title="Theme" type="button">
          <Paintbrush size={15} />
        </button>

        <button className="toolbar-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" data-testid="toolbar-undo-btn">
          <Undo2 size={15} />
        </button>
        <button className="toolbar-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" data-testid="toolbar-redo-btn">
          <Redo2 size={15} />
        </button>

        <button
          className={`toolbar-btn ${isPreview ? 'active' : ''}`}
          title="Preview"
          type="button"
          onClick={onTogglePreview}
          data-testid="toolbar-preview-btn"
        >
          <Eye size={15} />
        </button>

        <button className="toolbar-page-label toolbar-page-label-btn" type="button" onClick={onTogglePreview}>
          {isPreview ? 'Back To Builder' : 'View Page'}
        </button>

        <button className="publish-btn" onClick={() => setShowPublish((v) => !v)} data-testid="publish-btn">
          Update
        </button>

        <button className="toolbar-btn" title="More" type="button">
          <MoreVertical size={15} />
        </button>

        {showPublish && (
          <div className="publish-dropdown" data-testid="publish-dropdown">
            <button className="publish-dropdown-item" onClick={handleExportJSON} data-testid="export-json-btn">
              <FileJson size={15} style={{ color: '#4f89ff' }} />
              Download JSON
            </button>
            <button className="publish-dropdown-item" onClick={handleExportHTML} data-testid="export-html-btn">
              <FileCode size={15} style={{ color: '#32b880' }} />
              Download HTML
            </button>
            <button className="publish-dropdown-item" onClick={() => setShowPublish(false)}>
              <Download size={15} style={{ color: '#ff4d79' }} />
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
