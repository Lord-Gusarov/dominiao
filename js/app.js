// ═══════════════════════════════════════════
// Dominiao — Application Logic
// ═══════════════════════════════════════════

// ───── Storage ─────
const STORAGE_KEY = 'dominiao_v2';

// ───── Haptic ─────
function haptic(p) { try { navigator.vibrate && navigator.vibrate(p); } catch(e) {} }

// ───── i18n ─────
const STRINGS = {
  en: {
    us: 'Us', them: 'Them', mode: 'Mode',
    toTarget: (t) => `To ${t}`,
    bonusEnabled: 'Bonus', leading: 'Leading', won: 'Won!', toGo: 'to go',
    rounds: 'Rounds', bonus: 'Bonus',
    noRounds: 'No rounds yet. Add points to begin.',
    enterPoints: 'Points', addRound: 'Add round',
    quickBonus: 'Quick +25 Bonus', customBonus: 'Bonus points',
    bonusAmount: 'Bonus points', addBonus: 'Add bonus',
    bonusWarning: "Bonus can't win the game \u2014 play a normal round.",
    undo: 'Undo', share: 'Share', newGame: 'New game', keepPlaying: 'Keep playing',
    winner: 'Winner', margin: 'Margin',
    newGameQ: 'Start a new game?',
    newGameMsg: 'Current rounds will be cleared. Team names and mode are kept.',
    switchModeQ: 'Switch mode?',
    switchModeMsg: 'Changing modes mid-game resets the current rounds.',
    switchBtn: 'Switch',
    settings: 'Settings', language: 'Language', theme: 'Theme',
    done: 'Done', cancel: 'Cancel',
    themeWarm: 'Warm', themeStadium: 'Stadium', themeModern: 'Modern',
    roundsPlayed: 'rounds played',
    scoreCopied: 'Score copied',
    deleteRound: 'Delete round',
    modes: {
      c200: { name: 'Classic 200', desc: 'Standard domino game' },
      l500: { name: 'Long 500',    desc: 'Long game with custom bonus' },
      q100: { name: 'Quick 100',   desc: 'Short game' },
    }
  },
  es: {
    us: 'Nosotros', them: 'Ellos', mode: 'Modo',
    toTarget: (t) => `A ${t}`,
    bonusEnabled: 'Bono', leading: 'Ganando', won: '\u00a1Gan\u00f3!', toGo: 'restan',
    rounds: 'Rondas', bonus: 'Bono',
    noRounds: 'Sin rondas a\u00fan. Agrega puntos para empezar.',
    enterPoints: 'Puntos', addRound: 'Agregar ronda',
    quickBonus: 'Bono r\u00e1pido +25', customBonus: 'Puntos de bono',
    bonusAmount: 'Puntos de bono', addBonus: 'A\u00f1adir bono',
    bonusWarning: 'El bono no puede ganar el juego \u2014 juega una ronda normal.',
    undo: 'Deshacer', share: 'Compartir', newGame: 'Nuevo juego', keepPlaying: 'Seguir',
    winner: 'Ganador', margin: 'Margen',
    newGameQ: '\u00bfEmpezar un nuevo juego?',
    newGameMsg: 'Las rondas actuales se borrar\u00e1n. Los nombres y el modo se mantienen.',
    switchModeQ: '\u00bfCambiar de modo?',
    switchModeMsg: 'Cambiar de modo durante el juego reinicia las rondas.',
    switchBtn: 'Cambiar',
    settings: 'Ajustes', language: 'Idioma', theme: 'Tema',
    done: 'Listo', cancel: 'Cancelar',
    themeWarm: 'C\u00e1lido', themeStadium: 'Estadio', themeModern: 'Moderno',
    roundsPlayed: 'rondas jugadas',
    scoreCopied: 'Marcador copiado',
    deleteRound: 'Borrar ronda',
    modes: {
      c200: { name: 'Cl\u00e1sico 200', desc: 'Partida est\u00e1ndar de domin\u00f3' },
      l500: { name: 'Largo 500',    desc: 'Partida larga con bono personalizado' },
      q100: { name: 'R\u00e1pido 100',   desc: 'Partida corta' },
    }
  }
};

