// ModelSelector.tsx
import React from "react";

import "@esri/calcite-components/dist/components/calcite-card";
import "@esri/calcite-components/dist/components/calcite-button";

interface PresetModelProps {
  onSelect: (url: string, height?: number) => void;
}

const modelOptions = [
  { 
    name: "Tree", 
    url: "/static/tree.glb",
    height: 5 // meters
  },
  {
    name: "Pine Tree",
    url: "/static/pine_tree.glb",
    height: 7
  },
  {
    name: "Wall",
    url: "/static/wall.glb",
    height: 3
  },
];

export const PresetModels: React.FC<PresetModelProps> = ({ onSelect }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
        Preset Models ({modelOptions.length})
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {modelOptions.map((model) => (
          <calcite-card key={model.url}>
            <div slot="title" style={{ fontSize: '14px', fontWeight: '500' }}>
              {model.name}
            </div>
            <div slot="subtitle" style={{ fontSize: '12px', color: 'var(--calcite-color-text-3)' }}>
              Height: {model.height}m
            </div>
            <div style={{ marginTop: '12px' }}>
              <calcite-button
                onClick={() => onSelect(model.url, model.height)}
                appearance="solid"
                scale="s"
                width="full"
              >
                Use Model
              </calcite-button>
            </div>
          </calcite-card>
        ))}
      </div>
    </div>
  );
};
export default PresetModels;