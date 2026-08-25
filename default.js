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
     3. INTRO VIDEO ANIMATION (FULLY FLEXIBLE FOR ALL DISPLAY SIZES)
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
      pointer-events: none;
      overflow: hidden;
      padding: 20px;
      box-sizing: border-box;
    `;

    const video = document.createElement('video');
    video.src = 'videos/pixel.mp4';
    
    // Mobile autoplay requirements
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    
    // Dynamic sizing function for true responsiveness
    const updateVideoFit = () => {
      const screenAspect = window.innerWidth / window.innerHeight;
      const videoAspect = video.videoWidth && video.videoHeight 
        ? video.videoWidth / video.videoHeight 
        : 16 / 9; // Fallback to 16:9 standard ratio

      // If screen aspect matches video closely, cover; otherwise contain to avoid text cropping
      if (Math.abs(screenAspect - videoAspect) < 0.2) {
        video.style.objectFit = 'cover';
      } else {
        video.style.objectFit = 'contain';
      }
    };

    video.style.cssText = `
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: object-fit 0.3s ease;
    `;

    // Adjust fit when video metadata loads and on screen resize/orientation change
    video.addEventListener('loadedmetadata', updateVideoFit);
    window.addEventListener('resize', updateVideoFit);

    overlay.appendChild(video);
    document.body.appendChild(overlay);

    const removeOverlay = () => {
      window.removeEventListener('resize', updateVideoFit);
      if (overlay.parentNode) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
      }
    };

    // Attempt programmatically starting the video for strict mobile WebKit
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        removeOverlay();
      });
    }

    video.addEventListener('ended', removeOverlay);
    video.addEventListener('error', removeOverlay);

    // Safety fallback after 3s
    setTimeout(removeOverlay, 3000);
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