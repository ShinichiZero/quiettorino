"use client";

import type { Map as LeafletMap, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { SpazioSensoriale } from "@/types";

interface SpaceMapProps { spazi: SpazioSensoriale[]; }
const colori: Record<SpazioSensoriale["rumore"]["intensita"], string> = { "molto-basso": "#166534", basso: "#08775a", moderato: "#b45309", alto: "#b42318" };
const etichette: Record<SpazioSensoriale["rumore"]["intensita"], string> = { "molto-basso": "Molto tranquillo", basso: "Tranquillo", moderato: "Rumore medio", alto: "Rumoroso" };
function escapeHtml(testo: string): string { return testo.replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[c] ?? c); }

export default function SpaceMap({ spazi }: SpaceMapProps) {
  const contenitoreRef = useRef<HTMLDivElement>(null);
  const mappaRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker[]>([]);
  const [pronta, setPronta] = useState(false);
  const [errore, setErrore] = useState(false);

  useEffect(() => {
    let annullato = false;
    async function inizializza() {
      try {
        const L = await import("leaflet");
        if (annullato || !contenitoreRef.current) return;
        const mappa = L.map(contenitoreRef.current, { center: [45.0703, 7.6869], zoom: 13, scrollWheelZoom: false, zoomControl: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(mappa);
        mappaRef.current = mappa;
        setPronta(true);
      } catch { if (!annullato) setErrore(true); }
    }
    void inizializza();
    return () => { annullato = true; markerRef.current = []; mappaRef.current?.remove(); mappaRef.current = null; };
  }, []);

  useEffect(() => {
    if (!pronta || !mappaRef.current) return;
    let annullato = false;
    async function aggiorna() {
      const L = await import("leaflet");
      if (annullato || !mappaRef.current) return;
      markerRef.current.forEach((marker) => marker.remove());
      markerRef.current = spazi.map((spazio) => {
        const colore = colori[spazio.rumore.intensita];
        const etichetta = etichette[spazio.rumore.intensita];
        const icon = L.divIcon({ className: "quiet-map-marker-wrapper", html: `<span class="quiet-map-marker" style="--marker-color:${colore}"><span class="sr-only">${escapeHtml(etichetta)}</span></span>`, iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -42] });
        const marker = L.marker([spazio.coordinate.latitudine, spazio.coordinate.longitudine], { icon, keyboard: true, title: `${spazio.nome}: ${etichetta}`, alt: `Apri dettagli di ${spazio.nome}, ${etichetta}` }).addTo(mappaRef.current!);
        marker.bindPopup(`<article class="map-popup"><strong>${escapeHtml(spazio.nome)}</strong><span>${escapeHtml(spazio.indirizzo)}</span><span>${spazio.rumore.decibelMin}–${spazio.rumore.decibelMax} dB · ${escapeHtml(etichetta)}</span></article>`);
        return marker;
      });
      if (spazi.length) mappaRef.current.fitBounds(L.latLngBounds(spazi.map((spazio) => [spazio.coordinate.latitudine, spazio.coordinate.longitudine] as [number, number])), { padding: [48, 48], maxZoom: 15 });
    }
    void aggiorna();
    return () => { annullato = true; };
  }, [pronta, spazi]);

  if (errore) return <div className="map-error" role="alert">La mappa non è disponibile. Usa la vista Lista per consultare tutti gli spazi.</div>;
  return <section className="map-panel" aria-labelledby="titolo-mappa"><h2 id="titolo-mappa" className="sr-only">Mappa degli spazi filtrati</h2><div ref={contenitoreRef} className="map-container" role="region" aria-label={`Mappa interattiva con ${spazi.length} ${spazi.length === 1 ? "luogo" : "luoghi"}`} />{!pronta && <p className="map-loading" role="status">Caricamento della mappa…</p>}<div className="map-legend" aria-label="Legenda livello di rumore"><strong>Rumore stimato</strong><ul>{Object.entries(etichette).map(([livello, etichetta]) => <li key={livello}><span className="legend-dot" style={{ backgroundColor: colori[livello as keyof typeof colori] }} aria-hidden="true" />{etichetta}</li>)}</ul></div></section>;
}