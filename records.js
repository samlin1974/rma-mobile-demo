const list = document.querySelector('#records-list');
const reasonLabel = value => value ? t(value === 'noise' ? 'noise' : value === 'leak' ? 'leak' : 'inactive') : '—';
function renderRecords() {
  const records = JSON.parse(localStorage.getItem('rma-records') || '[]');
  list.innerHTML = '';
  if (!records.length) { const empty = document.createElement('section'); empty.className = 'card empty-state'; empty.textContent = t('noRecords'); list.append(empty); return; }
  records.forEach(record => {
    const card = document.createElement('article'); card.className = 'card record-card';
    const header = document.createElement('div'); header.className = 'record-header';
    const title = document.createElement('div'); title.innerHTML = `<strong>${escapeHtml(record.id)}</strong><small>${new Date(record.createdAt).toLocaleString()}</small>`;
    const remove = document.createElement('button'); remove.className = 'danger-button'; remove.textContent = t('deleteRecord');
    remove.addEventListener('click', () => { if (!confirm(t('confirmDelete'))) return; localStorage.setItem('rma-records', JSON.stringify(records.filter(item => item.id !== record.id))); renderRecords(); });
    header.append(title, remove);
    const body = document.createElement('dl'); body.className = 'record-details';
    body.innerHTML = `<dt>${t('assetCode')}</dt><dd>${escapeHtml(record.assetCode)}</dd><dt>${t('reason1')}</dt><dd>${reasonLabel(record.reasonOne)}</dd><dt>${t('reason2')}</dt><dd>${reasonLabel(record.reasonTwo)}</dd><dt>${t('emailLabel')}</dt><dd>${escapeHtml(record.email)}</dd><dt>${t('description')}</dt><dd>${escapeHtml(record.description || '—')}</dd><dt>${t('photoCount')}</dt><dd>${record.photos?.length || 0}</dd>`;
    const photos = document.createElement('div'); photos.className = 'photo-grid'; (record.photos || []).forEach((src, index) => { const img = document.createElement('img'); img.src = src; img.alt = `${t('photo')} ${index + 1}`; photos.append(img); });
    card.append(header, body, photos); list.append(card);
  });
}
function escapeHtml(value) { const el = document.createElement('span'); el.textContent = String(value); return el.innerHTML; }
renderRecords();
