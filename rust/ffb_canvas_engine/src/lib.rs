use ffb_schema_core::{validate_page, Element, Page, Position};
use serde_wasm_bindgen::{from_value, to_value};
use wasm_bindgen::prelude::*;
use std::collections::HashMap;

const SNAP_GRID: f64 = 8.0;

fn snap(value: f64) -> f64 {
    (value / SNAP_GRID).round() * SNAP_GRID
}

fn parse_page(page_js: JsValue) -> Result<Page, JsValue> {
    from_value(page_js).map_err(|e| JsValue::from_str(&format!("invalid page payload: {e}")))
}

fn to_js_page(page: &Page) -> Result<JsValue, JsValue> {
    to_value(page).map_err(|e| JsValue::from_str(&format!("failed to encode page: {e}")))
}

fn validate_and_encode(page: &Page) -> Result<JsValue, JsValue> {
    validate_page(page).map_err(|e| JsValue::from_str(&e))?;
    to_js_page(page)
}

fn generate_element_id(page: &Page) -> String {
    let flat_count: usize = page.sections.iter().map(|s| s.elements.len()).sum();
    let hierarchy_count = page.elements.len();
    format!("el-{}", flat_count + hierarchy_count + 1)
}

#[wasm_bindgen]
pub fn engine_version() -> String {
    "ffb_canvas_engine@0.2.0".to_string()
}

#[wasm_bindgen]
pub fn add_element(page_js: JsValue, section_id: String, element_js: JsValue) -> Result<JsValue, JsValue> {
    let mut page = parse_page(page_js)?;
    let mut element: Element = from_value(element_js)
        .map_err(|e| JsValue::from_str(&format!("invalid element payload: {e}")))?;

    if element.id.trim().is_empty() {
        element.id = generate_element_id(&page);
    }

    let target_section = page
        .sections
        .iter_mut()
        .find(|section| section.id == section_id)
        .ok_or_else(|| JsValue::from_str("target section not found"))?;

    target_section.elements.push(element);
    validate_and_encode(&page)
}

#[wasm_bindgen]
pub fn move_element_position(
    page_js: JsValue,
    element_id: String,
    x: f64,
    y: f64,
) -> Result<JsValue, JsValue> {
    let mut page = parse_page(page_js)?;

    let mut found = false;
    for section in &mut page.sections {
        if let Some(element) = section.elements.iter_mut().find(|element| element.id == element_id) {
            element.position = Some(Position {
                x: snap(x),
                y: snap(y),
            });
            found = true;
            break;
        }
    }

    if !found {
        return Err(JsValue::from_str("element not found"));
    }

    validate_and_encode(&page)
}

#[wasm_bindgen]
pub fn move_element(
    page_js: JsValue,
    element_id: String,
    to_section_id: String,
) -> Result<JsValue, JsValue> {
    let mut page = parse_page(page_js)?;

    let mut moved: Option<Element> = None;
    for section in &mut page.sections {
        if let Some(index) = section.elements.iter().position(|element| element.id == element_id) {
            moved = Some(section.elements.remove(index));
            break;
        }
    }

    let element = moved.ok_or_else(|| JsValue::from_str("element not found"))?;

    let target_section = page
        .sections
        .iter_mut()
        .find(|section| section.id == to_section_id)
        .ok_or_else(|| JsValue::from_str("target section not found"))?;

    target_section.elements.push(element);
    validate_and_encode(&page)
}

#[wasm_bindgen]
pub fn reorder_elements(
    page_js: JsValue,
    section_id: String,
    old_index: usize,
    new_index: usize,
) -> Result<JsValue, JsValue> {
    let mut page = parse_page(page_js)?;

    let section = page
        .sections
        .iter_mut()
        .find(|section| section.id == section_id)
        .ok_or_else(|| JsValue::from_str("section not found"))?;

    let len = section.elements.len();
    if old_index >= len || new_index >= len {
        return Err(JsValue::from_str("reorder index out of bounds"));
    }

    let moved = section.elements.remove(old_index);
    section.elements.insert(new_index, moved);

    validate_and_encode(&page)
}

// ============================================================================
// NEW: Hierarchical Element Operations (for Zoho-style JSON support)
// ============================================================================

