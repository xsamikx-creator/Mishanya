// Prevent Telegram Mini App from jumping down when the slideshow changes photos.
setActivePhoto = function(index, animate = true) {
  if (!photos.length) return;
  activePhotoIndex = (index + photos.length) % photos.length;

  const main = document.querySelector('.gallery-main');
  const stage = document.querySelector('.gallery-stage');
  if (!main || !stage) return renderGallery();

  if (animate) main.classList.add('changing');

  setTimeout(() => {
    main.src = photos[activePhotoIndex];
    applyStageBackground(stage, photos[activePhotoIndex]);
    main.classList.remove('changing');

    const badge = document.querySelector('.gallery-badge');
    if (badge) badge.textContent = `${activePhotoIndex + 1} / ${photos.length}`;

    document.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === activePhotoIndex);
    });

    // Scroll only the horizontal thumbnail strip, never the whole page.
    const strip = document.querySelector('.gallery-strip');
    const activeThumb = strip?.querySelector(`.gallery-thumb[data-index="${activePhotoIndex}"]`);
    if (strip && activeThumb) {
      const target = activeThumb.offsetLeft - (strip.clientWidth - activeThumb.clientWidth) / 2;
      strip.scrollTo({ left: Math.max(0, target), behavior: animate ? 'smooth' : 'auto' });
    }
  }, animate ? 170 : 0);
};
