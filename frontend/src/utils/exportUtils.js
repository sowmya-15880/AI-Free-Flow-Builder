export const exportJSON = (page) => {
  const json = JSON.stringify(page, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(page.title || 'landing-page').replace(/\s+/g, '-').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const renderElementHTML = (el) => {
  const styleStr = Object.entries(el.style || {})
    .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
    .join('; ');

  switch (el.type) {
    case 'heading':
      return `<h2 style="${styleStr}">${el.content}</h2>`;
    case 'paragraph':
      return `<p style="${styleStr}">${el.content}</p>`;
    case 'image': {
      const src = typeof el.content === 'object' ? el.content.src : el.content;
      const alt = typeof el.content === 'object' ? el.content.alt : '';
      return `<img src="${src}" alt="${alt}" style="${styleStr}" />`;
    }
    case 'button':
      return `<a href="#" style="${styleStr}; text-decoration: none; display: inline-block;">${el.content}</a>`;
    case 'form': {
      const fields = typeof el.content === 'object' ? el.content.fields || [] : [];
      const submitText = typeof el.content === 'object' ? el.content.submitText || 'Submit' : 'Submit';
      const fieldHTML = fields.map(f => {
        if (f.type === 'textarea') {
          return `<div style="margin-bottom: 16px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px;">${f.label}</label>
            <textarea placeholder="${f.placeholder || ''}" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; min-height: 80px; resize: vertical;"></textarea>
          </div>`;
        }
        return `<div style="margin-bottom: 16px;">
          <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px;">${f.label}</label>
          <input type="${f.type || 'text'}" placeholder="${f.placeholder || ''}" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
        </div>`;
      }).join('\n');
      return `<form style="${styleStr}" onsubmit="event.preventDefault()">
        ${fieldHTML}
        <button type="submit" style="background: #6366f1; color: white; padding: 12px 28px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; width: 100%;">${submitText}</button>
      </form>`;
    }
    case 'icon':
      return `<div style="${styleStr}; font-size: ${typeof el.content === 'object' ? el.content.size : 48}px;">&#9733;</div>`;
    case 'gallery': {
      const images = typeof el.content === 'object' ? el.content.images || [] : [];
      const imgHTML = images.map(img =>
        `<img src="${img.src}" alt="${img.alt || ''}" style="width: 100%; border-radius: 8px; object-fit: cover; aspect-ratio: 1;" />`
      ).join('\n');
      return `<div style="${styleStr}">${imgHTML}</div>`;
    }
    case 'divider':
      return `<hr style="${styleStr}" />`;
    case 'spacer':
      return `<div style="${styleStr}"></div>`;
    case 'popup':
      return `<button style="${styleStr}" onclick="alert('${typeof el.content === 'object' ? (el.content.body || '') : ''}')">${typeof el.content === 'object' ? el.content.triggerText : el.content}</button>`;
    default:
      return `<div style="${styleStr}">${typeof el.content === 'string' ? el.content : ''}</div>`;
  }
};

export const exportHTML = (page) => {
  const sectionsHTML = (page.sections || []).map(section => {
    const sectionStyle = Object.entries(section.style || {})
      .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
      .join('; ');
    const elementsHTML = (section.elements || []).map(renderElementHTML).join('\n      ');
    return `    <section style="${sectionStyle}">
      ${elementsHTML}
    </section>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title || 'Landing Page'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    img { max-width: 100%; height: auto; }
    section { width: 100%; }
  </style>
</head>
<body>
${sectionsHTML}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(page.title || 'landing-page').replace(/\s+/g, '-').toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
