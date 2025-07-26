# Sample 3D Model Analysis Data

This file contains sample data to demonstrate the expected output format of the 3D Model Geographic Analyzer.

## Sample Wall Analysis Results

For a typical building model, you might see results like this:

### Wall 1
- **Centroid**: [-122.419400, 37.774900, 10.5]
- **Orientation**: 45.2° from North
- **Normal**: [0.707, 0.707, 0.000]

### Wall 2
- **Centroid**: [-122.419450, 37.774850, 10.5]
- **Orientation**: 135.2° from North
- **Normal**: [-0.707, 0.707, 0.000]

### Wall 3
- **Centroid**: [-122.419500, 37.774900, 10.5]
- **Orientation**: 225.2° from North
- **Normal**: [-0.707, -0.707, 0.000]

### Wall 4
- **Centroid**: [-122.419450, 37.774950, 10.5]
- **Orientation**: 315.2° from North
- **Normal**: [0.707, -0.707, 0.000]

## Testing the Application

1. **Upload a 3D Model**: Use a .glb, .gltf, .fbx, or .usdz file
2. **Set Position**: Enter longitude, latitude, and elevation
3. **Analyze**: The application will automatically detect walls and calculate orientations
4. **View Results**: Check the analysis panel for detailed wall information

## Expected File Formats

- **GLB**: Binary glTF (recommended for web)
- **GLTF**: glTF format with external resources
- **FBX**: Autodesk FBX format
- **USDZ**: Universal Scene Description (Apple ecosystem)

## Geographic Coordinates

The application uses WGS84 coordinate system:
- **Longitude**: -180 to +180 degrees
- **Latitude**: -90 to +90 degrees
- **Elevation**: Height in meters above sea level

## Orientation Calculation

Wall orientations are calculated as:
1. Extract horizontal component of face normal
2. Calculate angle using atan2(ny, nx)
3. Normalize to 0-360 degrees
4. 0° = North, 90° = East, 180° = South, 270° = West 