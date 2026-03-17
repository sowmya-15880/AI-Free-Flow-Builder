const shouldUseRust = process.env.REACT_APP_USE_RUST_CANVAS === 'true';
const wasmModuleUrl = process.env.REACT_APP_RUST_CANVAS_MODULE_URL || '/wasm/ffb_canvas_engine.js';

let rustModule = null;
let rustLoadStarted = false;

export function initRustCanvasEngine() {
  if (!shouldUseRust || rustLoadStarted) return;
  rustLoadStarted = true;

  import(/* webpackIgnore: true */ wasmModuleUrl)
    .then((mod) => {
      rustModule = mod;
      if (typeof rustModule?.engine_version === 'function') {
        // eslint-disable-next-line no-console
        console.info('Rust canvas engine loaded:', rustModule.engine_version());
      }
    })
    .catch((err) => {
      rustModule = null;
      // eslint-disable-next-line no-console
      console.warn('Rust canvas engine unavailable, using JS reducer fallback.', err);
    });
}

function hasRustFunction(name) {
  return Boolean(rustModule && typeof rustModule[name] === 'function');
}

export function tryApplyRustMutation(page, action) {
  if (!shouldUseRust || !rustModule || !action) {
    return null;
  }

  try {
    switch (action.type) {
      case 'ADD_ELEMENT':
        if (!action.sectionId || !action.element || !hasRustFunction('add_element')) return null;
        return rustModule.add_element(page, action.sectionId, action.element);

      case 'MOVE_ELEMENT_POSITION':
        if (!hasRustFunction('move_element_position')) return null;
        return rustModule.move_element_position(page, action.elementId, action.x, action.y);

      case 'MOVE_ELEMENT':
        if (!hasRustFunction('move_element')) return null;
        return rustModule.move_element(page, action.elementId, action.toSectionId);

      case 'REORDER_ELEMENTS':
        if (!hasRustFunction('reorder_elements')) return null;
        return rustModule.reorder_elements(page, action.sectionId, action.oldIndex, action.newIndex);

      default:
        return null;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Rust mutation failed, falling back to JS reducer.', err);
    return null;
  }
}
