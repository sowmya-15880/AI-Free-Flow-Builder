use ffb_schema_core::{Element, Page};
use wasm_bindgen::prelude::*;

fn style_to_css(style: &ffb_schema_core::JsonMap) -> String {
    style
        .iter()
        .map(|(key, value)| {
            let css_key = key
                .chars()
                .enumerate()
                .flat_map(|(index, ch)| {
                    if ch.is_uppercase() {
                        let lower = ch.to_lowercase().collect::<String>();
                        if index == 0 {
                            lower.chars().collect::<Vec<char>>()
                        } else {
                            format!("-{lower}").chars().collect::<Vec<char>>()
                        }
                    } else {
                        vec![ch]
                    }
                })
                .collect::<String>();

            let css_value = match value {
                serde_json::Value::String(s) => s.clone(),
                _ => value.to_string(),
            };

            format!("{css_key}: {css_value}")
        })
        .collect::<Vec<String>>()
        .join("; ")
}

fn render_element(element: &Element) -> String {
    let style = style_to_css(&element.style);

    match element.element_type.as_str() {
        "heading" => format!("<h2 style=\"{style}\">{}</h2>", element.content),
        "paragraph" => format!("<p style=\"{style}\">{}</p>", element.content),
        "image" => {
            if let Some(content) = element.content.as_object() {
                let src = content.get("src").and_then(|v| v.as_str()).unwrap_or("");
                let alt = content.get("alt").and_then(|v| v.as_str()).unwrap_or("");
                format!("<img src=\"{src}\" alt=\"{alt}\" style=\"{style}\" />")
            } else {
                String::new()
            }
        }
        "button" => format!(
            "<a href=\"#\" style=\"{style}; text-decoration: none; display: inline-block;\">{}</a>",
            element.content
        ),
        _ => format!("<div style=\"{style}\">{}</div>", element.content),
    }
}

#[wasm_bindgen]
pub fn render_page_html(page_json: &str) -> Result<String, JsValue> {
    let page: Page = serde_json::from_str(page_json)
        .map_err(|e| JsValue::from_str(&format!("invalid page json: {e}")))?;

    let sections_html = page
        .sections
        .iter()
        .map(|section| {
            let section_style = style_to_css(&section.style);
            let inner = section
                .elements
                .iter()
                .map(render_element)
                .collect::<Vec<String>>()
                .join("\n");
            format!("<section style=\"{section_style}\">{inner}</section>")
        })
        .collect::<Vec<String>>()
        .join("\n");

    Ok(format!(
        "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>{}</title></head><body>{}</body></html>",
        page.title, sections_html
    ))
}
