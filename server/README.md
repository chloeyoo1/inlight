# Inlight 3D Model Server

A simple Express server for storing and serving 3D model files (.glb, .gltf, .obj) for the Inlight web application.

## Features

- File upload with validation (only .glb, .gltf, .obj files allowed)
- File size limit: 50MB
- Automatic unique filename generation
- Static file serving
- CORS enabled for cross-origin requests
- Model management (list, delete)

## Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on port 3001 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### Upload Model
- **POST** `/upload`
- **Body**: Form data with file field named 'model'
- **Response**: JSON with file information

### Get All Models
- **GET** `/models`
- **Response**: Array of model information

### Delete Model
- **DELETE** `/models/:filename`
- **Response**: Success/error message

### Access Model File
- **GET** `/models/:filename`
- **Response**: The actual model file

## File Storage

Uploaded files are stored in the `uploads/` directory within the server folder. The directory is created automatically if it doesn't exist.

## Environment Variables

- `PORT`: Server port (default: 3001)

## Integration with React App

The React app is configured to connect to this server via the `src/config.ts` file. Make sure the server URL matches your setup.

For production, update the `REACT_APP_SERVER_URL` environment variable in your React app. 