import SceneView from '@arcgis/core/views/SceneView';

export type Geolocation = { lat: number; lon: number };

export const getWeather = async (geolocation: Geolocation) => {
  const weatherUrl = `https://api.weather.gov/points/${geolocation.lat},${geolocation.lon}`;
  try {
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Weather data:", data);
    if (data.properties && data.properties.forecast) {
      const forecastUrl = data.properties.forecast;
      try {
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) {
          throw new Error(`Forecast HTTP error! status: ${forecastResponse.status}`);
        }
        const forecastData = await forecastResponse.json();
        console.log("Forecast data:", forecastData);
        return forecastData;
      } catch (forecastError) {
        console.error("Error fetching forecast data:", forecastError);
      }
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
};

export function applyNWSWeatherToScene(nwsPeriod: any, view: SceneView) {
  if (!view || !nwsPeriod) return;

  const forecast = nwsPeriod.shortForecast?.toLowerCase() || "";

  let weatherType: "sunny" | "cloudy" | "rainy" | "snowy" = "sunny";
  let cloudCover = 0.1;
  let precipitationIntensity = 0;

  if (forecast.includes("rain") || forecast.includes("showers") || forecast.includes("thunderstorm")) {
    weatherType = "rainy";
    precipitationIntensity = 0.7;
    cloudCover = 0.7;
  } else if (forecast.includes("snow") || forecast.includes("flurries") || forecast.includes("sleet")) {
    weatherType = "snowy";
    precipitationIntensity = 0.7;
    cloudCover = 0.9;
  } else if (forecast.includes("cloudy") || forecast.includes("overcast")) {
    weatherType = "cloudy";
    cloudCover = 0.6;
  } else if (forecast.includes("clear") || forecast.includes("sunny")) {
    weatherType = "sunny";
    cloudCover = 0.1;
  }

  if (weatherType === "rainy") {
    view.environment.weather = {
      type: "rainy",
      cloudCover,
      precipitation: precipitationIntensity
    };
  } else if (weatherType === "snowy") {
    view.environment.weather = {
      type: "snowy",
      cloudCover,
      precipitation: precipitationIntensity
    };
  } else if (weatherType === "cloudy") {
    view.environment.weather = {
      type: "cloudy",
      cloudCover
    };
  } else {
    view.environment.weather = {
      type: "sunny",
      cloudCover
    };
  }

  console.log("Applied weather to scene:", { weatherType, cloudCover, precipitationIntensity });
  view.environment.lighting = {
    type: "sun",
    date: new Date(nwsPeriod.startTime || Date.now()),
  };
}