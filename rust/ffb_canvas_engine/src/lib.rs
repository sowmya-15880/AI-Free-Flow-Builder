use ffb_schema_core::{validate_page, Element, Page, Position};
use serde_wasm_bindgen::{from_value, to_value};
use wasm_bindgen::prelude::*;

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
    let count = page.sections.iter().map(|s| s.elements.len()).sum::<usize>();
    format!("el-{}", count + 1)
}

#[wasm_bindgen]
pub fn engine_version() -> String {
    "ffb_canvas_engine@0.1.0".to_string()
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
