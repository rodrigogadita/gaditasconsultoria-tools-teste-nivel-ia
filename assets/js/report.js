/* ==========================================================================
   Geração do PDF do diagnóstico (jsPDF, vetorial — texto selecionável).
   ========================================================================== */

const PDF_COLORS = {
  brand: [109, 94, 252],
  brandDark: [74, 58, 167],
  ink: [20, 20, 43],
  body: [85, 84, 110],
  muted: [133, 131, 156],
  line: [227, 226, 238],
  soft: [239, 237, 255],
  series: [[42, 120, 214], [235, 104, 52], [27, 175, 122], [237, 161, 0]]
};

function buildPdf(result) {
  const ctor = window.jspdf && window.jspdf.jsPDF;
  if (!ctor || !result) throw new Error('jsPDF indisponível');

  const doc = new ctor({ unit: 'mm', format: 'a4' });
  const PAGE_W = 210, PAGE_H = 297, M = 18;
  const CONTENT_W = PAGE_W - M * 2;
  let y = 0;

  const setColor = (c, kind = 'text') => {
    if (kind === 'text') doc.setTextColor(c[0], c[1], c[2]);
    if (kind === 'fill') doc.setFillColor(c[0], c[1], c[2]);
    if (kind === 'draw') doc.setDrawColor(c[0], c[1], c[2]);
  };

  const ensure = h => {
    if (y + h > PAGE_H - 22) {
      footer();
      doc.addPage();
      y = M + 4;
    }
  };

  const heading = label => {
    ensure(16);
    doc.setFont('helvetica', 'bold').setFontSize(12);
    setColor(PDF_COLORS.brandDark);
    doc.text(label, M, y);
    y += 2.5;
    setColor(PDF_COLORS.line, 'draw');
    doc.setLineWidth(0.4);
    doc.line(M, y, M + CONTENT_W, y);
    y += 7;
  };

  const paragraph = (str, size = 10, color = PDF_COLORS.body, font = 'normal') => {
    doc.setFont('helvetica', font).setFontSize(size);
    setColor(color);
    const lines = doc.splitTextToSize(str, CONTENT_W);
    lines.forEach(line => {
      ensure(6);
      doc.text(line, M, y);
      y += size * 0.52;
    });
  };

  const bullet = (str, marker, markerColor) => {
    doc.setFont('helvetica', 'normal').setFontSize(10);
    const lines = doc.splitTextToSize(str, CONTENT_W - 7);
    lines.forEach((line, i) => {
      ensure(6.5);
      if (i === 0) {
        setColor(markerColor);
        doc.setFont('helvetica', 'bold');
        doc.text(marker, M, y);
        doc.setFont('helvetica', 'normal');
      }
      setColor(PDF_COLORS.body);
      doc.text(line, M + 6, y);
      y += 5.2;
    });
    y += 1.6;
  };

  const footer = () => {
    setColor(PDF_COLORS.muted);
    doc.setFont('helvetica', 'normal').setFontSize(8);
    const stamp = result.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Gaditas Consultoria · Diagnóstico de Nível de IA · ${stamp}`, M, PAGE_H - 12);
    doc.text(String(doc.getNumberOfPages()), PAGE_W - M, PAGE_H - 12, { align: 'right' });
  };

  /* ------------------------------- cabeçalho ------------------------------ */
  setColor(PDF_COLORS.brand, 'fill');
  doc.rect(0, 0, PAGE_W, 42, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(19);
  doc.setTextColor(255, 255, 255);
  doc.text('Diagnóstico de Nível de IA', M, 20);
  doc.setFont('helvetica', 'normal').setFontSize(10);
  doc.text('Gaditas Consultoria', M, 28);
  doc.setFontSize(9);
  doc.text(`${result.mode} perguntas respondidas`, PAGE_W - M, 20, { align: 'right' });
  doc.text(result.date.toLocaleDateString('pt-BR'), PAGE_W - M, 28, { align: 'right' });

  y = 56;

  /* --------------------------------- perfil ------------------------------- */
  doc.setFont('helvetica', 'bold').setFontSize(24);
  setColor(PDF_COLORS.ink);
  doc.text(result.fullName || result.name, M, y);
  y += 10;

  doc.setFont('helvetica', 'bold').setFontSize(14);
  setColor(PDF_COLORS.brandDark);
  doc.text(`${result.profile.title}  ·  Quadrante ${result.quadrant}`, M, y);
  y += 7;

  doc.setFont('helvetica', 'italic').setFontSize(10.5);
  setColor(PDF_COLORS.body);
  doc.text(result.profile.tagline, M, y);
  y += 10;

  /* caixa de notas */
  setColor(PDF_COLORS.soft, 'fill');
  doc.roundedRect(M, y, CONTENT_W, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(20);
  setColor(PDF_COLORS.brandDark);
  doc.text(result.overall.toFixed(1), M + 8, y + 14);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  setColor(PDF_COLORS.body);
  doc.text('de 5', M + 22, y + 14);

  doc.setFont('helvetica', 'bold').setFontSize(11);
  setColor(PDF_COLORS.ink);
  doc.text(result.band, M + 34, y + 10);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  setColor(PDF_COLORS.body);
  doc.text(`Conhecimento ${result.x.toFixed(2)} de 5  ·  Usar/criar ${result.y.toFixed(2)} de 5`, M + 34, y + 16);
  y += 32;

  paragraph(result.profile.summary);
  y += 6;

  /* ------------------------- mapa de quadrantes --------------------------- */
  heading('Posição no mapa de quadrantes');
  const mapW = 78, mapH = 66;
  const mapX = M, mapY = y;
  const mid = { x: mapX + mapW / 2, y: mapY + mapH / 2 };

  const zones = [
    { key: 'A', x: mapX, y: mapY },
    { key: 'B', x: mid.x, y: mapY },
    { key: 'C', x: mapX, y: mid.y },
    { key: 'D', x: mid.x, y: mid.y }
  ];
  zones.forEach(z => {
    const active = z.key === result.quadrant;
    setColor(active ? PDF_COLORS.soft : [250, 250, 253], 'fill');
    setColor(active ? PDF_COLORS.brand : PDF_COLORS.line, 'draw');
    doc.setLineWidth(active ? 0.7 : 0.3);
    doc.rect(z.x, z.y, mapW / 2, mapH / 2, 'FD');
    doc.setFont('helvetica', 'bold').setFontSize(11);
    setColor(active ? PDF_COLORS.brand : PDF_COLORS.line);
    doc.text(z.key, z.x + 4, z.y + 8);
  });

  setColor(PDF_COLORS.muted, 'draw');
  doc.setLineWidth(0.4);
  doc.line(mapX, mid.y, mapX + mapW, mid.y);
  doc.line(mid.x, mapY, mid.x, mapY + mapH);

  const dotX = mapX + ((result.x - 1) / 4) * mapW;
  const dotY = mapY + mapH - ((result.y - 1) / 4) * mapH;
  setColor([255, 255, 255], 'fill');
  doc.circle(dotX, dotY, 3.1, 'F');
  setColor(PDF_COLORS.brand, 'fill');
  doc.circle(dotX, dotY, 2.3, 'F');

  doc.setFont('helvetica', 'normal').setFontSize(7.5);
  setColor(PDF_COLORS.muted);
  doc.text('Quero CRIAR', mid.x, mapY - 2.5, { align: 'center' });
  doc.text('SEI POUCO', mapX, mapY + mapH + 4.5);
  doc.text('SEI MUITO', mapX + mapW, mapY + mapH + 4.5, { align: 'right' });
  doc.text('Quero USAR', mid.x, mapY + mapH + 10, { align: 'center' });

  /* barras das dimensões, ao lado do mapa */
  const barX = mapX + mapW + 14;
  const barW = CONTENT_W - mapW - 14;
  let barY = mapY + 4;
  Object.entries(DIMENSIONS).forEach(([id, dim], i) => {
    const value = result.dimScores[id];
    doc.setFont('helvetica', 'bold').setFontSize(9);
    setColor(PDF_COLORS.ink);
    doc.text(dim.label, barX, barY);
    doc.text(value.toFixed(1), barX + barW, barY, { align: 'right' });
    setColor([238, 238, 245], 'fill');
    doc.roundedRect(barX, barY + 2, barW, 3.2, 1.6, 1.6, 'F');
    setColor(PDF_COLORS.series[i], 'fill');
    doc.roundedRect(barX, barY + 2, Math.max((value / 5) * barW, 3.2), 3.2, 1.6, 1.6, 'F');
    barY += 15.5;
  });

  y = mapY + mapH + 20;

  /* ------------------------------- destaques ------------------------------ */
  if (result.highlights.length) {
    heading('Seus destaques');
    result.highlights.forEach(item => bullet(stripEmoji(item), '+', PDF_COLORS.series[2]));
    y += 3;
  }

  if (result.gaps.length) {
    heading('Pontos de atenção');
    result.gaps.forEach(item => bullet(stripEmoji(item), '!', PDF_COLORS.series[1]));
    y += 3;
  }

  /* -------------------------------- roadmap ------------------------------- */
  heading('Roadmap de evolução');
  result.profile.roadmap.forEach(item => {
    ensure(16);
    doc.setFont('helvetica', 'bold').setFontSize(9.5);
    setColor(PDF_COLORS.brandDark);
    doc.text(item.prazo, M, y);
    y += 5;
    paragraph(item.acao, 10);
    y += 3.5;
  });

  /* ----------------------------- próximos passos -------------------------- */
  heading('Próximos passos');
  result.profile.steps.forEach((step, i) => bullet(step, `${i + 1}.`, PDF_COLORS.brand));

  y += 4;
  ensure(14);
  paragraph('Escolha um. Um só, e faça esta semana.', 9.5, PDF_COLORS.muted, 'italic');

  footer();

  const slug = (result.fullName || result.name).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'resultado';
  doc.save(`diagnostico-ia-${slug}.pdf`);
}

/* Emojis não existem nas fontes padrão do PDF — saem como caixinhas. */
function stripEmoji(str) {
  return str.replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, '').trim();
}
