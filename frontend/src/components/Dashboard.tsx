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
  const [errorState, setErrorState] = useState<string | null>(null);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const fetchProducts = () => {
    setLoading(true);
    fetch('https://api.descg.store/api/products', {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(data => setProducts(data))
      .catch(err => error('Failed to load products. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductSave = async (product: Product) => {
    setLoading(true);
    try {
      let response;
      // Check if it's an existing product (has numeric ID, not temp ID)
      const isExistingProduct = product.id && !product.id.toString().startsWith('temp_');
      
      if (isExistingProduct) {
        response = await fetch(`https://api.descg.store/api/products/${product.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(product)
        });
      } else {
        response = await fetch('https://api.descg.store/api/products', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(product)
        }); 
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save product');
      }
      
      fetchProducts();
      setEditingProduct(undefined);
      setActiveTab('products');
      
      // Show success message
      success(isExistingProduct ? 'Product updated successfully' : 'Product added successfully');
      
    } catch (err: any) {
      // Show user-friendly error message
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
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to delete product');
      
      fetchProducts();
      success('Product deleted successfully');
      
    } catch (err: any) {
      if (err.message.includes('unauthorized')) {
        error('You are not authorized to delete this product');
      } else {
        error('Failed to delete product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const safeProducts = products || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center mr-8">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">AI Product Generator</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-700">
                <User className="w-5 h-5 mr-2" />
                <span className="font-medium">{user?.name}</span>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                icon={LogOut}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <Card className="mb-8">
          <div className="flex space-x-1">
            <Button
              onClick={() => {
                setEditingProduct(undefined);
                setActiveTab('products');
              }}
              variant={(activeTab === 'products' || editingProduct) ? 'primary' : 'ghost'}
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

        {/* Content */}
        {loading ? (
          <div className="text-center py-8 text-lg text-gray-500">Loading products...</div>
        ) : editingProduct ? (
          <ProductForm
            product={editingProduct}
            onSave={handleProductSave}
            onCancel={() => {
              setEditingProduct(undefined);
            }}
          />
        ) : activeTab === 'products' ? (
          <ProductList
            products={products}
            onEdit={(product) => {
              setEditingProduct(product);
            }}
            onDelete={handleProductDelete}
            onAddProduct={() => {
              setEditingProduct(undefined);
              setActiveTab('add');
            }}
          />
        ) : (
          <ProductForm
            onSave={handleProductSave}
            onCancel={() => {
              setActiveTab('products');
            }}
          />
        )}
      </div>
    </div>
  );
};