(function () {
'use strict';
const $ = selector => document.querySelector(selector);
const viewer = $('#case');
if (!$('#experience') || !viewer) return;
let projects = [], active = 0, gallery, busy = false;
const syncOverlay = () => window.PortfolioUI.syncOverlay();

const directory = $('#directory');
$('#directory-open').onclick = () => {
  directory.showModal(); syncOverlay();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) directory.animate([{ opacity: 0, transform: 'translateY(25px)' }, { opacity: 1, transform: 'none' }], { duration: 550, easing: 'cubic-bezier(.16,1,.3,1)' });
};
$('#directory-close').onclick = () => directory.close();
directory.addEventListener('close', syncOverlay);
directory.onclick = event => { if (event.target === directory) directory.close(); };

const chapterNames = ['视觉开篇', '方案展开', '完整呈现'];
function populateCase(index) {
  const p = projects[index], content = $('#case-content'); active = index;
  $('#case-title').textContent = p.title; content.replaceChildren(); $('#case-nav').replaceChildren();
  const hero = document.createElement('div'); hero.className = 'case-hero';
  const visual = document.createElement('img'); visual.src = p.sceneURL; visual.alt = p.title + '主视觉'; hero.append(visual); content.append(hero);
  visual.width = p.coverSize[0]; visual.height = p.coverSize[1];
  const lead = document.createElement('section'); lead.className = 'case-lead';
  const kicker = document.createElement('span'); kicker.className = 'case-kicker'; kicker.textContent = '0' + (index + 1) + ' / ' + p.english;
  const name = document.createElement('h1'); name.textContent = p.title;
  const desc = document.createElement('p'); desc.textContent = p.desc;
  const tags = document.createElement('div'); tags.className = 'case-tags';
  p.tag.split(' / ').forEach(t => { const span = document.createElement('span'); span.textContent = t; tags.append(span); });
  lead.append(kicker, name, desc, tags); content.append(lead);
  for (let k = 0; k < 3; k++) {
    const from = Math.floor(k * p.images.length / 3), to = Math.floor((k + 1) * p.images.length / 3);
    const section = document.createElement('section'); section.className = 'case-chapter'; section.id = 'chapter-' + k;
    const heading = document.createElement('div'); heading.className = 'chapter-title';
    const number = document.createElement('span'); number.textContent = '0' + (k + 1);
    const title = document.createElement('h2'); title.textContent = chapterNames[k];
    const range = document.createElement('span'); range.textContent = String(from + 1).padStart(2, '0') + ' — ' + String(to).padStart(2, '0');
    heading.append(number, title, range); section.append(heading);
    for (let j = from; j < to; j++) {
      const image = document.createElement('img'); image.src = p.images[j]; image.alt = p.title + ' · 设计展示 ' + (j + 1);
      image.loading = j ? 'lazy' : 'eager'; image.decoding = 'async'; image.tabIndex = 0; image.setAttribute('role', 'button'); image.setAttribute('aria-label', image.alt + '，点击查看大图');
      if (p.imageSizes && p.imageSizes[j]) { image.width = p.imageSizes[j][0]; image.height = p.imageSizes[j][1]; }
      image.onclick = () => showLarge(image); image.onkeydown = event => { if (event.key === 'Enter') showLarge(image); }; section.append(image);
    }
    content.append(section);
    const button = document.createElement('button'); button.textContent = chapterNames[k];
    button.onclick = () => viewer.scrollTo({ top: section.offsetTop - 80, behavior: gallery.reduced.matches ? 'instant' : 'smooth' }); $('#case-nav').append(button);
  }
  $('#next').textContent = index < projects.length - 1 ? '下一个项目：' + projects[index + 1].title + ' →' : '返回作品画廊 ↑';
  viewer.scrollTop = 0;
}
function animateCover(from, to) {
  const element = $('#transition-cover');
  const frame = rect => ({ left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px' });
  Object.assign(element.style, frame(from));
  if (gallery.reduced.matches) { Object.assign(element.style, frame(to)); return Promise.resolve(); }
  const animation = element.animate([frame(from), frame(to)], { duration: 920, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
  return animation.finished.catch(() => {}).then(() => { Object.assign(element.style, frame(to)); animation.cancel(); });
}
async function openCase(index) {
  if (busy || !gallery || !projects[index]) return;
  busy = true;
  try {
    if (!viewer.open) {
      const centered = await gallery.goProject(index); if (!centered) return;
      await projects[index].artReady;
      const from = gallery.getBounds(index), viewport = gallery.viewport;
      populateCase(index); $('#transition-cover img').src = projects[index].sceneURL;
      viewer.classList.add('transitioning');
      Object.assign($('#transition-cover').style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' });
      viewer.showModal(); syncOverlay();
      await animateCover(from, { left: 0, top: 0, width: viewport.width, height: viewport.height });
      viewer.classList.remove('transitioning');
    } else {
      await projects[index].artReady;
      populateCase(index); gallery.jumpToProject(index);
      if (!gallery.reduced.matches) $('#case-content').animate([{ opacity: .15, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  } finally { busy = false; }
}
async function closeCase() {
  if (busy || !viewer.open) return;
  busy = true;
  try {
    gallery.jumpToProject(active);
    const viewport = gallery.viewport, to = gallery.getBounds(active);
    $('#transition-cover img').src = projects[active].sceneURL; viewer.classList.add('transitioning');
    await animateCover({ left: 0, top: 0, width: viewport.width, height: viewport.height }, to);
    viewer.close(); viewer.classList.remove('transitioning'); syncOverlay();
    $('#project-hitboxes').children[active].focus({ preventScroll: true });
  } finally { busy = false; }
}
$('#case-close').onclick = closeCase;
viewer.addEventListener('cancel', event => { event.preventDefault(); closeCase(); });
viewer.addEventListener('close', syncOverlay);
$('#case-top').onclick = () => viewer.scrollTo({ top: 0, behavior: gallery.reduced.matches ? 'instant' : 'smooth' });
$('#next').onclick = () => active < projects.length - 1 ? openCase(active + 1) : closeCase();
function showLarge(image) {
  $('#lightbox-image').src = image.src; $('#lightbox-image').alt = image.alt; $('#lightbox-image').classList.remove('zoomed');
  $('#lightbox-zoom').textContent = '放大细节 +'; $('#lightbox-zoom').setAttribute('aria-pressed', 'false');
  $('#lightbox').showModal(); $('#lightbox').scrollTop = $('#lightbox').scrollLeft = 0; syncOverlay();
}
function toggleLarge() {
  const enlarged = $('#lightbox-image').classList.toggle('zoomed');
  $('#lightbox-zoom').textContent = enlarged ? '适应窗口 −' : '放大细节 +'; $('#lightbox-zoom').setAttribute('aria-pressed', String(enlarged));
}
$('#lightbox-zoom').onclick = $('#lightbox-image').onclick = toggleLarge;
$('#lightbox-close').onclick = () => $('#lightbox').close();
$('#lightbox').onclick = event => { if (event.target === $('#lightbox')) $('#lightbox').close(); };
$('#lightbox').addEventListener('close', syncOverlay);
fetch('projects.json').then(response => { if (!response.ok) throw new Error('Project data unavailable'); return response.json(); }).then(data => {
  projects = data; gallery = window.initializePortfolioGallery(data, openCase); syncOverlay();
}).catch(error => {
  console.error(error); $('#project-description').textContent = '项目加载失败，请刷新页面。';
  $('#scene-status').textContent = '项目加载失败，请刷新页面。';
});

})();
