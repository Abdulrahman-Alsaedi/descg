import React, { useState, useEffect } from 'react';
import { Plus, Package, Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProductForm } from './ProductForm';
import { ProductList } from './ProductList';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Product } from '../types';

export const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'add'>('products');
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('http://localhost:8000/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(data => setProducts(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleProductSave = (product: Product) => {
    setProducts(prev => {
      const existingIndex = prev.findIndex(p => p.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = product;
        return updated;
      }
      return [...prev, product];
    });
    setActiveTab('products');
  };

  const handleProductDelete = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

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
              onClick={() => setActiveTab('products')}
              variant={activeTab === 'products' ? 'primary' : 'ghost'}
              icon={Package}
            >
              Products ({products.length})
            </Button>
            <Button
              onClick={() => setActiveTab('add')}
              variant={activeTab === 'add' ? 'primary' : 'ghost'}
              icon={Plus}
            >
              Add Product
            </Button>
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="text-center py-8 text-lg text-gray-500">Loading products...</div>
        ) : error ? (
          <div className="text-center py-8 text-lg text-red-500">{error}</div>
        ) : activeTab === 'products' ? (
          <ProductList
            products={products}
            onEdit={(product) => {
              setActiveTab('add');
              // Pass product to form for editing
            }}
            onDelete={handleProductDelete}
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