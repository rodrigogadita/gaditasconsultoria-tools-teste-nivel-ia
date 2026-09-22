/* ==========================================================================
   Gráficos em SVG puro: mapa de quadrantes e radar das 4 dimensões.
   Paleta de dados validada (contraste + daltonismo) — ver README.
   ========================================================================== */

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}, parent = null) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  if (parent) parent.appendChild(node);
  return node;
}

function text(parent, content, attrs = {}) {
  const t = el('text', attrs, parent);
  t.textContent = content;
  return t;
}

function makeTooltip(container) {
  const tip = document.createElement('div');
  tip.className = 'viz-tooltip';
  container.appendChild(tip);
  return {
    show(html, x, y) {
      tip.innerHTML = html;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      tip.classList.add('show');
    },
    hide() { tip.classList.remove('show'); }
  };
}

/* Converte um ponto do sistema do SVG para pixels dentro do container. */
function svgPointToPx(svg, x, y) {
  const box = svg.viewBox.baseVal;
  const rect = svg.getBoundingClientRect();
  return {
    x: (x / box.width) * rect.width,
    y: (y / box.height) * rect.height
  };
}

const QUADRANT_ZONES = {
  A: { side: 'left',  half: 'top',    title: 'Criador em Formação',  hint: 'Sabe pouco · quer criar' },
  B: { side: 'right', half: 'top',    title: 'Construtor Avançado',  hint: 'Sabe muito · cria' },
  C: { side: 'left',  half: 'bottom', title: 'Explorador Iniciante', hint: 'Sabe pouco · usa' },
  D: { side: 'right', half: 'bottom', title: 'Usuário Estratégico',  hint: 'Sabe muito · usa' }
};

