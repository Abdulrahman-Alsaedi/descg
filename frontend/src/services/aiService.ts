import { AIGenerationRequest, AIDescriptionLog } from '../types';

// Track generation attempts to ensure uniqueness
const generationTracker = new Map<string, number>();

export const generateDescription = async (request: AIGenerationRequest, existingProductId?: string): Promise<{description: string, productId: string}> => {
  const { productName, category, features, keywords, tone = 'professional', length = 'medium', language = 'en', aiProvider = 'gemini' } = request;
  
  // Send frontend language codes directly - backend will convert them
  const backendLanguage = language;
  
  // Create a unique key for this product configuration
  const productKey = `${productName}-${category}-${features.join(',')}-${keywords.join(',')}`;
  const attemptNumber = (generationTracker.get(productKey) || 0) + 1;
  generationTracker.set(productKey, attemptNumber);
  
  let productId = existingProductId;
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Only create a new product if we don't have an existing one
    if (!productId) {
      const productResponse = await fetch('https://api.descg.store/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productName,
          category: category,
          features: features,
          keywords: keywords,
          tone: tone,
          length: length,
          language: backendLanguage,
          ai_provider: aiProvider,
        }),
      });

      if (!productResponse.ok) {
        const errorData = await productResponse.json().catch(() => ({ message: 'Failed to create product' }));
        throw new Error(errorData.message || 'Failed to create product');
      }

      const productData = await productResponse.json();
      productId = productData.product.id;
    }

    // Generate AI description using the product ID
    const aiResponse = await fetch(`https://api.descg.store/api/ai-description-logs/generate/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Generation-Attempt': attemptNumber.toString(),
      },
      body: JSON.stringify({
        tone: tone,
        length: length,
        language: backendLanguage,
        ai_provider: aiProvider,
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({ error: 'Unknown server error' }));
      console.error('AI Generation Failed:', {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        error: errorData,
        url: aiResponse.url
      });
      throw new Error(errorData.error || `Server error: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    
    // If we got a successful response, get the AI logs for this product to retrieve the generated description
    if (aiData.success) {
      const logsResponse = await fetch(`https://api.descg.store/api/ai-description-logs/${productId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        // Get the most recent log entry
        const latestLog = Array.isArray(logsData) && logsData.length > 0 ? logsData[logsData.length - 1] : null;
        
        if (latestLog && latestLog.generated_text) {
          return {
            description: latestLog.generated_text,
            productId: productId!
          };
        }
      }
    }
    
    // Fallback to direct response if logs retrieval fails
    return {
      description: aiData.description || 'Generated description not found',
      productId: productId!
    };
    
  } catch (error) {
    console.error('AI Generation Error:', error);
    
    // Use the actual productId if we have it (from successful product creation), 
    // otherwise use existingProductId, otherwise create a temp fallback
    const fallbackProductId = productId || existingProductId || `temp_${Date.now()}`;
    
    console.log('Using fallback description with productId:', fallbackProductId, 'Original productId:', productId, 'ExistingProductId:', existingProductId);
    
    // Enhanced fallback with uniqueness
    const fallbackVariations = [
      `Discover the innovative ${productName} - a cutting-edge ${category} that revolutionizes your experience with ${features.slice(0, 2).join(' and ')}. Ideal for those seeking ${keywords.slice(0, 2).join(' and ')} excellence.`,
      `Experience excellence with the ${productName}, featuring ${features.slice(0, 2).join(' and ')}. This premium ${category} delivers unmatched quality for ${keywords.slice(0, 2).join(' and ')} enthusiasts.`,
      `Transform your world with the ${productName} - where ${features.slice(0, 2).join(' meets ')} in perfect harmony. The ultimate ${category} solution for ${keywords.slice(0, 2).join(' and ')} perfection.`,
      `Unleash the power of the ${productName}, designed with ${features.slice(0, 2).join(' and ')} to redefine your ${category} experience. Perfect for ${keywords.slice(0, 2).join(' and ')} applications.`
    ];
    
    const fallbackIndex = (attemptNumber - 1) % fallbackVariations.length;
    return {
      description: fallbackVariations[fallbackIndex],
      productId: fallbackProductId
    };
  }
};

// Function to get all AI logs
export const getAILogs = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('https://api.descg.store/api/ai-description-logs', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch AI logs');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching AI logs:', error);
    throw error;
  }
};

// Function to get AI logs for a specific product
export const getProductAILogs = async (productId: string | number) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`https://api.descg.store/api/ai-description-logs/${productId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product AI logs');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching product AI logs:', error);
    throw error;
  }
};

// Function to get AI history for a specific product
export const getAIHistoryForProduct = async (productId: string): Promise<AIDescriptionLog[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`https://api.descg.store/api/ai-description-logs/fetchByProduct?product_id=${productId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch AI history' }));
      console.error('Failed to fetch AI history:', errorData);
      throw new Error(errorData.message || 'Failed to fetch AI history');
    }

    const data = await response.json();
    const logs = data.logs || [];
    return logs;
  } catch (error) {
    console.error('Error fetching AI history:', error);
    throw error;
  }
};

// Function to reset generation tracking for a specific product
export const resetGenerationTracking = (productName: string, category: string, features: string[], keywords: string[]) => {
  const productKey = `${productName}-${category}-${features.join(',')}-${keywords.join(',')}`;
  generationTracker.delete(productKey);
};

// Function to clear all generation tracking
export const clearAllGenerationTracking = () => {
  generationTracker.clear();
};

// Function to delete a specific product when user cancels
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`https://api.descg.store/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete product' }));
      console.warn('Product deletion failed:', errorData.message);
      // Don't throw error - deletion is for cleanup
    } else {
      const data = await response.json();
      console.log('Product deleted:', data.message);
    }
  } catch (error) {
    console.warn('Error during product deletion:', error);
    // Don't throw error - deletion is for cleanup
  }
};