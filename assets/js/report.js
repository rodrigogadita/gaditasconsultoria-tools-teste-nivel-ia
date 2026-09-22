/* ==========================================================================
   Relatório em PDF — mesma identidade visual do site (jsPDF, vetorial).
   Cores, cards, chips e o mapa de quadrantes seguem o que a tela mostra.
   ========================================================================== */

const C = {
  navy:      [34, 52, 142],      /* azul da logo Gaditas */
  deep:      [22, 22, 58],
  brand:     [109, 94, 252],
  brandInk:  [74, 58, 167],
  cyan:      [32, 197, 232],
  pink:      [255, 92, 138],
  ink:       [20, 20, 43],
  body:      [85, 84, 110],
  muted:     [133, 131, 156],
  line:      [227, 226, 238],
  soft:      [239, 237, 255],
  surface:   [250, 250, 253],
  white:     [255, 255, 255],
  series:    [[42, 120, 214], [235, 104, 52], [27, 175, 122], [237, 161, 0]]
};

const PAGE_W = 210, PAGE_H = 297, M = 16;
const CW = PAGE_W - M * 2;

async function buildPdf(result) {
  const ctor = window.jspdf && window.jspdf.jsPDF;
  if (!ctor || !result) throw new Error('jsPDF indisponível');

  const doc = new ctor({ unit: 'mm', format: 'a4', compress: true });
  let y = 0;

  /* ----------------------------- utilitários ----------------------------- */
  const fill = c => doc.setFillColor(c[0], c[1], c[2]);
  const draw = c => doc.setDrawColor(c[0], c[1], c[2]);
  const ink = c => doc.setTextColor(c[0], c[1], c[2]);
  const font = (weight, size) => doc.setFont('helvetica', weight).setFontSize(size);

  const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  /* faixa com degradê horizontal (o jsPDF não tem gradiente nativo) */
  const gradientRect = (x, yy, w, h, stops) => {
    const steps = 180;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const seg = t * (stops.length - 1);
      const idx = Math.min(Math.floor(seg), stops.length - 2);
      fill(lerp(stops[idx], stops[idx + 1], seg - idx));
      doc.rect(x + (w * i) / steps, yy, w / steps + 0.4, h, 'F');
    }
  };

  const card = (x, yy, w, h, opts = {}) => {
    fill(opts.bg || C.surface);
    if (opts.border) {
      draw(opts.border);
      doc.setLineWidth(opts.borderWidth || 0.3);
      doc.roundedRect(x, yy, w, h, 3, 3, 'FD');
    } else {
      doc.roundedRect(x, yy, w, h, 3, 3, 'F');
    }
    if (opts.accent) {            /* barra de destaque à esquerda */
      fill(opts.accent);
      doc.roundedRect(x, yy, 1.6, h, 0.8, 0.8, 'F');
      doc.rect(x + 0.8, yy, 0.8, h, 'F');
    }
  };

  const chip = (x, yy, label, bg, fg, size = 7) => {
    font('bold', size);
    const w = doc.getTextWidth(label) + 6;
    fill(bg);
    doc.roundedRect(x, yy, w, size * 0.62, size * 0.31, size * 0.31, 'F');
    ink(fg);
    doc.text(label, x + 3, yy + size * 0.44);
    return w;
  };

  /* anel de pontuação, desenhado como arco segmentado */
  const ring = (cx, cy, r, pct) => {
    draw(C.line);
    doc.setLineWidth(2.6);
    doc.circle(cx, cy, r, 'S');
    const segs = Math.max(2, Math.round(60 * pct));
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const a = -Math.PI / 2 + (i / segs) * pct * Math.PI * 2;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    const deltas = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
    doc.setLineWidth(2.6);
    doc.setLineCap('round');
    doc.setLineJoin('round');
    draw(C.brand);
    doc.lines(deltas, pts[0][0], pts[0][1]);
  };

  const footer = () => {
    draw(C.line);
    doc.setLineWidth(0.3);
    doc.line(M, PAGE_H - 16, PAGE_W - M, PAGE_H - 16);
    font('normal', 7.5);
    ink(C.muted);
    doc.text('Gaditas Consultoria · Diagnóstico de Nível de IA', M, PAGE_H - 11);
    doc.text(String(doc.getNumberOfPages()), PAGE_W - M, PAGE_H - 11, { align: 'right' });
  };

  const ensure = h => {
    if (y + h > PAGE_H - 22) {
      footer();
      doc.addPage();
      y = M + 6;
    }
  };

  const heading = label => {
    ensure(18);
    font('bold', 11.5);
    ink(C.brandInk);
    doc.text(label, M, y);
    y += 2.6;
    draw(C.line);
    doc.setLineWidth(0.4);
    doc.line(M, y, PAGE_W - M, y);
    y += 7;
  };

  const paragraph = (str, size = 9.8, color = C.body, weight = 'normal', width = CW) => {
    font(weight, size);
    const lines = doc.splitTextToSize(str, width);
    lines.forEach(line => {
      ensure(6);
      font(weight, size);          /* addPage não preserva o estado da fonte */
      ink(color);
      doc.text(line, M, y);
      y += size * 0.5;
    });
  };

  const bullet = (str, dotColor) => {
    font('normal', 9.6);
    const lines = doc.splitTextToSize(str, CW - 8);
    lines.forEach((line, i) => {
      ensure(6.5);
      font('normal', 9.6);
      if (i === 0) {
        fill(dotColor);
        doc.circle(M + 1.7, y - 1.2, 1.3, 'F');
      }
      ink(C.body);
      doc.text(line, M + 6, y);
      y += 4.9;
    });
    y += 1.4;
  };

  /* ------------------------------- cabeçalho ------------------------------ */
  gradientRect(0, 0, PAGE_W, 42, [C.navy, C.brandInk, C.brand, C.cyan]);
  /* leve realce inferior, como o card do site */
  fill(C.white);
  doc.rect(0, 41.4, PAGE_W, 0.6, 'F');

  let textX = M;
  try {
    const logo = await renderLogo('#ffffff', 560);
    const h = 24, w = h * (logo.width / logo.height);
    doc.addImage(logo.dataUrl, 'PNG', M, 9, w, h, 'logo', 'FAST');
    textX = M + w + 8;
  } catch (err) {
    console.warn('logo indisponível no PDF:', err);
  }

  ink(C.white);
  font('bold', 17);
  doc.text('Diagnóstico de Nível de IA', textX, 20);
  font('normal', 9);
  doc.setTextColor(226, 224, 255);
  const quando = result.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Relatório individual · ${quando}`, textX, 26.5);
  const tempo = result.minutes && /^\d+ min$/.test(result.minutes) ? ` · ${result.minutes}` : '';
  doc.text(`${result.mode} perguntas${tempo}`, textX, 32.5);

  /* --------------------------------- nome -------------------------------- */
  y = 55;
  font('bold', 8);
  ink(C.brandInk);
  doc.text('DIAGNÓSTICO DE', M, y);
  y += 9;
  font('bold', 25);
  ink(C.ink);
  doc.text(result.fullName || result.name, M, y);
  y += 7;

  /* ------------------------------ card do perfil -------------------------- */
  const cardH = 36;
  card(M, y, CW, cardH, { bg: C.soft, accent: C.brand });
  const cx = PAGE_W - M - 22;
  ring(cx, y + 16, 10.5, Math.max(result.overall / 5, 0.02));
  font('bold', 14);
  ink(C.brandInk);
  doc.text(result.overall.toFixed(1), cx, y + 17, { align: 'center' });
  font('normal', 6.5);
  ink(C.muted);
  doc.text('de 5', cx, y + 21.3, { align: 'center' });
  font('bold', 7.5);
  ink(C.brandInk);
  doc.text(result.band, cx, y + 31.5, { align: 'center' });

  chip(M + 7, y + 6, `QUADRANTE ${result.quadrant}`, C.brand, C.white);
  font('bold', 15);
  ink(C.ink);
  doc.text(result.profile.title, M + 7, y + 19.5);
  font('italic', 9.5);
  ink(C.body);
  doc.splitTextToSize(result.profile.tagline, CW - 58).forEach((line, i) => {
    doc.text(line, M + 7, y + 26 + i * 4.6);
  });
  y += cardH + 9;

  paragraph(result.profile.summary);
  y += 7;

  /* -------------------- mapa de quadrantes + dimensões -------------------- */
  heading('Como você se posiciona');

  const mapW = 82, mapH = 62, mapX = M, mapY = y + 3;
  const mid = { x: mapX + mapW / 2, y: mapY + mapH / 2 };

  const zonas = [
    { k: 'A', x: mapX, y: mapY, t: 'Criador em Formação' },
    { k: 'B', x: mid.x, y: mapY, t: 'Construtor Avançado' },
    { k: 'C', x: mapX, y: mid.y, t: 'Explorador Iniciante' },
    { k: 'D', x: mid.x, y: mid.y, t: 'Usuário Estratégico' }
  ];
  zonas.forEach(z => {
    const on = z.k === result.quadrant;
    fill(on ? C.soft : C.surface);
    draw(on ? C.brand : C.line);
    doc.setLineWidth(on ? 0.6 : 0.25);
    doc.roundedRect(z.x + 0.6, z.y + 0.6, mapW / 2 - 1.2, mapH / 2 - 1.2, 1.8, 1.8, 'FD');
    font('bold', 16);
    ink(on ? [199, 192, 252] : [235, 234, 244]);
    doc.text(z.k, z.x + mapW / 4, z.y + mapH / 4 + 6, { align: 'center' });
    font(on ? 'bold' : 'normal', 6.2);
    ink(on ? C.brandInk : C.muted);
    doc.text(z.t, z.x + mapW / 4, z.y + 5.5, { align: 'center' });
  });

  draw(C.muted);
  doc.setLineWidth(0.4);
  doc.line(mapX - 2, mid.y, mapX + mapW + 2, mid.y);
  doc.line(mid.x, mapY - 2, mid.x, mapY + mapH + 2);

  const dotX = mapX + ((result.x - 1) / 4) * mapW;
  const dotY = mapY + mapH - ((result.y - 1) / 4) * mapH;
  draw(C.brand);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(dotX, dotY, dotX, mid.y);
  doc.line(dotX, dotY, mid.x, dotY);
  doc.setLineDashPattern([], 0);
  fill(C.white);
  doc.circle(dotX, dotY, 2.9, 'F');
  fill(C.pink);
  doc.circle(dotX, dotY, 2, 'F');

  font('bold', 6.2);
  ink(C.muted);
  doc.text('QUERO CRIAR', mid.x, mapY - 4, { align: 'center' });
  doc.text('QUERO USAR', mid.x, mapY + mapH + 11.5, { align: 'center' });
  doc.text('SEI POUCO', mapX, mapY + mapH + 6);
  doc.text('SEI MUITO', mapX + mapW, mapY + mapH + 6, { align: 'right' });

  /* barras das dimensões */
  const barX = mapX + mapW + 12;
  const barW = CW - mapW - 12;
  let barY = mapY + 3;
  Object.entries(DIMENSIONS).forEach(([id, dim], i) => {
    const value = result.dimScores[id];
    font('bold', 8.6);
    ink(C.ink);
    doc.text(dim.label, barX + 4, barY);
    doc.text(value.toFixed(1), barX + barW, barY, { align: 'right' });
    fill(C.series[i]);
    doc.roundedRect(barX, barY - 1.9, 2.2, 2.2, 1.1, 1.1, 'F');
    fill([238, 238, 245]);
    doc.roundedRect(barX, barY + 2, barW, 3, 1.5, 1.5, 'F');
    fill(C.series[i]);
    doc.roundedRect(barX, barY + 2, Math.max((value / 5) * barW, 3), 3, 1.5, 1.5, 'F');
    font('normal', 7);
    ink(C.muted);
    doc.splitTextToSize(dim.desc, barW).forEach((line, n) => {
      doc.text(line, barX, barY + 9 + n * 3.2);
    });
    barY += 16;
  });

  y = mapY + mapH + 17;

  /* ------------------------------- destaques ------------------------------ */
  if (result.highlights.length) {
    ensure(34);
    heading('Seus destaques');
    result.highlights.forEach(item => bullet(stripEmoji(item), C.series[2]));
    y += 4;
  }

  if (result.gaps.length) {
    ensure(34);
    heading('Pontos de atenção');
    result.gaps.forEach(item => bullet(stripEmoji(item), C.series[1]));
    y += 4;
  }

  /* -------------------------------- roadmap ------------------------------- */
  ensure(52);
  heading('Roadmap de evolução');
  const colW = (CW - 8) / 3;
  const roadTop = y;
  let roadH = 0;
  result.profile.roadmap.forEach((item, i) => {
    const x = M + i * (colW + 4);
    font('normal', 8.4);
    const lines = doc.splitTextToSize(item.acao, colW - 10);
    roadH = Math.max(roadH, 16 + lines.length * 4);
  });
  result.profile.roadmap.forEach((item, i) => {
    const x = M + i * (colW + 4);
    card(x, roadTop, colW, roadH, { bg: C.surface, border: C.line, accent: C.brand });
    font('bold', 6.6);
    ink(C.brandInk);
    doc.text(item.prazo.toUpperCase(), x + 6, roadTop + 7);
    font('normal', 8.4);
    ink(C.body);
    doc.splitTextToSize(item.acao, colW - 10).forEach((line, n) => {
      doc.text(line, x + 6, roadTop + 13 + n * 4);
    });
  });
  y = roadTop + roadH + 12;

  /* ----------------------------- próximos passos -------------------------- */
  ensure(46);
  heading('Próximos passos');
  result.profile.steps.forEach((step, i) => {
    ensure(14);
    card(M, y - 4.5, CW, 11, { bg: C.soft });
    fill(C.brand);
    doc.roundedRect(M + 4, y - 3.2, 5.4, 5.4, 1.6, 1.6, 'F');
    font('bold', 7.5);
    ink(C.white);
    doc.text(String(i + 1), M + 6.7, y + 0.7, { align: 'center' });
    font('normal', 9.6);
    ink(C.ink);
    doc.text(step, M + 13, y + 0.6);
    y += 14;
  });

  y += 2;
  ensure(12);
  font('italic', 8.8);
  ink(C.muted);
  doc.text('Escolha um. Um só, e faça esta semana.', M, y);

  footer();

  const slug = (result.fullName || result.name).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'resultado';
  doc.save(`diagnostico-ia-${slug}.pdf`);
}

/* Emojis não existem nas fontes padrão do PDF — sairiam como caixinhas. */
function stripEmoji(str) {
  return str.replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, '').trim();
}
