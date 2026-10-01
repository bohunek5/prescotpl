import {coverPhotos} from './cover-photo-data.js?v=130bc2896fcd';

// A family image must never make a white example look like the selected black
// or clear variant. Keep the section icon unless the finish is documented.
export function coverPhotoIcon(cover, section) {
  const photo = coverPhotos[cover.id]?.find(item => item.finishVerified);
  if (!photo) return section;
  return `<span class="profile-photo-thumb"><img src="${photo.thumb}" alt="" width="80" height="72" loading="lazy" decoding="async">${section}</span>`;
}

export function createCoverGallery(trigger, dialog, {includeFamilyImages = true} = {}) {
  dialog.setAttribute('aria-labelledby', 'cover-photo-title');
  dialog.innerHTML = `<button type="button" class="close" aria-label="Zamknij zdjęcia osłony">×</button>
    <div class="eyebrow" data-cover-photo-heading></div><h2 id="cover-photo-title"></h2>
    <p data-cover-photo-selection></p>
    <figure class="profile-photo-figure"><img id="cover-photo-main" alt="" decoding="async">
      <p class="profile-photo-status" role="status" hidden>Zdjęcie nie zostało wczytane.</p>
    </figure>
    <div class="profile-photo-navigation"><button type="button" data-photo-step="-1" aria-label="Poprzednie zdjęcie">←</button>
      <p id="cover-photo-caption" aria-live="polite"></p>
      <button type="button" data-photo-step="1" aria-label="Następne zdjęcie">→</button></div>
    <div class="profile-photo-list" role="group" aria-label="Wybierz zdjęcie osłony"></div>
    <p class="profile-photo-note" data-cover-photo-note></p>
    <p class="profile-photo-note"><a data-cover-photo-source target="_blank" rel="noopener">Karta producenta</a></p>`;
  const title = dialog.querySelector('h2'), picture = dialog.querySelector('#cover-photo-main');
  const caption = dialog.querySelector('#cover-photo-caption'), list = dialog.querySelector('.profile-photo-list');
  const status = dialog.querySelector('.profile-photo-status'), note = dialog.querySelector('[data-cover-photo-note]');
  const source = dialog.querySelector('[data-cover-photo-source]'), heading = dialog.querySelector('[data-cover-photo-heading]');
  const selection = dialog.querySelector('[data-cover-photo-selection]');
  let cover, photos = [], index = 0;
  picture.onload = () => { status.hidden = true; picture.hidden = false; };
  picture.onerror = () => { status.hidden = false; picture.hidden = true; };
  function show(next) {
    if (!photos.length) return;
    index = (next + photos.length) % photos.length;
    const photo = photos[index];
    dialog.dataset.photoMatch = photo.matchScope;
    heading.textContent = photo.finishVerified ? 'KLUŚ · ZDJĘCIE OSŁONY' : 'KLUŚ · ZDJĘCIE RODZINY OSŁON';
    title.textContent = photo.finishVerified ? cover.name : `${photo.family} — przykładowy wariant`;
    selection.textContent = `Wybrano: ${cover.name} · ${cover.ref}`;
    status.hidden = true; picture.hidden = false;
    picture.alt = photo.label;
    picture.src = photo.src;
    picture.style.maxWidth = `min(100%, ${photo.width}px)`;
    picture.style.maxHeight = '100%';
    picture.style.objectFit = 'contain';
    caption.textContent = `${photo.label}${photos.length > 1 ? ` · ${index + 1} / ${photos.length}` : ''}`;
    note.textContent = photo.note;
    source.href = `${photo.source}#page=${photo.sourcePage}`;
    source.textContent = `Źródło: karta KLUŚ, strona ${photo.sourcePage}`;
    [...list.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }
  trigger.onclick = () => {
    if (!photos.length) return;
    list.replaceChildren(...photos.map((photo, i) => {
      const button = document.createElement('button'); button.type = 'button';
      const image = document.createElement('img');
      image.src = photo.thumb; image.alt = ''; image.width = 96; image.height = 64; image.decoding = 'async';
      const label = document.createElement('span'); label.textContent = photo.finishVerified ? 'Osłona' : 'Rodzina osłon';
      button.append(image, label); button.onclick = () => show(i); return button;
    }));
    list.hidden = photos.length < 2;
    dialog.querySelectorAll('[data-photo-step]').forEach(button => { button.disabled = photos.length < 2; });
    show(0); dialog.showModal();
  };
  dialog.querySelector('.close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { if (!trigger.hidden) trigger.focus({preventScroll: true}); });
  dialog.querySelectorAll('[data-photo-step]').forEach(button => { button.onclick = () => show(index + Number(button.dataset.photoStep)); });
  dialog.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); show(index + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  return {
    update(nextCover) {
      if (cover?.id === nextCover.id) return;
      cover = nextCover;
      photos = (coverPhotos[cover.id] || []).filter(photo => photo.finishVerified || includeFamilyImages);
      trigger.hidden = !photos.length;
      const first = photos[0];
      trigger.textContent = !first ? '' : first.finishVerified ? `Zobacz zdjęcie ${cover.name}` : `Zobacz zdjęcie rodziny ${first.family}`;
      if (dialog.open) dialog.close();
    }
  };
}
