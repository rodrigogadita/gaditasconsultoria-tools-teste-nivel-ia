/* ==========================================================================
   Diagnóstico de Nível de IA — controle de telas, atalhos e resultado.
   ========================================================================== */

const STORAGE_KEY = 'gaditas-diagnostico-ia-v1';
const $ = sel => document.querySelector(sel);

const state = {
  stage: 'welcome',      /* welcome | mode | quiz | review | result */
  name: '',
  mode: 20,
  questions: [],
  answers: {},           /* id -> 1..5 */
  index: 0,
  result: null,
  nudgeCount: 0,
  usedNudges: new Set()
};

/* ------------------------------- utilidades ------------------------------- */
const shuffle = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const mean = nums => (nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0);

function firstName(full) {
  const clean = full.trim().replace(/\s+/g, ' ');
  if (!clean) return 'Você';
  const part = clean.split(' ')[0];
  return part.charAt(0).toUpperCase() + part.slice(1);
}

/* Sorteio balanceado: mesmo número de perguntas por dimensão, ordem intercalada. */
function sampleQuestions(total) {
  const dims = Object.keys(DIMENSIONS);
  const base = Math.floor(total / dims.length);
  const extra = shuffle(dims).slice(0, total % dims.length);

  const queues = {};
  dims.forEach(d => {
    const take = base + (extra.includes(d) ? 1 : 0);
    queues[d] = shuffle(QUESTIONS.filter(q => q.dim === d)).slice(0, take);
  });

  const out = [];
  while (out.length < total) {
    shuffle(dims).forEach(d => {
      if (queues[d].length && out.length < total) out.push(queues[d].shift());
    });
  }
  return out;
}

/* ------------------------------ persistência ------------------------------ */
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      stage: state.stage, name: state.name, mode: state.mode,
      questionIds: state.questions.map(q => q.id),
      answers: state.answers, index: state.index
    }));
  } catch (e) { /* modo privado: segue sem salvar */ }
}

function clearSave() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
}

function restore() {
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return false; }
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (!data || !['quiz', 'review'].includes(data.stage) || !data.questionIds?.length) return false;
    const byId = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
    const questions = data.questionIds.map(id => byId[id]).filter(Boolean);
    if (questions.length !== data.questionIds.length) return false;
    Object.assign(state, {
      name: data.name || '', mode: data.mode || questions.length,
      questions, answers: data.answers || {},
      index: Math.min(data.index || 0, questions.length - 1)
    });
    go(data.stage);
    toast('Retomamos de onde você parou.');
    return true;
  } catch (e) { return false; }
}

/* --------------------------------- telas --------------------------------- */
const SCREENS = ['welcome', 'mode', 'quiz', 'review', 'result'];

function go(stage) {
  state.stage = stage;
  SCREENS.forEach(s => {
    const node = $('#screen-' + s);
    const active = s === stage;
    node.classList.toggle('is-active', active);
    node.hidden = !active;
  });
  $('#btn-restart-top').classList.toggle('is-hidden', stage === 'welcome');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (stage === 'quiz') renderQuestion();
  if (stage === 'review') renderReview();
  save();
}

/* --------------------------------- toasts -------------------------------- */
function toast(message, ms = 3600) {
  const stack = $('#toast-stack');
  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = '<i></i><span></span>';
  node.querySelector('span').textContent = message;
  stack.appendChild(node);
  setTimeout(() => {
    node.classList.add('out');
    setTimeout(() => node.remove(), 380);
  }, ms);
}

function maybeNudge(value, answeredCount) {
  const total = state.questions.length;
  if (answeredCount === Math.ceil(total / 2)) {
    return toast(pickNudge('progress'));
  }
  state.nudgeCount++;
  if (state.nudgeCount % 3 !== 0) return;
  const bucket = value >= 4 ? 'high' : value === 3 ? 'mid' : 'low';
  toast(pickNudge(bucket));
}

function pickNudge(bucket) {
  const pool = NUDGES[bucket].filter(m => !state.usedNudges.has(m));
  const list = pool.length ? pool : NUDGES[bucket];
  const msg = list[Math.floor(Math.random() * list.length)];
  state.usedNudges.add(msg);
  return msg;
}