function t(key, arg) {
  const v = STRINGS[game.lang][key];
  return typeof v === 'function' ? v(arg) : (v || key);
}

// ───── Modes ─────
const MODES = [
  { id: 'c200', target: 200, bonus: 'fixed25' },
  { id: 'l500', target: 500, bonus: 'custom' },
  { id: 'q100', target: 100, bonus: false },
];

function getMode(id) { return MODES.find(m => m.id === id) || MODES[0]; }

// ───── Game state ─────
let game = {
  teamA: 'Us', teamB: 'Them',
  scoreA: 0, scoreB: 0,
  rounds: [],
  mode: 'c200',
  lang: 'en',
  theme: 'warm',
  winShown: false,
  roundCounter: 0,
};
let pendingMode = null;

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); }

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { const s = JSON.parse(raw); game = { ...game, ...s }; } catch(e) {}
  }
  if (!game.teamA) game.teamA = t('us');
  if (!game.teamB) game.teamB = t('them');
  if (!game.roundCounter && game.rounds.length > 0) recalcRoundCounter();
}

function recalcScores() {
  game.scoreA = 0; game.scoreB = 0;
  for (const r of game.rounds) {
    const pts = (r.points || 0) + (r.bonus || 0);
    if (r.team === 'a') game.scoreA += pts;
    else game.scoreB += pts;
  }
}

function recalcRoundCounter() {
  let max = 0;
  for (const r of game.rounds) {
    if (r.id > max) max = r.id;
  }
  game.roundCounter = max;
}

// ───── Toast ─────
function showToast(msg, cls) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (cls ? ' ' + cls : '');
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ───── Score animation ─────
function animateScore(el, from, to) {
  if (from === to) return;
  const diff = to - from;
  const steps = Math.min(Math.abs(diff), 15);
  const duration = 400;
  let step = 0;
  function tick() {
    step++;
    const eased = 1 - Math.pow(1 - step / steps, 3);
    el.textContent = String(Math.round(from + diff * eased)).padStart(3, '0');
    if (step < steps) setTimeout(tick, duration / steps);
  }
  tick();
}

function popScore(team) {
  const el = document.getElementById(team === 'a' ? 'scoreA' : 'scoreB');
  el.classList.add('score-pop');
  setTimeout(() => el.classList.remove('score-pop'), 500);
}

