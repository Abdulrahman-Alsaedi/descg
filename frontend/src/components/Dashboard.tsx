import React, { useState, useEffect } from 'react';
import { Plus, Package, Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ProductForm } from './ProductForm';
import { ProductList } from './ProductList';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Product } from '../types';

export const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'add'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState<boolean>(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  const fetchProducts = async () => {
  setLoading(true);
  try {
    const response = await fetch('https://api.descg.store/api/salla/products', {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    console.log('Salla response:', data);

    if (!response.ok) throw new Error(data.message || 'Failed to fetch');

    // ✅ Directly handle the array (the response *is* the array)
    const rawProducts = Array.isArray(data) ? data : data.products || data.data;

    if (!Array.isArray(rawProducts)) {
      throw new Error('Invalid response format: expected array');
    }

    const mappedProducts = rawProducts.map((product: any) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      features: Array.isArray(product.features) ? product.features : [],
      keywords: Array.isArray(product.keywords) ? product.keywords : [],
      price: product.price,
      description: product.description || product.final_description,
      aiGenerated: product.ai_provider === 'gemini',
      thumbnail: product.thumbnail,
      type: product.type,
      tone: product.tone,
      length: product.length,
      language: product.language,
      ai_provider: product.ai_provider,
      final_description: product.final_description,
      salla_id: product.salla_id, // Use salla_id if available, otherwise fallback to id
    }));

    setProducts(mappedProducts);
  } catch (err) {
    console.error('fetchProducts - error:', err);
    error('Failed to load products. Please try again.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductSave = async (product: Product) => {
  setLoading(true);
  try {
   const isSallaProduct = product.salla_id !== undefined && product.salla_id !== null;
const isLocalProduct = !isSallaProduct && product.sku && product.sku.startsWith('SKU-');  

    // Ensure required fields exist
    if (!product.name || product.name.trim() === '') {
      error('Product name is required.');
      return;
    }

    if (!product.sku || product.sku.trim() === '') {
      product.sku = `SKU-${Date.now()}`;
    }

    // Use final_description if present
    if (!product.description || product.description.trim() === '') {
      product.description = product.final_description || '';
    }

    if (!product.language || product.language.trim() === '') {
      product.language = 'English'; 
    }

    console.log('Product before sending:', product);

    let url: string;
let method: 'POST' | 'PUT';

if (isSallaProduct) {
  // ✅ Don’t allow updating Salla products directly — show an error or handle differently
  error('Salla-synced products cannot be updated from this dashboard.');
  setLoading(false);
  return;
} else if (isLocalProduct) {
  url = `https://api.descg.store/api/salla/products/${product.sku}`;
  method = 'PUT';
} else {
  url = 'https://api.descg.store/api/products';
  method = 'POST';
}


    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save product');
    }

    await fetchProducts(); // Refresh list
    setEditingProduct(undefined);
    setActiveTab('products');
    success(editingProduct ? 'Product updated successfully' : 'Product added successfully');
  } catch (err: any) {
    console.error('handleProductSave - error:', err);
    if (err.message.includes('validation')) {
      error('Please fill all required fields');
    } else if (err.message.includes('unauthorized')) {
      error('You are not authorized to perform this action');
    } else {
      error('Failed to save product. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  const handleProductDelete = async (productId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.descg.store/api/products/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete product');

      await fetchProducts();
      success('Product deleted successfully');
    } catch (err: any) {
      console.error('handleProductDelete - error:', err);
      error(err.message || 'Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const safeProducts = products || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center mr-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AI Product Generator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-700">
                <User className="w-5 h-5 mr-2" />
                <span className="font-medium">{user?.name}</span>
              </div>
              <Button onClick={logout} variant="ghost" size="sm" icon={LogOut}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <div className="flex space-x-1">
            <Button
              onClick={() => {
                setEditingProduct(undefined);
                setActiveTab('products');
              }}
              variant={activeTab === 'products' || editingProduct ? 'primary' : 'ghost'}
              icon={Package}
            >
              Products ({safeProducts.length}) {editingProduct ? '- Editing' : ''}
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(undefined);
                setActiveTab('add');
              }}
              variant={activeTab === 'add' && !editingProduct ? 'primary' : 'ghost'}
              icon={Plus}
            >
              Add Product
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-8 text-lg text-gray-500">Loading products...</div>
        ) : editingProduct ? (
          <ProductForm
            product={editingProduct}
            onSave={handleProductSave}
            onCancel={() => setEditingProduct(undefined)}
          />
        ) : activeTab === 'products' ? (
          <ProductList
            products={safeProducts}
            onEdit={(p) => setEditingProduct(p)}
            onDelete={handleProductDelete}
            onAddProduct={() => {
              setEditingProduct(undefined);
              setActiveTab('add');
            }}
          />
        ) : (
          <ProductForm
            onSave={handleProductSave}
            onCancel={() => setActiveTab('products')}
          />
        )}
      </div>
    </div>
  );
};
