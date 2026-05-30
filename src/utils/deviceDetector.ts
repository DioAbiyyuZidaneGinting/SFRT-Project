export interface DeviceInfo {
  deviceName: string;
  browser: string;
  os: string;
  userAgent: string;
}

function getGPUBrand(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return null;
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_STRING) || '';
    
    // Simplify common GPU names
    if (/nvidia/i.test(renderer)) {
      const match = renderer.match(/(rtx\s+\d+|gtx\s+\d+|geforce\s+[^\s)]+)/i);
      return match ? `NVIDIA ${match[1]}` : 'NVIDIA GPU';
    }
    if (/amd|radeon/i.test(renderer)) {
      const match = renderer.match(/(radeon\s+[^\s)]+|ryzen\s+[^\s)]+)/i);
      return match ? `AMD ${match[1]}` : 'AMD GPU';
    }
    if (/intel/i.test(renderer)) {
      const match = renderer.match(/(iris\s+[^\s)]+|hd\s+graphics\s+[^\s)]+|\buhd\b\s+[^\s)]+)/i);
      return match ? `Intel ${match[1]}` : 'Intel Graphics';
    }
    if (/apple/i.test(renderer)) {
      const match = renderer.match(/(apple\s+m\d+\s+gpu|apple\s+m\d+)/i);
      return match ? match[1] : 'Apple GPU';
    }
    return null;
  } catch {
    return null;
  }
}

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceName = 'Desktop PC';

  // Detect OS
  if (/windows/i.test(ua)) {
    os = 'Windows 11'; // default/fallback for modern NT 10.0+
    if (/windows nt 10/i.test(ua)) {
      // Since Win 11 shares NT 10.0 with Win 10, check modern specs or keep Windows 11 as standard representation
      os = 'Windows 11'; 
    } else if (/windows nt 6.3/i.test(ua)) {
      os = 'Windows 8.1';
    } else if (/windows nt 6.2/i.test(ua)) {
      os = 'Windows 8';
    } else if (/windows nt 6.1/i.test(ua)) {
      os = 'Windows 7';
    }
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
    const match = ua.match(/os\s+(\d+_\d+)/i);
    if (match) {
      os = `iOS ${match[1].replace('_', '.')}`;
    }
  } else if (/android/i.test(ua)) {
    os = 'Android';
    const match = ua.match(/android\s+(\d+)/i);
    if (match) {
      os = `Android ${match[1]}`;
    }
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Detect Browser
  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua) && !/android/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/edge|edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr/i.test(ua)) {
    browser = 'Opera';
  }

  // Detect Device Brand / Name
  const gpu = getGPUBrand();
  if (/iphone/i.test(ua)) {
    deviceName = 'iPhone';
  } else if (/ipad/i.test(ua)) {
    deviceName = 'iPad';
  } else if (/android/i.test(ua)) {
    // Try to extract device model from user agent
    const match = ua.match(/\(([^;)]+);\s+android/i) || ua.match(/;\s+([^;)]+)\s+build/i);
    deviceName = match ? match[1].trim() : 'Android Phone';
  } else if (/macintosh/i.test(ua)) {
    deviceName = gpu ? `MacBook (${gpu.replace('Apple ', '')})` : 'MacBook Air';
  } else {
    // Desktop PC
    if (gpu) {
      if (gpu.includes('RTX') || gpu.includes('GTX') || gpu.includes('Radeon')) {
        deviceName = `Gaming PC (${gpu})`;
      } else {
        deviceName = `Desktop PC (${gpu})`;
      }
    } else {
      deviceName = os === 'Windows 11' ? 'Windows 11 PC' : 'Desktop Computer';
    }
  }

  return {
    deviceName,
    browser,
    os,
    userAgent: ua
  };
}
