import { useState, useEffect } from 'react';
import { ModelService, ModelInfo } from '../services/modelService';

export const useModelManager = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadModels = async () => {
    try {
      const serverModels = await ModelService.getModels();
      setModels(serverModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const deleteModel = async (filename: string) => {
    try {
      await ModelService.deleteModel(filename);
      await loadModels(); // Reload the models list
    } catch (error) {
      console.error("Failed to delete model:", error);
    }
  };

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  return {
    models,
    isUploading,
    uploadError,
    setUploadError,
    setIsUploading,
    loadModels,
    deleteModel
  };
}; 