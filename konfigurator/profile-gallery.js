import {profilePhotos} from './profile-photo-data.js?v=130bc2896fcd';

export function profilePhotoIcon(profile, section) {
  const photo = profilePhotos[profile.id]?.[0];
  if (!photo) return section;
  return `<span class="profile-photo-thumb"><img src="${photo.thumb}" alt="" width="80" height="72" loading="lazy" decoding="async">${section}</span>`;
}

export function createProfileGallery(trigger, dialog) {
  dialog.innerHTML = `<button type="button" class="close" aria-label="Zamknij zdjęcia">×</button>
    <div class="eyebrow">KLUŚ · ZDJĘCIA PROFILU</div><h2 id="profile-photo-title"></h2>
    <figure class="profile-photo-figure"><img id="profile-photo-main" alt="" decoding="async">
      <p class="profile-photo-status" role="status" hidden>Zdjęcie nie zostało wczytane.</p>
    </figure>
    <div class="profile-photo-navigation"><button type="button" data-photo-step="-1" aria-label="Poprzednie zdjęcie">←</button>
      <p id="profile-photo-caption" aria-live="polite"></p>
      <button type="button" data-photo-step="1" aria-label="Następne zdjęcie">→</button></div>
    <div class="profile-photo-list" role="group" aria-label="Wybierz zdjęcie"></div>
    <p class="profile-photo-note">Zdjęcia katalogowe pokazują przykładowe wykończenie i osprzęt. Wybrane elementy zestawu zobaczysz w podglądzie 3D.</p>`;
  const title = dialog.querySelector('h2'), picture = dialog.querySelector('#profile-photo-main');
  const caption = dialog.querySelector('#profile-photo-caption'), list = dialog.querySelector('.profile-photo-list');
  const status = dialog.querySelector('.profile-photo-status');
  let profile, photos = [], index = 0;
  picture.onload = () => { status.hidden = true; picture.hidden = false; };
  picture.onerror = () => { status.hidden = false; picture.hidden = true; };
  function show(next) {
    if (!photos.length) return;
    index = (next + photos.length) % photos.length;
    const photo = photos[index];
    status.hidden = true; picture.hidden = false;
    picture.alt = `${profile.name} — ${photo.label}`;
    picture.src = photo.src;
    caption.textContent = `${photo.label} · ${index + 1} / ${photos.length}`;
    [...list.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }
  trigger.onclick = () => {
    if (!photos.length) return;
    title.textContent = profile.name;
    list.replaceChildren(...photos.map((photo, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      const image = document.createElement('img');
      image.src = photo.thumb; image.alt = ''; image.width = 96; image.height = 64; image.decoding = 'async';
      const label = document.createElement('span'); label.textContent = photo.label.replace('Zastosowanie', 'Przykład');
      button.append(image, label); button.onclick = () => show(i);
      return button;
    }));
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
    update(nextProfile) {
      if (profile?.id === nextProfile.id) return;
      profile = nextProfile; photos = profilePhotos[profile.id] || [];
      trigger.hidden = !photos.length;
      trigger.textContent = photos.length ? `Zobacz zdjęcia ${profile.name} · ${photos.length}` : '';
      if (dialog.open) dialog.close();
    }
  };
}
