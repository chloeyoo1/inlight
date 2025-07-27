// ModelSelector.tsx
import React from "react";

interface ModelSelectorProps {
  onSelect: (url: string, height?: number) => void;
}

const modelOptions = [
  { 
    name: "Tree", 
    url: "/static/maple_tree.glb",
    height: 5 // meters
  },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({ onSelect }) => {
  return (
    <div>
      {modelOptions.map((model) => (
        <calcite-button
          key={model.url}
          onClick={() => onSelect(model.url, model.height)}
          style={{ display: "block", marginBottom: "8px" }}
        >
          {model.name}
        </calcite-button>
      ))}
    </div>
  );
};
export default ModelSelector;