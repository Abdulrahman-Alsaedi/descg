import React, { useState } from 'react';
import { Save, Sparkles, Edit, X, Copy, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';
import { Product, AIGenerationRequest } from '../types';
import { generateDescription } from '../services/aiService';

interface ProductFormProps {
  product?: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    features: (() => {
      if (Array.isArray(product?.features)) return product.features;
      if (typeof product?.features === 'string') {
        try {
          return JSON.parse(product.features);
        } catch {
          return [];
        }
      }
      return [];
    })(),
    keywords: (() => {
      if (Array.isArray(product?.keywords)) return product.keywords;
      if (typeof product?.keywords === 'string') {
        try {
          return JSON.parse(product.keywords);
        } catch {
          return [];
        }
      }
      return [];
    })(),
    price: product?.price || 0,
    description: product?.description || ''
  });
  
  const [newFeature, setNewFeature] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tone, setTone] = useState<'professional' | 'casual' | 'persuasive'>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [copied, setCopied] = useState(false);

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'books', label: 'Books' },
    { value: 'toys', label: 'Toys & Games' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'automotive', label: 'Automotive' }
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'persuasive', label: 'Persuasive' }
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short (1-2 sentences)' },
    { value: 'medium', label: 'Medium (1 paragraph)' },
    { value: 'long', label: 'Long (2+ paragraphs)' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_: string, i: number) => i !== index)
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_: string, i: number) => i !== index)
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a product name first');
      return;
    }

    setIsGenerating(true);
    try {
      const request: AIGenerationRequest = {
        productName: formData.name,
        category: formData.category || 'general',
        features: formData.features,
        keywords: formData.keywords,
        tone,
        length
      };

      const description = await generateDescription(request);
      setGeneratedDescription(description);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating description:', error);
      alert('Error generating description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const useGeneratedDescription = () => {
    setFormData(prev => ({ ...prev, description: generatedDescription }));
    setShowPreview(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a product name');
      return;
    }

    const productData: Product = {
      id: product?.id || `temp_${Date.now()}`,
      name: formData.name,
      category: formData.category,
      features: formData.features,
      keywords: formData.keywords,
      price: formData.price,
      description: formData.description,
      aiGenerated: !!generatedDescription && formData.description === generatedDescription,
      createdAt: product?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onSave(productData);
  };

  return (
    <div className="space-y-8">
      {/* Product Information */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter product name"
            required
          />
          
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            options={[{ value: '', label: 'Select a category' }, ...categories]}
          />
          
          <Input
            label="Price ($)"
            type="number"
            value={formData.price}
            onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        {/* Features */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features
          </label>
          <div className="flex gap-2 mb-3">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a feature"
              onKeyPress={(e) => e.key === 'Enter' && addFeature()}
            />
            <Button onClick={addFeature} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.features.map((feature: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {feature}
                <button
                  onClick={() => removeFeature(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords
          </label>
          <div className="flex gap-2 mb-3">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add a keyword"
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <Button onClick={addKeyword} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.keywords.map((keyword: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
              >
                {keyword}
                <button
                  onClick={() => removeKeyword(index)}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* AI Description Generator */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6">Generate AI Description</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Select
            label="Tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as any)}
            options={toneOptions}
          />
          
          <Select
            label="Length"
            value={length}
            onChange={(e) => setLength(e.target.value as any)}
            options={lengthOptions}
          />
        </div>

        <Button
          onClick={handleGenerateDescription}
          loading={isGenerating}
          icon={Sparkles}
          size="lg"
          className="mb-6"
        >
          Generate Description with AI
        </Button>

        {showPreview && generatedDescription && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-gray-900">Generated Description:</h4>
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                icon={copied ? Check : Copy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed">{generatedDescription}</p>
            <div className="flex gap-3">
              <Button onClick={useGeneratedDescription} icon={Check}>
                Use This Description
              </Button>
              <Button onClick={() => setShowPreview(false)} variant="outline">
                Generate New One
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Manual Description */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6">Product Description</h3>
        <div className="space-y-4">
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter product description or generate one with AI above..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={handleSave} icon={product ? Edit : Save} size="lg">
          {product ? 'Update Product' : 'Save Product'}
        </Button>
        <Button onClick={onCancel} variant="outline" size="lg">
          Cancel
        </Button>
      </div>
    </div>
  );
};