"use client";

import { useEffect } from "react";
import config from "@arcgis/core/config";

export default function ArcGISConfig() {
  useEffect(() => {
    // Configure ArcGIS Maps SDK
    config.assetsPath = "/arcgis-assets";
    
    // Set API key if available (optional)
    // config.apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;
    
    // Configure request settings
    config.request.useIdentity = false;
    
    // Configure worker settings
    config.workers.loaderConfig = {
      has: {
        "esri-workers-for-memory": 0,
      },
    };
  }, []);

  return null; // This component doesn't render anything
} 