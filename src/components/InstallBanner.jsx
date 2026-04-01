import React, { useState, useEffect } from 'react';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isSafari() {
  return /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed this session
    if (isStandalone()) return;
    if (sessionStorage.getItem('showflow_install_dismissed')) return;

    // iOS Safari fallback
    if (isIOS() && isSafari()) {
      setIsIOSSafari(true);
      setShow(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
    if (outcome === 'accepted') {
      sessionStorage.setItem('showflow_install_dismissed', '1');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('showflow_install_dismissed', '1');
  };

  if (!show) return null;

  return (
    <div className="install-banner" role="banner">
      {isIOSSafari ? (
        <>
          <span className="install-text">
            Tap the Share button <strong>↑</strong> then <strong>"Add to Home Screen"</strong> to install ShowFlow
          </span>
          <button className="install-dismiss" onClick={handleDismiss} aria-label="Dismiss">✕</button>
        </>
      ) : (
        <>
          <span className="install-text">Install ShowFlow for the best experience</span>
          <button className="install-btn" onClick={handleInstall}>Install</button>
          <button className="install-dismiss" onClick={handleDismiss} aria-label="Not now">Not now</button>
        </>
      )}
    </div>
  );
}
