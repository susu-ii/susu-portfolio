(function () {
  'use strict';
  if (window.parent === window) return;

  window.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    const root = document.scrollingElement || document.documentElement;
    const max = Math.max(0, root.scrollHeight - window.innerHeight);
    const leavingAtTop = event.deltaY < 0 && window.scrollY <= 1;
    const leavingAtBottom = event.deltaY > 0 && window.scrollY >= max - 1;
    if (!leavingAtTop && !leavingAtBottom) return;

    event.preventDefault();
    window.parent.postMessage({
      type: 'works-original:boundary-wheel',
      deltaY: event.deltaY,
      deltaMode: event.deltaMode
    }, window.location.origin);
  }, { passive: false });
})();
