"use client";

import { Accessibility, AlertTriangle, ChevronDown, Clock3, ExternalLink, Lightbulb, MapPin, Sparkles, Users, Volume2 } from "lucide-react";
import { etichetteAffollamento, formattaGiorni, trovaAffollamentoAttuale } from "@/lib/sensory";
import type { SpazioSensoriale } from "@/types";

interface SpaceCardProps { spazio: SpazioSensoriale; }
const categorie: Record<SpazioSensoriale["categoria"], string> = { biblioteca: "Biblioteca", parco: "Parco", museo: "Museo", "ufficio-pubblico": "Ufficio pubblico", "centro-culturale": "Centro culturale" };
const luci: Record<SpazioSensoriale["illuminazione"]["livello"], string> = { basso: "Soffusa", medio: "Media", alto: "Intensa", variabile: "Variabile" };

export default function SpaceCard({ spazio }: SpaceCardProps) {
  const affollamento = trovaAffollamentoAttuale(spazio);
  const quietLabel = spazio.quietRoom.tipologia === "stanza-dedicata" ? "Quiet Room presente" : "Area tranquilla presente";
  return (
    <article className="space-card" aria-labelledby={`titolo-${spazio.id}`}>
      <div className="card-heading"><div><p className="category-label">{categorie[spazio.categoria]}</p><h3 id={`titolo-${spazio.id}`}>{spazio.nome}</h3><p className="address"><MapPin aria-hidden="true" /><span>{spazio.indirizzo}</span></p></div><span className={`calm-score calm-${spazio.rumore.intensita}`}><span aria-hidden="true">●</span> {spazio.rumore.intensita.replace("-", " ")}</span></div>
      <p className="card-description">{spazio.descrizione}</p>
      <ul className="sensory-badges" aria-label="Caratteristiche sensoriali principali">
        <li className="sensory-badge"><Volume2 aria-hidden="true" /><span><strong>{spazio.rumore.decibelMin}–{spazio.rumore.decibelMax} dB</strong><small>rumore stimato</small></span></li>
        <li className="sensory-badge"><Users aria-hidden="true" /><span><strong>{affollamento ? etichetteAffollamento[affollamento.livello] : "Non disponibile"}</strong><small>affollamento attuale</small></span></li>
        <li className="sensory-badge"><Lightbulb aria-hidden="true" /><span><strong>{luci[spazio.illuminazione.livello]}</strong><small>illuminazione</small></span></li>
        {spazio.quietRoom.presente && <li className="sensory-badge quiet-badge"><Sparkles aria-hidden="true" /><span><strong>{quietLabel}</strong><small>{spazio.quietRoom.verificata ? "servizio verificato" : "da verificare"}</small></span></li>}
        {spazio.accessibilita.accessoSenzaBarriere && <li className="sensory-badge"><Accessibility aria-hidden="true" /><span><strong>Accesso senza barriere</strong><small>percorso indicato</small></span></li>}
      </ul>
      <details className="card-details"><summary>Dettagli sensoriali e orari<ChevronDown aria-hidden="true" /></summary><div className="details-content">
        <section aria-labelledby={`orari-${spazio.id}`}><h4 id={`orari-${spazio.id}`}><Clock3 aria-hidden="true" /> Orari più tranquilli</h4><ul>{spazio.orariTranquilli.map((orario) => <li key={`${orario.giorni.join("-")}-${orario.dalle}`}><strong>{formattaGiorni(orario.giorni)}, {orario.dalle}–{orario.alle}</strong><span>{orario.motivazione}</span></li>)}</ul></section>
        <section aria-labelledby={`avvertenze-${spazio.id}`}><h4 id={`avvertenze-${spazio.id}`}><AlertTriangle aria-hidden="true" /> Avvertenze sensoriali</h4><ul>{spazio.rumore.nota && <li>{spazio.rumore.nota}</li>}{spazio.illuminazione.nota && <li>{spazio.illuminazione.nota}</li>}{spazio.avvertenze.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <p className="quiet-room-note"><strong>Spazio tranquillo:</strong> {spazio.quietRoom.descrizione}</p>
        {spazio.sitoWeb && <a className="external-link" href={spazio.sitoWeb} target="_blank" rel="noreferrer">Visita il sito ufficiale <ExternalLink aria-hidden="true" /><span className="sr-only"> (si apre in una nuova scheda)</span></a>}
      </div></details>
    </article>
  );
}