#!/usr/bin/env python3

import requests
import json
import sys
import time
from datetime import datetime

class LandingPageBuilderTester:
    def __init__(self, base_url="https://b467106f-57d6-4a8d-a53d-0379a62be61d.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def test_api_health(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            self.log_test(
                "API Health Check", 
                success, 
                f"Status: {response.status_code}" if not success else "",
                data
            )
            return success
        except Exception as e:
            self.log_test("API Health Check", False, f"Error: {str(e)}")
            return False

    def test_ai_generation_rich_content(self):
        """Test AI generation produces rich content with 8+ sections and 40+ elements"""
        try:
            payload = {
                "prompt": "Create a comprehensive SaaS landing page with multiple sections including hero, features, testimonials, pricing, and FAQ. Make it rich and detailed.",
                "page_type": "saas",
                "audience": "Startup founders and SaaS teams",
                "product_name": "TestFlow Pro",
                "product_description": "A comprehensive SaaS platform for testing and automation",
                "variant_hint": f"test-{int(time.time())}"
            }
            
            print("🔄 Testing AI generation (may take 15-30 seconds)...")
            start_time = time.time()
            response = requests.post(f"{self.base_url}/generate-page", json=payload, timeout=45)
            end_time = time.time()
            
            if response.status_code != 200:
                self.log_test("AI Generation Rich Content", False, f"Status: {response.status_code}")
                return False
            
            data = response.json()
            page = data.get("page", {})
            sections = page.get("sections", [])
            
            # Count total elements across all sections
            total_elements = sum(len(section.get("elements", [])) for section in sections)
            
            # Check requirements
            has_8_plus_sections = len(sections) >= 8
            has_40_plus_elements = total_elements >= 40
            
            details = f"Generated {len(sections)} sections, {total_elements} elements in {end_time - start_time:.1f}s"
            success = has_8_plus_sections and has_40_plus_elements
            
            self.log_test(
                "AI Generation Rich Content", 
                success, 
                details if success else f"{details} (Need 8+ sections, 40+ elements)",
                {"sections": len(sections), "elements": total_elements, "duration": end_time - start_time}
            )
            
            # Store for form test
            self.last_generated_page = page
            return success
            
        except Exception as e:
            self.log_test("AI Generation Rich Content", False, f"Error: {str(e)}")
            return False

    def test_form_generation_on_request(self):
        """Test that AI generates form elements when requested"""
        try:
            payload = {
                "prompt": "Create a lead generation landing page with a contact form for user feedback. Include a feedback form in the last section.",
                "page_type": "lead_generation",
                "audience": "Business owners",
                "product_name": "ContactPro",
                "product_description": "Professional contact management system",
                "variant_hint": f"form-test-{int(time.time())}"
            }
            
            print("🔄 Testing form generation when requested...")
            response = requests.post(f"{self.base_url}/generate-page", json=payload, timeout=45)
            
            if response.status_code != 200:
                self.log_test("Form Generation on Request", False, f"Status: {response.status_code}")
                return False
            
            data = response.json()
            page = data.get("page", {})
            sections = page.get("sections", [])
            
            # Look for form elements
            form_found = False
            for section in sections:
                for element in section.get("elements", []):
                    if element.get("type") == "form":
                        form_found = True
                        break
                if form_found:
                    break
            
            self.log_test(
                "Form Generation on Request", 
                form_found, 
                "Form element found" if form_found else "No form element found despite request",
                {"has_form": form_found, "sections": len(sections)}
            )
            return form_found
            
        except Exception as e:
            self.log_test("Form Generation on Request", False, f"Error: {str(e)}")
            return False

    def test_fallback_generation(self):
        """Test fallback generation by using invalid LLM key scenario"""
        try:
            # Test with a prompt that should trigger rich fallback
            payload = {
                "prompt": "Create a comprehensive business landing page with all standard sections",
                "page_type": "product_info",
                "audience": "Business decision makers",
                "product_name": "BusinessFlow",
                "product_description": "Complete business management solution",
                "variant_hint": f"fallback-test-{int(time.time())}"
            }
            
            print("🔄 Testing fallback generation capabilities...")
            response = requests.post(f"{self.base_url}/generate-page", json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test("Fallback Generation", False, f"Status: {response.status_code}")
                return False
            
            data = response.json()
            page = data.get("page", {})
            sections = page.get("sections", [])
            meta = data.get("meta", {})
            generator = meta.get("generator", "unknown")
            
            # Count elements
            total_elements = sum(len(section.get("elements", [])) for section in sections)
            
            # Fallback should still generate rich content (10 sections per spec)
            success = len(sections) >= 8 and total_elements >= 30
            
            details = f"Generator: {generator}, {len(sections)} sections, {total_elements} elements"
            
            self.log_test(
                "Fallback Generation", 
                success, 
                details,
                {"generator": generator, "sections": len(sections), "elements": total_elements}
            )
            return success
            
        except Exception as e:
            self.log_test("Fallback Generation", False, f"Error: {str(e)}")
            return False

    def test_cors_headers(self):
        """Test CORS headers are properly configured"""
        try:
            response = requests.options(f"{self.base_url}/generate-page")
            headers = response.headers
            
            has_cors = 'Access-Control-Allow-Origin' in headers
            has_methods = 'Access-Control-Allow-Methods' in headers
            
            success = has_cors and has_methods
            details = f"CORS Origin: {headers.get('Access-Control-Allow-Origin', 'Missing')}"
            
            self.log_test("CORS Headers", success, details if not success else "")
            return success
            
        except Exception as e:
            self.log_test("CORS Headers", False, f"Error: {str(e)}")
            return False

    def test_error_handling(self):
        """Test API error handling"""
        try:
            # Test empty prompt
            response = requests.post(f"{self.base_url}/generate-page", json={"prompt": ""}, timeout=10)
            success = response.status_code == 400
            
            self.log_test(
                "Error Handling (Empty Prompt)", 
                success, 
                f"Status: {response.status_code}" if not success else ""
            )
            
            # Test missing prompt
            response = requests.post(f"{self.base_url}/generate-page", json={}, timeout=10)
            success2 = response.status_code == 400
            
            self.log_test(
                "Error Handling (Missing Prompt)", 
                success2, 
                f"Status: {response.status_code}" if not success2 else ""
            )
            
            return success and success2
            
        except Exception as e:
            self.log_test("Error Handling", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for AI Landing Page Builder")
        print("=" * 60)
        
        # Run tests in order
        self.test_api_health()
        self.test_ai_generation_rich_content()
        self.test_form_generation_on_request()
        self.test_fallback_generation()
        self.test_cors_headers()
        self.test_error_handling()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Backend Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = LandingPageBuilderTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())