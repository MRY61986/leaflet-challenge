// Create the 'basemap' tile layer that will be the default background of our map.
let basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Add a 'satellite' tile layer.
let satellite = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_ACCESS_TOKEN', {
  attribution: 'Map data © <a href="https://www.mapbox.com/">Mapbox</a>',
  tileSize: 512,
  zoomOffset: -1
});

// Add a 'grayscale' tile layer.
let grayscale = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
});


// Create the map object with center and zoom options.
let map = L.map("map", {
  center: [37.09, -95.71], // Centered over the United States
  zoom: 5,
  layers: [basemap] // Default layer is basemap
});

// Create the layer groups for earthquakes and tectonic plates.
let tectonic_plates = new L.LayerGroup();
let earthquakes = new L.LayerGroup();

// Create baseMaps and overlayMaps for layer control.
let baseMaps = {
  "Satellite": satellite,
  "Grayscale": grayscale,
  "Outdoors": basemap
};

let overlayMaps = {
  "Earthquakes": earthquakes,
  "Tectonic Plates": tectonic_plates
};

// Add layer control to the map.
L.control.layers(baseMaps, overlayMaps, {
  collapsed: false
}).addTo(map);

// Load the earthquake GeoJSON data.
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {
  // Style information for earthquakes.
  function styleInfo(feature) {
    return {
      opacity: 1,
      fillOpacity: 1,
      fillColor: getColor(feature.geometry.coordinates[2]), // Depth-based color
      color: "#000000",
      radius: getRadius(feature.properties.mag), // Magnitude-based size
      stroke: true,
      weight: 0.5
    };
  }

  // Function to determine marker color based on depth.
  function getColor(depth) {
    if (depth > 90) return "#ea2c2c";
    if (depth > 70) return "#ea822c";
    if (depth > 50) return "#ee9c00";
    if (depth > 30) return "#eecc00";
    if (depth > 10) return "#d4ee00";
    return "#98ee00";
  }

  // Function to determine marker size based on magnitude.
  function getRadius(magnitude) {
    return magnitude === 0 ? 1 : magnitude * 4;
  }

  // Add a GeoJSON layer to the map.
  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng);
    },
    style: styleInfo,
    onEachFeature: function (feature, layer) {
      layer.bindPopup(`
        <strong>Magnitude:</strong> ${feature.properties.mag}<br>
        <strong>Location:</strong> ${feature.properties.place}<br>
        <strong>Depth:</strong> ${feature.geometry.coordinates[2]} km
      `);
    }
  }).addTo(earthquakes);

  // Add earthquakes layer to map.
  earthquakes.addTo(map);

  // Add a legend to the map.
  let legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

    // Depth intervals and corresponding colors for the legend.
    const depthIntervals = [-10, 10, 30, 50, 70, 90];
    const colors = [
      "#98ee00",
      "#d4ee00",
      "#eecc00",
      "#ee9c00",
      "#ea822c",
      "#ea2c2c"
    ];

    // Generate legend items.
    for (let i = 0; i < depthIntervals.length; i++) {
      div.innerHTML += `
        <i style="background: ${colors[i]}"></i>
        ${depthIntervals[i]}${depthIntervals[i + 1] ? "&ndash;" + depthIntervals[i + 1] + "<br>" : "+"}
      `;
    }

    return div;
  };

  legend.addTo(map);

  // Load the tectonic plates GeoJSON data.
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plate_data) {
    L.geoJson(plate_data, {
      color: "orange",
      weight: 2
    }).addTo(tectonic_plates);

    // Add tectonic plates layer to map.
    tectonic_plates.addTo(map);
  });
});
