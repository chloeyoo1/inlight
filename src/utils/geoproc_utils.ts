import * as geoprocessor from "@arcgis/core/rest/geoprocessor.js";
import JobInfo from "@arcgis/core/rest/support/JobInfo.js";

const url = "https://lsangarya.esri.com/server/rest/services/ModelXYZ/GPServer/Model";
// const url = 

export async function executeGeoprocessingTask(params: any): Promise<any> {
  const jobInfo: JobInfo = await geoprocessor.submitJob(url, params);
  await jobInfo.waitForJobCompletion();
  console.log("Job status:", jobInfo.jobStatus);
  console.log("Job:", jobInfo);
  if (jobInfo.jobStatus === "job-succeeded") {
    const result = await jobInfo.toJSON();
    if (result) {
      return result;
    }
  } else {
    throw new Error(`Job failed with status: ${jobInfo.jobStatus}`);
  }
}