/* --------------------------- MAPA DE QUADRANTES --------------------------- */
function renderQuadrant(container, data) {
  container.innerHTML = '';
  const W = 720, H = 560;
  const L = 132, R = 588, T = 58, B = 498;          /* área do gráfico */
  const cx = (L + R) / 2, cy = (T + B) / 2;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`,
    role: 'img',
    'aria-label': `Mapa de quadrantes. ${data.name} está no quadrante ${data.quadrant}, ` +
      `com ${data.x.toFixed(2)} de 5 em conhecimento e ${data.y.toFixed(2)} de 5 na escala usar-criar.`
  }, container);

  const defs = el('defs', {}, svg);
  const grad = el('linearGradient', { id: 'dotGrad', x1: '0', y1: '0', x2: '1', y2: '1' }, defs);
  el('stop', { offset: '0', 'stop-color': '#6d5efc' }, grad);
  el('stop', { offset: '1', 'stop-color': '#ff5c8a' }, grad);
  const arrow = el('marker', {
    id: 'arrowHead', viewBox: '0 0 10 10', refX: '8', refY: '5',
    markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse'
  }, defs);
  el('path', { d: 'M0 0 L10 5 L0 10 z', fill: 'var(--axis)' }, arrow);

  const sx = v => L + ((v - 1) / 4) * (R - L);
  const sy = v => B - ((v - 1) / 4) * (B - T);

  /* zonas */
  const zones = [
    { key: 'A', x: L, y: T, w: cx - L, h: cy - T },
    { key: 'B', x: cx, y: T, w: R - cx, h: cy - T },
    { key: 'C', x: L, y: cy, w: cx - L, h: B - cy },
    { key: 'D', x: cx, y: cy, w: R - cx, h: B - cy }
  ];
  const tip = makeTooltip(container);

  zones.forEach(z => {
    const active = z.key === data.quadrant;
    const rect = el('rect', {
      x: z.x + 2, y: z.y + 2, width: z.w - 4, height: z.h - 4, rx: 14,
      class: 'q-zone',
      fill: active ? 'var(--brand-soft)' : 'var(--surface-2)',
      stroke: active ? 'var(--brand)' : 'var(--border)',
      'stroke-width': active ? 2 : 1
    }, svg);

    const info = QUADRANT_ZONES[z.key];
    rect.addEventListener('mousemove', e => {
      const r = container.getBoundingClientRect();
      tip.show(`<b>Quadrante ${z.key} — ${info.title}</b><small>${info.hint}</small>`,
        e.clientX - r.left, e.clientY - r.top);
    });
    rect.addEventListener('mouseleave', () => tip.hide());

    /* letra como marca d'água no centro; título no topo da zona, longe do ponto */
    const lx = z.x + z.w / 2, ly = z.y + z.h / 2;
    text(svg, z.key, {
      x: lx, y: ly + 20, 'text-anchor': 'middle', class: 'q-letter',
      'font-size': 58, opacity: active ? .2 : .13,
      fill: active ? 'var(--brand)' : 'var(--axis)'
    });
    text(svg, `${z.key} · ${info.title}`, {
      x: lx, y: z.y + 24, 'text-anchor': 'middle', class: 'q-zone-label',
      'font-weight': active ? 700 : 400,
      fill: active ? 'var(--brand-ink)' : 'var(--text-muted)',
      opacity: active ? 1 : .75
    });
  });

  /* grade */
  for (let v = 1; v <= 5; v++) {
    if (v !== 3) {
      el('line', { x1: sx(v), y1: T, x2: sx(v), y2: B, stroke: 'var(--grid)', 'stroke-width': 1, 'stroke-dasharray': '2 6' }, svg);
      el('line', { x1: L, y1: sy(v), x2: R, y2: sy(v), stroke: 'var(--grid)', 'stroke-width': 1, 'stroke-dasharray': '2 6' }, svg);
    }
    if (v !== 3) {   /* o centro já é marcado pelo cruzamento dos eixos */
      text(svg, v, { x: sx(v), y: B + 18, 'text-anchor': 'middle', class: 'tick-text' });
      text(svg, v, { x: L - 12, y: sy(v) + 4, 'text-anchor': 'end', class: 'tick-text' });
    }
  }

  /* eixos */
  el('line', { x1: L - 16, y1: cy, x2: R + 16, y2: cy, stroke: 'var(--axis)', 'stroke-width': 1.6, 'marker-start': 'url(#arrowHead)', 'marker-end': 'url(#arrowHead)' }, svg);
  el('line', { x1: cx, y1: T - 16, x2: cx, y2: B + 16, stroke: 'var(--axis)', 'stroke-width': 1.6, 'marker-start': 'url(#arrowHead)', 'marker-end': 'url(#arrowHead)' }, svg);

  /* rótulos dos eixos */
  const top = text(svg, '', { x: cx, y: T - 30, 'text-anchor': 'middle', class: 'axis-label axis-label-strong', 'font-size': 14 });
  top.appendChild(makeTspan('Quero CRIAR ', true));
  top.appendChild(makeTspan('soluções de IA', false));

  const bottom = text(svg, '', { x: cx, y: B + 44, 'text-anchor': 'middle', class: 'axis-label axis-label-strong', 'font-size': 14 });
  bottom.appendChild(makeTspan('Quero USAR ', true));
  bottom.appendChild(makeTspan('soluções de IA no dia a dia', false));

  wrapLabel(svg, ['Acredito que', 'SEI POUCO', 'sobre IA'], L - 34, cy - 18, 'end');
  wrapLabel(svg, ['Acredito que', 'SEI MUITO', 'sobre IA'], R + 34, cy - 18, 'start');

  /* linhas-guia até os eixos */
  const px = sx(data.x), py = sy(data.y);
  el('line', { x1: px, y1: py, x2: px, y2: cy, stroke: 'var(--brand)', 'stroke-width': 1.5, 'stroke-dasharray': '3 5', opacity: .45 }, svg);
  el('line', { x1: px, y1: py, x2: cx, y2: py, stroke: 'var(--brand)', 'stroke-width': 1.5, 'stroke-dasharray': '3 5', opacity: .45 }, svg);

  /* marcador */
  const g = el('g', { class: 'dot-group' }, svg);
  const pulse = el('circle', { cx: px, cy: py, r: 13, fill: 'var(--brand)', opacity: .35 }, g);
  el('animate', { attributeName: 'r', values: '13;30;13', dur: '2.8s', repeatCount: 'indefinite' }, pulse);
  el('animate', { attributeName: 'opacity', values: '.35;0;.35', dur: '2.8s', repeatCount: 'indefinite' }, pulse);

  const dot = el('circle', {
    cx: px, cy: py, r: 0, fill: 'url(#dotGrad)',
    stroke: 'var(--surface-1)', 'stroke-width': 3
  }, g);
  el('animate', { attributeName: 'r', from: '0', to: '13', dur: '.7s', begin: '.15s', fill: 'freeze', calcMode: 'spline', keySplines: '.2 .8 .3 1', keyTimes: '0;1' }, dot);

  const labelY = py < T + 46 ? py + 34 : py - 26;
  const anchor = px > R - 90 ? 'end' : (px < L + 90 ? 'start' : 'middle');
  text(svg, data.name, { x: px, y: labelY, 'text-anchor': anchor, class: 'dot-label' });
  text(svg, `${data.x.toFixed(1)} · ${data.y.toFixed(1)}`, {
    x: px, y: labelY + 15, 'text-anchor': anchor, class: 'tick-text'
  });

  const hit = el('circle', { cx: px, cy: py, r: 26, fill: 'transparent', style: 'cursor:pointer' }, g);
  hit.addEventListener('mousemove', e => {
    const r = container.getBoundingClientRect();
    tip.show(
      `<b>${data.name}</b><small>Conhecimento ${data.x.toFixed(2)} de 5<br>Usar → criar ${data.y.toFixed(2)} de 5<br>Quadrante ${data.quadrant}</small>`,
      e.clientX - r.left, e.clientY - r.top
    );
  });
  hit.addEventListener('mouseleave', () => tip.hide());

  function makeTspan(content, strong) {
    const t = document.createElementNS(SVG_NS, 'tspan');
    t.textContent = content;
    if (strong) { t.setAttribute('font-weight', '700'); t.setAttribute('fill', 'var(--brand-ink)'); }
    else { t.setAttribute('fill', 'var(--text-secondary)'); t.setAttribute('font-weight', '500'); }
    return t;
  }

  function wrapLabel(svgRoot, lines, x, y, anchor) {
    lines.forEach((line, i) => {
      const strong = line === line.toUpperCase();
      text(svgRoot, line, {
        x, y: y + i * 17, 'text-anchor': anchor,
        class: 'axis-label',
        'font-weight': strong ? 700 : 500,
        fill: strong ? 'var(--text-primary)' : 'var(--text-secondary)'
      });
    });
  }

  return svg;
}

/* ---------------------------------- RADAR --------------------------------- */
function renderRadar(container, dims) {
  container.innerHTML = '';
  const W = 400, H = 360, cx = 200, cy = 174, R = 104;

  const order = [
    { id: 'criacao', angle: -90, anchor: 'middle', dx: 0, dy: -20 },
    { id: 'conhecimento', angle: 0, anchor: 'start', dx: 14, dy: 0 },
    { id: 'uso', angle: 90, anchor: 'middle', dx: 0, dy: 30 },
    { id: 'criterio', angle: 180, anchor: 'end', dx: -14, dy: 0 }
  ];

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'Radar das quatro dimensões: ' +
      order.map(o => `${DIMENSIONS[o.id].label} ${dims[o.id].toFixed(1)} de 5`).join(', ') + '.'
  }, container);

  const pt = (angle, value) => {
    const r = (value / 5) * R;
    const rad = (angle * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  /* anéis */
  for (let v = 1; v <= 5; v++) {
    const pts = order.map(o => pt(o.angle, v).join(',')).join(' ');
    el('polygon', {
      points: pts, fill: 'none', stroke: 'var(--grid)', 'stroke-width': 1,
      'stroke-dasharray': v === 5 ? null : '2 5'
    }, svg);
  }
  /* raios */
  order.forEach(o => {
    const [x, y] = pt(o.angle, 5);
    el('line', { x1: cx, y1: cy, x2: x, y2: y, stroke: 'var(--grid)', 'stroke-width': 1 }, svg);
  });

  /* polígono de dados */
  const dataPts = order.map(o => pt(o.angle, Math.max(dims[o.id], 0.2)));
  const poly = el('polygon', {
    points: dataPts.map(p => p.join(',')).join(' '),
    fill: 'var(--series-1)', 'fill-opacity': .16,
    stroke: 'var(--series-1)', 'stroke-width': 2, 'stroke-linejoin': 'round',
    style: `transform-origin:${cx}px ${cy}px; transform:scale(.05); animation:radar-grow .9s cubic-bezier(.2,.8,.3,1) .15s forwards`
  }, svg);
  const tip = makeTooltip(container);

  /* vértices + rótulos diretos (a paleta exige rótulo visível no tema claro) */
  order.forEach((o, i) => {
    const dim = DIMENSIONS[o.id];
    const [x, y] = dataPts[i];
    el('circle', { cx: x, cy: y, r: 6, fill: `var(--series-${i === 0 ? 4 : i === 1 ? 1 : i === 2 ? 3 : 2})`, stroke: 'var(--surface-1)', 'stroke-width': 2 }, svg);

    const [lx, ly] = pt(o.angle, 5);
    const tx = lx + o.dx, ty = ly + o.dy;
    text(svg, dim.label, {
      x: tx, y: ty, 'text-anchor': o.anchor, class: 'axis-label axis-label-strong', 'font-size': 13
    });
    text(svg, `${dims[o.id].toFixed(1)} / 5`, {
      x: tx, y: ty + 15, 'text-anchor': o.anchor, class: 'tick-text', 'font-size': 12
    });

    const hit = el('circle', { cx: x, cy: y, r: 16, fill: 'transparent', style: 'cursor:pointer' }, svg);
    hit.addEventListener('mousemove', e => {
      const r = container.getBoundingClientRect();
      tip.show(`<b>${dim.label} · ${dims[o.id].toFixed(2)}</b><small>${dim.desc}</small>`,
        e.clientX - r.left, e.clientY - r.top);
    });
    hit.addEventListener('mouseleave', () => tip.hide());
  });

  return svg;
}
