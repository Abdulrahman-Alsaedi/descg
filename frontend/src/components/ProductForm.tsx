import React, { useState, useEffect } from 'react';
import { Save, Sparkles, Edit, X, Copy, Check, History, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';
import { ImageUpload } from './ui/ImageUpload';
import HistoryModal from './HistoryModal';
import { Product, AIGenerationRequest, AIDescriptionLog } from '../types';
import { generateDescription, getAIHistoryForProduct } from '../services/aiService';

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
    description: product?.description || '',
    image_url: product?.image_url || ''
  });
  
  const [newFeature, setNewFeature] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tone, setTone] = useState<'professional' | 'friendly' | 'casual' | 'luxury' | 'playful' | 'emotional'>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'deepseek'>('gemini');
  const [generatedByProvider, setGeneratedByProvider] = useState<'gemini' | 'deepseek'>('gemini'); // Track which AI generated current description
  const [generatedWithLanguage, setGeneratedWithLanguage] = useState<'ar' | 'en'>('en'); // Track language used for current description
  const [generatedWithLength, setGeneratedWithLength] = useState<'short' | 'medium' | 'long'>('medium'); // Track length used for current description
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [aiHistory, setAiHistory] = useState<AIDescriptionLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(product?.id || null);

  // Reset form data when product prop changes (including from editing to adding new product)
  useEffect(() => {
    setFormData({
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
      description: product?.description || '',
      image_url: product?.image_url || ''
    });
    
    // Reset other states when switching products
    setCurrentProductId(product?.id || null);
    setGeneratedDescription('');
    setShowPreview(false);
    setNewFeature('');
    setNewKeyword('');
    setShowHistory(false);
    setCopied(false);
  }, [product]);

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
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'playful', label: 'Playful' },
    { value: 'emotional', label: 'Emotional' }
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short (1-2 paragraphs)' },
    { value: 'medium', label: 'Medium (3-4 paragraphs)' },
    { value: 'long', label: 'Long (5-6 paragraphs)' }
  ];

  const languageOptions = [
    { value: 'ar', label: 'Arabic' },
    { value: 'en', label: 'English' }
  ];

  const aiProviderOptions = [
    { value: 'gemini', label: 'Google Gemini 2.0 Flash' },
    { value: 'deepseek', label: 'DeepSeek Chat' }
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
        length,
        language,
        aiProvider
      };

      // Use existing product ID if available, otherwise use currentProductId from previous generations
      const existingId = product?.id || currentProductId || undefined;
      
      const result = await generateDescription(request, existingId);
      setGeneratedDescription(result.description);
      setCurrentProductId(result.productId);
      
      // Track which AI provider and settings generated this description
      setGeneratedByProvider(aiProvider);
      setGeneratedWithLanguage(language);
      setGeneratedWithLength(length);
      
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating description:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check for specific API key errors
      if (errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('DEEPSEEK_API_KEY')) {
        alert(`Configuration Error: Missing AI API keys.\n\nPlease contact the administrator to configure:\n- GEMINI_API_KEY\n- DEEPSEEK_API_KEY\n\nIn the backend .env file.`);
      } else {
        alert(`Error generating description: ${errorMessage}\n\nPlease check:\n- Your internet connection\n- Backend server is running\n- API keys are configured`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShowHistory = async () => {
    const productIdToUse = product?.id || currentProductId;
    
    if (!productIdToUse) {
      alert('Generate at least one AI description first to view history');
      return;
    }

    setLoadingHistory(true);
    try {
      const history = await getAIHistoryForProduct(productIdToUse);
      setAiHistory(history);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading AI history:', error);
      alert('Failed to load AI history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectHistoryDescription = (log: AIDescriptionLog) => {
    setGeneratedDescription(log.generated_text);
    
    // Extract metadata from the selected log
    if (log.ai_provider) {
      setGeneratedByProvider(log.ai_provider);
    } else {
      // Fallback: detect from request_data if direct field not available
      if (log.request_data) {
        if (log.request_data.contents) {
          setGeneratedByProvider('gemini');
        } else if (log.request_data.prompt) {
          setGeneratedByProvider('deepseek');
        } else {
          setGeneratedByProvider('gemini'); // default fallback
        }
      }
    }
    
    // Try to extract language and length from request_data if available
    if (log.request_data) {
      const requestLanguage = log.request_data.language;
      if (requestLanguage === 'English' || requestLanguage === 'en') {
        setGeneratedWithLanguage('en');
      } else if (requestLanguage === 'العربية' || requestLanguage === 'ar') {
        setGeneratedWithLanguage('ar');
      }
      
      const requestLength = log.request_data.length;
      if (requestLength && ['short', 'medium', 'long'].includes(requestLength)) {
        setGeneratedWithLength(requestLength);
      }
    }
    
    setShowPreview(true);
    setShowHistory(false);
  };

  const regenerateDescription = () => {
    setShowPreview(false);
    handleGenerateDescription();
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

    // Use existing product ID if available, or currentProductId from AI generation, or create temp ID as fallback
    const productIdToUse = product?.id || currentProductId || `temp_${Date.now()}`;
    
    const productData: Product = {
      id: productIdToUse,
      name: formData.name,
      category: formData.category,
      features: formData.features,
      keywords: formData.keywords,
      price: formData.price,
      description: formData.description,
      image_url: formData.image_url,
      aiGenerated: !!generatedDescription && formData.description === generatedDescription,
      createdAt: product?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onSave(productData);
  };

  const cleanupTempProduct = async () => {
    // If we have a currentProductId that was created during AI generation and the user cancels,
    // we should delete it to avoid leaving temporary products in the database
    if (currentProductId && !product?.id) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`https://descg.store/api/products/${currentProductId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
      } catch (error) {
        console.error('Failed to cleanup temporary product:', error);
        // Don't show error to user as this is background cleanup
      }
    }
  };

  const handleCancel = async () => {
    await cleanupTempProduct();
    onCancel();
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

        {/* Image Upload Section */}
        <ImageUpload
          value={formData.image_url}
          onChange={(imageUrl) => handleInputChange('image_url', imageUrl)}
          onRemove={() => handleInputChange('image_url', '')}
        />

        {/* Features */}
        <div className="mt-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Features
          </label>
          <div className="flex gap-2 mb-4">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a feature"
              onKeyPress={(e) => e.key === 'Enter' && addFeature()}
              className="flex-1"
            />
            <Button onClick={addFeature} variant="outline">
              Add
            </Button>
          </div>
          {formData.features.length > 0 && (
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
          )}
        </div>

        {/* Keywords */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Keywords
          </label>
          <div className="flex gap-2 mb-4">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add a keyword"
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              className="flex-1"
            />
            <Button onClick={addKeyword} variant="outline">
              Add
            </Button>
          </div>
          {formData.keywords.length > 0 && (
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
          )}
        </div>
      </Card>

      {/* AI Description Generator */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6">Generate AI Description</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Select
            label="AI Model"
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as any)}
            options={aiProviderOptions}
          />
          
          <Select
            label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            options={languageOptions}
          />
          
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

        <div className="flex gap-3 mb-6">
          <Button
            onClick={handleGenerateDescription}
            loading={isGenerating}
            icon={Sparkles}
            size="lg"
          >
            {isGenerating 
              ? `Generating with ${aiProvider === 'gemini' ? 'Gemini' : 'DeepSeek'}...` 
              : `Generate Description with ${aiProvider === 'gemini' ? 'Gemini 2.0' : 'DeepSeek'}`
            }
          </Button>

          <Button
            onClick={handleShowHistory}
            loading={loadingHistory}
            icon={History}
            variant="outline"
            size="lg"
            disabled={!product?.id && !currentProductId}
          >
            {loadingHistory ? 'Loading...' : 'History'}
          </Button>
        </div>

        {showPreview && generatedDescription && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">Generated Description:</h4>
                <span className="text-xs text-gray-500 mt-1">
                  Generated by {generatedByProvider === 'gemini' ? 'Google Gemini 2.0 Flash' : 'DeepSeek Chat'} • {generatedWithLanguage === 'ar' ? 'Arabic' : 'English'} • {generatedWithLength} length
                </span>
              </div>
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                icon={copied ? Check : Copy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{generatedDescription}</p>
            <div className="flex gap-3">
              <Button onClick={useGeneratedDescription} icon={Check}>
                Use This Description
              </Button>
              <Button onClick={regenerateDescription} variant="outline" icon={RefreshCw}>
                Generate New One
              </Button>
            </div>
          </div>
        )}

        {/* New History Modal */}
        <HistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          aiHistory={aiHistory}
          onSelectDescription={selectHistoryDescription}
          productName={formData.name}
        />
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
        <Button onClick={handleCancel} variant="outline" size="lg">
          Cancel
        </Button>
      </div>
    </div>
  );
};