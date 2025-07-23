export interface User {
  id: string;
  email: string;
  name: string;
  role: 'merchant';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  features: string[];
  keywords: string[];
  price?: number;
  description?: string;
  aiGenerated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIGenerationRequest {
  productName: string;
  category: string;
  features: string[];
  keywords: string[];
  tone?: 'professional' | 'casual' | 'persuasive';
  length?: 'short' | 'medium' | 'long';
}