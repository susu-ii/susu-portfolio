(function () {
  'use strict';
  if (window.parent === window) return;

  let syncingFromParent = false;
  let releaseFrame = 0;

  function postMetrics() {
    const root = document.scrollingElement || document.documentElement;
    window.parent.postMessage({
      type: 'works-original:metrics',
      scrollHeight: root.scrollHeight,
      viewportHeight: window.innerHeight
    }, window.location.origin);
  }

  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'works-original:request-metrics') {
      postMetrics();
      return;
    }
    if (event.data?.type !== 'works-original:set-scroll') return;
    const root = document.scrollingElement || document.documentElement;
    const max = Math.max(0, root.scrollHeight - window.innerHeight);
    const y = Math.max(0, Math.min(max, Number(event.data.y) || 0));
    syncingFromParent = true;
    window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    cancelAnimationFrame(releaseFrame);
    releaseFrame = requestAnimationFrame(() => {
      releaseFrame = requestAnimationFrame(() => { syncingFromParent = false; });
    });
  });

  window.addEventListener('wheel', event => {
    if (event.ctrlKey || document.querySelector('dialog[open]')) return;
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (!delta) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.parent.postMessage({
      type: 'works-original:wheel',
      deltaY: delta,
      deltaMode: event.deltaMode
    }, window.location.origin);
  }, { passive: false, capture: true });

  window.addEventListener('scroll', () => {
    if (syncingFromParent) return;
    window.parent.postMessage({ type: 'works-original:inner-scroll', y: window.scrollY }, window.location.origin);
  }, { passive: true });

  window.addEventListener('load', postMetrics, { once: true });
  window.addEventListener('resize', postMetrics, { passive: true });
  new ResizeObserver(postMetrics).observe(document.documentElement);
  postMetrics();
})();