// ───── Overlay helpers ─────
function openOverlay(id) { document.getElementById(id).classList.add('show'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('show'); }

// ═══════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════

function renderAll() {
  applyTheme();
  renderTopBar();
  renderModeChip();
  renderTeamCards(false);
  renderAddSection();
  renderHistory();
  renderBottomBar();
  renderSettings();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', game.theme);
  const mc = game.theme === 'modern' ? '#fafaf7' : (game.theme === 'stadium' ? '#05070a' : '#1e1510');
  document.querySelector('meta[name="theme-color"]').content = mc;
  document.querySelector('meta[name="color-scheme"]').content = game.theme === 'modern' ? 'light' : 'dark';
}

function renderTopBar() {
  document.getElementById('langEs').className = game.lang === 'es' ? 'active' : '';
  document.getElementById('langEn').className = game.lang === 'en' ? 'active' : '';
}

function renderModeChip() {
  const modeStr = STRINGS[game.lang].modes[game.mode];
  document.getElementById('modeLabelText').textContent = t('mode');
  document.getElementById('modeValText').textContent = modeStr.name;

  const dd = document.getElementById('modeDropdown');
  dd.innerHTML = MODES.map(m => {
    const ms = STRINGS[game.lang].modes[m.id];
    const active = m.id === game.mode;
    return `<button class="${active ? 'active' : ''}" onclick="selectMode('${m.id}')">
      <div>
        <div style="font-weight:500">${ms.name}</div>
        <div class="mode-desc">${t('toTarget', m.target)}${m.bonus ? ' \u00b7 ' + t('bonusEnabled') : ''}</div>
      </div>
      ${active ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-glow)" stroke-width="1.8" stroke-linecap="round"><path d="M5 12l5 5L20 7"/></svg>' : ''}
    </button>`;
  }).join('');
}

function renderTeamCards(animate) {
  const mode = getMode(game.mode);
  const target = mode.target;
  const prevA = parseInt(document.getElementById('scoreA').textContent) || 0;
  const prevB = parseInt(document.getElementById('scoreB').textContent) || 0;

  document.getElementById('nameTextA').textContent = game.teamA;
  document.getElementById('nameTextB').textContent = game.teamB;

  if (animate) {
    animateScore(document.getElementById('scoreA'), prevA, game.scoreA);
    animateScore(document.getElementById('scoreB'), prevB, game.scoreB);
  } else {
    document.getElementById('scoreA').textContent = String(game.scoreA).padStart(3, '0');
    document.getElementById('scoreB').textContent = String(game.scoreB).padStart(3, '0');
  }

  const sA = document.getElementById('scoreA');
  const sB = document.getElementById('scoreB');
  const winnerA = game.scoreA >= target;
  const winnerB = game.scoreB >= target;
  const leadingA = !winnerA && !winnerB && game.scoreA > game.scoreB;
  const leadingB = !winnerA && !winnerB && game.scoreB > game.scoreA;

  sA.style.color = winnerA ? 'var(--gold-glow)' : 'var(--fg)';
  sA.style.textShadow = winnerA
    ? '0 0 18px var(--team-a-glow), 0 0 36px var(--gold)'
    : leadingA ? '0 0 16px rgba(196,69,42,0.4), 0 2px 0 rgba(0,0,0,0.3)' : '0 2px 0 rgba(0,0,0,0.3)';
  sB.style.color = winnerB ? 'var(--gold-glow)' : 'var(--fg)';
  sB.style.textShadow = winnerB
    ? '0 0 18px var(--team-b-glow), 0 0 36px var(--gold)'
    : leadingB ? '0 0 16px rgba(107,138,75,0.4), 0 2px 0 rgba(0,0,0,0.3)' : '0 2px 0 rgba(0,0,0,0.3)';

  document.getElementById('cardA').className = 'team-card' + (winnerA ? ' winner-a' : leadingA ? ' leading-a' : '');
  document.getElementById('cardB').className = 'team-card' + (winnerB ? ' winner-b' : leadingB ? ' leading-b' : '');

  // Progress bars (segmented, 10 segments)
  const segments = 10;
  const filledA = Math.round((game.scoreA / target) * segments);
  const filledB = Math.round((game.scoreB / target) * segments);
  document.getElementById('progressA').innerHTML = Array.from({ length: segments }, (_, i) =>
    `<div class="progress-seg" style="background:${i < filledA ? 'var(--team-a)' : 'var(--divider)'};box-shadow:${i < filledA ? '0 0 6px var(--team-a-glow)' : 'none'}"></div>`
  ).join('');
  document.getElementById('progressB').innerHTML = Array.from({ length: segments }, (_, i) =>
    `<div class="progress-seg" style="background:${i < filledB ? 'var(--team-b)' : 'var(--divider)'};box-shadow:${i < filledB ? '0 0 6px var(--team-b-glow)' : 'none'}"></div>`
  ).join('');

  const toGoA = target - game.scoreA;
  const toGoB = target - game.scoreB;
  document.getElementById('toGoA').textContent = toGoA > 0 ? `${toGoA} ${t('toGo')}` : t('won');
  document.getElementById('toGoB').textContent = toGoB > 0 ? `${toGoB} ${t('toGo')}` : t('won');
  document.getElementById('targetA').textContent = '/ ' + target;
  document.getElementById('targetB').textContent = '/ ' + target;

  if (!game.winShown && (winnerA || winnerB)) {
    game.winShown = true;
    save();
    showWinOverlay(winnerA ? 'a' : 'b');
    haptic([50, 50, 100, 50, 200]);
  }
}

function renderAddSection() {
  const mode = getMode(game.mode);

  document.getElementById('pointsInputA').placeholder = t('enterPoints');
  document.getElementById('pointsInputB').placeholder = t('enterPoints');
  document.getElementById('addRoundLabel').textContent = t('addRound');
  updateAddBtnState();

  const ba = document.getElementById('bonusArea');
  if (mode.bonus === 'fixed25') {
    ba.innerHTML = `
      <div class="label-sm" style="margin:10px 0 6px">${t('quickBonus')}</div>
      <div class="bonus-row">
        ${['a', 'b'].map(k => `<button class="bonus-btn" onclick="submitBonus('${k}',25)">
          <span>+25</span>
          <span class="team-label">${k === 'a' ? game.teamA : game.teamB}</span>
        </button>`).join('')}
      </div>`;
  } else if (mode.bonus === 'custom') {
    ba.innerHTML = `
      <div class="label-sm" style="margin:10px 0 6px">${t('customBonus')}</div>
      <div class="bonus-row-dual">
        <div class="bonus-field">
          <input type="number" inputmode="numeric" class="bonus-input" id="bonusInputA" placeholder="${t('bonusAmount')}" oninput="updateBonusBtnState()">
        </div>
        <div class="bonus-field">
          <input type="number" inputmode="numeric" class="bonus-input" id="bonusInputB" placeholder="${t('bonusAmount')}" oninput="updateBonusBtnState()">
        </div>
      </div>
      <button class="bonus-add-btn" id="bonusSubmitBtn" onclick="submitCustomBonus()">${t('addBonus')}</button>`;
    document.getElementById('bonusInputA').addEventListener('keydown', e => { if (e.key === 'Enter') submitCustomBonus(); });
    document.getElementById('bonusInputB').addEventListener('keydown', e => { if (e.key === 'Enter') submitCustomBonus(); });
    updateBonusBtnState();
  } else {
    ba.innerHTML = '';
  }
}

function updateAddBtnState() {
  const valA = document.getElementById('pointsInputA').value;
  const valB = document.getElementById('pointsInputB').value;
  document.getElementById('addBtn').className = 'add-round-btn' + (valA || valB ? ' ready' : '');
}

function updateBonusBtnState() {
  const biA = document.getElementById('bonusInputA');
  const biB = document.getElementById('bonusInputB');
  const btn = document.getElementById('bonusSubmitBtn');
  if (!btn) return;
  const hasValue = (biA && biA.value) || (biB && biB.value);
  btn.className = 'bonus-add-btn' + (hasValue ? ' ready' : '');
}

function renderHistory() {
  document.getElementById('roundsLabel').textContent = t('rounds');
  const n = game.rounds.length;
  const rc = game.roundCounter || 0;
  document.getElementById('roundsCount').textContent = rc > 0 ? `${rc} ${t('roundsPlayed')}` : '';

  const box = document.getElementById('historyContent');
  if (n === 0) {
    box.innerHTML = `<div class="history-empty">
      <svg width="32" height="16" viewBox="0 0 200 100" opacity="0.4"><rect x="1" y="1" width="198" height="98" rx="8" fill="var(--app-bg)" stroke="var(--fg)" stroke-opacity="0.2" stroke-width="1"/><circle cx="50" cy="50" r="7" fill="var(--fg)"/><line x1="100" y1="15" x2="100" y2="85" stroke="var(--fg)" stroke-opacity="0.25" stroke-width="1"/><circle cx="150" cy="50" r="7" fill="var(--fg)"/></svg>
      <span>${t('noRounds')}</span>
    </div>`;
    return;
  }

  let totalA = 0, totalB = 0;
  for (const r of game.rounds) {
    const pts = (r.points || 0) + (r.bonus || 0);
    if (r.team === 'a') totalA += pts; else totalB += pts;
  }

  function buildCell(entry, side) {
    if (!entry) return '<div class="history-cell"></div>';
    const total = (entry.points || 0) + (entry.bonus || 0);
    const isBonus = entry.bonus > 0;
    const teamColor = side === 'a' ? 'var(--team-a)' : 'var(--team-b)';
    const teamGlow = side === 'a' ? 'var(--team-a-glow)' : 'var(--team-b-glow)';
    const tintBg = isBonus ? (side === 'a' ? 'var(--team-a-tint)' : 'var(--team-b-tint)') : 'transparent';
    return `<div class="history-cell" style="background:${tintBg}">
      <div class="cell-info">
        ${isBonus ? `<span class="bonus-badge" style="background:${teamColor}">${t('bonus')}</span>` : ''}
        <div class="cell-time">${entry.timestamp || ''}</div>
      </div>
      <div class="cell-right">
        <div class="delta" style="color:${teamColor};${isBonus ? `text-shadow:0 0 10px ${teamGlow}` : ''}">+${total}</div>
        <button class="del-btn" onclick="deleteRound(${entry.index})" title="${t('deleteRound')}">&times;</button>
      </div>
    </div>`;
  }

  // Build rows chronologically by walking the rounds array.
  // Simultaneous non-bonus entries (consecutive, same id, different teams) get paired.
  // Everything else gets its own row.
  const rows = [];
  let i = 0;
  while (i < game.rounds.length) {
    const r = game.rounds[i];
    const rid = r.id || i + 1;
    const next = game.rounds[i + 1];
    // Check if this and the next entry form a simultaneous pair
    if (next && !(r.bonus > 0) && !(next.bonus > 0)
        && r.id === next.id && r.team !== next.team) {
      const eA = r.team === 'a' ? { ...r, index: i } : { ...next, index: i + 1 };
      const eB = r.team === 'b' ? { ...r, index: i } : { ...next, index: i + 1 };
      rows.push({ rid, cellA: eA, cellB: eB });
      i += 2;
    } else {
      const entry = { ...r, index: i };
      rows.push({
        rid,
        cellA: r.team === 'a' ? entry : null,
        cellB: r.team === 'b' ? entry : null,
      });
      i++;
    }
  }

  let html = `<div class="history-table">
    <div class="history-team-row">
      <div class="history-team-cell">
        <div class="team-info">
          <span class="team-dot" style="background:var(--team-a);box-shadow:0 0 6px var(--team-a-glow)"></span>
          <span class="team-label" style="color:var(--team-a)">${game.teamA}</span>
        </div>
        <span class="team-total">${totalA}</span>
      </div>
      <div class="history-team-cell-mid"></div>
      <div class="history-team-cell">
        <div class="team-info">
          <span class="team-dot" style="background:var(--team-b);box-shadow:0 0 6px var(--team-b-glow)"></span>
          <span class="team-label" style="color:var(--team-b)">${game.teamB}</span>
        </div>
        <span class="team-total">${totalB}</span>
      </div>
    </div>`;

  // Render rows in reverse (newest at top)
  for (let r = rows.length - 1; r >= 0; r--) {
    const row = rows[r];
    html += `<div class="history-round-row">
      ${buildCell(row.cellA, 'a')}
      <div class="round-id-cell"><span class="round-id-badge">R${row.rid}</span></div>
      ${buildCell(row.cellB, 'b')}
    </div>`;
  }
  html += '</div>';
  box.innerHTML = html;
}

function renderBottomBar() {
  document.getElementById('undoLabel').textContent = t('undo');
  document.getElementById('shareLabel').textContent = t('share');
  document.getElementById('newGameLabel').textContent = t('newGame');
  document.getElementById('undoBtn').disabled = game.rounds.length === 0;
}

function renderSettings() {
  document.getElementById('settingsTitle').textContent = t('settings');
  document.getElementById('langLabel').textContent = t('language');
  document.getElementById('themeLabel').textContent = t('theme');
  document.getElementById('settingsDone').textContent = t('done');

  document.getElementById('sLangEs').className = game.lang === 'es' ? 'active' : '';
  document.getElementById('sLangEn').className = game.lang === 'en' ? 'active' : '';

  const palettes = {
    warm:    ['#2a1d14', '#c4452a', '#f4ead5'],
    stadium: ['#05070a', '#ff3c2a', '#ffd400'],
    modern:  ['#fafaf7', '#1558ff', '#111111'],
  };
  document.getElementById('themePaletteIcon').innerHTML =
    `<div class="palette-swatch">${palettes[game.theme].map(c => `<span style="background:${c}"></span>`).join('')}</div>`;

  const themes = [
    { id: 'warm',    label: t('themeWarm') },
    { id: 'stadium', label: t('themeStadium') },
    { id: 'modern',  label: t('themeModern') },
  ];
  document.getElementById('themePicker').innerHTML = themes.map(th => {
    const active = th.id === game.theme;
    return `<button class="theme-option ${active ? 'active' : ''}" onclick="setTheme('${th.id}')">
      <div class="palette-swatch">${palettes[th.id].map(c => `<span style="background:${c}"></span>`).join('')}</div>
      <span>${th.label}</span>
    </button>`;
  }).join('');

  document.getElementById('confirmTitle').textContent = t('newGameQ');
  document.getElementById('confirmMsg').textContent = t('newGameMsg');
  document.getElementById('confirmCancel').textContent = t('cancel');
  document.getElementById('confirmOk').textContent = t('newGame');
  document.getElementById('modeConfirmTitle').textContent = t('switchModeQ');
  document.getElementById('modeConfirmMsg').textContent = t('switchModeMsg');
  document.getElementById('modeConfirmCancel').textContent = t('cancel');
  document.getElementById('modeConfirmOk').textContent = t('switchBtn');
}

// ═══════════════════════════════════════════
// Win overlay
// ═══════════════════════════════════════════

function showWinOverlay(winner) {
  const mode = getMode(game.mode);
  const winColor = winner === 'a' ? 'var(--team-a)' : 'var(--team-b)';
  const winGlow = winner === 'a' ? 'var(--team-a-glow)' : 'var(--team-b-glow)';
  const winName = winner === 'a' ? game.teamA : game.teamB;
  const winScore = winner === 'a' ? game.scoreA : game.scoreB;
  const loseScore = winner === 'a' ? game.scoreB : game.scoreA;
  const margin = winScore - loseScore;

  document.getElementById('winLabel').textContent = t('winner');
  document.getElementById('winName').textContent = winName;
  document.getElementById('winTrophy').style.background = `radial-gradient(circle, ${winGlow}, ${winColor})`;
  document.getElementById('winTrophy').style.boxShadow = `0 0 40px ${winGlow}, 0 0 80px ${winColor}`;

  document.getElementById('winScoreCard').innerHTML = `
    <div style="text-align:center">
      <div class="label-sm" style="color:var(--team-a);margin-bottom:4px">${game.teamA}</div>
      <div class="score-digits" style="font-size:32px;color:${winner === 'a' ? 'var(--gold-glow)' : 'var(--fg)'}">${String(game.scoreA).padStart(3, '0')}</div>
    </div>
    <div style="width:1px;height:36px;background:var(--divider)"></div>
    <div style="text-align:center">
      <div class="label-sm" style="color:var(--team-b);margin-bottom:4px">${game.teamB}</div>
      <div class="score-digits" style="font-size:32px;color:${winner === 'b' ? 'var(--gold-glow)' : 'var(--fg)'}">${String(game.scoreB).padStart(3, '0')}</div>
    </div>`;

  document.getElementById('winStats').innerHTML = [
    { label: t('rounds'), value: game.roundCounter },
    { label: t('margin'), value: '+' + margin },
    { label: t('mode'), value: mode.target },
  ].map(s => `<div style="padding:10px 6px;border-radius:10px;background:var(--input-bg);border:1px solid var(--divider);text-align:center">
    <div class="label-sm" style="font-size:8px;margin-bottom:4px">${s.label}</div>
    <div class="score-digits" style="font-size:18px;color:var(--fg)">${s.value}</div>
  </div>`).join('');

  const ngBtn = document.getElementById('winNewGame');
  ngBtn.textContent = t('newGame');
  ngBtn.style.background = winColor;
  ngBtn.style.boxShadow = `0 0 24px ${winGlow}`;
  document.getElementById('winKeep').textContent = t('keepPlaying');
  document.getElementById('winShareLabel').textContent = t('share');

  spawnConfetti();
  openOverlay('winOverlay');
}

function spawnConfetti() {
  const box = document.getElementById('confettiBox');
  const colors = ['var(--team-a)', 'var(--team-b)', 'var(--gold)', 'var(--fg)'];
  box.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const size = 6 + Math.random() * 8;
    const shape = i % 3;
    el.style.cssText = `
      left:${Math.random() * 100}%;
      width:${size}px; height:${size * (shape === 0 ? 1.6 : 1)}px;
      background:${colors[i % colors.length]};
      border-radius:${shape === 1 ? '50%' : shape === 2 ? '2px' : '1px'};
      animation-delay:${Math.random() * 0.8}s;
      animation-duration:${1.8 + Math.random() * 1.2}s;
      transform:rotate(${Math.random() * 360}deg);
    `;
    box.appendChild(el);
  }
}

