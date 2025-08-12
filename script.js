// Простая idle-игра без внешних файлов (SVG + WebAudio), сохранение в localStorage

// ---------------- utils ----------------
const uid = (localStorage.getItem('gm_uid') || ('uid_' + Math.random().toString(36).slice(2,10)));
localStorage.setItem('gm_uid', uid);

const $ = (sel) => document.querySelector(sel);
const $all = (sel) => document.querySelectorAll(sel);

function format(n){
  if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(2)+'K';
  return Math.floor(n).toString();
}

// ---------------- audio (WebAudio procedural) ----------------
let audioCtx = null;
function ensureAudioCtx(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function beep(freq=440, dur=0.08, type='sine', vol=0.06){
  const ctx = ensureAudioCtx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + dur);
}
function twoTone(){
  beep(420,0.06,'square',0.06);
  setTimeout(()=>beep(620,0.05,'sawtooth',0.04),70);
}
function levelSound(){ beep(900,0.12,'sine',0.08); setTimeout(()=>beep(1120,0.08,'sine',0.06),120); }

// ---------------- game state ----------------
let state = {
  coins: 0,
  miners: [ { level:1, count:1 } ], // стартовый тип
  lastSaved: Date.now()
};

// load save
const SAVE_KEY = 'goldmine_save_v1';
function load(){
  const s = localStorage.getItem(SAVE_KEY);
  if (s) {
    try {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed.coins === 'number') state = parsed;
    } catch(e){ console.warn('save parse err',e) }
  }
}
function save(){
  state.lastSaved = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

// ---------------- UI ----------------
const coinsEl = $('#coins');
const minersList = $('#minersList');
const buySlotBtn = $('#buySlot');
const autoRateEl = $('#autoRate');
const uidEl = $('#uid');
const muteBtn = $('#muteBtn');

let muted = false;
uidEl.textContent = uid;

function render(){
  coinsEl.textContent = format(Math.floor(state.coins));
  minersList.innerHTML = '';
  state.miners.forEach((m, idx) => {
    const card = document.createElement('div'); card.className = 'minerCard';
    const svgWrap = document.createElement('div'); svgWrap.className = 'minerSVG';
    svgWrap.innerHTML = minerSVG(m.level);
    const info = document.createElement('div'); info.className = 'minerInfo';
    info.innerHTML = `<div class="title">Шахтёр ${idx+1} — Lvl ${m.level}</div>
      <div class="small">Кол-во: ${m.count} · Производство: ${Math.floor(m.count * Math.pow(1.9, m.level-1))}/с</div>`;
    const actions = document.createElement('div');
    actions.className = 'row';
    const hire = document.createElement('button'); hire.className='btn buy'; hire.textContent = `Найм (${Math.floor(25*Math.pow(1.8,m.count))})`;
    hire.onclick = ()=>{ hireMiner(idx) };
    const upg = document.createElement('button'); upg.className='btn upg'; upg.textContent = `Улучшить (${Math.floor(50*Math.pow(2.5,m.level-1))})`;
    upg.onclick = ()=>{ upgradeTier(idx) };
    actions.appendChild(hire); actions.appendChild(upg);
    info.appendChild(actions);
    card.appendChild(svgWrap); card.appendChild(info);
    minersList.appendChild(card);
  });

  const rate = calcAutoRate();
  autoRateEl.textContent = Math.floor(rate);
}

function minerSVG(level){
  const scale = 0.9 + (level-1)*0.06;
  const pickAngle = -18 - (level-1)*4;
  return `
    <svg viewBox="0 0 90 110" width="64" height="78" style="transform:scale(${scale})">
      <ellipse cx="45" cy="78" rx="22" ry="10" fill="#6b4f2b"></ellipse>
      <circle cx="45" cy="36" r="12" fill="#f0c27b"></circle>
      <rect x="28" y="26" width="34" height="10" rx="4" fill="#c9d1d9"></rect>
      <g transform="translate(48,48) rotate(${pickAngle})">
        <rect x="18" y="-2" width="36" height="5" rx="2" fill="#7b6b50" />
        <polygon points="54,1 62,-6 62,8" fill="#9b7d4e" />
      </g>
      <text x="45" y="105" font-size="10" text-anchor="middle" fill="#fff">x${Math.floor(level)}</text>
    </svg>
  `;
}

// ---------------- game mechanics ----------------
function calcAutoRate(){
  return state.miners.reduce((acc,m)=> acc + m.count * Math.pow(1.9, m.level-1), 0);
}

// clicking the big rock
const rock = document.getElementById('rock');
rock.addEventListener('click', ()=>{ mineClick() });
document.addEventListener('keydown', (e)=>{ if(e.code==='Space') { e.preventDefault(); mineClick() } });

function mineClick(){
  const gained = 1 + Math.floor(Math.random()*3);
  state.coins += gained;
  if (!muted) twoTone();
  render();
}

// hire miner
function hireMiner(idx){
  const cost = Math.floor(25 * Math.pow(1.8, state.miners[idx].count));
  if (state.coins < cost) return;
  state.coins -= cost;
  state.miners[idx].count += 1;
  if (!muted) beep(520,0.06,'sine',0.05);
  render();
}

// upgrade tier
function upgradeTier(idx){
  const tier = state.miners[idx];
  const cost = Math.floor(50 * Math.pow(2.5, tier.level-1));
  if (state.coins < cost) return;
  state.coins -= cost;
  state.miners[idx].level += 1;
  if (!muted) levelSound();
  render();
}

// buy new slot
buySlotBtn.addEventListener('click', ()=>{
  const cost = Math.floor(200 * Math.pow(3, state.miners.length-1));
  if (state.coins < cost) return;
  state.coins -= cost;
  state.miners.push({ level:1, count:1 });
  if (!muted) beep(740,0.08,'triangle',0.06);
  render();
});

// buy pack
$('#buyPack').addEventListener('click', ()=>{
  if (state.coins < 100) return;
  state.coins -= 100;
  state.coins += 100; // effectively lets user trade, but here just demo: +0 net. You can change.
  state.coins += 100; // make it +100 net (cost 100 -> +200). Modify as needed.
  render();
});

// reset
$('#resetBtn').addEventListener('click', ()=>{
  if (!confirm('Сбросить прогресс?')) return;
  state = { coins:0, miners:[{level:1,count:1}], lastSaved:Date.now() };
  save(); render();
});

// mute
muteBtn.addEventListener('click', ()=>{
  muted = !muted;
  muteBtn.textContent = muted ? '🔇' : '🔊';
});

// passive income loop (tick 4x per sec)
setInterval(()=>{
  const rate = calcAutoRate();
  state.coins += rate / 4;
  render();
},250);

// autosave
setInterval(()=>{ save(); },5000);

// initial load + render
load();
render();
save();
