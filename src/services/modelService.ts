import { API_ENDPOINTS } from '../config';

export interface ModelInfo {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface UploadResponse {
  success: boolean;
  filename: string;
  originalName: string;
  url: string;
  size: number;
}

export class ModelService {
  static async uploadModel(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('model', file);

    const response = await fetch(API_ENDPOINTS.UPLOAD, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return response.json();
  }

  static async getModels(): Promise<ModelInfo[]> {
    const response = await fetch(API_ENDPOINTS.MODELS);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch models');
    }

    return response.json();
  }

  static async deleteModel(filename: string): Promise<void> {
    const response = await fetch(API_ENDPOINTS.DELETE_MODEL(filename), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete model');
    }
  }

  static getModelUrl(filename: string): string {
    return API_ENDPOINTS.MODEL_URL(filename);
  }
} 