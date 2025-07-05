import os
import json
import logging
from google import genai
from google.genai import types

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class FarmingAssistant:
    def __init__(self):
        self.model_name = "gemini-2.5-flash"
        
    def get_farming_advice(self, user_query, crop_type=None, soil_type=None, farm_size=None, language='english'):
        """
        Get personalized farming advice from Gemini AI
        """
        try:
            # Create context-aware prompt
            system_prompt = self._create_system_prompt(language)
            
            # Format user query with context
            formatted_query = self._format_user_query(
                user_query, crop_type, soil_type, farm_size, language
            )
            
            # Generate response
            response = client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user", 
                        parts=[types.Part(text=formatted_query)]
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.7,
                    max_output_tokens=2000,
                ),
            )
            
            return response.text if response.text else "I apologize, but I couldn't generate a response. Please try again."
            
        except Exception as e:
            logging.error(f"Error getting farming advice: {str(e)}")
            return "I'm sorry, there was an error processing your request. Please try again later."
    
    def _create_system_prompt(self, language):
        """Create system prompt based on language preference"""
        base_prompt = """You are an expert agricultural advisor and farming assistant. Your role is to provide accurate, practical, and actionable farming advice to farmers. 

Key responsibilities:
1. Provide specific fertilizer recommendations (NPK ratios, application schedules)
2. Suggest optimal watering schedules based on crop and soil type
3. Offer pest and disease protection strategies (both organic and chemical options)
4. Give seasonal farming tips and best practices
5. Suggest crop rotation and soil health improvement methods

Guidelines:
- Always provide practical, implementable advice
- Include specific quantities, timings, and methods when possible
- Consider local farming practices and conditions
- Prioritize sustainable and cost-effective solutions
- Mention both organic and chemical alternatives when relevant
- Be encouraging and supportive in your tone"""

        if language == 'hindi':
            base_prompt += "\n\nPlease respond in Hindi (हिंदी में उत्तर दें)."
        elif language == 'marathi':
            base_prompt += "\n\nPlease respond in Marathi (मराठीत उत्तर द्या)."
        else:
            base_prompt += "\n\nPlease respond in clear, simple English."
            
        return base_prompt
    
    def _format_user_query(self, query, crop_type, soil_type, farm_size, language):
        """Format user query with additional context"""
        context_parts = []
        
        if crop_type:
            context_parts.append(f"Crop: {crop_type}")
        if soil_type:
            context_parts.append(f"Soil Type: {soil_type}")
        if farm_size:
            context_parts.append(f"Farm Size: {farm_size} acres")
            
        context = " | ".join(context_parts) if context_parts else "No specific context provided"
        
        formatted_query = f"""
Farmer's Query: {query}

Context: {context}

Please provide detailed advice covering:
1. 🧪 Fertilizer recommendations (specific NPK ratios and application schedule)
2. 💧 Watering/irrigation schedule
3. 🐛 Pest and disease protection measures
4. 🌱 Additional farming tips and best practices

Make your response practical and actionable for the farmer.
"""
        
        return formatted_query
    
    def analyze_farming_query(self, query):
        """Analyze the query to extract farming-related information"""
        try:
            analysis_prompt = f"""
Analyze this farming query and extract key information:
Query: "{query}"

Please identify and return in JSON format:
1. crop_type: What crop is mentioned (if any)
2. soil_type: What soil type is mentioned (if any)
3. farm_size: What farm size is mentioned (if any)
4. query_type: Classify as 'fertilizer', 'watering', 'pest_control', or 'general'
5. urgency: 'high', 'medium', or 'low'

Return only valid JSON.
"""
            
            response = client.models.generate_content(
                model=self.model_name,
                contents=analysis_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                ),
            )
            
            if response.text:
                return json.loads(response.text)
            else:
                return self._default_analysis()
                
        except Exception as e:
            logging.error(f"Error analyzing query: {str(e)}")
            return self._default_analysis()
    
    def _default_analysis(self):
        """Return default analysis when parsing fails"""
        return {
            "crop_type": None,
            "soil_type": None,
            "farm_size": None,
            "query_type": "general",
            "urgency": "medium"
        }
    
    def get_crop_suggestions(self, soil_type, location, language='english'):
        """Get crop suggestions based on soil type and location"""
        try:
            prompt = f"""
Based on the following information, suggest the best crops to grow:
- Soil Type: {soil_type}
- Location: {location}

Please provide:
1. Top 5 recommended crops
2. Reasons for each recommendation
3. Expected yield information
4. Best planting season

Language: {language}
"""
            
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=1500,
                ),
            )
            
            return response.text if response.text else "Unable to generate crop suggestions."
            
        except Exception as e:
            logging.error(f"Error getting crop suggestions: {str(e)}")
            return "Sorry, I couldn't provide crop suggestions at this time."

# Initialize the farming assistant
farming_assistant = FarmingAssistant()
