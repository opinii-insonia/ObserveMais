const videoContainer = document.querySelector('[data-youtube-video]');
const videoTrigger = videoContainer?.querySelector('.about-video-trigger');

function playVideoInline() {
  if (!videoContainer) return;

  const videoId = videoContainer.dataset.youtubeVideo;
  const iframe = document.createElement('iframe');
  const origin = encodeURIComponent(window.location.origin);

  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&origin=${origin}`;
  iframe.title = 'Vídeo da Observe Mais';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allowFullscreen = true;

  videoContainer.replaceChildren(iframe);
  videoContainer.classList.add('is-playing');
}

videoTrigger?.addEventListener('click', () => {
  if (window.location.protocol === 'file:') {
    const videoId = videoContainer.dataset.youtubeVideo;
    window.location.assign(`http://127.0.0.1:4173/?play=${videoId}#sobre`);
    return;
  }

  playVideoInline();
});

const requestedVideo = new URLSearchParams(window.location.search).get('play');
if (videoContainer && requestedVideo === videoContainer.dataset.youtubeVideo) {
  playVideoInline();
}
