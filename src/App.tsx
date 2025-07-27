import React, { useEffect, useRef, useState } from 'react';
import './App.css';

import "@esri/calcite-components";
import "@esri/calcite-components/dist/components/calcite-button";

import esriConfig from '@arcgis/core/config';
import WebScene from '@arcgis/core/WebScene';
import SceneView from '@arcgis/core/views/SceneView';
import Editor from '@arcgis/core/widgets/Editor';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import TileLayer from '@arcgis/core/layers/TileLayer';
// import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import ObjectSymbol3DLayer from '@arcgis/core/symbols/ObjectSymbol3DLayer';
import Graphic from '@arcgis/core/Graphic';
import Basemap from '@arcgis/core/Basemap';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import Weather from "@arcgis/core/widgets/Weather.js";
import ShadowCast from '@arcgis/core/widgets/ShadowCast';
import Daylight from "@arcgis/core/widgets/Daylight.js";

import { getWeather, applyNWSWeatherToScene, type Geolocation } from './utils/weather_utils';
import { ModelService, ModelInfo } from './services/modelService';
import { executeGeoprocessingTask } from './utils/geoproc_utils';
import { getCurrentUTCTime, getCurrentLocalTimeISO, convertLocalInputToUTC, convertUTCToLocalInput } from './utils/time_utils';
import ModelSelector from './components/ModelSelector';

