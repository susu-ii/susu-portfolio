(function () {
'use strict';
const $ = selector => document.querySelector(selector);
const video = $('#intro'), badge = $('#badge'), endFrame = $('#end'), badgeVisual = $('#badge-visual');
if (!video || !badge) return;

// Keep the confirmed video/WebP autoplay path independent from the gallery.
let playPending = false, finished = false, retryTimer, fallbackTimer, fallbackActive = false, revealRun = 0;
const visualReady = Promise.all([
  endFrame?.decode ? endFrame.decode().catch(() => {}) : Promise.resolve(),
  badgeVisual?.decode ? badgeVisual.decode().catch(() => {}) : Promise.resolve()
]);
video.muted = true; video.defaultMuted = true; video.volume = 0; video.playsInline = true; video.autoplay = true;
async function ready() {
  const run = ++revealRun;
  clearTimeout(fallbackTimer); clearInterval(retryTimer);
  await visualReady;
  if (run !== revealRun) return;
  $('#motion-fallback').hidden = true;
  requestAnimationFrame(() => {
    if (run !== revealRun) return;
    video.classList.add('done');
    badge.disabled = false; $('#hero').classList.add('ready'); $('#play').style.display = 'none';
  });
}
function startFallback() {
  if (finished || fallbackActive || (!video.paused && video.currentTime > 0)) return;
  fallbackActive = true; clearInterval(retryTimer); video.pause(); video.classList.add('done');
  const animation = $('#motion-fallback'); animation.hidden = false;
  animation.onload = () => { fallbackTimer = setTimeout(() => { finished = true; ready(); }, 7100); };
  animation.onerror = () => { finished = true; ready(); };
  animation.src = 'assets/intro-auto.webp'; $('#play').style.display = 'none';
}
function autoPlay() {
  if (finished || fallbackActive || playPending || !video.paused || document.hidden) return;
  video.muted = true; video.volume = 0; playPending = true;
  const attempt = video.play();
  if (attempt) attempt.then(() => $('#play').style.display = 'none').catch(error => {
    if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') startFallback();
  }).finally(() => playPending = false);
  else playPending = false;
}
video.addEventListener('ended', () => { finished = true; ready(); });
video.addEventListener('error', startFallback);
for (const event of ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough']) video.addEventListener(event, autoPlay);
window.addEventListener('pageshow', autoPlay); document.addEventListener('visibilitychange', autoPlay);
for (const event of ['pointerdown', 'keydown', 'touchstart']) document.addEventListener(event, autoPlay, { passive: true });
video.addEventListener('playing', () => { clearInterval(retryTimer); $('#play').style.display = 'none'; });
retryTimer = setInterval(() => { if (!finished && video.paused) autoPlay(); }, 700);
$('#play').onclick = autoPlay; autoPlay();
setTimeout(() => { if (!finished && video.currentTime < .05) startFallback(); }, 2200);
$('#replay').onclick = async () => {
  const gallery = window.PortfolioGallery;
  if (gallery && !await gallery.goHome(450)) return;
  revealRun++; clearTimeout(fallbackTimer); finished = false; badge.disabled = true; $('#hero').classList.remove('ready');
  if (fallbackActive) {
    const old = $('#motion-fallback'), animation = old.cloneNode(false); animation.removeAttribute('src'); animation.hidden = true; old.replaceWith(animation);
    fallbackActive = false; startFallback(); return;
  }
  video.classList.remove('done'); video.currentTime = 0;
  video.play().catch(startFallback);
  setTimeout(() => { if (!finished && video.currentTime < .05) startFallback(); }, 1600);
};


})();