/* -------------------------------- pergunta ------------------------------- */
function renderQuestion() {
  const q = state.questions[state.index];
  const total = state.questions.length;
  const pct = Math.round(((state.index + 1) / total) * 100);

  $('#progress-label').textContent = `Pergunta ${state.index + 1} de ${total}`;
  $('#progress-pct').textContent = pct + '%';
  const fill = $('#progress-fill');
  fill.style.width = pct + '%';
  fill.setAttribute('aria-valuenow', pct);

  const dots = $('#progress-dots');
  dots.innerHTML = '';
  state.questions.forEach((item, i) => {
    const dot = document.createElement('i');
    if (state.answers[item.id]) dot.classList.add('done');
    if (i === state.index) dot.classList.add('current');
    dots.appendChild(dot);
  });

  $('#question-dim').textContent = DIMENSIONS[q.dim].label;
  $('#question-text').textContent = `${q.emoji} ${q.text}`;

  const scale = $('#scale');
  scale.innerHTML = '';
  for (let v = 1; v <= 5; v++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scale-btn';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(state.answers[q.id] === v));
    btn.setAttribute('aria-label', `${v} — ${SCALE_LABELS[v - 1]}`);
    btn.dataset.value = v;
    btn.innerHTML = `${v}<small>${v === 1 ? 'nunca' : v === 5 ? 'sempre' : ''}</small>`;
    btn.addEventListener('click', () => answer(v, btn));
    scale.appendChild(btn);
  }

  $('#btn-back').style.visibility = state.index === 0 ? 'hidden' : 'visible';
  const next = $('#btn-next');
  next.disabled = !state.answers[q.id];
  next.textContent = state.index === total - 1 ? 'Revisar →' : 'Avançar →';
}

