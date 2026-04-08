import { PDFDocument } from 'pdf-lib';

const MM_TO_POINTS = 72 / 25.4;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const CARD_WIDTH_MM = 63;
const CARD_HEIGHT_MM = 88;
const GRID_COLUMNS = 3;
const GRID_ROWS = 3;
const TARGET_DPI = 220;
const JPEG_QUALITY = 0.82;
const CUT_MARK_LENGTH_MM = 4;
const CUT_MARK_WIDTH = 0.7;

const imageCache = new Map();

function mmToPoints(mm) {
  return mm * MM_TO_POINTS;
}

function mmToPixels(mm) {
  return Math.round((mm / 25.4) * TARGET_DPI);
}

function drawCutMarks(page, pageWidth, pageHeight, offsetX, offsetY, cardWidth, cardHeight) {
  const markLength = mmToPoints(CUT_MARK_LENGTH_MM);
  const gridWidth = GRID_COLUMNS * cardWidth;
  const gridHeight = GRID_ROWS * cardHeight;
  const left = offsetX;
  const right = offsetX + gridWidth;
  const bottom = offsetY;
  const top = offsetY + gridHeight;

  for (let column = 0; column <= GRID_COLUMNS; column += 1) {
    const x = left + (column * cardWidth);

    page.drawLine({
      start: { x, y: Math.max(0, bottom - markLength) },
      end: { x, y: bottom },
      thickness: CUT_MARK_WIDTH,
    });

    page.drawLine({
      start: { x, y: top },
      end: { x, y: Math.min(pageHeight, top + markLength) },
      thickness: CUT_MARK_WIDTH,
    });
  }

  for (let row = 0; row <= GRID_ROWS; row += 1) {
    const y = bottom + (row * cardHeight);

    page.drawLine({
      start: { x: Math.max(0, left - markLength), y },
      end: { x: left, y },
      thickness: CUT_MARK_WIDTH,
    });

    page.drawLine({
      start: { x: right, y },
      end: { x: Math.min(pageWidth, right + markLength), y },
      thickness: CUT_MARK_WIDTH,
    });
  }
}

function getProxyCandidates(imageUrl) {
  const normalizedUrl = imageUrl.replace(/^https?:\/\//, '');
  const encodedOriginal = encodeURIComponent(imageUrl);
  const encodedNormalized = encodeURIComponent(normalizedUrl);

  return [
    `https://images.weserv.nl/?url=${encodedNormalized}&output=png`,
    `https://images.weserv.nl/?url=${encodedNormalized}`,
    `https://corsproxy.io/?${encodedOriginal}`,
  ];
}

async function blobToImageElement(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };

    img.src = objectUrl;
  });
}

async function fetchImageBlob(imageUrl) {
  const attempts = [];

  for (const candidateUrl of getProxyCandidates(imageUrl)) {
    try {
      const response = await fetch(candidateUrl);
      if (!response.ok) {
        attempts.push(`${candidateUrl} -> ${response.status}`);
        continue;
      }

      return await response.blob();
    } catch (error) {
      attempts.push(`${candidateUrl} -> ${error instanceof Error ? error.message : 'fetch failed'}`);
    }
  }

  throw new Error(`Unable to fetch image through static proxy fallbacks: ${imageUrl}\n${attempts.join('\n')}`);
}

async function renderImageToJpegBytes(imageUrl, rotateImage) {
  const cacheKey = `${imageUrl}::${rotateImage ? 'rotated' : 'normal'}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const promise = (async () => {
    const blob = await fetchImageBlob(imageUrl);
    const image = await blobToImageElement(blob);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const canvas = document.createElement('canvas');
    const targetWidth = rotateImage ? mmToPixels(CARD_HEIGHT_MM) : mmToPixels(CARD_WIDTH_MM);
    const targetHeight = rotateImage ? mmToPixels(CARD_WIDTH_MM) : mmToPixels(CARD_HEIGHT_MM);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (rotateImage) {
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(Math.PI / 2);
      context.drawImage(image, -targetHeight / 2, -targetWidth / 2, targetHeight, targetWidth);
    } else {
      context.drawImage(image, 0, 0, targetWidth, targetHeight);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let idx = 0; idx < binaryString.length; idx += 1) {
      bytes[idx] = binaryString.charCodeAt(idx);
    }

    return bytes;
  })();

  imageCache.set(cacheKey, promise);
  return promise;
}

export async function exportProxyPdf(chosenCards) {
  const pdfDoc = await PDFDocument.create();
  const pageWidth = mmToPoints(A4_WIDTH_MM);
  const pageHeight = mmToPoints(A4_HEIGHT_MM);
  const cardWidth = mmToPoints(CARD_WIDTH_MM);
  const cardHeight = mmToPoints(CARD_HEIGHT_MM);
  const contentWidth = GRID_COLUMNS * cardWidth;
  const contentHeight = GRID_ROWS * cardHeight;
  const offsetX = (pageWidth - contentWidth) / 2;
  const offsetY = (pageHeight - contentHeight) / 2;

  for (let start = 0; start < chosenCards.length; start += GRID_COLUMNS * GRID_ROWS) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const pageCards = chosenCards.slice(start, start + (GRID_COLUMNS * GRID_ROWS));

    for (let idx = 0; idx < pageCards.length; idx += 1) {
      const entry = pageCards[idx];
      const rotateImage = entry.card.played_horizontally
        && entry.printing.image_rotation_degrees !== 270
        && entry.printing.image_rotation_degrees !== 90;
      const imageBytes = await renderImageToJpegBytes(entry.printing.image_url, rotateImage);
      const image = await pdfDoc.embedJpg(imageBytes);
      const row = Math.floor(idx / GRID_COLUMNS);
      const column = idx % GRID_COLUMNS;
      const x = offsetX + (column * cardWidth);
      const y = pageHeight - offsetY - ((row + 1) * cardHeight);

      page.drawImage(image, {
        x,
        y,
        width: cardWidth,
        height: cardHeight,
      });
    }

    drawCutMarks(page, pageWidth, pageHeight, offsetX, offsetY, cardWidth, cardHeight);
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

export async function downloadProxyPdf(chosenCards) {
  const blob = await exportProxyPdf(chosenCards);
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  link.href = downloadUrl;
  link.download = `fab-proxies-${timestamp}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}
