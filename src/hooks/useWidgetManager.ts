import { useRef, useState } from 'react';
import Editor from '@arcgis/core/widgets/Editor';
import Weather from "@arcgis/core/widgets/Weather.js";
import ShadowCast from '@arcgis/core/widgets/ShadowCast';
import Daylight from "@arcgis/core/widgets/Daylight.js";
import SceneView from '@arcgis/core/views/SceneView';

export const useWidgetManager = (view: SceneView | null) => {
  const [activeWidget, setActiveWidget] = useState<string>('none');
  
  // Widget refs
  const editorRef = useRef<Editor | null>(null);
  const weatherRef = useRef<Weather | null>(null);
  const shadowCastRef = useRef<ShadowCast | null>(null);
  const daylightRef = useRef<Daylight | null>(null);

  const widgets = [
    { id: 'none', name: 'None', ref: null },
    { id: 'editor', name: 'Editor', ref: editorRef },
    { id: 'weather', name: 'Weather', ref: weatherRef },
    { id: 'shadowcast', name: 'Shadow Cast', ref: shadowCastRef },
    { id: 'daylight', name: 'Daylight', ref: daylightRef }
  ];

  const switchWidget = (widgetId: string) => {
    if (!view) return;
    
    try {
      // Hide all widgets first
      widgets.forEach(widget => {
        if (widget.ref?.current) {
          view.ui.remove(widget.ref.current);
        }
      });
      
      // Show selected widget
      if (widgetId !== 'none') {
        const selectedWidget = widgets.find(w => w.id === widgetId);
        if (selectedWidget?.ref?.current) {
          view.ui.add(selectedWidget.ref.current, "top-right");
        }
      }
      
      setActiveWidget(widgetId);
    } catch (error) {
      console.warn('Widget switching error:', error);
      setActiveWidget(widgetId);
    }
  };

  return {
    activeWidget,
    widgets,
    switchWidget,
    editorRef,
    weatherRef,
    shadowCastRef,
    daylightRef
  };
}; 