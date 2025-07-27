import React, { useEffect, useRef, useState } from 'react';
import './App.css';

import "@esri/calcite-components";
import "@esri/calcite-components/dist/components/calcite-button";

import esriConfig from '@arcgis/core/config';
import WebScene from '@arcgis/core/WebScene';
import SceneView from '@arcgis/core/views/SceneView';
import Editor from '@arcgis/core/widgets/Editor';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import Weather from "@arcgis/core/widgets/Weather.js";
import ShadowCast from '@arcgis/core/widgets/ShadowCast';
import Daylight from "@arcgis/core/widgets/Daylight.js";

import { getWeather, applyNWSWeatherToScene, type Geolocation } from './utils/weather_utils';
import { ModelService, ModelInfo } from './services/modelService';
import { useWidgetManager } from './hooks/useWidgetManager';
import { useModelManager } from './hooks/useModelManager';

interface MainAppProps {
  onBackToLanding: () => void;
}

function MainApp({ onBackToLanding }: MainAppProps) {
  const viewRef = useRef<SceneView | null>(null);
  const sceneRef = useRef<WebScene | null>(null);
  const sketchVMRef = useRef<SketchViewModel | null>(null);
  
  const [viewGeolocation, setViewGeolocation] = useState<Geolocation | null>(null);

  // Custom hooks
  const { activeWidget, widgets, switchWidget, editorRef, weatherRef, shadowCastRef, daylightRef } = useWidgetManager(viewRef.current);
  const { models, isUploading, uploadError, setUploadError, setIsUploading, loadModels, deleteModel } = useModelManager();

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
        type: "unique-value",
        field: "TYPE",
        visualVariables: [
          {
            type: "size",
            field: "SIZE",
            axis: "height",
            valueUnit: "meters",
          },
          {
            type: "rotation",
            field: "ROTATION",
          },
        ],
        uniqueValueInfos: [
          {
            value: "1",
            label: "Slide",
            symbol: {
              type: "point-3d",
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
              type: "point-3d",
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

    // Initialize widgets
    weatherRef.current = new Weather({ view });
    shadowCastRef.current = new ShadowCast({ view });
    daylightRef.current = new Daylight({ view, dateOrSeason: "date" });

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
      editorRef.current = new Editor({
        view: view,
        tooltipOptions: { enabled: true },
        labelOptions: { enabled: true }
      });

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          view.goTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 20,
            tilt: 45
          }, { duration: 2000 });
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

  const handleImportModel = async () => {
    await viewRef.current?.when();
    
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".glb,.gltf,.obj";

    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".glb") && !file.name.endsWith(".gltf") && !file.name.endsWith(".obj")) {
        console.error("Invalid file type. Please upload a .glb, .gltf, or .obj file.");
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        const uploadResponse = await ModelService.uploadModel(file);
        await loadModels();

        if (sceneRef.current && sketchVMRef.current) {
          sketchVMRef.current.pointSymbol = {
            type: "point-3d",
            symbolLayers: [
              {
                type: "object",
                resource: { href: uploadResponse.url },
              }
            ]
          };

          sketchVMRef.current.create("point");
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    };

    fileInput.click();
  };

  const getMapViewLocation = async () => {
    if (!viewRef.current) return;
    
    await viewRef.current.when();
    const center = viewRef.current.center;
    setViewGeolocation({ 
      lat: center.latitude ?? 0, 
      lon: center.longitude ?? 0 
    });
  };

  const handleSelectModel = async (model: ModelInfo) => {
    if (sceneRef.current && sketchVMRef.current) {
      sketchVMRef.current.pointSymbol = {
        type: "point-3d",
        symbolLayers: [
          {
            type: "object",
            resource: { href: model.url },
          }
        ]
      };

      sketchVMRef.current.create("point");
    }
  };

  const handleDatetimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value);
    if (viewRef.current) {
      viewRef.current.environment.lighting = {
        type: "sun",
        date: selectedDate,
      };
    }
  };

  useEffect(() => {
    if (viewRef.current && viewGeolocation) {
      getWeather(viewGeolocation).then(data => {
        if (data?.properties?.periods?.[0]) {
          applyNWSWeatherToScene(data.properties.periods[0], viewRef.current!);
        }
      }).catch(error => {
        console.error("Error fetching or applying weather data:", error);
      });
    }
  }, [viewGeolocation]);

  return (
    <div className="App flex flex-col h-screen">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onBackToLanding}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      </div>

      <div id="viewDiv" className="flex-1"></div>
      <div className="h-[300px] bg-gray-100 overflow-auto p-4">
        <div className="flex flex-col gap-4">
          
          {/* Widget Switcher */}
          <div className="mb-4 text-left">
            <button onClick={getMapViewLocation}>update</button>
            <div className="flex flex-wrap gap-2 mb-4 justify-start">
              {widgets.map(widget => (
                <button
                  key={widget.id}
                  onClick={() => switchWidget(widget.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    activeWidget === widget.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {widget.name}
                </button>
              ))}
            </div>
          </div>

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
                          onClick={() => deleteModel(model.filename)}
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

export default MainApp; 