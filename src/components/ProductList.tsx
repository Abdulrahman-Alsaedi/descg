import React from 'react';
import { Edit, Trash2, Package, Sparkles, DollarSign } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete }) => {
  const items: Product[] = Array.isArray(products) ? products : [];
  if (!items || items.length === 0) {
    return (
      <Card className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
        <p className="text-gray-600 mb-6">Get started by adding your first product and generating AI descriptions.</p>
        <Button icon={Package}>Add Your First Product</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Your Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((product) => product && (
          <Card key={product.id} className="relative">
            {product.aiGenerated && (
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 pr-20">{product.name}</h3>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100">
                  {product.category}
                </span>
                {product.price && (
                  <span className="inline-flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {(() => {
                      const price = typeof product.price === 'number' ? product.price : parseFloat(product.price);
                      return isNaN(price) ? '0.00' : price.toFixed(2);
                    })()}
                  </span>
                )}
              </div>
              
              {product.description && (
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {product.description}
                </p>
              )}
              
              {Array.isArray(product.features) && product.features.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {product.features.slice(0, 3).map((feature, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {product.features.length > 3 && (
                      <span className="text-xs text-gray-500"> 
                        +{product.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {Array.isArray(product.keywords) && product.keywords.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {product.keywords.slice(0, 3).map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                    {product.keywords.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{product.keywords.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => onEdit(product)}
                variant="outline"
                size="sm"
                icon={Edit}
                className="flex-1"
              >
                Edit
              </Button>
              <Button
                onClick={() => onDelete(product.id)}
                variant="outline"
                size="sm"
                icon={Trash2}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};