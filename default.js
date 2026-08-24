document.addEventListener("DOMContentLoaded", () => {
  // 1. Mobile Hamburger Menu Toggle
  const hamburger = document.getElementById("hamburger-btn");
  const navMenu = document.getElementById("navbar-nav");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("show");
    });
  }

  // 2. Scrub Bar Scroll Progress
  const scrubFill = document.getElementById("scrubFill");

  window.addEventListener("scroll", () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    if (scrollHeight > 0 && scrubFill) {
      const progress = (scrollTop / scrollHeight) * 100;
      scrubFill.style.width = progress + "%";
    }
  });

  /* ==========================================================================
     3. INTRO VIDEO ANIMATION (FIRST VISIT & REFRESH ONLY)
     ========================================================================== */
  const navigationEntries = performance.getEntriesByType('navigation');
  const isRefresh = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';
  const hasVisited = sessionStorage.getItem('pixel_visited');

  if (isRefresh || !hasVisited) {
    sessionStorage.setItem('pixel_visited', 'true');

    const overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: #0f0d18;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s ease;
    `;

    const video = document.createElement('video');
    video.src = 'videos/pixel.mp4';
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;

    overlay.appendChild(video);
    document.body.appendChild(overlay);

    video.addEventListener('ended', () => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    });

    setTimeout(() => {
      if (document.body.contains(overlay)) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
      }
    }, 3000);
  } else {
    sessionStorage.setItem('pixel_visited', 'true');
  }

  /* ==========================================================================
     4. COOKIE CONSENT MODULE (Vanilla JS - No jQuery dependency required)
     ========================================================================== */
  function initCookieConsent() {
    const CONSENT_KEY = 'site_cookie_consent';
    const consent = localStorage.getItem(CONSENT_KEY);

    // If user already decided, DO NOT show the banner
    if (consent) {
      return;
    }

    let banner = document.getElementById('cookie-banner');

    // Auto-inject HTML container if missing from your HTML file
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'cookie-banner';
      banner.className = 'cookie-banner';
      banner.innerHTML = `
        <div class="cookie-banner-content">
          <p>We use cookies to improve your experience. Choose your preferences below.</p>
          <div class="cookie-banner-actions">
            <button type="button" id="accept-cookies" class="cookie-btn cookie-accept">Accept</button>
            <button type="button" id="reject-cookies" class="cookie-btn cookie-reject">Reject</button>
          </div>
        </div>
      `;
      document.body.appendChild(banner);
    }

    // Un-hide banner safely only for first-time visitors
    banner.classList.remove('hidden');
    banner.style.display = 'block';

    // Event listener for Accept
    document.addEventListener('click', (event) => {
      if (event.target && event.target.id === 'accept-cookies') {
        localStorage.setItem(CONSENT_KEY, 'accepted');
        banner.style.display = 'none';
      }
    });

    // Event listener for Reject
    document.addEventListener('click', (event) => {
      if (event.target && event.target.id === 'reject-cookies') {
        localStorage.setItem(CONSENT_KEY, 'rejected');
        banner.style.display = 'none';
      }
    });
  }

  // Run cookie check
  initCookieConsent();
});