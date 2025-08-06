export interface User {
    id: string;
    email: string;
    name: string;
    role: 'merchant';
  }

  export interface Product {
  id: string;
  name: string;
  category: string | null;
  features: string[] | null;
  keywords: string[] | null;
  price: string;
  sku: string;
  thumbnail: string;
  tone: string | null;
  length: string | null;
  language: string;
  ai_provider: string;
  final_description: string | null;
  type: string;
  aiGenerated?: boolean;        
  description?: string; 
  image_url?: string;
  salla_id?: string; // Added salla_id property
}


  export interface AIGenerationRequest {
    productName: string;
    category: string;
    features: string[];
    keywords: string[];
    tone?: 'professional' | 'friendly' | 'casual' | 'luxury' | 'playful' | 'emotional';
    length?: 'short' | 'medium' | 'long';
  language?: 'ar' | 'en';
  aiProvider?: 'gemini' | 'deepseek';
}

export interface AIDescriptionLog {
  id: number;
  product_id: number;
  generated_text: string;
  request_data?: any;
  response_data?: any;
  created_at: string;
  updated_at: string;
  ai_provider?: 'gemini' | 'deepseek'; // Optional for backward compatibility
  }