import requests
import json
import sys
import time
from datetime import datetime

class LandingPageBuilderAPITester:
    def __init__(self, base_url="https://harmony-flow-5.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.ai_response_data = None

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {test_name}")
        if details:
            print(f"   Details: {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": test_name, "details": details})
        print()

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("Root Endpoint", True, f"Message: {data['message']}")
                    return True
                else:
                    self.log_result("Root Endpoint", False, "Missing 'message' field in response")
                    return False
            else:
                self.log_result("Root Endpoint", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Root Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_generate_page_missing_prompt(self):
        """Test generate-page endpoint with missing prompt"""
        try:
            response = requests.post(f"{self.base_url}/generate-page", json={}, timeout=10)
            # Should return 422 for validation error
            if response.status_code == 422:
                self.log_result("Generate Page - Missing Prompt", True, "Correctly returned 422 for missing prompt")
                return True
            else:
                self.log_result("Generate Page - Missing Prompt", False, f"Expected 422, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Generate Page - Missing Prompt", False, f"Exception: {str(e)}")
            return False

    def test_generate_page_empty_prompt(self):
        """Test generate-page endpoint with empty prompt"""
        try:
            response = requests.post(f"{self.base_url}/generate-page", json={"prompt": ""}, timeout=10)
            # Backend should handle empty prompt, but let's see what happens
            if response.status_code in [200, 400, 422]:
                self.log_result("Generate Page - Empty Prompt", True, f"Status: {response.status_code}")
                return True
            else:
                self.log_result("Generate Page - Empty Prompt", False, f"Unexpected status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Generate Page - Empty Prompt", False, f"Exception: {str(e)}")
            return False

    def test_generate_page_valid_prompt(self):
        """Test generate-page endpoint with a valid prompt"""
        test_prompt = "A modern SaaS landing page for a project management tool with hero section, features, team, testimonials, and pricing"
        
        try:
            print(f"🔄 Testing AI generation with prompt: '{test_prompt[:50]}...'")
            print("⏳ This may take 15-30 seconds for AI processing...")
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/generate-page", 
                json={"prompt": test_prompt}, 
                timeout=60  # Give AI enough time to respond
            )
            end_time = time.time()
            response_time = round(end_time - start_time, 2)
            
            if response.status_code == 200:
                data = response.json()
                if "page" in data:
                    page_data = data["page"]
                    self.ai_response_data = page_data
                    
                    # Validate page structure
                    validation_errors = []
                    
                    # Check for title
                    if "title" not in page_data:
                        validation_errors.append("Missing 'title' field")
                    
                    # Check for sections
                    if "sections" not in page_data:
                        validation_errors.append("Missing 'sections' field")
                    else:
                        sections = page_data["sections"]
                        if not isinstance(sections, list):
                            validation_errors.append("'sections' should be a list")
                        elif len(sections) == 0:
                            validation_errors.append("No sections generated")
                        else:
                            # Validate each section
                            for i, section in enumerate(sections):
                                if "id" not in section:
                                    validation_errors.append(f"Section {i} missing 'id'")
                                if "type" not in section:
                                    validation_errors.append(f"Section {i} missing 'type'")
                                if "elements" not in section:
                                    validation_errors.append(f"Section {i} missing 'elements'")
                                elif not isinstance(section["elements"], list):
                                    validation_errors.append(f"Section {i} 'elements' should be a list")
                                else:
                                    # Validate elements
                                    for j, element in enumerate(section["elements"]):
                                        if "id" not in element:
                                            validation_errors.append(f"Section {i}, Element {j} missing 'id'")
                                        if "type" not in element:
                                            validation_errors.append(f"Section {i}, Element {j} missing 'type'")
                                        if "content" not in element:
                                            validation_errors.append(f"Section {i}, Element {j} missing 'content'")
                    
                    if validation_errors:
                        self.log_result("Generate Page - Valid Prompt", False, f"Validation errors: {'; '.join(validation_errors[:3])}")
                        return False
                    else:
                        sections_count = len(page_data.get("sections", []))
                        elements_count = sum(len(s.get("elements", [])) for s in page_data.get("sections", []))
                        self.log_result("Generate Page - Valid Prompt", True, 
                                      f"Generated page with {sections_count} sections, {elements_count} elements in {response_time}s")
                        return True
                else:
                    self.log_result("Generate Page - Valid Prompt", False, "Response missing 'page' field")
                    return False
            else:
                error_details = "Unknown error"
                try:
                    error_data = response.json()
                    error_details = error_data.get("detail", str(error_data))
                except:
                    error_details = response.text[:200]
                
                self.log_result("Generate Page - Valid Prompt", False, 
                              f"Status: {response.status_code}, Error: {error_details}")
                return False
                
        except requests.exceptions.Timeout:
            self.log_result("Generate Page - Valid Prompt", False, "Request timed out (>60s)")
            return False
        except Exception as e:
            self.log_result("Generate Page - Valid Prompt", False, f"Exception: {str(e)}")
            return False

    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        try:
            # Test OPTIONS request
            response = requests.options(f"{self.base_url}/generate-page")
            headers = response.headers
            
            cors_ok = True
            cors_issues = []
            
            if 'Access-Control-Allow-Origin' not in headers:
                cors_issues.append("Missing Access-Control-Allow-Origin")
                cors_ok = False
            
            if 'Access-Control-Allow-Methods' not in headers:
                cors_issues.append("Missing Access-Control-Allow-Methods") 
                cors_ok = False
            
            if cors_ok:
                self.log_result("CORS Headers", True, f"Origin: {headers.get('Access-Control-Allow-Origin', 'N/A')}")
                return True
            else:
                self.log_result("CORS Headers", False, f"Issues: {', '.join(cors_issues)}")
                return False
                
        except Exception as e:
            self.log_result("CORS Headers", False, f"Exception: {str(e)}")
            return False

    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("🧪 BACKEND API TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {round((self.tests_passed/self.tests_run)*100, 1) if self.tests_run > 0 else 0}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, failed in enumerate(self.failed_tests, 1):
                print(f"{i}. {failed['test']}")
                if failed['details']:
                    print(f"   {failed['details']}")
        
        if self.ai_response_data:
            print("\n🤖 AI GENERATED CONTENT SAMPLE:")
            print(f"Title: {self.ai_response_data.get('title', 'N/A')}")
            sections = self.ai_response_data.get('sections', [])
            for i, section in enumerate(sections[:3]):  # Show first 3 sections
                section_type = section.get('type', 'unknown')
                elements_count = len(section.get('elements', []))
                print(f"Section {i+1}: {section_type} ({elements_count} elements)")
        
        print("\n" + "=" * 60)

def main():
    print("🚀 Starting Backend API Tests for Landing Page Builder")
    print("=" * 60)
    
    tester = LandingPageBuilderAPITester()
    
    # Run all tests
    print("🔍 Testing API endpoints...\n")
    
    tester.test_root_endpoint()
    tester.test_generate_page_missing_prompt()
    tester.test_generate_page_empty_prompt()
    tester.test_generate_page_valid_prompt()
    tester.test_cors_headers()
    
    tester.print_summary()
    
    # Return exit code based on success
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())