function answer(value, btn) {
  const q = state.questions[state.index];
  const isNew = !state.answers[q.id];
  state.answers[q.id] = value;

  $('#scale').querySelectorAll('.scale-btn').forEach(b => {
    b.setAttribute('aria-checked', String(Number(b.dataset.value) === value));
  });
  if (btn) { btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse'); }
  $('#btn-next').disabled = false;
  save();

  if (isNew) maybeNudge(value, Object.keys(state.answers).length);
  setTimeout(nextQuestion, 320);
}

function nextQuestion() {
  const q = state.questions[state.index];
  if (!state.answers[q.id]) return;
  if (state.index === state.questions.length - 1) {
    go('review');
  } else {
    state.index++;
    renderQuestion();
    save();
  }
}

function prevQuestion() {
  if (state.index === 0) return;
  state.index--;
  renderQuestion();
  save();
}

/* --------------------------------- revisão ------------------------------- */
function renderReview() {
  const list = $('#review-list');
  list.innerHTML = '';
  state.questions.forEach((q, i) => {
    const li = document.createElement('li');
    li.className = 'review-item';
    li.innerHTML = `
      <span class="review-num">${i + 1}</span>
      <span class="review-text"><b>${DIMENSIONS[q.dim].label}</b>${q.emoji} ${q.text}</span>
      <button class="review-score" type="button" title="Editar esta resposta">${state.answers[q.id] || '-'}</button>`;
    li.querySelector('.review-score').addEventListener('click', () => {
      state.index = i;
      go('quiz');
    });
    list.appendChild(li);
  });
}

/* -------------------------------- resultado ------------------------------ */
function computeResult() {
  const dimScores = {};
  Object.keys(DIMENSIONS).forEach(d => {
    const values = state.questions.filter(q => q.dim === d).map(q => state.answers[q.id]).filter(Boolean);
    dimScores[d] = values.length ? mean(values) : 3;
  });

  const axis = key => Object.entries(AXIS_WEIGHTS[key])
    .reduce((sum, [dim, w]) => sum + dimScores[dim] * w, 0);

  const x = axis('x');
  const y = axis('y');
  const quadrant = y >= 3 ? (x >= 3 ? 'B' : 'A') : (x >= 3 ? 'D' : 'C');
  const overall = mean(Object.values(dimScores));
  const band = LEVEL_BANDS.find(b => overall < b.max) || LEVEL_BANDS[LEVEL_BANDS.length - 1];

  const scored = state.questions
    .map(q => ({ q, v: state.answers[q.id] || 0 }))
    .filter(item => item.v > 0);

  const highlights = scored.filter(i => i.v >= 4)
    .sort((a, b) => b.v - a.v).slice(0, 5).map(i => `${i.q.emoji} ${i.q.text}`);
  const gaps = scored.filter(i => i.v <= 3)
    .sort((a, b) => a.v - b.v).slice(0, 4).map(i => `${i.q.emoji} ${i.q.text}`);

  return {
    name: firstName(state.name), fullName: state.name.trim(),
    dimScores, x, y, quadrant, overall,
    band: band.name, profile: PROFILES[quadrant],
    highlights, gaps, mode: state.questions.length,
    date: new Date()
  };
}

function renderResult() {
  const r = computeResult();
  state.result = r;

  $('#result-name').textContent = `${r.name} · quadrante ${r.quadrant} · ${r.mode} perguntas`;
  $('#result-title').textContent = r.profile.title;
  $('#result-tagline').textContent = r.profile.tagline;
  $('#result-summary').textContent = r.profile.summary;
  $('#score-value').textContent = r.overall.toFixed(1);
  $('#score-band').textContent = r.band;

  const circumference = 2 * Math.PI * 52;
  const ring = $('#ring-fg');
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference;
  requestAnimationFrame(() => {
    ring.style.strokeDashoffset = circumference * (1 - r.overall / 5);
  });

  $('#quadrant-caption').textContent =
    `Horizontal: o quanto você sabe (${r.x.toFixed(2)} de 5). Vertical: usar ou criar (${r.y.toFixed(2)} de 5).`;
  renderQuadrant($('#quadrant-wrap'), { name: r.name, x: r.x, y: r.y, quadrant: r.quadrant });
  renderRadar($('#radar-wrap'), r.dimScores);

  const bars = $('#dim-bars');
  bars.innerHTML = '';
  Object.entries(DIMENSIONS).forEach(([id, dim], i) => {
    const value = r.dimScores[id];
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <div class="bar-head">
        <span class="bar-name"><i class="bar-chip" style="background:var(--series-${i + 1})"></i>${dim.label}</span>
        <span class="bar-value">${value.toFixed(1)}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="background:var(--series-${i + 1})"></div></div>
      <span class="bar-desc">${dim.desc}</span>`;
    bars.appendChild(row);
    requestAnimationFrame(() => {
      row.querySelector('.bar-fill').style.width = (value / 5) * 100 + '%';
    });
  });

  const table = $('#table-wrap');
  table.innerHTML = `<table><caption class="sr-only">Pontuação por dimensão</caption>
    <thead><tr><th>Dimensão</th><th>O que mede</th><th>Nota</th></tr></thead><tbody>
    ${Object.entries(DIMENSIONS).map(([id, d]) =>
      `<tr><td>${d.label}</td><td>${d.desc}</td><td>${r.dimScores[id].toFixed(2)}</td></tr>`).join('')}
    <tr><td><b>Geral</b></td><td>Média das quatro dimensões</td><td><b>${r.overall.toFixed(2)}</b></td></tr>
    </tbody></table>`;

  fillList($('#list-highlights'), r.highlights.length ? r.highlights
    : ['Você foi sincero nas respostas — é daí que sai um plano que funciona.']);
  fillList($('#list-gaps'), r.gaps.length ? r.gaps
    : ['Nenhum ponto crítico apareceu. O próximo passo é profundidade, não cobertura.']);

  const roadmap = $('#roadmap');
  roadmap.innerHTML = r.profile.roadmap
    .map(item => `<li><b>${item.prazo}</b><span>${item.acao}</span></li>`).join('');

  const steps = $('#next-steps');
  steps.innerHTML = r.profile.steps
    .map((s, i) => `<li><span>${i + 1}</span>${s}</li>`).join('');

  go('result');
  clearSave();
  setTimeout(() => toast(`Diagnóstico pronto, ${r.name}. Quadrante ${r.quadrant}.`, 4200), 500);
}

function fillList(node, items) {
  node.innerHTML = items.map(i => `<li>${i}</li>`).join('');
}

function summaryText(r) {
  return [
    `Diagnóstico de Nível de IA — ${r.name}`,
    `Perfil: ${r.profile.title} (quadrante ${r.quadrant})`,
    `Nota geral: ${r.overall.toFixed(2)} de 5 — ${r.band}`,
    `Conhecimento ${r.dimScores.conhecimento.toFixed(1)} · Critério ${r.dimScores.criterio.toFixed(1)} · Uso ${r.dimScores.uso.toFixed(1)} · Criação ${r.dimScores.criacao.toFixed(1)}`,
    '',
    'Próximos passos:',
    ...r.profile.steps.map(s => `- ${s}`)
  ].join('\n');
}

/* --------------------------------- eventos ------------------------------- */
function bind() {
  $('#form-name').addEventListener('submit', e => {
    e.preventDefault();
    const value = $('#input-name').value.trim();
    if (value.length < 2) {
      $('#name-error').hidden = false;
      $('#input-name').focus();
      return;
    }
    $('#name-error').hidden = true;
    state.name = value;
    $('#mode-greeting').textContent = `Prazer, ${firstName(value)}!`;
    go('mode');
    document.querySelector('.mode-card').focus();
  });

  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => startQuiz(Number(card.dataset.mode)));
  });

  $('#btn-next').addEventListener('click', nextQuestion);
  $('#btn-back').addEventListener('click', prevQuestion);
  $('#btn-review-back').addEventListener('click', () => { state.index = state.questions.length - 1; go('quiz'); });
  $('#btn-finish').addEventListener('click', renderResult);
  $('#btn-restart').addEventListener('click', restart);
  $('#btn-restart-top').addEventListener('click', restart);

  $('#btn-table').addEventListener('click', e => {
    const wrap = $('#table-wrap');
    wrap.hidden = !wrap.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!wrap.hidden));
    e.currentTarget.textContent = wrap.hidden ? 'Ver como tabela' : 'Ocultar tabela';
  });

  $('#btn-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summaryText(state.result));
      toast('Resumo copiado para a área de transferência.');
    } catch (e) {
      toast('Não foi possível copiar aqui. Use o PDF.');
    }
  });

  $('#btn-pdf').addEventListener('click', () => {
    try {
      buildPdf(state.result);
      toast('PDF gerado.');
    } catch (err) {
      console.error(err);
      toast('Não consegui gerar o PDF. Abrindo a impressão do navegador.');
      window.print();
    }
  });

  $('#btn-theme').addEventListener('click', toggleTheme);
  document.addEventListener('keydown', onKey);
}

function startQuiz(mode) {
  state.mode = mode;
  state.questions = sampleQuestions(mode);
  state.answers = {};
  state.index = 0;
  state.nudgeCount = 0;
  state.usedNudges.clear();
  document.querySelectorAll('.mode-card').forEach(c => {
    c.setAttribute('aria-checked', String(Number(c.dataset.mode) === mode));
  });
  go('quiz');
}

function restart() {
  clearSave();
  state.answers = {};
  state.questions = [];
  state.index = 0;
  state.result = null;
  go('welcome');
  $('#input-name').value = state.name;
  $('#input-name').focus();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const next = current ? (current === 'dark' ? 'light' : 'dark') : (prefersDark ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('gaditas-theme', next); } catch (e) { /* noop */ }
}

function onKey(e) {
  const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

  if (!typing && (e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey) {
    toggleTheme();
    return;
  }

  if (state.stage === 'mode') {
    if (e.key === '1' || e.key === '2') {
      e.preventDefault();
      startQuiz(e.key === '1' ? 20 : 10);
    }
    if (['ArrowRight', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      const cards = [...document.querySelectorAll('.mode-card')];
      const at = cards.indexOf(document.activeElement);
      cards[(at + (e.key === 'ArrowRight' ? 1 : cards.length - 1) + cards.length) % cards.length].focus();
    }
    return;
  }

  if (state.stage === 'quiz') {
    if (/^[1-5]$/.test(e.key)) {
      e.preventDefault();
      const btn = $('#scale').querySelector(`[data-value="${e.key}"]`);
      answer(Number(e.key), btn);
      return;
    }
    if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); nextQuestion(); }
    if (e.key === 'ArrowLeft' || (e.key === 'Backspace' && !typing)) { e.preventDefault(); prevQuestion(); }
    return;
  }

  if (state.stage === 'review' && e.key === 'Enter') {
    e.preventDefault();
    renderResult();
  }
}

/* ---------------------------------- boot --------------------------------- */
(function init() {
  try {
    const saved = localStorage.getItem('gaditas-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  } catch (e) { /* noop */ }

  bind();
  if (!restore()) {
    go('welcome');
    setTimeout(() => $('#input-name').focus(), 300);
  }
})();
