declare module "@arcgis/core" {
  export class Map {
    constructor(options?: any);
    add(layer: any): void;
  }

  export class SceneView {
    constructor(options: any);
    destroy(): void;
    on(event: string, handler: (event: any) => void): void;
  }

  export class Point {
    constructor(options: any);
    x: number;
    y: number;
    z?: number;
    spatialReference?: any;
  }

  export class Mesh {
    static createFromGLTF(point: Point, url: string, options?: any): Promise<Mesh>;
    load(): Promise<void>;
    vertexAttributes: any;
    components: any;
  }

  export class GraphicsLayer {
    constructor();
    add(graphic: Graphic): void;
  }

  export class Graphic {
    constructor(options: any);
    geometry: any;
  }

  export class SpatialReference {
    static WGS84: any;
  }

  export class SketchViewModel {
    constructor(options: any);
    create(type: string): void;
    on(event: string, handler: (event: any) => void): void;
  }

  export const meshUtils: {
    convertVertexSpace(mesh: Mesh, vertexSpace: any): Promise<Mesh>;
  };

  export class MeshGeoreferencedVertexSpace {
    static instance: any;
  }

  export const config: {
    assetsPath: string;
    apiKey?: string;
    request: {
      useIdentity: boolean;
    };
    workers: {
      loaderConfig: any;
    };
  };
}

declare module "@arcgis/core/assets/esri/themes/light/main.css" {
  const content: string;
  export default content;
} 