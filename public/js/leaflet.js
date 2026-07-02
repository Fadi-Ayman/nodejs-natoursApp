import L from 'leaflet';

export const displayMap = (locations) => {
  const mapElement = document.getElementById('map');

  if (!mapElement) return;

  const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  const bounds = [];

  locations.forEach((location) => {
    const [lng, lat] = location.coordinates;

    bounds.push([lat, lng]);

    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(
        `<p>Day ${location.day}: ${location.description}</p>`
      );
  });

  map.fitBounds(bounds, {
    padding: [50, 50],
  });

  map.setMinZoom(map.getZoom());
  map.setMaxZoom(map.getZoom());
};
