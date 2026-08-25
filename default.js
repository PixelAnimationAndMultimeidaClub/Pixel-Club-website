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

  // ==========================================
// 1. DYNAMIC COOKIE & CONSENT MANAGER
// ==========================================
const CookieManager = {
  // Flag tracking consent (Synced with localStorage on start)
  hasConsent: false,

  // Called when user clicks "Accept" or "Reject" on your banner
  setConsent(consentGiven) {
    this.hasConsent = consentGiven;
    
    if (consentGiven) {
      // Save current in-memory favorites to cookie when consent is granted
      if (typeof favorites !== 'undefined' && favorites.length > 0) {
        this.set('pixel_favs', JSON.stringify(favorites));
      }
    } else {
      // Wipe cookie if user rejects or revokes consent
      this.delete('pixel_favs');
    }
  },

  // Dynamic set method with built-in consent check
  set(name, value, days = 30) {
    if (!this.hasConsent) {
      console.warn(`[CookieManager] Skipping cookie "${name}": Consent not granted.`);
      return false;
    }

    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Lax${secure}`;
    return true;
  },

  // Read cookies safely
  get(name) {
    const matches = document.cookie.match(new RegExp(
      `(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
  },

  // Clear/Delete cookie helper
  delete(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};


// ==========================================
// 2. FAVORITES LOGIC (SYNCED WITH CONSENT)
// ==========================================
const FAVS_KEY = 'pixel_favs';

// Safely read saved favorites and sync consent state on start
function loadFavoritesOnStart() {
  const CONSENT_KEY = 'site_cookie_consent';
  const savedConsent = localStorage.getItem(CONSENT_KEY);
  
  // Restore consent status in CookieManager from prior visits
  CookieManager.hasConsent = (savedConsent === 'accepted');

  try {
    const savedData = CookieManager.get(FAVS_KEY);
    return savedData ? JSON.parse(savedData) : [];
  } catch (error) {
    console.error("Failed to parse favorites cookie:", error);
    return [];
  }
}

// In-Memory global state
let favorites = loadFavoritesOnStart();

// Toggle item in favorites array and save according to consent
function toggleFavorite(itemId) {
  const index = favorites.indexOf(itemId);
  
  if (index === -1) {
    favorites.push(itemId);
  } else {
    favorites.splice(index, 1);
  }

  // Attempt to write cookie; degrades to tab memory if hasConsent === false
  CookieManager.set(FAVS_KEY, JSON.stringify(favorites));
  
  if (typeof renderFavoritesUI === 'function') {
    renderFavoritesUI();
  }
}