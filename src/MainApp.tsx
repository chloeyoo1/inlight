import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import './MainApp.css';
import logo from './img/logo192.png';

import "@esri/calcite-components";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-slider";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-segmented-control";
import "@esri/calcite-components/dist/components/calcite-segmented-control-item";
import "@esri/calcite-components/dist/components/calcite-card";
import "@esri/calcite-components/dist/components/calcite-notice";
import "@esri/calcite-components/dist/components/calcite-input";
import "@esri/calcite-components/dist/components/calcite-input-date-picker";
import "@esri/calcite-components/dist/components/calcite-label";

import esriConfig from '@arcgis/core/config';
import WebScene from '@arcgis/core/WebScene';
import SceneView from '@arcgis/core/views/SceneView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import TileLayer from '@arcgis/core/layers/TileLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
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
import { getCurrentUTCTime, getCurrentLocalTimeISO, convertLocalInputToUTC, convertUTCToLocalInput } from './utils/time_utils';
import PresetModels from './components/PresetModels';

// TypeScript declarations for Calcite components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'calcite-button': any;
      'calcite-notice': any;
      'calcite-card': any;
      'calcite-input-date-picker': any;
      'calcite-panel': any;
      'calcite-segmented-control': any;
      'calcite-segmented-control-item': any;
    }
  }
}