function App() {
  const viewRef = useRef<SceneView | null>(null);
  const sceneRef = useRef<WebScene | null>(null);
  const sketchVMRef = useRef<SketchViewModel | null>(null);
  
  // Widget refs
  const editorRef = useRef<Editor | null>(null);
  const weatherRef = useRef<Weather | null>(null);
  const shadowCastRef = useRef<ShadowCast | null>(null);
  const daylightRef = useRef<Daylight | null>(null);
  
  // Active widget state
  const [activeWidget, setActiveWidget] = useState<string>('editor');

  const [viewGeolocation, setViewGeolocation] = useState<Geolocation | null>(null);

  const widgets = [
    { id: 'editor', name: 'Editor', ref: editorRef },
    { id: 'weather', name: 'Weather', ref: weatherRef },
    { id: 'shadowcast', name: 'Shadow Cast', ref: shadowCastRef },
    { id: 'daylight', name: 'Daylight', ref: daylightRef }
  ];

  const switchWidget = (widgetId: string) => {
    if (!viewRef.current) return;
    
    try {
      // Remove all current widgets
      widgets.forEach(widget => {
        if (widget.ref?.current) {
          viewRef.current!.ui.remove(widget.ref.current);
          // Destroy widget to free memory (except the one we're switching to)
          if (widget.id !== widgetId && widget.ref.current.destroy) {
            widget.ref.current.destroy();
            widget.ref.current = null;
          }
        }
      });
      
      // Create and show selected widget
      if (widgetId !== 'none') {
        const selectedWidget = widgets.find(w => w.id === widgetId);
        if (selectedWidget) {
          // Create widget if it doesn't exist
          if (!selectedWidget.ref?.current) {
            createWidget(widgetId);
          }
          // Add to UI
          if (selectedWidget.ref?.current) {
            viewRef.current.ui.add(selectedWidget.ref.current, "top-right");
          }
        }
      }
      
      setActiveWidget(widgetId);
    } catch (error) {
      console.warn('Widget switching error:', error);
      setActiveWidget(widgetId);
    }
  };

  const createWidget = (widgetId: string) => {
    if (!viewRef.current) return;

    switch (widgetId) {
      case 'editor':
        if (!editorRef.current) {
          const editor = new Editor({
            view: viewRef.current,
            tooltipOptions: {
              enabled: true,
            },
            labelOptions: {
              enabled: true,
            }
          });
          editorRef.current = editor;
        }
        break;
      case 'weather':
        if (!weatherRef.current) {
          const weatherWidget = new Weather({ view: viewRef.current });
          weatherRef.current = weatherWidget;
        }
        break;
      case 'shadowcast':
        if (!shadowCastRef.current) {
          const shadowCastWidget = new ShadowCast({
            view: viewRef.current
          });
          shadowCastRef.current = shadowCastWidget;
        }
        break;
      case 'daylight':
        if (!daylightRef.current) {
          const daylightWidget = new Daylight({
            view: viewRef.current,
            dateOrSeason: "date"
          });
          daylightRef.current = daylightWidget;
        }
        break;
    }
  };
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

    // const recreationLayer = new FeatureLayer({
    //   title: "Recreation",
    //   url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/EditableFeatures3D/FeatureServer/1",
    //   elevationInfo: {
    //     mode: "absolute-height",
    //   },
    //   renderer: {
    //     type: "unique-value", // autocasts as new UniqueValueRenderer()
    //     field: "TYPE",
    //     visualVariables: [
    //       {
    //         // size can be modified with the interactive handle
    //         type: "size",
    //         field: "SIZE",
    //         axis: "height",
    //         valueUnit: "meters",
    //       },
    //       {
    //         // rotation can be modified with the interactive handle
    //         type: "rotation",
    //         field: "ROTATION",
    //       },
    //     ],
    //     uniqueValueInfos: [
    //       {
    //         value: "1",
    //         label: "Tree",
    //         symbol: {
    //           type: "point-3d", // autocasts as new PointSymbol3D()
    //           symbolLayers: [
    //             {
    //               type: "object",
    //               resource: {
    //                 href: "/static/maple_tree.glb",
    //               },
    //             },
    //           ],
    //           styleOrigin: {
    //             styleName: "EsriRecreationStyle",
    //             name: "Tree",
    //           },
    //         },
    //       },
    //       {
    //         value: "2",
    //         label: "Swing",
    //         symbol: {
    //           type: "point-3d", // autocasts as new PointSymbol3D()
    //           symbolLayers: [
    //             {
    //               type: "object",
    //               resource: {
    //                 href: "https://static.arcgis.com/arcgis/styleItems/Recreation/gltf/resource/Swing.glb",
    //               },
    //             },
    //           ],
    //           styleOrigin: {
    //             styleName: "EsriRecreationStyle",
    //             name: "Swing",
    //           },
    //         },
    //       },
    //     ],
    //   },
    // });
    // webScene.add(recreationLayer);

    const modelLayer = new GraphicsLayer();
    webScene.add(modelLayer);

    // Add the tile package hosted service
    const tilePackageLayer = new TileLayer({
      url: "https://tiles.arcgis.com/tiles/LLNIdHmmdjO2qQ5q/arcgis/rest/services/solardirect_extilecache/MapServer",
      opacity: 0.8
    });
    webScene.add(tilePackageLayer);
  
    sceneRef.current = webScene;

    // Create and setup the SceneView
    const view = new SceneView({
      container: "viewDiv",
      map: webScene,
      environment: {
        lighting: {
          date: getCurrentUTCTime(),
          directShadowsEnabled: true
        }
      },
      qualityProfile: "high",
    });

    // Don't create widgets here anymore - they'll be created on-demand

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
      // Create and show the default Editor widget
      createWidget('editor');
      if (editorRef.current) {
        view.ui.add(editorRef.current, "top-right");
      }

      console.log("WebScene spatial reference:", view.spatialReference);


      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          setViewGeolocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
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

  const getMapViewLocation = async () => {
    if (!viewRef.current) {
      console.warn("SceneView is not initialized.");
      return;
    }
    await viewRef.current.when();
    const center = viewRef.current.center;
    if (center) {
      setViewGeolocation({ 
        lat: center.latitude ?? 0, 
        lon: center.longitude ?? 0 
      });
    } else {
      console.warn("View center is undefined.");
    }
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
    const localDateTimeString = event.target.value;
    const utcDate = convertLocalInputToUTC(localDateTimeString);
    
    if (viewRef.current) {
      viewRef.current.environment.lighting = {
        type: "sun",
        date: utcDate,
      };

      console.log("Lighting date updated to UTC:", utcDate, "from local input:", localDateTimeString);
    }
  };

  useEffect(() => {
    if (viewRef && viewGeolocation) {
      const weatherData = getWeather(viewGeolocation);
      weatherData.then(data => {
        if (data && data.properties && data.properties.periods && data.properties.periods.length > 0) {
          const nwsPeriod = data.properties.periods[0];
          applyNWSWeatherToScene(nwsPeriod, viewRef.current!);
        } else {
          console.warn("No valid weather periods found in the response.");
        }
      }).catch(error => {
        console.error("Error fetching or applying weather data:", error);
      });
    }
  }, [viewGeolocation]);

  const runGeoprocessingTask = async () => {
    const results = await executeGeoprocessingTask({
      "Time_configuration": "Whole year",
      "Day_interval": 14,
      "Hour_interval": 2,
    });

    // if (results.url) {
    //   const gpLayer = new FeatureLayer({
    //     url: results.url,
    //     title: "Geoprocessing Result"
    //   });
    //   sceneRef.current?.add(gpLayer);
    //   console.log("FeatureLayer added from geoprocessing result:", results.url);
    // }
    console.log("Geoprocessing task executed successfully:", results);
    await results.load();
  }

  const handleSelectPremadeModel = async (modelUrl: string, height?: number) => {
    if (sceneRef.current && sketchVMRef.current) {
      sketchVMRef.current.pointSymbol = {
        type: "point-3d",
        symbolLayers: [
          {
            type: "object",
            height: height || 10, // Default height if not provided
            resource: {
              href: modelUrl,
            },
          }
        ]
      };

      sketchVMRef.current.create("point");
      console.log("Premade model selected:", modelUrl, "with height:", height);
    }
  };

  return (
    <div className="App flex flex-col h-screen">
      <div id="viewDiv" className="flex-1"></div>
      <div className="h-[300px] bg-gray-100 overflow-auto p-4">
        <div className="flex flex-col gap-4">
          
          {/* Widget Switcher */}
          <div className="mb-4 text-left">
            <button onClick={getMapViewLocation}>Update Location (for weather service)</button> <br />
            <button onClick={runGeoprocessingTask}>Test Geoprocessing Execution</button> <br />
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

          {/* Model Selector */}
          <ModelSelector onSelect={handleSelectPremadeModel} />

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
              value={getCurrentLocalTimeISO()}
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
