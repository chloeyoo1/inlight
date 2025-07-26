import React, { useEffect, useRef } from 'react';
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

function App() {
  const viewRef = useRef<SceneView | null>(null);
  const sceneRef = useRef<WebScene | null>(null);
  const sketchVMRef = useRef<SketchViewModel | null>(null);

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
        console.error("Invalid file type. Please upload a .glb or .gltf file.");
        return;
      }

      const fileBlob = new Blob([file], { type: file.type });
      const objectUrl = URL.createObjectURL(fileBlob);
      console.log("objectUrl", objectUrl);

      if (sceneRef.current && sketchVMRef.current) {
        sketchVMRef.current.pointSymbol = {
          type: "point-3d",
          symbolLayers: [
            {
              type: "object",
              resource: {
                href: objectUrl,
              },
            }
          ]
        };

        sketchVMRef.current.create("point");
        console.log("Custom model added to the scene.");
      } else {
        console.error("Scene is not initialized.");
      }
    };

    fileInput.click();
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
      <div className="h-[200px] bg-gray-100 overflow-auto">
        <calcite-button onClick={handleImportModel}>Import Your Model</calcite-button>
        <input type="datetime-local" onChange={handleDatetimeChange} />
      </div>
    </div>
  );
}

export default App;
