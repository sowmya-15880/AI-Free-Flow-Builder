#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class TemplateGalleryTester:
    def __init__(self, base_url="https://b467106f-57d6-4a8d-a53d-0379a62be61d.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, passed, details=""):
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
        self.results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })

    def test_api_health(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            passed = response.status_code == 200
            details = f"Status: {response.status_code}"
            if passed:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
        except Exception as e:
            passed = False
            details = f"Error: {str(e)}"
        
        self.log_result("API Health Check", passed, details)
        return passed

    def test_template_generation_saas_dark(self):
        """Test SaaS Dark template generation"""
        template_config = {
            "prompt": "Dark theme with neon indigo/violet accents, bold gradients, glass-morphism cards, glowing CTAs. Make it look like a premium dev tool landing page.",
            "page_type": "saas",
            "audience": "Startup founders and SaaS teams",
            "product_name": "NovaDev",
            "product_description": "A next-gen developer platform with AI-powered code generation, real-time collaboration, and instant cloud deployments.",
            "variant_hint": "dark_neon-test-template"
        }
        
        try:
            response = requests.post(f"{self.base_url}/generate-page", json=template_config, timeout=45)
            passed = response.status_code == 200
            
            if passed:
                data = response.json()
                page = data.get('page', {})
                sections = page.get('sections', [])
                
                # Count total elements
                total_elements = sum(len(section.get('elements', [])) for section in sections)
                
                # Verify requirements
                has_8_sections = len(sections) >= 8
                has_40_elements = total_elements >= 40
                has_style_hint = data.get('meta', {}).get('variant_hint', '').startswith('dark_neon')
                
                details = f"Sections: {len(sections)}, Elements: {total_elements}, Style hint: {has_style_hint}"
                passed = has_8_sections and has_40_elements and has_style_hint
                
                if not passed:
                    details += f" (Need 8+ sections: {has_8_sections}, 40+ elements: {has_40_elements})"
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:200]}"
                
        except Exception as e:
            passed = False
            details = f"Error: {str(e)}"
        
        self.log_result("SaaS Dark Template Generation", passed, details)
        return passed

    def test_template_generation_gradient_saas(self):
        """Test Gradient SaaS template generation"""
        template_config = {
            "prompt": "Gradient SaaS style with purple-to-blue gradients, soft shadows, rounded cards, floating UI mockups. Clean and aspirational design.",
            "page_type": "saas",
            "audience": "Product teams and business leaders",
            "product_name": "CloudSync Pro",
            "product_description": "An intelligent cloud platform that unifies your data, automates workflows, and delivers real-time insights across every department.",
            "variant_hint": "gradient_saas-test-template"
        }
        
        try:
            response = requests.post(f"{self.base_url}/generate-page", json=template_config, timeout=45)
            passed = response.status_code == 200
            
            if passed:
                data = response.json()
                page = data.get('page', {})
                sections = page.get('sections', [])
                total_elements = sum(len(section.get('elements', [])) for section in sections)
                
                has_8_sections = len(sections) >= 8
                has_40_elements = total_elements >= 40
                has_gradient_style = data.get('meta', {}).get('variant_hint', '').startswith('gradient_saas')
                
                details = f"Sections: {len(sections)}, Elements: {total_elements}, Gradient style: {has_gradient_style}"
                passed = has_8_sections and has_40_elements and has_gradient_style
                
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:200]}"
                
        except Exception as e:
            passed = False
            details = f"Error: {str(e)}"
        
        self.log_result("Gradient SaaS Template Generation", passed, details)
        return passed

    def test_template_generation_minimal_white(self):
        """Test Minimal White template generation"""
        template_config = {
            "prompt": "Clean minimal white design with sharp black typography, lots of whitespace, subtle gray accents, refined card layouts. Inspired by Linear, Stripe, Notion.",
            "page_type": "product_info",
            "audience": "Product evaluators and early adopters",
            "product_name": "Refine Studio",
            "product_description": "A minimalist project management tool that cuts the noise. Focus on what matters with elegant task flows and smart automation.",
            "variant_hint": "minimal_white-test-template"
        }
        
        try:
            response = requests.post(f"{self.base_url}/generate-page", json=template_config, timeout=45)
            passed = response.status_code == 200
            
            if passed:
                data = response.json()
                page = data.get('page', {})
                sections = page.get('sections', [])
                total_elements = sum(len(section.get('elements', [])) for section in sections)
                
                has_8_sections = len(sections) >= 8
                has_40_elements = total_elements >= 40
                
                details = f"Sections: {len(sections)}, Elements: {total_elements}"
                passed = has_8_sections and has_40_elements
                
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:200]}"
                
        except Exception as e:
            passed = False
            details = f"Error: {str(e)}"
        
        self.log_result("Minimal White Template Generation", passed, details)
        return passed

    def test_template_generation_food_restaurant(self):
        """Test Food & Restaurant template generation"""
        template_config = {
            "prompt": "Dark theme with warm amber/orange accents for a premium food delivery or restaurant landing page. Rich imagery sections, menu card grids, customer review cards with avatars, order CTA buttons.",
            "page_type": "lead_generation",
            "audience": "Foodies and busy professionals who value quality meals",
            "product_name": "HealthyEat",
            "product_description": "A premium meal delivery service offering chef-crafted, nutritionally balanced meals delivered fresh to your door every day.",
            "variant_hint": "food_dark-test-template"
        }
        
        try:
            response = requests.post(f"{self.base_url}/generate-page", json=template_config, timeout=45)
            passed = response.status_code == 200
            
            if passed:
                data = response.json()
                page = data.get('page', {})
                sections = page.get('sections', [])
                total_elements = sum(len(section.get('elements', [])) for section in sections)
                
                has_8_sections = len(sections) >= 8
                has_40_elements = total_elements >= 40
                
                details = f"Sections: {len(sections)}, Elements: {total_elements}"
                passed = has_8_sections and has_40_elements
                
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:200]}"
                
        except Exception as e:
            passed = False
            details = f"Error: {str(e)}"
        
        self.log_result("Food & Restaurant Template Generation", passed, details)
        return passed

    def test_enhanced_ai_system_prompt(self):
        """Test that enhanced AI system prompt generates richer content"""
        test_config = {
            "prompt": "Create a comprehensive landing page with multiple sections, rich content, and detailed elements.",
            "page_type": "saas",
            "audience": "Business professionals",
            "product_name": "TestPro",
            "product_description": "A comprehensive testing platform for modern businesses.",
            "variant_hint": "enhanced-ai-test"
        }
        
        try:
            response = requests.post(f"{self.base_url}/generate-page", json=test_config, timeout=45)
            passed = response.status_code == 200
            
            if passed:
                data = response.json()
                page = data.get('page', {})
                sections = page.get('sections', [])
                
                # Check for mandatory sections
                section_types = [s.get('type', '') for s in sections]
                required_sections = ['navbar', 'hero', 'features', 'testimonials', 'cta', 'footer']
                has_required_sections = all(any(req in stype for stype in section_types) for req in required_sections)
                
                # Count elements with proper structure
                total_elements = 0
                elements_with_position = 0
                elements_with_style = 0
                
                for section in sections:
                    elements = section.get('elements', [])
                    total_elements += len(elements)
                    
                    for element in elements:
                        if 'position' in element and isinstance(element.get('position'), dict):
                            elements_with_position += 1
                        if 'style' in element and isinstance(element.get('style'), dict):
                            elements_with_style += 1
                
                has_40_elements = total_elements >= 40
                has_8_sections = len(sections) >= 8
                proper_positioning = elements_with_position >= (total_elements * 0.8)  # 80% should have positions
                proper_styling = elements_with_style >= (total_elements * 0.8)  # 80% should have styles
                
                details = f"Sections: {len(sections)}, Elements: {total_elements}, Positioned: {elements_with_position}, Styled: {elements_with_style}, Required sections: {has_required_sections}"
                passed = has_8_sections and has_40_elements and proper_positioning and proper_styling and has_required_sections
                
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:200]}"
                
        except Exception as e:
            passed = False
            details = f"Error: {str(e)}"
        
        self.log_result("Enhanced AI System Prompt Quality", passed, details)
        return passed

    def test_style_hint_variations(self):
        """Test that different style hints produce different outputs"""
        base_config = {
            "prompt": "Create a modern landing page",
            "page_type": "saas",
            "audience": "Developers",
            "product_name": "DevTool",
            "product_description": "A development tool for modern teams."
        }
        
        style_hints = ["dark_neon", "gradient_saas", "minimal_white", "playful_creative"]
        responses = []
        
        try:
            for hint in style_hints:
                config = {**base_config, "variant_hint": f"{hint}-variation-test"}
                response = requests.post(f"{self.base_url}/generate-page", json=config, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    responses.append({
                        "hint": hint,
                        "sections": len(data.get('page', {}).get('sections', [])),
                        "elements": sum(len(s.get('elements', [])) for s in data.get('page', {}).get('sections', []))
                    })
                else:
                    responses.append({"hint": hint, "error": response.status_code})
            
            # Check that we got different responses (at least different element counts)
            element_counts = [r.get('elements', 0) for r in responses if 'elements' in r]
            has_variations = len(set(element_counts)) > 1 if len(element_counts) >= 2 else True
            all_successful = all('error' not in r for r in responses)
            
            details = f"Responses: {len(responses)}, Variations: {has_variations}, All successful: {all_successful}"
            passed = all_successful and has_variations and len(responses) == 4
            
        except Exception as e:
            passed = False
            details = f"Error: {str(e)}"
        
        self.log_result("Style Hint Variations", passed, details)
        return passed

    def run_all_tests(self):
        """Run all backend tests"""
        print("🧪 Starting Template Gallery Backend Tests")
        print("=" * 50)
        
        # Basic API health
        if not self.test_api_health():
            print("❌ API health check failed, stopping tests")
            return False
        
        # Template generation tests
        self.test_template_generation_saas_dark()
        self.test_template_generation_gradient_saas()
        self.test_template_generation_minimal_white()
        self.test_template_generation_food_restaurant()
        
        # Enhanced AI tests
        self.test_enhanced_ai_system_prompt()
        self.test_style_hint_variations()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 Backend Tests Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = TemplateGalleryTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())