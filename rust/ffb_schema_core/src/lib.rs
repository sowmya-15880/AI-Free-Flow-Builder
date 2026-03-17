use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::HashSet;
use wasm_bindgen::prelude::*;

pub type JsonMap = Map<String, Value>;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Page {
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub sections: Vec<Section>,
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
}

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
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

pub fn validate_page(page: &Page) -> Result<(), String> {
    if page.sections.is_empty() {
        return Ok(());
    }

    let mut section_ids = HashSet::new();
    let mut element_ids = HashSet::new();

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
