import React, { useEffect, useRef, useState } from 'react';
import './App.css';

import "@esri/calcite-components";
import "@esri/calcite-components/dist/components/calcite-button";

import esriConfig from '@arcgis/core/config';
import WebScene from '@arcgis/core/WebScene';
import SceneView from '@arcgis/core/views/SceneView';
import Editor from '@arcgis/core/widgets/Editor';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
// import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import ObjectSymbol3DLayer from '@arcgis/core/symbols/ObjectSymbol3DLayer';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import Weather from "@arcgis/core/widgets/Weather.js";
import { ModelService, ModelInfo } from './services/modelService';

function App() {
  const viewRef = useRef<SceneView | null>(null);
  const sceneRef = useRef<WebScene | null>(null);
  const sketchVMRef = useRef<SketchViewModel | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  try {
    const { default: ARCGIS_API_KEY } = require('./key');
    esriConfig.apiKey = ARCGIS_API_KEY;
  } catch (error) {
    console.error("Missing ArcGIS API key (did you make a key.ts file exporting ARCGIS_API_KEY in ./src?)");
  }

  useEffect(() => {
    const webScene = new WebScene({
      portalItem: {
        id: "79da6e264b6d4a0bb88366b57bdc037d" // OpenStreetMap
      }
    });

    const recreationLayer = new FeatureLayer({
      title: "Recreation",
      url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/EditableFeatures3D/FeatureServer/1",
      elevationInfo: {
        mode: "absolute-height",
      },
      renderer: {
        type: "unique-value", // autocasts as new UniqueValueRenderer()
        field: "TYPE",
        visualVariables: [
          {
            // size can be modified with the interactive handle
            type: "size",
            field: "SIZE",
            axis: "height",
            valueUnit: "meters",
          },
          {
            // rotation can be modified with the interactive handle
            type: "rotation",
            field: "ROTATION",
          },
        ],
        uniqueValueInfos: [
          {
            value: "1",
            label: "Slide",
            symbol: {
              type: "point-3d", // autocasts as new PointSymbol3D()
              symbolLayers: [
                {
                  type: "object",
                  resource: {
                    href: "https://static.arcgis.com/arcgis/styleItems/Recreation/gltf/resource/Slide.glb",
                  },
                },
              ],
              styleOrigin: {
                styleName: "EsriRecreationStyle",
                name: "Slide",
              },
            },
          },
          {
            value: "2",
            label: "Swing",
            symbol: {
              type: "point-3d", // autocasts as new PointSymbol3D()
              symbolLayers: [
                {
                  type: "object",
                  resource: {
                    href: "https://static.arcgis.com/arcgis/styleItems/Recreation/gltf/resource/Swing.glb",
                  },
                },
              ],
              styleOrigin: {
                styleName: "EsriRecreationStyle",
                name: "Swing",
              },
            },
          },
        ],
      },
    });

    webScene.add(recreationLayer);
  
    sceneRef.current = webScene;

    // Create and setup the SceneView
    const view = new SceneView({
      container: "viewDiv",
      map: webScene,
      environment: {
        lighting: {
          date: new Date(),
          directShadowsEnabled: true
        }
      },
      qualityProfile: "high"
    });

    const widget = new Weather({ view: view });

    view.ui.add(widget, "bottom-left");

    const graphicsLayer = new GraphicsLayer({
      elevationInfo: { mode: "relative-to-ground" }
    });
    view.map?.add(graphicsLayer);

    const sketchVM = new SketchViewModel({
      layer: graphicsLayer,
      view: view,
    });

    sketchVMRef.current = sketchVM;

    viewRef.current = view;

    view.when(() => {
      const editor = new Editor({
        view: view,
        tooltipOptions: {
          enabled: true,
        },
        labelOptions: {
          enabled: true,
        }
      });

      view.ui.add(editor, "top-right");

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          view.goTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 20,
            tilt: 45
          }, {
            duration: 2000
          })
        }, (error) => {
          console.error("Error getting location:", error);
        });
      } else {
        console.warn("Geolocation is not supported by this browser.");
      }
    }).catch((error) => {
      console.error("Error loading SceneView:", error);
    });

  }, []);

  // Load models from server on component mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const serverModels = await ModelService.getModels();
      setModels(serverModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleImportModel = async () => {
    await viewRef.current?.when();
    
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".glb,.gltf,.obj";

    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        console.error("No file selected.");
        return;
      }

      if (!file.name.endsWith(".glb") && !file.name.endsWith(".gltf") && !file.name.endsWith(".obj")) {
        console.error("Invalid file type. Please upload a .glb, .gltf, or .obj file.");
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        // Upload file to server
        const uploadResponse = await ModelService.uploadModel(file);
        console.log("File uploaded successfully:", uploadResponse);

        // Reload models list
        await loadModels();

        // Add model to scene using server URL
        if (sceneRef.current && sketchVMRef.current) {
          sketchVMRef.current.pointSymbol = {
            type: "point-3d",
            symbolLayers: [
              {
                type: "object",
                resource: {
                  href: uploadResponse.url,
                },
              }
            ]
          };

          sketchVMRef.current.create("point");
          console.log("Custom model added to the scene from server.");
        } else {
          console.error("Scene is not initialized.");
        }
      } catch (error) {
        console.error("Upload failed:", error);
        setUploadError(error instanceof Error ? error.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    };

    fileInput.click();
  };

  const handleSelectModel = async (model: ModelInfo) => {
    if (sceneRef.current && sketchVMRef.current) {
      sketchVMRef.current.pointSymbol = {
        type: "point-3d",
        symbolLayers: [
          {
            type: "object",
            resource: {
              href: model.url,
            },
          }
        ]
      };

      sketchVMRef.current.create("point");
      console.log("Model selected from server:", model.originalName);
    }
  };

  const handleDeleteModel = async (filename: string) => {
    try {
      await ModelService.deleteModel(filename);
      await loadModels(); // Reload the models list
      console.log("Model deleted successfully");
    } catch (error) {
      console.error("Failed to delete model:", error);
    }
  };

  const handleDatetimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value);
    if (viewRef.current) {
      viewRef.current.environment.lighting = {
        type: "sun",
        date: selectedDate,
      };
      console.log("Lighting date updated to:", selectedDate);
    }
  };

  return (
    <div className="App flex flex-col h-screen">
      <div id="viewDiv" className="flex-1"></div>
      <div className="h-[300px] bg-gray-100 overflow-auto p-4">
        <div className="flex flex-col gap-4">
          {/* Upload Section */}
          <div className="flex items-center gap-4">
            <calcite-button 
              onClick={handleImportModel}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Import Your Model'}
            </calcite-button>
            <input 
              type="datetime-local" 
              onChange={handleDatetimeChange}
              className="border rounded px-2 py-1"
            />
          </div>

          {/* Error Display */}
          {uploadError && (
            <div className="text-red-600 bg-red-100 p-2 rounded">
              Error: {uploadError}
            </div>
          )}

          {/* Models List */}
          <div>
            <h3 className="font-semibold mb-2">Available Models ({models.length})</h3>
            {models.length === 0 ? (
              <p className="text-gray-500">No models uploaded yet. Upload a model to get started.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {models.map((model) => (
                  <div 
                    key={model.filename} 
                    className="border rounded p-2 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={model.originalName}>
                          {model.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(model.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(model.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleSelectModel(model)}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => handleDeleteModel(model.filename)}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
