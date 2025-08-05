// Default product image placeholder
export const getDefaultProductImage = (productName: string): string => {
  // Return a simple data URL for a default placeholder
  return createDefaultPlaceholder(productName);
};

const base64EncodeUnicode = (str: string): string => {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

// Create a simple SVG placeholder
const createDefaultPlaceholder = (productName: string): string => {
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f3f4f6" />
      <rect x="120" y="90" width="160" height="120" rx="8" fill="none" stroke="#d1d5db" stroke-width="2"/>
      <circle cx="160" cy="130" r="12" fill="none" stroke="#d1d5db" stroke-width="2"/>
      <path d="M135 175 L155 155 L175 165 L190 150 L245 175 Z" fill="none" stroke="#d1d5db" stroke-width="2" stroke-linejoin="round"/>
      <text x="200" y="240" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">
        ${productName.length > 25 ? productName.substring(0, 25) + '...' : productName}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${base64EncodeUnicode(svg)}`;
};

// Function to validate if image URL is accessible
export const validateImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

// Function to get image URL with fallback
export const getProductImageUrl = (product: any): string => {
  if (product.image_url) {
    // If it's already a full URL (http/https or data:), use it as is
    if (product.image_url.startsWith('http') || product.image_url.startsWith('data:')) {
      return product.image_url;
    }
    // If it's a relative path, convert to full URL
    if (product.image_url.startsWith('/storage/')) {
      return `http://127.0.0.1:8000${product.image_url}`;
    }
    // If it's just a filename or other format, assume it needs the storage prefix
    return `http://127.0.0.1:8000/storage/products/${product.image_url}`;
  }
  return getDefaultProductImage(product.name);
};

// Function to determine the best object-fit for a product based on category/name
export const getImageObjectFit = (product: any): 'cover' | 'contain' => {
  const productName = product.name?.toLowerCase() || '';
  const category = product.category?.toLowerCase() || '';
  
  // Products that should show full item (use contain)
  const containKeywords = [
    // Clothing
    'shirt', 't-shirt', 'tshirt', 'dress', 'pants', 'jeans', 'jacket', 'hoodie', 'sweater',
    'blouse', 'skirt', 'shorts', 'coat', 'vest', 'blazer', 'cardigan', 'jumpsuit',
    
    // Electronics with specific shapes
    'phone', 'tablet', 'laptop', 'computer', 'monitor', 'keyboard', 'mouse', 'headphones',
    'smartwatch', 'earbuds', 'speaker', 'router', 'modem', 'console', 'controller',
    
    // Tools and equipment
    'bottle', 'cup', 'mug', 'glass', 'tool', 'hammer', 'screwdriver', 'wrench',
    'knife', 'fork', 'spoon', 'plate', 'bowl', 'pot', 'pan', 'blender',
    
    // Toys and specific items
    'toy', 'doll', 'figure', 'book', 'notebook', 'pen', 'pencil', 'marker',
    'bag', 'backpack', 'purse', 'wallet', 'watch', 'jewelry', 'ring', 'necklace'
  ];
  
  // Categories that typically need full item visibility
  const containCategories = [
    'clothing', 'apparel', 'fashion', 'electronics', 'tools', 'kitchenware',
    'toys', 'books', 'accessories', 'jewelry', 'bags', 'footwear', 'shoes'
  ];
  
  // Check if product name contains keywords that need full visibility
  const needsContain = containKeywords.some(keyword => 
    productName.includes(keyword)
  ) || containCategories.some(cat => 
    category.includes(cat)
  );
  
  return needsContain ? 'contain' : 'cover';
};
