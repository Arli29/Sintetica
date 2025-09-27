// Chips de filtro (ahora filtra carrusel Y grilla)
const chips = document.querySelectorAll('.chip');
const carrusel = document.getElementById('carousel');
const gridEl = document.getElementById('sitios-deportivos');
const btnMore = document.getElementById('btnLoadMore');

// Utilidad: normaliza categorías (fútbol -> futbol, etc.)
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '');

// === DATA (la que ya tenías) ===
const ESCENARIOS = [
  { id: 1,  nombre: "Estadio Sierra Nevada", tipo: "Campo de futbol", deporte: ["Fútbol"], img: "img/sierra_nevada.png", alt: "Imagen del Estadio Sierra Nevada en Santa Marta" },
  { id: 4,  nombre: "Coliseo Menor", tipo: "Complejo de voleibol", deporte: ["Voleibol","Gimnasia","Boxeo","Lucha"], img: "img/coliseo_menor.png", alt: "Imagen del Coliseo Menor" },
  { id: 5,  nombre: "Piscina Olímpica", tipo: "Natación", deporte: ["Natación","Clavados","Polo Acuático"], img: "img/piscina_olimpica.png", alt: "Imagen de la Piscina Olímpica" },
  { id: 41, nombre: "Cancha de futbol Curinca", tipo: "Campo de futbol", deporte: ["Fútbol"], img: "img/curinca.png", alt: "Imagen de la Cancha de futbol Curinca" },
  // … (deja el resto tal cual como los tenías)
];

// === FILTRO (afecta carrusel y grilla) ===
function applyFilter(cat) {
  // Carrusel
  carrusel.querySelectorAll('.slide').forEach((s) => {
    const ok = cat === 'todos' || s.dataset.cat === cat;
    s.style.display = ok ? '' : 'none';
  });
  // Grilla
  gridEl.querySelectorAll('.card').forEach((c) => {
    const ok = cat === 'todos' || c.dataset.cat?.split(' ').includes(cat);
    c.style.display = ok ? '' : 'none';
  });
}

chips.forEach((ch) =>
  ch.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    ch.classList.add('active');
    applyFilter(ch.dataset.cat);
  })
);

// === CARRUSEL DINÁMICO ===
function renderCarrusel() {
  const html = ESCENARIOS.map((e) => {
    const firstCat = Array.isArray(e.deporte) ? norm(e.deporte[0]) : norm(e.deporte);
    return `
      <article class="slide" data-cat="${firstCat}">
        <img src="${e.img}" alt="${e.alt || e.nombre}">
        <h3>${e.nombre}</h3>
        <p class="card-sub">${e.tipo}</p>
      </article>`;
  }).join('');
  carrusel.innerHTML = html;
}

// === TEMPLATE DE CARD PARA LA GRILLA ===
const tplCard = (e) => {
  const cats = Array.isArray(e.deporte) ? e.deporte.map(norm).join(' ') : norm(e.deporte);
  return `
    <article class="card" data-cat="${cats}">
      <img src="${e.img}" alt="${e.alt || e.nombre || ''}">
      <div class="card-body">
        <h3>${e.nombre || ''}</h3>
        <p class="card-sub">${e.tipo || ''}</p>
        <button class="btn-cta btn-reserva">Mirar disponibilidad</button>
      </div>
    </article>
  `;
};

// === “Cargar más” por tandas (ej. 8 en 8) ===
let loadedCount = 0;
const BATCH = 8;

// Render inicial: respeta las 4 cards estáticas que ya hay en el HTML
function appendNextBatch() {
  const slice = ESCENARIOS.slice(loadedCount, loadedCount + BATCH);
  if (!slice.length) {
    btnMore.disabled = true;
    btnMore.textContent = 'No hay más';
    return;
  }
  const html = slice.map(tplCard).join('');
  gridEl.insertAdjacentHTML('beforeend', html);
  loadedCount += slice.length;

  // Si ya alcanzamos el total, deshabilita
  if (loadedCount >= ESCENARIOS.length) {
    btnMore.disabled = true;
    btnMore.textContent = 'No hay más';
  }
}

// Click en “Cargar más”
if (btnMore) {
  btnMore.addEventListener('click', appendNextBatch);
}

// Delegación: cualquier botón “Mirar disponibilidad” abre reserva
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-reserva');
  if (btn) window.location.href = 'reserva.html';
});

// (Opcional) mini-carrusel en “Próximas reservas”
const card = document.getElementById('reservaCard');
if (card) {
  const reservas = [
    { title: 'Cancha de fútbol la castellana', img: 'img/campo_castellana.png', sub: 'Campo de fútbol', fecha: '22/09/2025', hora: '20:00', tipo: 'Gratuita' },
    { title: 'Estadio Sierra Nevada',           img: 'img/sierra_nevada.png',   sub: 'Campo de fútbol', fecha: '24/09/2025', hora: '19:00', tipo: 'Paga' }
  ];
  let i = 0;
  const img = card.querySelector('.reserva-thumb');
  const title = card.querySelector('.reserva-title');
  const sub = card.querySelector('.reserva-sub');
  const metas = card.querySelectorAll('.reserva-meta');
  const prev = card.querySelector('.prev');
  const next = card.querySelector('.next');

  const render = () => {
    const r = reservas[i];
    img.src = r.img; title.textContent = r.title; sub.textContent = r.sub;
    metas[0].textContent = `Fecha: ${r.fecha}`;
    metas[1].textContent = `Hora: ${r.hora}`;
    metas[2].textContent = `Tipo de reserva: ${r.tipo}`;
  };
  render();
  prev.addEventListener('click', () => { i = (i - 1 + reservas.length) % reservas.length; render(); });
  next.addEventListener('click', () => { i = (i + 1) % reservas.length; render(); });
}

// Estado inicial
renderCarrusel();
// Aplica el filtro “todos”
applyFilter('todos');
