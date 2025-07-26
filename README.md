# 3D Model Geographic Analyzer

A web application built with Next.js and Esri ArcGIS Maps SDK for JavaScript that allows users to upload 3D models and analyze their geographic positioning and wall orientations.

## Features

- **3D Model Upload**: Support for .glb, .gltf, .fbx, and .usdz file formats
- **Geographic Positioning**: Place models at specific geographic coordinates (longitude, latitude, elevation)
- **Mesh Analysis**: Automatically analyze model geometry to identify walls and their orientations
- **Real-world Coordinates**: Convert mesh vertices to real-world geographic coordinates
- **Wall Orientation Analysis**: Calculate the facing direction of each wall relative to geographic north
- **Interactive 3D Scene**: Visualize models in a 3D scene with satellite imagery and elevation data
- **Manual Placement**: Use SketchViewModel for interactive model placement

## Technical Implementation

### Core Functionality

1. **Model Loading**: Uses `Mesh.createFromGLTF()` to load 3D models from uploaded files
2. **Vertex Space Conversion**: Converts mesh to `MeshGeoreferencedVertexSpace` for real-world coordinate analysis
3. **Geometry Analysis**: 
   - Groups faces by normal direction to identify walls
   - Calculates centroids of wall face groups
   - Computes wall orientations from face normals
4. **Geographic Positioning**: Places models at user-specified geographic coordinates

### Key Components

- **ModelAnalyzer**: Main component handling 3D model upload, loading, and analysis
- **ArcGISConfig**: Configuration component for ArcGIS Maps SDK setup
- **API Routes**: Serves ArcGIS assets from node_modules

### Analysis Algorithm

1. **Face Grouping**: Groups triangular faces by similar normal directions to identify walls
2. **Centroid Calculation**: Computes the geographic center of each wall face group
3. **Orientation Analysis**: 
   - Extracts horizontal component of face normals
   - Calculates angle relative to geographic north
   - Normalizes angles to 0-360 degrees

## Prerequisites

- Node.js 16.0+
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`

3. Upload a 3D model file (.glb, .gltf, .fbx, or .usdz)

4. Set the desired geographic position (longitude, latitude, elevation)

5. The application will automatically analyze the model and display:
   - Wall centroids in real-world coordinates
   - Wall orientations in degrees from north
   - Face normal vectors

## API Reference

### Wall Analysis Results

Each detected wall provides:
- **Centroid**: Geographic coordinates [longitude, latitude, elevation]
- **Orientation**: Angle in degrees from geographic north (0-360°)
- **Normal**: Face normal vector [x, y, z]

### Supported File Formats

- **GLB**: Binary glTF format
- **GLTF**: glTF format
- **FBX**: Autodesk FBX format
- **USDZ**: Universal Scene Description format

## Architecture

The application uses a client-side architecture with:
- **Next.js**: React framework for the web application
- **ArcGIS Maps SDK**: 3D visualization and geographic analysis
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Styling and responsive design

## Development

### Project Structure

```
src/
├── app/
│   ├── api/arcgis-assets/     # ArcGIS asset serving
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main application page
├── components/
│   ├── ArcGISConfig.tsx       # ArcGIS configuration
│   └── ModelAnalyzer.tsx      # Main 3D model analyzer
```

### Key Dependencies

- `@arcgis/core`: ArcGIS Maps SDK for JavaScript
- `next`: React framework
- `react`: React library
- `typescript`: TypeScript support

## License

This project is licensed under the MIT License.
