interface NavigatorWithUA extends Navigator {
  userAgentData?: {
    mobile: boolean;
  };
}

/**
 * Detect if the current device is mobile/touchscreen.
 * Uses multiple methods for maximum compatibility.
 */
export function isMobileDevice(): boolean {
  // Method 1: Check navigator.userAgentData (modern browsers)
  if (typeof navigator !== 'undefined' && (navigator as NavigatorWithUA).userAgentData?.mobile) {
    return true;
  }

  // Method 2: Check user agent string (fallback)
  const userAgent = navigator.userAgent.toLowerCase();
  const mobilePatterns = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  if (mobilePatterns.test(userAgent)) {
    return true;
  }

  // Method 3: Check for touchscreen capability
  if (typeof window !== 'undefined' && window.matchMedia) {
    // pointer:coarse indicates touchscreen or pen input
    if (window.matchMedia('(pointer:coarse)').matches) {
      return true;
    }
  }

  // Method 4: Check for touch event support
  if (typeof window !== 'undefined') {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return true;
    }
  }

  return false;
}
