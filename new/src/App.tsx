import React, { useEffect, useRef } from 'react';
import './App.css';

import esriConfig from '@arcgis/core/config';
import WebScene from '@arcgis/core/WebScene';
import SceneView from '@arcgis/core/views/SceneView';
import Editor from '@arcgis/core/widgets/Editor';

function App() {
  const viewRef = useRef<SceneView | null>(null);
  const sceneRef = useRef<WebScene | null>(null);

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
            zoom: 50,
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

  return (
    <div className="App flex flex-col h-screen">
      <div id="viewDiv" className="flex-1"></div>
      <div className="h-[200px] bg-gray-100 overflow-auto">
      {/* Place for UI stuff */}
      </div>
    </div>
  );
}

export default App;
