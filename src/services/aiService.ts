import { AIGenerationRequest } from '../types';

export const generateDescription = async (request: AIGenerationRequest): Promise<string> => {
  // Simulate AI API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { productName, category, features, keywords, tone = 'professional', length = 'medium' } = request;
  
  // Mock AI-generated descriptions based on input
  const templates = {
    professional: {
      short: `Introducing the ${productName} - a premium ${category} designed for excellence. ${features.slice(0, 2).join(' and ')} make this the perfect choice for discerning customers.`,
      medium: `Discover the ${productName}, a revolutionary ${category} that combines innovation with style. Featuring ${features.join(', ')}, this product delivers exceptional performance and value. Perfect for ${keywords.join(', ')} enthusiasts who demand the best.`,
      long: `Experience the future with the ${productName}, an extraordinary ${category} that redefines industry standards. Our engineering team has meticulously crafted this product with ${features.join(', ')}, ensuring unparalleled quality and performance. Whether you're interested in ${keywords.join(', ')}, this versatile solution adapts to your needs. The ${productName} represents our commitment to innovation, combining cutting-edge technology with user-friendly design to deliver an exceptional experience that exceeds expectations.`
    },
    casual: {
      short: `Meet the ${productName}! This awesome ${category} is packed with ${features.slice(0, 2).join(' and ')} that'll make your life easier.`,
      medium: `Hey there! Looking for an amazing ${category}? The ${productName} is exactly what you need! With ${features.join(', ')}, it's perfect for anyone into ${keywords.join(', ')}. Trust us, you're going to love it!`,
      long: `Okay, let's talk about the ${productName} - this ${category} is seriously incredible! We've loaded it with ${features.join(', ')} because we know you want something that actually works. Whether you're all about ${keywords.join(', ')} or just want something reliable, this is it. The ${productName} isn't just another product - it's going to become your new favorite thing. We've thought of everything to make sure you get exactly what you're looking for.`
    },
    persuasive: {
      short: `Don't miss out on the ${productName} - the ultimate ${category} with ${features.slice(0, 2).join(' and ')} that customers can't stop raving about!`,
      medium: `Why settle for ordinary when you can have extraordinary? The ${productName} transforms your ${category} experience with ${features.join(', ')}. Join thousands of satisfied customers who've discovered the ${keywords.join(', ')} solution they've been searching for. Order yours today!`,
      long: `Stop wasting time with inferior products! The ${productName} is the game-changing ${category} that's taking the market by storm. With ${features.join(', ')}, this isn't just another purchase - it's an investment in quality that pays dividends every day. Thousands of customers have already discovered why the ${productName} is the #1 choice for ${keywords.join(', ')} enthusiasts. Don't let this opportunity slip away - demand is high and availability is limited. Experience the difference that true quality makes and join the revolution of satisfied customers who made the smart choice.`
    }
  };
  
  return templates[tone][length];
};