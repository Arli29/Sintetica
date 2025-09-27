// ====== Calendario simple ======
const calMonthEl = document.getElementById('calMonth');
const calDaysEl  = document.getElementById('calDays');
const prevBtn    = document.querySelector('.cal-nav.prev');
const nextBtn    = document.querySelector('.cal-nav.next');

let current = new Date(); // hoy

// Días disponibles de ejemplo (ajusta por mes/año)
const availability = {
  // 'YYYY-MM': [dias...]
  '2025-09': [18, 21, 25],
};

let selectedDate = null;

function pad(n){ return String(n).padStart(2,'0'); }

function monthLabel(d){
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function buildCalendar(baseDate){
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();

  calMonthEl.textContent = monthLabel(baseDate);
  calDaysEl.innerHTML = '';

  // primer día del mes y cuántos días tiene el mes
  const first = new Date(y, m, 1);
  const last  = new Date(y, m+1, 0);
  const firstWeekday = (first.getDay()+6) % 7; // 0=Lu ... 6=Do

  // mes anterior (para “muted”)
  const prevLast = new Date(y, m, 0).getDate();

  // huecos del mes anterior
  for(let i=firstWeekday-1; i>=0; i--){
    const div = document.createElement('div');
    div.className = 'cal-day muted';
    div.textContent = (prevLast - i);
    calDaysEl.appendChild(div);
  }

  // días del mes actual
  const key = `${y}-${pad(m+1)}`;
  const avail = availability[key] || [];

  for(let d=1; d<=last.getDate(); d++){
    const div = document.createElement('div');
    div.className = 'cal-day';
    if (avail.includes(d)) div.classList.add('available');
    div.textContent = d;

    div.addEventListener('click', ()=>{
      // deseleccionar anterior
      calDaysEl.querySelectorAll('.cal-day.selected').forEach(el=>el.classList.remove('selected'));
      div.classList.add('selected');
      selectedDate = new Date(y, m, d);
      // aquí puedes disparar una actualización de horarios según fecha seleccionada
      // console.log('Fecha seleccionada:', selectedDate.toISOString().slice(0,10));
    });

    calDaysEl.appendChild(div);
  }

  // huecos del siguiente mes
  const totalCells = firstWeekday + last.getDate();
  const nextFill = (7 - (totalCells % 7)) % 7;
  for(let i=1; i<=nextFill; i++){
    const div = document.createElement('div');
    div.className = 'cal-day muted';
    div.textContent = i;
    calDaysEl.appendChild(div);
  }
}

prevBtn.addEventListener('click', ()=>{
  current = new Date(current.getFullYear(), current.getMonth()-1, 1);
  buildCalendar(current);
});
nextBtn.addEventListener('click', ()=>{
  current = new Date(current.getFullYear(), current.getMonth()+1, 1);
  buildCalendar(current);
});

buildCalendar(current);

// ====== Relleno de selects de hora ======
function fillTimeSelects(hSel, mSel, apSel){
  // Horas 1..12
  for(let h=1; h<=12; h++){
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h;
    hSel.appendChild(opt);
  }
  // Minutos 00, 15, 30, 45
  [0,15,30,45].forEach(v=>{
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = String(v).padStart(2,'0');
    mSel.appendChild(opt);
  });
  // AM/PM
  ['AM','PM'].forEach(v=>{
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    apSel.appendChild(opt);
  });
}

fillTimeSelects(
  document.getElementById('fromHour'),
  document.getElementById('fromMin'),
  document.getElementById('fromAmPm')
);
fillTimeSelects(
  document.getElementById('toHour'),
  document.getElementById('toMin'),
  document.getElementById('toAmPm')
);

// Preselección simple
document.getElementById('fromHour').value = 2;
document.getElementById('fromMin').value = 30;
document.getElementById('fromAmPm').value = 'PM';
document.getElementById('toHour').value   = 3;
document.getElementById('toMin').value    = 30;
document.getElementById('toAmPm').value   = 'PM';

// ====== Submit demo ======
document.getElementById('reservaForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const fecha = selectedDate ? selectedDate.toISOString().slice(0,10) : '(sin seleccionar)';
  alert(`Reserva solicitada para el ${fecha}. (Aquí iría tu POST al servidor)`);
});