function MainApp() {
  const viewRef = useRef<SceneView | null>(null);
  const sceneRef = useRef<WebScene | null>(null);
  const sketchVMRef = useRef<SketchViewModel | null>(null);
  
  // Widget refs
  const sunlightPanelRef = useRef<any>(null);
  const weatherRef = useRef<Weather | null>(null);
  const shadowCastRef = useRef<ShadowCast | null>(null);
  const daylightRef = useRef<Daylight | null>(null);
  
  // Active widget state
  const [activeWidget, setActiveWidget] = useState<string>('sunlight');
  
  // Sunlight layer state
  const [activeSunlightLayer, setActiveSunlightLayer] = useState<'direct' | 'diffuse' | 'duration'>('direct');
  const directSunlightRef = useRef<FeatureLayer | null>(null);
  const diffuseSunlightRef = useRef<FeatureLayer | null>(null);
  const durationSunlightRef = useRef<FeatureLayer | null>(null);

  const [viewGeolocation, setViewGeolocation] = useState<Geolocation | null>(null);

  const widgets = [
    { id: 'sunlight', name: 'Sunlight Layers', ref: sunlightPanelRef },
    { id: 'weather', name: 'Weather', ref: weatherRef },
    { id: 'shadowcast', name: 'Shadow Cast', ref: shadowCastRef },
    { id: 'daylight', name: 'Daylight', ref: daylightRef }
  ];

  const switchWidget = (widgetId: string) => {
    if (!viewRef.current) return;
    
    try {
      // Handle sunlight layer visibility when switching away from sunlight panel
      if (activeWidget === 'sunlight' && widgetId !== 'sunlight') {
        // Hide all sunlight layers when switching away from sunlight panel
        if (directSunlightRef.current) directSunlightRef.current.visible = false;
        if (diffuseSunlightRef.current) diffuseSunlightRef.current.visible = false;
        if (durationSunlightRef.current) durationSunlightRef.current.visible = false;
      }
      
      // Remove all current widgets
      widgets.forEach(widget => {
        if (widget.ref?.current) {
          viewRef.current!.ui.remove(widget.ref.current);
          // Destroy widget to free memory (except the one we're switching to and except HTML elements)
          if (widget.id !== widgetId && widget.ref.current && 'destroy' in widget.ref.current && typeof widget.ref.current.destroy === 'function') {
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
      
      // Handle sunlight layer visibility when switching back to sunlight panel
      if (widgetId === 'sunlight') {
        // Show the previously selected sunlight layer when switching back to sunlight panel
        switchSunlightLayer(activeSunlightLayer);
      }
      
      setActiveWidget(widgetId);
    } catch (error) {
      console.warn('Widget switching error:', error);
      setActiveWidget(widgetId);
    }
  };

  const switchSunlightLayer = (layerType: 'direct' | 'diffuse' | 'duration') => {
    if (!directSunlightRef.current || !diffuseSunlightRef.current || !durationSunlightRef.current) return;
    
    // Hide all layers first
    directSunlightRef.current.visible = false;
    diffuseSunlightRef.current.visible = false;
    durationSunlightRef.current.visible = false;
    
    // Show selected layer
    switch (layerType) {
      case 'direct':
        directSunlightRef.current.visible = true;
        break;
      case 'diffuse':
        diffuseSunlightRef.current.visible = true;
        break;
      case 'duration':
        durationSunlightRef.current.visible = true;
        break;
    }
    
    setActiveSunlightLayer(layerType);
  };

  const createWidget = (widgetId: string) => {
    if (!viewRef.current) return;

    switch (widgetId) {
      case 'sunlight':
        if (!sunlightPanelRef.current) {
          const panel = document.createElement("calcite-panel");
          panel.setAttribute("heading", "Sunlight Analysis");
          panel.style.width = "320px";
          panel.style.maxHeight = "400px";
          
          panel.innerHTML = `
            <div style="padding: 16px;">
              <calcite-segmented-control id="sunlight-control" width="full" style="margin-bottom: 16px;">
                <calcite-segmented-control-item value="direct" checked>Direct</calcite-segmented-control-item>
                <calcite-segmented-control-item value="diffuse">Diffuse</calcite-segmented-control-item>
                <calcite-segmented-control-item value="duration">Duration</calcite-segmented-control-item>
              </calcite-segmented-control>
              
              <div id="layer-info" style="font-size: 13px; color: var(--calcite-color-text-2); line-height: 1.4;">
                <div id="direct-info">
                  <strong>Direct Sunlight:</strong> Areas that receive unobstructed sunlight throughout the day. These areas have the highest solar irradiance.
                </div>
                <div id="diffuse-info" style="display: none;">
                  <strong>Diffuse Sunlight:</strong> Areas that receive scattered or indirect sunlight due to obstructions like buildings, trees, or terrain. These areas have lower solar irradiance but still receive some light throughout the day.
                </div>
                <div id="duration-info" style="display: none;">
                  <strong>Duration:</strong> Shows the amount of time each location receives direct sunlight throughout the day. Darker areas indicate longer sunlight exposure duration.
                </div>
              </div>
            </div>
          `;
          
          const segmentedControl = panel.querySelector('#sunlight-control') as any;
          const directInfo = panel.querySelector('#direct-info') as HTMLElement;
          const diffuseInfo = panel.querySelector('#diffuse-info') as HTMLElement;
          const durationInfo = panel.querySelector('#duration-info') as HTMLElement;
          
          const updateInfo = (value: string) => {
            // Hide all info sections
            directInfo.style.display = 'none';
            diffuseInfo.style.display = 'none';
            durationInfo.style.display = 'none';
            
            // Show the selected info section
            switch (value) {
              case 'direct':
                directInfo.style.display = 'block';
                break;
              case 'diffuse':
                diffuseInfo.style.display = 'block';
                break;
              case 'duration':
                durationInfo.style.display = 'block';
                break;
            }
          };
          
          segmentedControl.addEventListener('calciteSegmentedControlChange', (event: any) => {
            const selectedValue = event.target.selectedItem.value;
            switchSunlightLayer(selectedValue as 'direct' | 'diffuse' | 'duration');
            updateInfo(selectedValue);
          });
          
          sunlightPanelRef.current = panel as any;
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
  const [datetimeValue, setDatetimeValue] = useState(getCurrentLocalTimeISO());

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

    // Add the sunlight analysis layers
    const directSunlight = new FeatureLayer({
      url: "https://services8.arcgis.com/LLNIdHmmdjO2qQ5q/arcgis/rest/services/direct_polygon_2/FeatureServer",
      opacity: 0.8,
      title: "Direct Sunlight",
      visible: true // Start with direct sunlight visible (since sunlight panel is default active)
    });
    webScene.add(directSunlight);
    directSunlightRef.current = directSunlight;

    const diffuseSunlight = new FeatureLayer({
      url: "https://services8.arcgis.com/LLNIdHmmdjO2qQ5q/arcgis/rest/services/diffuse_polygon/FeatureServer",
      opacity: 0.8,
      title: "Diffuse Sunlight",
      visible: false // Start with diffuse sunlight hidden
    });
    webScene.add(diffuseSunlight);
    diffuseSunlightRef.current = diffuseSunlight;

    const durationSunlight = new FeatureLayer({
      url: "https://services8.arcgis.com/LLNIdHmmdjO2qQ5q/arcgis/rest/services/duration_polygon/FeatureServer",
      opacity: 0.8,
      title: "Sunlight Duration",
      visible: false // Start with duration sunlight hidden
    });
    webScene.add(durationSunlight);
    durationSunlightRef.current = durationSunlight;
  
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

    const graphicsLayer = new GraphicsLayer({
      elevationInfo: { mode: "relative-to-ground" },
      title: "Custom Models"
    });
    view.map?.add(graphicsLayer);

    const sketchVM = new SketchViewModel({
      layer: graphicsLayer,
      view: view,
    });

    sketchVMRef.current = sketchVM;

    viewRef.current = view;

    view.when(() => {
      // Create and show the default Sunlight panel
      createWidget('sunlight');
      if (sunlightPanelRef.current) {
        view.ui.add(sunlightPanelRef.current, "top-right");
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

  useEffect(() => {
    console.log("Datetime input changed:", datetimeValue);
    const utcDate = convertLocalInputToUTC(datetimeValue);
    
    if (viewRef.current) {
      viewRef.current.environment.lighting = {
        type: "sun",
        date: utcDate,
      };

      console.log("Lighting date updated to UTC:", utcDate, "from local input:", utcDate.toISOString());
    }
  }, [datetimeValue]);

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
    <div className="main-app">
      {/* Header Bar */}
      <header className="main-header">
        <div className="logo-section">
          <div className="logo-icon">
            <img src={logo} alt="Inlight Logo" className="logo-image" />
          </div>
          <span className="logo-text">Inlight</span>
        </div>
        
        <div className="header-cta">
          <calcite-button
            onClick={handleImportModel}
            disabled={isUploading}
            appearance="solid"
            kind="brand"
            scale="m"
          >
            <svg slot="icon-start" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isUploading ? 'Uploading...' : 'Import Model'}
          </calcite-button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        <div className="bg-white border-r border-gray-200 flex-shrink-0 shadow-sm flex flex-col" style={{ width: '320px' }}>
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 m-0">Controls</h2>
          </div>
          <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
            
            {/* Widget Switcher */}
            <div className="space-y-3">
              <div>
                <calcite-button onClick={getMapViewLocation} width="full" appearance="outline">
                  Update Location
                </calcite-button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {widgets.map(widget => (
                  <calcite-button
                    key={widget.id}
                    onClick={() => switchWidget(widget.id)}
                    appearance={activeWidget === widget.id ? 'solid' : 'outline'}
                    scale="s"
                  >
                    {widget.name}
                  </calcite-button>
                ))}
              </div>

              <calcite-input-date-picker
                value={datetimeValue}
                onCalciteInputDatePickerChange={(e: any) => setDatetimeValue(e.target.value)}
                scale="s"
              />
            </div>

            {/* Model Selector */}
            <PresetModels onSelect={handleSelectPremadeModel} />

            {/* Models List */}
            <div className="flex-1">
              <h3 className="text-base font-semibold mb-3 m-0">
                Your Models ({models.length})
              </h3>

              {/* Error Display */}
              {uploadError && (
                <calcite-notice open kind="danger">
                  <div slot="title">Upload Error</div>
                  <div slot="message">{uploadError}</div>
                </calcite-notice>
              )}

              {models.length === 0 ? (
                <calcite-notice open kind="info">
                  <div slot="title">No Models Yet</div>
                  <div slot="message">Upload a model to get started.</div>
                </calcite-notice>
              ) : (
                <div className="flex flex-col gap-3">
                  {models.map((model) => (
                    <calcite-card key={model.filename}>
                      <div slot="title" className="text-sm font-medium truncate" title={model.originalName}>
                        {model.originalName}
                      </div>
                      <div slot="subtitle" className="text-xs text-gray-500">
                        {(model.size / 1024 / 1024).toFixed(2)} MB • {new Date(model.uploadedAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <calcite-button
                          onClick={() => handleSelectModel(model)}
                          appearance="solid"
                          scale="s"
                          width="half"
                        >
                          Use
                        </calcite-button>
                        <calcite-button
                          onClick={() => handleDeleteModel(model.filename)}
                          appearance="outline"
                          kind="danger"
                          scale="s"
                          width="half"
                        >
                          Delete
                        </calcite-button>
                      </div>
                    </calcite-card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div id="viewDiv" className="flex-1 h-full"></div>
      </div>
    </div>
  );
}

export default MainApp;