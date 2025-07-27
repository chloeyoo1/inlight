// ModelSelector.tsx
import React from "react";

interface PresetModelProps {
  onSelect: (url: string, height?: number) => void;
}

const modelOptions = [
  { 
    name: "Tree", 
    url: "/static/maple_tree.glb",
    height: 5 // meters
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
      <h3 className="font-semibold mb-2">Preset Models ({modelOptions.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {modelOptions.map((model) => (
          <div 
            key={model.url} 
            className="border rounded p-2 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" title={model.name}>
                  {model.name}
                </p>
              </div>
              <div className="ml-2">
                <button
                  onClick={() => onSelect(model.url, model.height)}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default PresetModels;