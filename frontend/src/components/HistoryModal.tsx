import React from 'react';
import { X, Clock, RefreshCw, Eye, Copy, Check } from 'lucide-react';
import { AIDescriptionLog } from '../types';
import { Button } from './ui/Button';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiHistory: AIDescriptionLog[];
  onSelectDescription: (log: AIDescriptionLog) => void;
  productName?: string;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  aiHistory,
  onSelectDescription,
  productName
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAIProviderName = (log: AIDescriptionLog) => {
    // First check if we have the direct ai_provider field (new logs)
    if (log.ai_provider) {
      return log.ai_provider === 'deepseek' ? 'DeepSeek Chat' : 'Google Gemini 2.0 Flash';
    }
    
    // Fallback: Try to extract AI provider from request_data (old logs)
    if (log.request_data && typeof log.request_data === 'object') {
      // Check if it's stored in the request data
      if (log.request_data.ai_provider) {
        return log.request_data.ai_provider === 'deepseek' ? 'DeepSeek Chat' : 'Google Gemini 2.0 Flash';
      }
      // Check if it's in the contents structure (Gemini format)
      if (log.request_data.contents) {
        return 'Google Gemini 2.0 Flash';
      }
      // Check if it's in the prompt structure (DeepSeek format)
      if (log.request_data.prompt) {
        return 'DeepSeek Chat';
      }
    }
    // Default fallback
    return 'Google Gemini 2.0 Flash';
  };

  const getAIProviderBadge = (log: AIDescriptionLog) => {
    const providerName = getAIProviderName(log);
    const isDeepSeek = providerName === 'DeepSeek Chat';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isDeepSeek 
          ? 'bg-purple-100 text-purple-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {providerName}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">AI Generation History</h2>
              <p className="text-blue-100">
                {productName ? `For "${productName}"` : 'Generated descriptions for this product'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {aiHistory.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No AI generations found</h3>
              <p className="text-gray-500">Generate your first AI description to see it here!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {aiHistory.map((log, index) => (
                <div
                  key={log.id}
                  className="bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200"
                >
                  {/* History Item Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <span>{formatDate(log.created_at)}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          #{aiHistory.length - index}
                        </span>
                        {getAIProviderBadge(log)}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(log.generated_text, index)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={14} />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                          {expandedIndex === index ? 'Show Less' : 'View Full'}
                        </button>
                        <Button
                          onClick={() => onSelectDescription(log)}
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                        >
                          Select This
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* History Item Content */}
                  <div className="p-4">
                    <div className="text-gray-800 leading-relaxed">
                      {expandedIndex === index ? (
                        <div className="whitespace-pre-wrap">{log.generated_text}</div>
                      ) : (
                        <div>{truncateText(log.generated_text, 200)}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {aiHistory.length > 0 && (
                <span>{aiHistory.length} generation{aiHistory.length !== 1 ? 's' : ''} found</span>
              )}
            </div>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
