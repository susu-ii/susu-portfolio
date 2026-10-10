(function () {
  'use strict';
  const profile = document.querySelector('#profile');
  function syncOverlay() {
    const open = !!document.querySelector('dialog[open]');
    document.body.style.overflow = open ? 'hidden' : '';
    if (window.PortfolioGallery) window.PortfolioGallery.setPaused(open);
  }
  function showProfile() {
    if (profile && !profile.open) profile.showModal();
    syncOverlay();
  }
  function closeProfile() {
    if (profile) profile.close();
    syncOverlay();
  }
  window.PortfolioUI = { syncOverlay, showProfile, closeProfile };
  document.querySelectorAll('#badge,#about,#intro-profile,#contact-about,#contact-badge').forEach(button => {
    button.onclick = showProfile;
  });
  if (profile) {
    profile.querySelector('.close').onclick = closeProfile;
    profile.onclick = event => { if (event.target === profile) closeProfile(); };
    profile.addEventListener('close', syncOverlay);
  }
})();
