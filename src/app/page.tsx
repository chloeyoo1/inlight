"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ArcGISConfig from "../components/ArcGISConfig";

// Dynamically import the 3D Model Analyzer component to avoid SSR issues
const ModelAnalyzer = dynamic(() => import("../components/ModelAnalyzer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Loading 3D Model Analyzer...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                3D Model Geographic Analyzer
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Upload 3D models and analyze their geographic positioning and wall orientations
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ArcGISConfig />
        <ModelAnalyzer />
      </main>
    </div>
  );
}
