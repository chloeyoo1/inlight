// Server configuration
export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

// API endpoints
export const API_ENDPOINTS = {
  UPLOAD: `${SERVER_URL}/upload`,
  MODELS: `${SERVER_URL}/models`,
  DELETE_MODEL: (filename: string) => `${SERVER_URL}/models/${filename}`,
  MODEL_URL: (filename: string) => `${SERVER_URL}/models/${filename}`
}; 