/// Add element to hierarchical structure by parent ID
/// If parent is a row, adds to columns; if parent is a column, adds to elements
#[wasm_bindgen]
pub fn add_element_to_parent(
    page_js: JsValue,
    parent_id: String,
    element_js: JsValue,
) -> Result<JsValue, JsValue> {
    let mut page = parse_page(page_js)?;
    let mut element: Element = from_value(element_js)
        .map_err(|e| JsValue::from_str(&format!("invalid element payload: {e}")))?;

    if element.id.trim().is_empty() {
        element.id = generate_element_id(&page);
    }

    let parent = page
        .elements
        .get_mut(&parent_id)
        .ok_or_else(|| JsValue::from_str("parent element not found"))?;

    // Determine which field to use based on parent type
    let element_id = element.id.clone();
    match parent.element_type.as_str() {
        "row" => {
            // Rows contain columns
            if element.element_type == "column" {
                parent.columns.push(element_id.clone());
                page.elements.insert(element_id, element);
            } else {
                return Err(JsValue::from_str("can only add columns to rows"));
            }
        }
        "column" => {
            // Columns contain elements
            parent.elements.push(element_id.clone());
            element.parent_id = Some(parent_id.clone());
            page.elements.insert(element_id, element);
        }
        "box" => {
            // Boxes contain elements
            parent.children.push(element_id.clone());
            element.parent_id = Some(parent_id.clone());
            page.elements.insert(element_id, element);
        }
        _ => return Err(JsValue::from_str("invalid parent element type")),
    }

    validate_and_encode(&page)
}

/// Move element within hierarchy (change parent)
#[wasm_bindgen]
pub fn move_element_to_parent(
    page_js: JsValue,
    element_id: String,
    from_parent_id: String,
    to_parent_id: String,
) -> Result<JsValue, JsValue> {
    let mut page = parse_page(page_js)?;

    // Remove from old parent
    if let Some(from_parent) = page.elements.get_mut(&from_parent_id) {
        match from_parent.element_type.as_str() {
            "row" => {
                if let Some(idx) = from_parent.columns.iter().position(|id| id == &element_id) {
                    from_parent.columns.remove(idx);
                }
            }
            "column" => {
                if let Some(idx) = from_parent.elements.iter().position(|id| id == &element_id) {
                    from_parent.elements.remove(idx);
                }
            }
            "box" => {
                if let Some(idx) = from_parent.children.iter().position(|id| id == &element_id) {
                    from_parent.children.remove(idx);
                }
            }
            _ => {}
        }
    }

    // Add to new parent
    if let Some(to_parent) = page.elements.get_mut(&to_parent_id) {
        match to_parent.element_type.as_str() {
            "row" => to_parent.columns.push(element_id.clone()),
            "column" => to_parent.elements.push(element_id.clone()),
            "box" => to_parent.children.push(element_id.clone()),
            _ => return Err(JsValue::from_str("invalid target parent type")),
        }
    }

    // Update element's parent reference
    if let Some(element) = page.elements.get_mut(&element_id) {
        element.parent_id = Some(to_parent_id);
    }

    validate_and_encode(&page)
}

/// Update element properties (style, content, etc.) in hierarchical structure
#[wasm_bindgen]
pub fn update_element_in_hierarchy(
    page_js: JsValue,
    element_id: String,
    update_js: JsValue,
) -> Result<JsValue, JsValue> {
    let mut page = parse_page(page_js)?;

    let element = page
        .elements
        .get_mut(&element_id)
        .ok_or_else(|| JsValue::from_str("element not found"))?;

    let update: serde_json::Value =
        from_value(update_js).map_err(|e| JsValue::from_str(&format!("invalid update: {e}")))?;

    if let Some(style) = update.get("style").and_then(|s| s.as_object()) {
        element.style = style.clone();
    }

    if let Some(content) = update.get("content") {
        element.content = content.clone();
    }

    if let Some(mobile_style) = update.get("mobile_style").and_then(|s| s.as_object()) {
        element.mobile_style = Some(mobile_style.clone());
    }

    if let Some(tablet_style) = update.get("tablet_style").and_then(|s| s.as_object()) {
        element.tablet_style = Some(tablet_style.clone());
    }

    validate_and_encode(&page)
}

/// Delete element from hierarchical structure
#[wasm_bindgen]
pub fn delete_element_from_hierarchy(
    page_js: JsValue,
    element_id: String,
) -> Result<JsValue, JsValue> {
    let mut page = parse_page(page_js)?;

    let element = page
        .elements
        .get(&element_id)
        .ok_or_else(|| JsValue::from_str("element not found"))?
        .clone();

    // Remove from parent
    if let Some(parent_id) = &element.parent_id {
        if let Some(parent) = page.elements.get_mut(parent_id) {
            parent.columns.retain(|id| id != &element_id);
            parent.elements.retain(|id| id != &element_id);
            parent.children.retain(|id| id != &element_id);
        }
    }

    // Delete all children recursively
    let children_to_delete: Vec<String> = element
        .children
        .iter()
        .chain(element.columns.iter())
        .chain(element.elements.iter())
        .cloned()
        .collect();

    for child_id in children_to_delete {
        page.elements.remove(&child_id);
    }

    // Remove self
    page.elements.remove(&element_id);

    validate_and_encode(&page)
}
