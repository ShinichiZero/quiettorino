"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export default function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(userAgent) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const frame = window.requestAnimationFrame(() => {
      setIsIOS(ios);
      setInstalled(isStandalone());
      setDismissed(window.sessionStorage.getItem("quiettorino-install-dismissed") === "true");
    });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowIOSInstructions(false);
    };
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => setInstalled(isStandalone());

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    displayMode.addEventListener("change", onDisplayModeChange);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
        console.error("Registrazione Service Worker non riuscita:", error);
      });
    }
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      displayMode.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  async function installa() {
    if (installPrompt) {
      await installPrompt.prompt();
      const scelta = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (scelta.outcome === "dismissed") setDismissed(true);
      return;
    }
    if (isIOS) setShowIOSInstructions(true);
  }

  function nascondi() {
    setDismissed(true);
    window.sessionStorage.setItem("quiettorino-install-dismissed", "true");
  }

  if (installed || dismissed || (!installPrompt && !isIOS)) return null;

  return (
    <aside className="install-banner" aria-labelledby="install-title">
      <div className="install-banner-icon" aria-hidden="true"><Download /></div>
      <div className="install-copy">
        <h2 id="install-title">Installa QuietTorino</h2>
        {showIOSInstructions ? (
          <div className="ios-instructions" role="status">
            <p>In Safari tocca <Share aria-label="Condividi" /> <strong>Condividi</strong>, poi scorri e scegli <strong>“Aggiungi alla schermata Home”</strong>.</p>
          </div>
        ) : <p>Accesso rapido dalla schermata Home e contenuti già visitati disponibili anche senza rete.</p>}
      </div>
      <div className="install-actions">
        {!showIOSInstructions && <button className="primary-button" type="button" onClick={() => void installa()}><Download aria-hidden="true" /> {isIOS ? "Mostra istruzioni" : "Installa app"}</button>}
        <button className="icon-button" type="button" onClick={nascondi} aria-label="Nascondi invito all’installazione"><X aria-hidden="true" /></button>
      </div>
    </aside>
  );
}