// ═══════════════════════════════════════════
// Actions
// ═══════════════════════════════════════════

function submitPoints() {
  const inputA = document.getElementById('pointsInputA');
  const inputB = document.getElementById('pointsInputB');
  const valA = parseInt(inputA.value, 10) || 0;
  const valB = parseInt(inputB.value, 10) || 0;
  if (valA <= 0 && valB <= 0) return;

  game.roundCounter++;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const id = game.roundCounter;

  if (valA > 0) {
    game.rounds.push({ id, team: 'a', points: valA, bonus: 0, timestamp });
    game.scoreA += valA;
  }
  if (valB > 0) {
    game.rounds.push({ id, team: 'b', points: valB, bonus: 0, timestamp });
    game.scoreB += valB;
  }

  inputA.value = '';
  inputB.value = '';
  game.winShown = false;
  save();
  renderTeamCards(true);
  renderHistory();
  renderAddSection();
  renderBottomBar();
  if (valA > 0) popScore('a');
  if (valB > 0) popScore('b');
  haptic(30);
  updateAddBtnState();
}

function submitBonus(team, amount) {
  const mode = getMode(game.mode);
  const score = team === 'a' ? game.scoreA : game.scoreB;
  if (score + amount >= mode.target) {
    showToast(t('bonusWarning'));
    return;
  }
  addBonus(team, amount);
}

