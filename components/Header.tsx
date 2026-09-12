"use client";

import { AudioLines, Contrast, MapPinned, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Tema = "chiaro" | "scuro";

interface HeaderProps {
  onOpenMeter: () => void;
}

export default function Header({ onOpenMeter }: HeaderProps) {
  const [tema, setTema] = useState<Tema>("chiaro");
  const [contrastoAlto, setContrastoAlto] = useState(false);
  const [installata, setInstallata] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const aggiornaInstallazione = () => setInstallata(media.matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
    const frame = window.requestAnimationFrame(() => {
      const salvato = window.localStorage.getItem("quiettorino-tema");
      const temaCorrente: Tema = salvato === "chiaro" || salvato === "scuro" ? salvato : window.matchMedia("(prefers-color-scheme: dark)").matches ? "scuro" : "chiaro";
      const contrasto = window.localStorage.getItem("quiettorino-contrasto") === "alto";
      setTema(temaCorrente);
      setContrastoAlto(contrasto);
      document.documentElement.dataset.theme = temaCorrente;
      document.documentElement.dataset.contrast = contrasto ? "high" : "standard";
      aggiornaInstallazione();
    });
    media.addEventListener("change", aggiornaInstallazione);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", aggiornaInstallazione);
    };
  }, []);

  function cambiaTema() {
    const nuovo: Tema = tema === "chiaro" ? "scuro" : "chiaro";
    setTema(nuovo);
    document.documentElement.dataset.theme = nuovo;
    window.localStorage.setItem("quiettorino-tema", nuovo);
  }

  function cambiaContrasto() {
    const nuovo = !contrastoAlto;
    setContrastoAlto(nuovo);
    document.documentElement.dataset.contrast = nuovo ? "high" : "standard";
    window.localStorage.setItem("quiettorino-contrasto", nuovo ? "alto" : "standard");
  }

  return (
    <header className="site-header">
      <a className="skip-link" href="#contenuto-principale">Salta al contenuto principale</a>
      <div className="header-inner">
        <a className="brand" href="#contenuto-principale" aria-label="QuietTorino, pagina iniziale">
          <span className="brand-mark" aria-hidden="true"><MapPinned strokeWidth={2} /></span>
          <span><strong>QuietTorino</strong><small>Mappa sensoriale</small></span>
        </a>
        <div className="header-actions" aria-label="Preferenze di visualizzazione">
          <button className="header-meter-button" type="button" onClick={onOpenMeter}><AudioLines aria-hidden="true" /><span>Misura rumore live</span></button>
          <span className="pwa-status" title={installata ? "Applicazione installata" : "Versione web"}>
            <span className="status-dot" aria-hidden="true" /><span className="status-label">{installata ? "Installata" : "Web"}</span>
          </span>
          <button className="icon-button" type="button" onClick={cambiaContrasto} aria-pressed={contrastoAlto} aria-label={`${contrastoAlto ? "Disattiva" : "Attiva"} contrasto elevato`} title={`${contrastoAlto ? "Disattiva" : "Attiva"} contrasto elevato`}><Contrast aria-hidden="true" /></button>
          <button className="icon-button" type="button" onClick={cambiaTema} aria-label={`Passa al tema ${tema === "chiaro" ? "scuro" : "chiaro"}`} title={`Passa al tema ${tema === "chiaro" ? "scuro" : "chiaro"}`}>{tema === "chiaro" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}</button>
        </div>
      </div>
    </header>
  );
}