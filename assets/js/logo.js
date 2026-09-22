/* ==========================================================================
   A logo é um SVG (assets/img/gaditas-logo.svg) e o jsPDF não lê SVG.
   Aqui ela é rasterizada no próprio navegador, na cor pedida, só quando o
   PDF é gerado. Sem base64 embutido e sem perder nitidez.
   ========================================================================== */

const LOGO_SRC = 'assets/img/gaditas-logo.svg';
const LOGO_RATIO = 2133 / 2367;
const logoCache = new Map();

function renderLogo(color = '#ffffff', width = 560) {
  const key = `${color}|${width}`;
  if (logoCache.has(key)) return logoCache.get(key);

  const job = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const ratio = img.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : LOGO_RATIO;
        const height = Math.round(width / ratio);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        ctx.globalCompositeOperation = 'source-in';   /* pinta só o desenho */
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width, height, ratio });
      } catch (err) {
        reject(err);   /* canvas "sujo" (file://) — o PDF sai sem a logo */
      }
    };
    img.onerror = () => reject(new Error('logo não carregou'));
    img.src = LOGO_SRC;
  });

  logoCache.set(key, job);
  return job;
}
