"use client";

import { useEffect, useRef } from "react";
import Map from "@arcgis/core/Map.js";
import SceneView from "@arcgis/core/views/SceneView.js";

export default function Home() {
  const mapDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapDiv.current) {
      const map = new Map({
        basemap: "satellite", 
        ground: "world-elevation" 
      });

      const view = new SceneView({
        container: mapDiv.current,
        map: map,
        camera: {
          position: {
            x: -118.80543, 
            y: 34.02700,   
            z: 1000        
          },
          tilt: 75
        }
      });

      return () => {
        if (view) {
          view.destroy();
        }
      };
    }
  }, []);

  return (
    <main className="h-screen w-screen">
      <div 
        className="h-full w-full" 
        ref={mapDiv}
      />
    </main>
  );
}