function submitCustomBonus() {
  const inputA = document.getElementById('bonusInputA');
  const inputB = document.getElementById('bonusInputB');
  const valA = parseInt(inputA ? inputA.value : '', 10) || 0;
  const valB = parseInt(inputB ? inputB.value : '', 10) || 0;
  if (valA <= 0 && valB <= 0) return;

  const mode = getMode(game.mode);
  if (valA > 0 && game.scoreA + valA >= mode.target) {
    showToast(t('bonusWarning'));
    return;
  }
  if (valB > 0 && game.scoreB + valB >= mode.target) {
    showToast(t('bonusWarning'));
    return;
  }

  if (valA > 0) addBonus('a', valA);
  if (valB > 0) addBonus('b', valB);
  if (inputA) inputA.value = '';
  if (inputB) inputB.value = '';
  updateBonusBtnState();
}

function addBonus(team, amount) {
  const id = game.roundCounter + 1;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  game.rounds.push({ id, team, points: 0, bonus: amount, timestamp });
  if (team === 'a') game.scoreA += amount; else game.scoreB += amount;
  game.winShown = false;
  save();
  renderTeamCards(true);
  renderHistory();
  renderAddSection();
  renderBottomBar();
  popScore(team);
  haptic(30);
}

function deleteRound(index) {
  const r = game.rounds[index];
  if (!r) return;
  game.rounds.splice(index, 1);
  recalcScores();
  recalcRoundCounter();
  game.winShown = false;
  save();
  renderTeamCards(true);
  renderHistory();
  renderBottomBar();
}

