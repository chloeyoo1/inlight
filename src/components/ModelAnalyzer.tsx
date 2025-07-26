"use client";

import { useEffect, useRef, useState } from "react";
import SceneView from "@arcgis/core/views/SceneView";
import Map from "@arcgis/core/Map";
import Point from "@arcgis/core/geometry/Point";
import Mesh from "@arcgis/core/geometry/Mesh";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils.js";
import MeshGeoreferencedVertexSpace from "@arcgis/core/geometry/support/MeshGeoreferencedVertexSpace.js";

interface WallAnalysis {
  id: number;
  centroid: [number, number, number];
  orientation: number;
  normal: [number, number, number];
}

export default function ModelAnalyzer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<SceneView | null>(null);
  const sketchViewModelRef = useRef<SketchViewModel | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [wallAnalysis, setWallAnalysis] = useState<WallAnalysis[]>([]);
  const [modelPosition, setModelPosition] = useState<[number, number, number]>([-122.4194, 37.7749, 0]); // Default: San Francisco
  const [modelRotation, setModelRotation] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize the map and scene view
    const map = new Map({
      basemap: "satellite",
      ground: "world-elevation",
    });

    const view = new SceneView({
      container: mapRef.current,
      map: map,
      camera: {
        position: {
          x: modelPosition[0],
          y: modelPosition[1],
          z: 1000,
        },
        tilt: 45,
      },
      environment: {
        lighting: {
          directShadowsEnabled: true,
        },
      },
    });

    // Create graphics layer for the 3D model
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    viewRef.current = view;
    graphicsLayerRef.current = graphicsLayer;

    // Initialize SketchViewModel for manual positioning
    const sketchViewModel = new SketchViewModel({
      view: view,
      layer: graphicsLayer,
      defaultCreateOptions: {
        mode: "hybrid",
      },
    });

    sketchViewModelRef.current = sketchViewModel;

    // Handle model placement completion
    sketchViewModel.on("create", (event: any) => {
      if (event.state === "complete" && event.graphic) {
        const graphic = event.graphic;
        const geometry = graphic.geometry as Point;
        
        if (geometry) {
          setModelPosition([geometry.x, geometry.y, geometry.z || 0]);
          analyzeModelGeometry();
        }
      }
    });

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      loadModel(file);
    }
  };

  const loadModel = async (file: File) => {
    if (!viewRef.current || !graphicsLayerRef.current) return;

    setIsLoading(true);
    setAnalysisComplete(false);
    setWallAnalysis([]);

    try {
      // Create object URL for the file
      const objectUrl = URL.createObjectURL(file);

      // Create mesh from the 3D model file
      const mesh = await Mesh.createFromGLTF(
        new Point({
          x: modelPosition[0],
          y: modelPosition[1],
          z: modelPosition[2],
          spatialReference: SpatialReference.WGS84,
        }),
        objectUrl,
        { vertexSpace: "local" }
      );

      await mesh.load();

      // Convert to georeferenced vertex space
      const georeferencedMesh = await meshUtils.convertVertexSpace(
        mesh,
        new MeshGeoreferencedVertexSpace()
      );

      // Create graphic and add to layer
      const graphic = new Graphic({
        geometry: georeferencedMesh,
        symbol: {
          type: "mesh-3d",
          symbolLayers: [
            {
              type: "fill",
              material: {
                color: [0.8, 0.8, 0.8, 0.8],
              },
            },
          ],
        },
      });

      graphicsLayerRef.current.add(graphic);
      meshRef.current = georeferencedMesh;

      // Clean up object URL
      URL.revokeObjectURL(objectUrl);

      // Analyze the model geometry
      analyzeModelGeometry();

    } catch (error) {
      console.error("Error loading model:", error);
      alert("Error loading 3D model. Please ensure the file is a valid .glb, .gltf, .fbx, or .usdz file.");
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeModelGeometry = () => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const vertexAttributes = mesh.vertexAttributes;
    const components = mesh.components;

    if (!vertexAttributes.position || !components?.[0].faces) {
      console.warn("Model does not have position attributes or faces");
      return;
    }

    const positions = vertexAttributes.position;
    const faces = components?.[0].faces;
    const walls: WallAnalysis[] = [];

    // Group faces by their normal direction to identify walls
    const faceGroups: { [key: string]: number[] } = {};
    
    for (let i = 0; i < faces.length; i += 3) {
      const v1 = faces[i];
      const v2 = faces[i + 1];
      const v3 = faces[i + 2];

      // Calculate face normal
      const p1 = [positions[v1 * 3], positions[v1 * 3 + 1], positions[v1 * 3 + 2]];
      const p2 = [positions[v2 * 3], positions[v2 * 3 + 1], positions[v2 * 3 + 2]];
      const p3 = [positions[v3 * 3], positions[v3 * 3 + 1], positions[v3 * 3 + 2]];

      const u = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
      const v = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

      const normal = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];

      // Normalize the normal vector
      const length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
      if (length > 0) {
        normal[0] /= length;
        normal[1] /= length;
        normal[2] /= length;
      }

      // Group faces by similar normal directions (walls)
      const normalKey = `${Math.round(normal[0] * 10) / 10},${Math.round(normal[1] * 10) / 10},${Math.round(normal[2] * 10) / 10}`;
      
      if (!faceGroups[normalKey]) {
        faceGroups[normalKey] = [];
      }
      faceGroups[normalKey].push(i);
    }

    // Analyze each wall group
    let wallId = 0;
    for (const [normalKey, faceIndices] of Object.entries(faceGroups)) {
      if (faceIndices.length < 3) continue; // Skip small face groups

      // Calculate centroid of all faces in this group
      let centroidX = 0, centroidY = 0, centroidZ = 0;
      let totalFaces = 0;

      for (const faceIndex of faceIndices) {
        const v1 = faces[faceIndex];
        const v2 = faces[faceIndex + 1];
        const v3 = faces[faceIndex + 2];

        const p1 = [positions[v1 * 3], positions[v1 * 3 + 1], positions[v1 * 3 + 2]];
        const p2 = [positions[v2 * 3], positions[v2 * 3 + 1], positions[v2 * 3 + 2]];
        const p3 = [positions[v3 * 3], positions[v3 * 3 + 1], positions[v3 * 3 + 2]];

        centroidX += (p1[0] + p2[0] + p3[0]) / 3;
        centroidY += (p1[1] + p2[1] + p3[1]) / 3;
        centroidZ += (p1[2] + p2[2] + p3[2]) / 3;
        totalFaces++;
      }

      if (totalFaces > 0) {
        centroidX /= totalFaces;
        centroidY /= totalFaces;
        centroidZ /= totalFaces;

        // Calculate orientation from normal (horizontal component)
        const [nx, ny, nz] = normalKey.split(',').map(Number);
        const horizontalNormal = [nx, ny, 0];
        const horizontalLength = Math.sqrt(nx * nx + ny * ny);
        
        if (horizontalLength > 0.1) { // Only consider walls with significant horizontal component
          const angle = Math.atan2(ny, nx) * (180 / Math.PI);
          const orientation = (angle + 360) % 360; // Normalize to 0-360 degrees

          walls.push({
            id: wallId++,
            centroid: [centroidX, centroidY, centroidZ],
            orientation,
            normal: [nx, ny, nz],
          });
        }
      }
    }

    setWallAnalysis(walls);
    setAnalysisComplete(true);
  };

  const handlePositionChange = (index: number, value: number) => {
    const newPosition = [...modelPosition] as [number, number, number];
    newPosition[index] = value;
    setModelPosition(newPosition);
  };

  const handleRotationChange = (value: number) => {
    setModelRotation(value);
    // Apply rotation to the model if it exists
    if (meshRef.current && viewRef.current) {
      // This would require updating the mesh transformation
      // For now, we'll just store the rotation value
    }
  };

  const startManualPlacement = () => {
    if (sketchViewModelRef.current) {
      sketchViewModelRef.current.create("point");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Control Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Model Upload & Controls</h2>
          
          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload 3D Model
            </label>
            <input
              type="file"
              accept=".glb,.gltf,.fbx,.usdz"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Position Controls */}
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Model Position</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-600">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={modelPosition[0]}
                  onChange={(e) => handlePositionChange(0, parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={modelPosition[1]}
                  onChange={(e) => handlePositionChange(1, parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Elevation (m)</label>
                <input
                  type="number"
                  step="any"
                  value={modelPosition[2]}
                  onChange={(e) => handlePositionChange(2, parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Rotation Control */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotation (degrees)
            </label>
            <input
              type="number"
              min="0"
              max="360"
              value={modelRotation}
              onChange={(e) => handleRotationChange(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Manual Placement Button */}
          <button
            onClick={startManualPlacement}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Place Model Manually
          </button>

          {isLoading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading model...</p>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysisComplete && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Wall Analysis Results</h2>
            {wallAnalysis.length > 0 ? (
              <div className="space-y-3">
                {wallAnalysis.map((wall) => (
                  <div key={wall.id} className="border border-gray-200 rounded p-3">
                    <h3 className="font-medium text-gray-900">Wall {wall.id + 1}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Centroid: [{wall.centroid[0].toFixed(6)}, {wall.centroid[1].toFixed(6)}, {wall.centroid[2].toFixed(2)}]</p>
                      <p>Orientation: {wall.orientation.toFixed(1)}° from North</p>
                      <p>Normal: [{wall.normal[0].toFixed(3)}, {wall.normal[1].toFixed(3)}, {wall.normal[2].toFixed(3)}]</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No walls detected in the model.</p>
            )}
          </div>
        )}
      </div>

      {/* 3D Map View */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">3D Scene View</h2>
            <p className="text-sm text-gray-600">
              Use the map to visualize and interact with your 3D model
            </p>
          </div>
          <div 
            ref={mapRef} 
            className="w-full h-96 lg:h-[600px] rounded-b-lg"
          />
        </div>
      </div>
    </div>
  );
} 