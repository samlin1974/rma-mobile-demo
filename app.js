const $ = selector => document.querySelector(selector);
const scanner = $('#scanner');
const video = $('#camera');
const assetCode = $('#asset-code');
const scanStatus = $('#scan-status');
const message = $('#scan-message');
const photoInput = $('#photo-input');
const photoGrid = $('#photo-grid');
const photoCount = $('#photo-count');
const form = $('#repair-form');
const dialog = $('#result-dialog');
let stream, detector;
let scanning = false;
let photos = [];

async function startScanner() {
  message.classList.remove('error');
  if (!navigator.mediaDevices?.getUserMedia) return showError(t('cameraUnsupported'));
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
    video.srcObject = stream;
    await video.play();
    scanner.hidden = false;
    $('#start-scan').hidden = true;
    scanning = true;
    message.textContent = t('aimQr');
    if ('BarcodeDetector' in window) detector = new BarcodeDetector({ formats: ['qr_code'] });
    requestAnimationFrame(scanFrame);
  } catch (error) {
    showError(error.name === 'NotAllowedError' ? t('cameraDenied') : `${t('cameraFailed')} ${error.message}`);
  }
}

async function scanFrame() {
  if (!scanning) return;
  try {
    let value = '';
    if (detector) value = (await detector.detect(video))[0]?.rawValue || '';
    else if (window.jsQR && video.readyState >= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(video, 0, 0);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      value = window.jsQR(image.data, image.width, image.height)?.data || '';
    }
    if (value) {
      assetCode.value = value;
      scanStatus.textContent = t('scanComplete'); scanStatus.classList.add('ok');
      message.textContent = `${t('readValue')} ${value}`;
      navigator.vibrate?.(120); stopScanner(); return;
    }
  } catch (error) { console.debug('QR scan retry:', error); }
  setTimeout(() => requestAnimationFrame(scanFrame), 180);
}

function stopScanner() {
  scanning = false; stream?.getTracks().forEach(track => track.stop());
  stream = undefined; video.srcObject = null; scanner.hidden = true; $('#start-scan').hidden = false;
}
function showError(text) { message.textContent = text; message.classList.add('error'); stopScanner(); }

function renderPhotos() {
  photoGrid.innerHTML = '';
  photos.forEach((photo, index) => {
    const item = document.createElement('div'); item.className = 'photo-item';
    const image = document.createElement('img'); image.src = photo.preview; image.alt = `${t('photo')} ${index + 1}`;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-photo'; remove.textContent = '×';
    remove.addEventListener('click', () => { photos.splice(index, 1); renderPhotos(); });
    item.append(image, remove); photoGrid.append(item);
  });
  photoCount.textContent = `${photos.length} / 3 ${t('photosUnit')}`;
  photoCount.classList.toggle('ok', photos.length > 0);
}

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas'); canvas.width = image.width * scale; canvas.height = image.height * scale;
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .75));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

photoInput.addEventListener('change', async () => {
  for (const file of [...photoInput.files].slice(0, 3 - photos.length)) photos.push({ name: file.name, preview: await resizePhoto(file) });
  photoInput.value = ''; renderPhotos();
});
assetCode.addEventListener('input', () => { scanStatus.textContent = assetCode.value ? t('hasAssetCode') : t('notScanned'); scanStatus.classList.toggle('ok', !!assetCode.value); });

async function saveRecord(record) {
  const records = JSON.parse(localStorage.getItem('rma-records') || '[]');
  records.unshift(record); localStorage.setItem('rma-records', JSON.stringify(records));
  try {
    const response = await fetch('/api/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
    return response.ok ? 'server' : 'browser';
  } catch { return 'browser'; }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  if (!photos.length) return alert(t('photoRequired'));
  const ticket = `RMA-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-4)}`;
  const record = { id: ticket, createdAt: new Date().toISOString(), assetCode: assetCode.value.trim(), reasonOne: $('#reason-one').value, reasonTwo: $('#reason-two').value || null, description: $('#description').value.trim(), email: $('#email').value.trim(), photos: photos.map(photo => photo.preview) };
  $('#save-button').disabled = true;
  const mode = await saveRecord(record);
  $('#save-button').disabled = false;
  $('#result-text').textContent = `${t('ticket')} ${ticket}\n${mode === 'server' ? t('serverSaved') : t('browserSaved')}`;
  dialog.showModal();
});

$('#reset-form').addEventListener('click', () => { dialog.close(); photos = []; form.reset(); renderPhotos(); scanStatus.textContent = t('notScanned'); scanStatus.classList.remove('ok'); });
$('#start-scan').addEventListener('click', startScanner); $('#close-scanner').addEventListener('click', stopScanner); window.addEventListener('pagehide', stopScanner);
renderPhotos();