function undoRound() {
  if (game.rounds.length === 0) return;
  game.rounds.pop();
  recalcScores();
  recalcRoundCounter();
  game.winShown = false;
  save();
  renderTeamCards(true);
  renderHistory();
  renderBottomBar();
  haptic(20);
  showToast(t('undo'), 'info');
}

function newGame() {
  game.rounds = [];
  game.scoreA = 0;
  game.scoreB = 0;
  game.winShown = false;
  game.roundCounter = 0;
  save();
  renderAll();
}

function openNewGameConfirm() {
  if (game.rounds.length === 0) return;
  openOverlay('newGameConfirm');
}

// ───── Mode switching ─────
function toggleModeDropdown() {
  const dd = document.getElementById('modeDropdown');
  dd.style.display = dd.style.display === 'none' ? '' : 'none';
}

function selectMode(modeId) {
  document.getElementById('modeDropdown').style.display = 'none';
  if (modeId === game.mode) return;
  if (game.rounds.length > 0) {
    pendingMode = modeId;
    openOverlay('modeSwitchConfirm');
  } else {
    game.mode = modeId;
    save();
    renderAll();
  }
}

function confirmModeSwitch() {
  if (pendingMode) {
    game.mode = pendingMode;
    game.rounds = [];
    game.scoreA = 0;
    game.scoreB = 0;
    game.winShown = false;
    game.roundCounter = 0;
    pendingMode = null;
    save();
    renderAll();
  }
  closeOverlay('modeSwitchConfirm');
}

