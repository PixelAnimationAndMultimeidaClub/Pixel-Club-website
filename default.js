/* ==========================================================================
   DEFAULT.JS - Main Website Script
   ========================================================================== */

// Global Scope Definitions (Accessible from any file or HTML element)
window.CookieManager = {
  hasConsent: false,

  setConsent(consentGiven) {
    this.hasConsent = consentGiven;
    
    if (consentGiven) {
      if (typeof window.favorites !== 'undefined' && window.favorites.length > 0) {
        this.set('pixel_favs', JSON.stringify(window.favorites));
      }
    } else {
      this.delete('pixel_favs');
    }
  },

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

  get(name) {
    const matches = document.cookie.match(new RegExp(
      `(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
  },

  delete(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

// Favorites Utility Functions
const FAVS_KEY = 'pixel_favs';

function loadFavoritesOnStart() {
  const CONSENT_KEY = 'site_cookie_consent';
  const savedConsent = localStorage.getItem(CONSENT_KEY);
  
  window.CookieManager.hasConsent = (savedConsent === 'accepted');

  try {
    const savedData = window.CookieManager.get(FAVS_KEY);
    return savedData ? JSON.parse(savedData) : [];
  } catch (error) {
    console.error("Failed to parse favorites cookie:", error);
    return [];
  }
}

window.favorites = loadFavoritesOnStart();

window.toggleFavorite = function(itemId) {
  const index = window.favorites.indexOf(itemId);
  
  if (index === -1) {
    window.favorites.push(itemId);
  } else {
    window.favorites.splice(index, 1);
  }

  window.CookieManager.set(FAVS_KEY, JSON.stringify(window.favorites));
  
  if (typeof renderFavoritesUI === 'function') {
    renderFavoritesUI();
  }
};

// Main DOM Content Initialization
document.addEventListener("DOMContentLoaded", () => {

  // 1. Mobile Hamburger Menu Toggle
  try {
    const hamburger = document.getElementById("hamburger-btn");
    const navMenu = document.getElementById("navbar-nav");

    if (hamburger && navMenu) {
      hamburger.addEventListener("click", () => {
        navMenu.classList.toggle("show");
      });
    }
  } catch (err) {
    console.error("Hamburger Menu Error:", err);
  }

  // 2. Scrub Bar Scroll Progress
  try {
    const scrubFill = document.getElementById("scrubFill");

    window.addEventListener("scroll", () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (scrollHeight > 0 && scrubFill) {
        const progress = (scrollTop / scrollHeight) * 100;
        scrubFill.style.width = progress + "%";
      }
    });
  } catch (err) {
    console.error("Scrub Bar Error:", err);
  }

  // 3. Intro Video Animation
  try {
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
        z-index: 999;
        background: #0f0d18;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.5s ease;
        overflow: hidden;
        padding: 20px;
        box-sizing: border-box;
      `;

      const video = document.createElement('video');
      video.src = 'videos/pixel.mp4';
      video.muted = true;
      video.defaultMuted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('muted', '');
      
      const updateVideoFit = () => {
        const screenAspect = window.innerWidth / window.innerHeight;
        const videoAspect = video.videoWidth && video.videoHeight 
          ? video.videoWidth / video.videoHeight 
          : 16 / 9;

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

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => removeOverlay());
      }

      video.addEventListener('ended', removeOverlay);
      video.addEventListener('error', removeOverlay);

      setTimeout(removeOverlay, 2500);
    } else {
      sessionStorage.setItem('pixel_visited', 'true');
    }
  } catch (err) {
    console.error("Intro Video Overlay Error:", err);
  }

  // 4. Cookie Consent Banner & YouTube Control
  try {
    function initCookieConsent() {
      const CONSENT_KEY = 'site_cookie_consent';
      const consent = localStorage.getItem(CONSENT_KEY);

      function handleYouTubeIframes(useCookies) {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          const src = iframe.getAttribute('src') || iframe.getAttribute('data-src');
          if (src && src.includes('youtube')) {
            if (useCookies) {
              iframe.src = src.replace('youtube-nocookie.com', 'youtube.com');
            } else {
              iframe.src = src.replace('youtube.com', 'youtube-nocookie.com');
            }
          }
        });
      }

      if (consent) {
        const isAccepted = consent === 'accepted';
        window.CookieManager.setConsent(isAccepted);
        handleYouTubeIframes(isAccepted);
        return;
      }

      handleYouTubeIframes(false);

      let banner = document.getElementById('cookie-banner');

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

      banner.classList.remove('hidden');
      banner.style.display = 'block';

      document.addEventListener('click', (event) => {
        if (event.target && event.target.id === 'accept-cookies') {
          localStorage.setItem(CONSENT_KEY, 'accepted');
          window.CookieManager.setConsent(true);
          handleYouTubeIframes(true);
          banner.style.display = 'none';
        }
        if (event.target && event.target.id === 'reject-cookies') {
          localStorage.setItem(CONSENT_KEY, 'rejected');
          window.CookieManager.setConsent(false);
          handleYouTubeIframes(false);
          banner.style.display = 'none';
        }
      });
    }

    initCookieConsent();
  } catch (err) {
    console.error("Cookie Banner Error:", err);
  }
});