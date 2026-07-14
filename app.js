const scanner = document.querySelector('#scanner');
const video = document.querySelector('#camera');
const startButton = document.querySelector('#start-scan');
const closeButton = document.querySelector('#close-scanner');
const message = document.querySelector('#scan-message');
const assetCode = document.querySelector('#asset-code');
const scanStatus = document.querySelector('#scan-status');
const photoInput = document.querySelector('#photo-input');
const photoGrid = document.querySelector('#photo-grid');
const photoCount = document.querySelector('#photo-count');
const form = document.querySelector('#repair-form');
const dialog = document.querySelector('#result-dialog');

let stream;
let scanning = false;
let photos = [];
let detector;

async function startScanner() {
  message.classList.remove('error');
  if (!navigator.mediaDevices?.getUserMedia) {
    showError('此瀏覽器無法開啟相機，請改用手機 Chrome / Safari，或手動輸入編號。');
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    scanner.hidden = false;
    startButton.hidden = true;
    scanning = true;
    message.textContent = '將 QR Code 對準框線，辨識完成後會自動關閉。';
    if ('BarcodeDetector' in window) detector = new BarcodeDetector({ formats: ['qr_code'] });
    requestAnimationFrame(scanFrame);
  } catch (error) {
    showError(error.name === 'NotAllowedError' ? '相機權限被拒絕，請在瀏覽器設定中允許相機。' : `無法開啟相機：${error.message}`);
  }
}

async function scanFrame() {
  if (!scanning) return;
  try {
    let value = '';
    if (detector) {
      const codes = await detector.detect(video);
      value = codes[0]?.rawValue || '';
    } else if (window.jsQR && video.readyState >= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(video, 0, 0);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      value = window.jsQR(image.data, image.width, image.height)?.data || '';
    }
    if (value) {
      assetCode.value = value;
      scanStatus.textContent = '掃描完成';
      scanStatus.classList.add('ok');
      message.textContent = `已讀取：${value}`;
      navigator.vibrate?.(120);
      stopScanner();
      return;
    }
  } catch (error) {
    console.debug('QR scan retry:', error);
  }
  setTimeout(() => requestAnimationFrame(scanFrame), 180);
}

function stopScanner() {
  scanning = false;
  stream?.getTracks().forEach(track => track.stop());
  stream = undefined;
  video.srcObject = null;
  scanner.hidden = true;
  startButton.hidden = false;
}

function showError(text) {
  message.textContent = text;
  message.classList.add('error');
  stopScanner();
}

function renderPhotos() {
  photoGrid.innerHTML = '';
  photos.forEach((photo, index) => {
    const item = document.createElement('div');
    item.className = 'photo-item';
    const image = document.createElement('img');
    image.src = photo.url;
    image.alt = `異常照片 ${index + 1}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-photo';
    remove.setAttribute('aria-label', `移除照片 ${index + 1}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      URL.revokeObjectURL(photos[index].url);
      photos.splice(index, 1);
      renderPhotos();
    });
    item.append(image, remove);
    photoGrid.append(item);
  });
  photoCount.textContent = `${photos.length} / 3 張`;
  photoCount.classList.toggle('ok', photos.length > 0);
}

photoInput.addEventListener('change', () => {
  const remaining = 3 - photos.length;
  [...photoInput.files].slice(0, remaining).forEach(file => {
    photos.push({ file, url: URL.createObjectURL(file) });
  });
  photoInput.value = '';
  renderPhotos();
});

assetCode.addEventListener('input', () => {
  scanStatus.textContent = assetCode.value ? '已有設備編號' : '尚未掃描';
  scanStatus.classList.toggle('ok', Boolean(assetCode.value));
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  if (!photos.length) {
    alert('請至少拍攝或選擇一張異常照片。');
    return;
  }
  const ticket = `RMA-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-4)}`;
  document.querySelector('#result-text').textContent = `單號：${ticket}\n設備：${assetCode.value}\n照片：${photos.length} 張\n\n此 Demo 僅模擬送出，尚未連接後端。`;
  dialog.showModal();
});

document.querySelector('#reset-form').addEventListener('click', () => {
  dialog.close();
  photos.forEach(photo => URL.revokeObjectURL(photo.url));
  photos = [];
  form.reset();
  renderPhotos();
  scanStatus.textContent = '尚未掃描';
  scanStatus.classList.remove('ok');
});

startButton.addEventListener('click', startScanner);
closeButton.addEventListener('click', stopScanner);
window.addEventListener('pagehide', stopScanner);
