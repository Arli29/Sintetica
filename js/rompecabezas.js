(() => {
  // ========= PARÁMETROS =========
  const params = new URLSearchParams(location.search);
  const IMG_FROM_QS  = params.get("img");
  const SIZE_FROM_QS = parseInt(params.get("size") || "4", 10);

  const ALT_IMAGES = [
    "img/curinca.png",
    "img/sierra_nevada.png",
    "img/piscina_olimpica.png",
    "img/coliseo_menor.png",
  ];
  const IMG_SRC = IMG_FROM_QS || ALT_IMAGES[Math.floor(Math.random()*ALT_IMAGES.length)];

  // Límite duro por tamaño (segundos)
  const TIME_LIMIT = { 3: 120, 4: 210, 5: 360 };

  // Metas para medallas (se evalúan con el tiempo empleado)
  const TIME_GOALS = {
    3: { oro: 60,  plata: 90,  bronce: 120 },
    4: { oro: 120, plata: 180, bronce: 240 },
    5: { oro: 240, plata: 300, bronce: 360 }
  };

  // Descuento escala con el tamaño
  const DISCOUNT_BY_SIZE = {
    3: { oro: 8,  plata: 5,  bronce: 3 },
    4: { oro: 12, plata: 8,  bronce: 5 },
    5: { oro: 18, plata: 12, bronce: 8 }
  };

  // ========= UI =========
  const boardEl     = document.getElementById("board");
  const sizeSel     = document.getElementById("size");
  const btnShuffle  = document.getElementById("shuffle");
  const btnSolve    = document.getElementById("solve");
  const movesEl     = document.getElementById("moves");
  const timeEl      = document.getElementById("time");
  const previewEl   = document.getElementById("preview");
  const winModal    = document.getElementById("winModal");
  const finalTimeEl = document.getElementById("finalTime");
  const finalMovesEl= document.getElementById("finalMoves");
  const playAgain   = document.getElementById("playAgain");
  const rewardArea  = document.getElementById("rewardArea");

  if (previewEl) previewEl.src = IMG_SRC;

  // Tamaño inicial
  let N = Number.isFinite(SIZE_FROM_QS) ? SIZE_FROM_QS : 4;
  if (sizeSel) sizeSel.value = String(N);

  // ========= ESTADO =========
  let tiles = [];                 // 0..N*N-1 ; 0 = hueco
  let moves = 0;
  let started = false;

  // Temporizador ↓
  let timer = null;
  let timeLeft = TIME_LIMIT[N];   // segundos restantes
  let expired = false;            // si llegó a 0, bloquea tablero

  // Arrastre
  let dragging=false, dragEl=null, dragIndex=-1, dragAxis=null;
  let startX=0, startY=0, baseLeftPx=0, baseTopPx=0;
  let boardRect=null, tileSizePx=0;

  // ========= UTILS =========
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  function updateTimeUI(){
    if (!timeEl) return;
    timeEl.textContent = fmt(Math.max(0, timeLeft));
    // aviso visual cuando quedan <=10 s
    if (timeLeft <= 10) timeEl.classList.add('timer-low'); else timeEl.classList.remove('timer-low');
  }

  function startTimer(){
    if (timer) return;
    timer = setInterval(() => {
      timeLeft--;
      updateTimeUI();
      if (timeLeft <= 0){
        timeLeft = 0;
        stopTimer();
        onTimeUp();
      }
    }, 1000);
  }
  function stopTimer(){ clearInterval(timer); timer = null; }

  function resetStats(){
    moves = 0;
    started = false;
    expired = false;
    timeLeft = TIME_LIMIT[N] || 0;
    movesEl && (movesEl.textContent = "0");
    updateTimeUI();
    boardEl && boardEl.classList.remove('disabled');
  }

  const indexToPos = i => ({ r: Math.floor(i/N), c: i%N });
  const posToIndex = (r,c) => r*N + c;
  const getEmptyIndex = () => tiles.indexOf(0);

  const neighborsOf = index => {
    const {r,c} = indexToPos(index); const list=[];
    if(r>0)   list.push(posToIndex(r-1,c));
    if(r<N-1) list.push(posToIndex(r+1,c));
    if(c>0)   list.push(posToIndex(r,c-1));
    if(c<N-1) list.push(posToIndex(r,c+1));
    return list;
  };
  const canMove = i => !expired && neighborsOf(i).includes(getEmptyIndex());
  const swap = (i,j) => { [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; };
  const isSolved = () => tiles.every((v,i)=> (i===tiles.length-1 ? v===0 : v===i+1));

  // Paridad (resoluble)
  function inversions(arr){ const vals=arr.filter(x=>x!==0); let inv=0; for(let i=0;i<vals.length;i++) for(let j=i+1;j<vals.length;j++) if(vals[i]>vals[j]) inv++; return inv; }
  function isSolvable(arr){
    const inv = inversions(arr);
    if (N%2===1) return inv%2===0;
    const emptyRowFromTop = Math.floor(arr.indexOf(0)/N);
    const emptyRowFromBottom = N - emptyRowFromTop;
    return (emptyRowFromBottom%2===0) ? (inv%2===1) : (inv%2===0);
  }
  const isSolvedBase = arr => arr.every((v,i)=> (i===arr.length-1 ? v===0 : v===i+1));
  function makeSolvableShuffle(){
    const base = Array.from({length:N*N}, (_,i)=>i);
    do{
      for(let i=base.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [base[i],base[j]] = [base[j],base[i]];
      }
    } while(!isSolvable(base) || isSolvedBase(base));
    return base;
  }

  // ========= DRAG =========
  const pct2px = (pct,total) => (parseFloat(pct)/100)*total;

  function onPointerDown(e, index, el){
    if (!canMove(index)) return;
    dragging=true; dragEl=el; dragIndex=index;

    boardRect = boardEl.getBoundingClientRect();
    tileSizePx = boardRect.width / N;

    startX=e.clientX; startY=e.clientY;
    baseLeftPx=pct2px(parseFloat(el.style.left), boardRect.width);
    baseTopPx =pct2px(parseFloat(el.style.top),  boardRect.width);

    const empty=getEmptyIndex();
    const { r:tr, c:tc }=indexToPos(index);
    const { r:er, c:ec }=indexToPos(empty);
    dragAxis=(tr===er)?'x':'y';

    el.style.transition='none';
    el.setPointerCapture(e.pointerId);

    document.addEventListener('pointermove', onPointerMove, {passive:false});
    document.addEventListener('pointerup', onPointerUp, {passive:true});
  }

  function onPointerMove(e){
    if (!dragging||!dragEl) return;
    e.preventDefault();

    const dx=e.clientX-startX, dy=e.clientY-startY;
    let mx=(dragAxis==='x')?dx:0, my=(dragAxis==='y')?dy:0;

    const max=tileSizePx;
    if (mx> max) mx= max; if (mx<-max) mx=-max;
    if (my> max) my= max; if (my<-max) my=-max;

    dragEl.style.transform=`translate(${mx}px, ${my}px)`;
  }

  function onPointerUp(e){
    if (!dragging||!dragEl) return;

    const empty=getEmptyIndex();
    const { r:er, c:ec }=indexToPos(empty);
    const emptyCx=ec*tileSizePx + tileSizePx/2;
    const emptyCy=er*tileSizePx + tileSizePx/2;

    const m=/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(dragEl.style.transform||'translate(0px,0px)');
    const tdx=m?parseFloat(m[1]):0, tdy=m?parseFloat(m[2]):0;

    const currentCx=(baseLeftPx+tdx)+tileSizePx/2;
    const currentCy=(baseTopPx +tdy)+tileSizePx/2;

    const dist=Math.hypot(currentCx-emptyCx, currentCy-emptyCy);
    const threshold=tileSizePx*0.45;

    dragEl.style.transition='';
    dragEl.releasePointerCapture(e.pointerId);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);

    if (dist<=threshold){
      tryMove(dragIndex);
      if (!started){ started = true; startTimer(); }
    } else {
      dragEl.style.transform='translate(0,0)';
    }

    dragging=false; dragEl=null; dragIndex=-1; dragAxis=null;
  }

  // ========= RENDER =========
  function render(){
    const tileSize=100/N;
    boardEl.innerHTML='';

    tiles.forEach((val,i)=>{
      const { r, c } = indexToPos(i);
      const el=document.createElement('button');
      el.className='tile';
      el.style.width = `${tileSize}%`;
      el.style.height= `${tileSize}%`;
      el.style.left  = `${c * tileSize}%`;
      el.style.top   = `${r * tileSize}%`;
      el.style.position='absolute';
      el.setAttribute('aria-label', val===0?'Hueco':`Pieza ${val}`);

      if (val===0){
        el.classList.add('empty');
        boardEl.appendChild(el);
        return;
      }

      const targetIndex=val-1;
      const { r:tr, c:tc }=indexToPos(targetIndex);
      el.style.backgroundImage = `linear-gradient(#00000030,#00000030), url('${IMG_SRC}')`;
      el.style.backgroundSize = `${N*100}% ${N*100}%`;
      el.style.backgroundPosition = `${tc/(N-1)*100}% ${tr/(N-1)*100}%`;
      el.style.backgroundRepeat='no-repeat';

      el.addEventListener('pointerdown', (ev)=>onPointerDown(ev,i,el), {passive:true});
      boardEl.appendChild(el);
    });

    // si expiró, bloquea el tablero
    boardEl.classList.toggle('disabled', expired);
  }

  // ========= JUEGO / VICTORIA / TIEMPO =========
  function tryMove(tileIndex){
    if (!canMove(tileIndex)) return;
    swap(tileIndex, getEmptyIndex());
    moves++; movesEl && (movesEl.textContent = String(moves));
    render();
    if (isSolved()) onWin();
  }

  function onTimeUp(){
    expired = true;
    boardEl.classList.add('disabled');
    // Mostrar modal de “tiempo agotado”
    if (finalMovesEl) finalMovesEl.textContent = String(moves);
    if (finalTimeEl)  finalTimeEl.textContent  = fmt(TIME_LIMIT[N]); // tiempo asignado
    rewardArea && (rewardArea.textContent = 'Tiempo agotado ⏳ · Sin descuento.');
    winModal && (winModal.hidden = false);
  }

  function onWin(){
    stopTimer();
    // tiempo empleado = asignado - restante
    const elapsed = (TIME_LIMIT[N] || 0) - timeLeft;
    if (finalMovesEl) finalMovesEl.textContent = String(moves);
    if (finalTimeEl)  finalTimeEl.textContent  = fmt(Math.max(0, elapsed));

    if (timeLeft <= 0){
      // ganó después de expirar → sin descuento
      rewardArea && (rewardArea.textContent = 'Terminaste, pero fuera de tiempo. Sin descuento.');
      winModal && (winModal.hidden = false);
      return;
    }

    // Evalúa medalla y % según tamaño
    const metas = TIME_GOALS[N] || {};
    let tier=null;
    if      (elapsed <= metas.oro)    tier='oro';
    else if (elapsed <= metas.plata)  tier='plata';
    else if (elapsed <= metas.bronce) tier='bronce';

    if (!tier){
      rewardArea && (rewardArea.textContent = 'Terminaste dentro del tiempo, pero sin alcanzar metas de medalla.');
      winModal && (winModal.hidden = false);
      return;
    }

    const pct = (DISCOUNT_BY_SIZE[N] && DISCOUNT_BY_SIZE[N][tier]) || 0;
    const code = `PUZ-${tier.toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    rewardArea && (rewardArea.innerHTML = `
      <p>🎉 ¡Ganaste <b>${pct}%</b> de descuento (medalla <b>${tier}</b>, ${N}×${N})</p>
      <p style="color:#666">Cupón: <b>${code}</b></p>
    `);
    winModal && (winModal.hidden = false);
  }

  // ========= CONTROL =========
  function newGame(){
    tiles = makeSolvableShuffle();
    stopTimer();
    resetStats();
    render();
  }

  function solveGame(){
    tiles = Array.from({length:N*N},(_,i)=>(i===N*N-1?0:i+1));
    stopTimer();
    resetStats();
    render();
  }

  // Accesibilidad por teclado (opcional)
  function onKey(e){
    if (expired) return;
    const key=e.key, empty=getEmptyIndex(); const {r,c}=indexToPos(empty);
    let target=null;
    if (key==='ArrowUp'    && r<N-1) target=posToIndex(r+1,c);
    if (key==='ArrowDown'  && r>0)   target=posToIndex(r-1,c);
    if (key==='ArrowLeft'  && c<N-1) target=posToIndex(r,c+1);
    if (key==='ArrowRight' && c>0)   target=posToIndex(r,c-1);
    if (target!==null){
      tryMove(target);
      if (!started){ started = true; startTimer(); }
      e.preventDefault();
    }
  }

  // ========= EVENTOS =========
  document.addEventListener('keydown', onKey, {passive:false});
  btnShuffle && btnShuffle.addEventListener('click', newGame);
  btnSolve   && btnSolve.addEventListener('click', solveGame);
  sizeSel    && sizeSel.addEventListener('change', ()=>{
    N = parseInt(sizeSel.value,10);
    newGame(); // reinicia con nuevo límite y temporizador
  });
  playAgain  && playAgain.addEventListener('click', ()=>{
    winModal && (winModal.hidden = true);
    newGame();
  });

  // ========= INIT =========
  solveGame();           // muestra resuelto
  setTimeout(newGame, 200); // mezcla automático
})();

