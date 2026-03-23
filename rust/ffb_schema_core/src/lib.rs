use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;

pub type JsonMap = Map<String, Value>;

/// Extended Page schema supporting both flat and hierarchical structures
/// Supports both FFB format (flat sections→elements) and Zoho format (hierarchical with row/column)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Page {
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub page_type: String,
    #[serde(default)]
    pub sections: Vec<Section>,
    
    // NEW: Flat element store for Zoho-style JSON compatibility
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub elements: HashMap<String, Element>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Section {
    #[serde(default)]
    pub id: String,
    #[serde(rename = "type", default)]
    pub section_type: String,
    #[serde(default)]
    pub style: JsonMap,
    #[serde(default)]
    pub elements: Vec<Element>,
    
    // NEW: Support Zoho-style row references
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub rows: Vec<String>,  // Row element IDs
}

/// Extended Element schema with hierarchical and device-specific support
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Element {
    #[serde(default)]
    pub id: String,
    #[serde(rename = "type", default)]
    pub element_type: String,
    #[serde(default)]
    pub content: Value,
    #[serde(default)]
    pub style: JsonMap,
    #[serde(default)]
    pub position: Option<Position>,
    
    // NEW: Hierarchical support (for rows, columns, boxes)
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub children: Vec<String>,  // IDs of direct child elements
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,  // ID of parent element
    
    // NEW: Support columns for rows and elements for columns
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub columns: Vec<String>,  // For rows: column IDs
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub elements: Vec<String>,  // For columns: element IDs
    
    // NEW: Device-specific styling (preserve Zoho format properties)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mobile_style: Option<JsonMap>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tablet_style: Option<JsonMap>,
    
    // NEW: Full element object for Zoho compatibility (wraps all properties)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub element: Option<Box<JsonMap>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

pub fn validate_page(page: &Page) -> Result<(), String> {
    if page.sections.is_empty() && page.elements.is_empty() {
        return Ok(());
    }

    let mut section_ids = HashSet::new();
    let mut element_ids = HashSet::new();

    // Validate flat sections (FFB format)
    for section in &page.sections {
        if section.id.trim().is_empty() {
            return Err("section id cannot be empty".to_string());
        }
        if !section_ids.insert(section.id.clone()) {
            return Err(format!("duplicate section id: {}", section.id));
        }

        for element in &section.elements {
            if element.id.trim().is_empty() {
                return Err("element id cannot be empty".to_string());
            }
            if !element_ids.insert(element.id.clone()) {
                return Err(format!("duplicate element id: {}", element.id));
            }
            if element.element_type.trim().is_empty() {
                return Err(format!("element {} has empty type", element.id));
            }
        }
    }

    // Validate hierarchical elements (Zoho format)
    if !page.elements.is_empty() {
        validate_element_hierarchy(page)?;
    }

    Ok(())
}

/// Validate hierarchical element structure (no circular references, all IDs resolved)
fn validate_element_hierarchy(page: &Page) -> Result<(), String> {
    let mut visited = HashSet::new();
    let mut rec_stack = HashSet::new();

    for element_id in page.elements.keys() {
        if !visited.contains(element_id) {
            validate_no_cycles(element_id, page, &mut visited, &mut rec_stack)?;
        }
    }

    // Validate all references resolve
    for (id, element) in &page.elements {
        // Check children exist
        for child_id in &element.children {
            if !page.elements.contains_key(child_id) {
                return Err(format!("element {} references non-existent child {}", id, child_id));
            }
        }
        // Check columns exist
        for col_id in &element.columns {
            if !page.elements.contains_key(col_id) {
                return Err(format!("row {} references non-existent column {}", id, col_id));
            }
        }
        // Check elements exist
        for el_id in &element.elements {
            if !page.elements.contains_key(el_id) {
                return Err(format!("column {} references non-existent element {}", id, el_id));
            }
        }
        // Check parent exists if present
        if let Some(parent_id) = &element.parent_id {
            if !page.elements.contains_key(parent_id) {
                return Err(format!("element {} references non-existent parent {}", id, parent_id));
            }
        }
    }

    Ok(())
}

fn validate_no_cycles(
    node: &str,
    page: &Page,
    visited: &mut HashSet<String>,
    rec_stack: &mut HashSet<String>,
) -> Result<(), String> {
    visited.insert(node.to_string());
    rec_stack.insert(node.to_string());

    if let Some(element) = page.elements.get(node) {
        let all_refs: Vec<String> = element
            .children
            .iter()
            .chain(element.columns.iter())
            .chain(element.elements.iter())
            .cloned()
            .collect();

        for neighbor in all_refs {
            if !visited.contains(&neighbor) {
                validate_no_cycles(&neighbor, page, visited, rec_stack)?;
            } else if rec_stack.contains(&neighbor) {
                return Err(format!("circular reference detected: {} -> {}", node, neighbor));
            }
        }
    }

    rec_stack.remove(node);
    Ok(())
}

#[wasm_bindgen]
pub fn validate_page_json(input: &str) -> Result<String, JsValue> {
    let page: Page = serde_json::from_str(input)
        .map_err(|e| JsValue::from_str(&format!("invalid page json: {e}")))?;

    validate_page(&page).map_err(|e| JsValue::from_str(&e))?;

    serde_json::to_string(&page)
        .map_err(|e| JsValue::from_str(&format!("failed to serialize page: {e}")))
}

/// Flatten hierarchical elements into a simple element list for rendering
/// Resolves all ID references and returns a map of element IDs to resolved elements
#[wasm_bindgen]
pub fn resolve_element_hierarchy(page_js: JsValue) -> Result<JsValue, JsValue> {
    let page: Page = serde_wasm_bindgen::from_value(page_js)
        .map_err(|e| JsValue::from_str(&format!("invalid page: {e}")))?;

    validate_page(&page).map_err(|e| JsValue::from_str(&e))?;

    // Return the page as-is with validation passed
    serde_wasm_bindgen::to_value(&page)
        .map_err(|e| JsValue::from_str(&format!("failed to encode: {e}")))
}

/// Get all children of an element by ID (for hierarchical rendering)
#[wasm_bindgen]
pub fn get_element_children(page_js: JsValue, element_id: String) -> Result<JsValue, JsValue> {
    let page: Page = serde_wasm_bindgen::from_value(page_js)
        .map_err(|e| JsValue::from_str(&format!("invalid page: {e}")))?;

    if let Some(element) = page.elements.get(&element_id) {
        let children: Vec<String> = element
            .children
            .iter()
            .chain(element.columns.iter())
            .chain(element.elements.iter())
            .cloned()
            .collect();

        return serde_wasm_bindgen::to_value(&children)
            .map_err(|e| JsValue::from_str(&format!("failed to encode: {e}")));
    }

    Ok(JsValue::NULL)
}

/// Get device-specific style for an element
#[wasm_bindgen]
pub fn get_device_style(page_js: JsValue, element_id: String, device: String) -> Result<JsValue, JsValue> {
    let page: Page = serde_wasm_bindgen::from_value(page_js)
        .map_err(|e| JsValue::from_str(&format!("invalid page: {e}")))?;

    if let Some(element) = page.elements.get(&element_id) {
        let style = match device.as_str() {
            "mobile" => element.mobile_style.as_ref().unwrap_or(&element.style),
            "tablet" => element.tablet_style.as_ref().unwrap_or(&element.style),
            _ => &element.style,
        };

        return serde_wasm_bindgen::to_value(&style)
            .map_err(|e| JsValue::from_str(&format!("failed to encode: {e}")));
    }

    Ok(JsValue::NULL)
}