// ───── Language ─────
function setLang(lang) {
  const oldUs = STRINGS[game.lang].us;
  const oldThem = STRINGS[game.lang].them;
  game.lang = lang;
  if (game.teamA === oldUs || game.teamA === 'Us' || game.teamA === 'Nosotros') game.teamA = t('us');
  if (game.teamB === oldThem || game.teamB === 'Them' || game.teamB === 'Ellos') game.teamB = t('them');
  save();
  renderAll();
}

// ───── Theme ─────
function setTheme(theme) {
  game.theme = theme;
  save();
  renderAll();
}

// ───── Settings ─────
function openSettings() { openOverlay('settingsOverlay'); }

// ───── Share ─────
function shareScore() {
  const modeStr = STRINGS[game.lang].modes[game.mode];
  const text = `${game.teamA} ${game.scoreA} - ${game.scoreB} ${game.teamB}\n${modeStr.name} (${game.roundCounter} ${t('rounds').toLowerCase()})`;
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      showToast(t('scoreCopied'), 'info');
    }).catch(() => {});
  }
  haptic(30);
}

// ───── Team name editing ─────
function startEditName(team) {
  const display = document.getElementById(team === 'a' ? 'nameDisplayA' : 'nameDisplayB');
  const edit = document.getElementById(team === 'a' ? 'nameEditA' : 'nameEditB');
  const input = document.getElementById(team === 'a' ? 'nameInputA' : 'nameInputB');
  display.style.display = 'none';
  edit.style.display = '';
  input.value = team === 'a' ? game.teamA : game.teamB;
  input.focus();
  input.select();

  const commit = () => {
    const val = input.value.trim().slice(0, 12);
    if (team === 'a') game.teamA = val || t('us');
    else game.teamB = val || t('them');
    display.style.display = '';
    edit.style.display = 'none';
    save();
    renderAll();
  };
  input.onblur = commit;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') { commit(); e.preventDefault(); }
    if (e.key === 'Escape') { display.style.display = ''; edit.style.display = 'none'; }
  };
}

// ───── Input listeners ─────
document.getElementById('pointsInputA').addEventListener('input', updateAddBtnState);
document.getElementById('pointsInputB').addEventListener('input', updateAddBtnState);
document.getElementById('pointsInputA').addEventListener('keydown', e => { if (e.key === 'Enter') submitPoints(); });
document.getElementById('pointsInputB').addEventListener('keydown', e => { if (e.key === 'Enter') submitPoints(); });

// ───── Init ─────
load();
recalcScores();
renderAll();

// Service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
