// Centro y zoom
const SM_CENTER = [11.2408, -74.1990];
const START_ZOOM = 14; // zoom alto por defecto

// Tus escenarios
const escenarios = [
  { name:'Estadio de Fútbol La Castellana', type:'Campo de fútbol', coords:[11.22955,-74.19985], img:'img/castellana.jpg' },
  { name:'Estadio Sierra Nevada', type:'Campo de fútbol', coords:[11.2479,-74.1815], img:'img/sierra_nevada.jpg' },
  { name:'Coliseo Menor', type:'Complejo de voleibol', coords:[11.2385,-74.2110], img:'img/coliseo_menor.jpg' },
];

// Icono etiqueta
function labelIcon(texto){
  return L.divIcon({
    className: 'label-pin-wrap',
    html: `<div class="label-pin">${texto}</div>`,
    iconSize: [0,0], iconAnchor: [0,28]
  });
}

// Mapa
const map = L.map('map', { zoomControl: true }).setView(SM_CENTER, START_ZOOM);

// Basemap oscuro
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map);



// Marcadores + popup tipo tarjeta
const bounds = [];
escenarios.forEach(e => {
  const marker = L.marker(e.coords, { icon: labelIcon(e.name) }).addTo(map);
  const html = `
    <div class="place-card">
      <img class="thumb" src="${e.img}" alt="${e.name}">
      <div class="body">
        <h4 class="title">${e.name}</h4>
        <p class="meta">${e.type}</p>
      </div>
    </div>
  `;
  marker.bindPopup(html);
  bounds.push(e.coords);
});

// Ajusta la vista para abarcar todos (sin pasarse del zoom inicial)
if (bounds.length) {
  map.fitBounds(bounds, { padding: [40,40], maxZoom: START_ZOOM });
}

// Fuerza que todas las interacciones queden activas
map.dragging.enable();
map.scrollWheelZoom.enable();
map.touchZoom.enable();
map.doubleClickZoom.enable();
map.boxZoom.enable();
map.keyboard.enable();

// Si el contenedor usó animaciones/transform al montar el mapa:
setTimeout(() => { map.invalidateSize(); }, 0);


