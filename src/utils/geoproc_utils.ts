import * as geoprocessor from "@arcgis/core/rest/geoprocessor.js";

// const url = "https://lsangarya.esri.com/server/rest/services/model3folder/Model3/GPServer/Model3";
const url = "https://lsangarya.esri.com/server/rest/services/Model2/GPServer/SunModel2"

export async function executeGeoprocessingTask(): Promise<any> {
  try {
    const response = await geoprocessor.submitJob(url, {});
    
    if (response) {
      return response;
    } else {
      throw new Error("No results returned from the geoprocessing task.");
    }
  } catch (error) {
    console.error("Error executing geoprocessing task:", error);
    throw error;
  }
}
