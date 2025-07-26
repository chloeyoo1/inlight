import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const arcgisPath = join(process.cwd(), "node_modules", "@arcgis", "core", "assets", path);
    
    if (!existsSync(arcgisPath)) {
      return new NextResponse("Asset not found", { status: 404 });
    }
    
    const fileBuffer = readFileSync(arcgisPath);
    
    // Determine content type based on file extension
    const ext = path.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    
    switch (ext) {
      case "js":
        contentType = "application/javascript";
        break;
      case "css":
        contentType = "text/css";
        break;
      case "json":
        contentType = "application/json";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "svg":
        contentType = "image/svg+xml";
        break;
      case "woff":
        contentType = "font/woff";
        break;
      case "woff2":
        contentType = "font/woff2";
        break;
      case "ttf":
        contentType = "font/ttf";
        break;
      case "wasm":
        contentType = "application/wasm";
        break;
      case "glb":
        contentType = "model/gltf-binary";
        break;
      case "gltf":
        contentType = "model/gltf+json";
        break;
      case "fbx":
        contentType = "application/octet-stream";
        break;
      case "usdz":
        contentType = "model/vnd.usdz+zip";
        break;
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error serving ArcGIS asset:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 