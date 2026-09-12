"use client";

import { List, Map } from "lucide-react";
import { useMemo, useState } from "react";
import DecibelMeterModal from "@/components/DecibelMeterModal";
import FilterBar, { type PreferenzaIlluminazione, type StatoFiltri } from "@/components/FilterBar";
import Header from "@/components/Header";
import PWAInstaller from "@/components/PWAInstaller";
import SpaceCard from "@/components/SpaceCard";
import SpaceMap from "@/components/SpaceMap";
import { mockSpaces } from "@/data/mockSpaces";
import { ordineAffollamento, trovaAffollamentoAttuale } from "@/lib/sensory";
import type { SpazioSensoriale } from "@/types";

type Vista = "lista" | "mappa";

const filtriIniziali: StatoFiltri = {
  decibelMassimi: 75,
  illuminazione: [],
  soloQuietRoom: false,
  soloAccessibili: false,
  affollamentoMassimo: "alto",
};

function corrispondeIlluminazione(spazio: SpazioSensoriale, preferenze: PreferenzaIlluminazione[]) {
  if (!preferenze.length) return true;
  return preferenze.some((preferenza) => {
    if (preferenza === "naturale") return spazio.illuminazione.luceNaturale;
    if (preferenza === "soffusa") return spazio.illuminazione.livello === "basso";
    return spazio.illuminazione.livello === "alto";
  });
}

export default function HomePage() {
  const [vista, setVista] = useState<Vista>("lista");
  const [filtri, setFiltri] = useState<StatoFiltri>(filtriIniziali);
  const [misuratoreAperto, setMisuratoreAperto] = useState(false);
  const spaziFiltrati = useMemo(() => mockSpaces.filter((spazio) => {
    const affollamento = trovaAffollamentoAttuale(spazio);
    return spazio.rumore.decibelMax <= filtri.decibelMassimi
      && corrispondeIlluminazione(spazio, filtri.illuminazione)
      && (!filtri.soloQuietRoom || spazio.quietRoom.presente)
      && (!filtri.soloAccessibili || spazio.accessibilita.accessoSenzaBarriere)
      && (!affollamento || ordineAffollamento[affollamento.livello] <= ordineAffollamento[filtri.affollamentoMassimo]);
  }), [filtri]);

  return (
    <>
      <Header onOpenMeter={() => setMisuratoreAperto(true)} />
      <main id="contenuto-principale" className="app-main" tabIndex={-1}>
        <section className="hero" aria-labelledby="titolo-pagina">
          <p className="section-kicker">Torino, con meno sorprese sensoriali</p>
          <h1 id="titolo-pagina">Trova il tuo spazio tranquillo</h1>
          <p>Confronta rumore, luce e affollamento prima di uscire. I valori sono stime orientative e possono variare.</p>
        </section>
        <PWAInstaller />
        <FilterBar filtri={filtri} onChange={setFiltri} onReset={() => setFiltri(filtriIniziali)} />
        <section className="results-section" aria-labelledby="titolo-risultati">
          <div className="results-toolbar">
            <div><p className="section-kicker">Risultati aggiornati</p><h2 id="titolo-risultati">{spaziFiltrati.length} {spaziFiltrati.length === 1 ? "spazio trovato" : "spazi trovati"}</h2></div>
            <div className="view-switcher" role="group" aria-label="Scegli il tipo di visualizzazione">
              <button type="button" className={vista === "lista" ? "active" : undefined} aria-pressed={vista === "lista"} onClick={() => setVista("lista")}><List aria-hidden="true" /> Lista</button>
              <button type="button" className={vista === "mappa" ? "active" : undefined} aria-pressed={vista === "mappa"} onClick={() => setVista("mappa")}><Map aria-hidden="true" /> Mappa</button>
            </div>
          </div>
          <p className="sr-only" role="status" aria-live="polite">I filtri mostrano {spaziFiltrati.length} {spaziFiltrati.length === 1 ? "spazio" : "spazi"}.</p>
          {spaziFiltrati.length === 0 ? (
            <div className="empty-state" role="status"><h3>Nessuno spazio corrisponde ai filtri</h3><p>Prova ad aumentare il rumore massimo o a rimuovere una preferenza.</p><button className="primary-button" type="button" onClick={() => setFiltri(filtriIniziali)}>Azzera tutti i filtri</button></div>
          ) : vista === "lista" ? (
            <div className="space-list">{spaziFiltrati.map((spazio) => <SpaceCard key={spazio.id} spazio={spazio} />)}</div>
          ) : <SpaceMap spazi={spaziFiltrati} />}
        </section>
      </main>
      <DecibelMeterModal open={misuratoreAperto} onClose={() => setMisuratoreAperto(false)} spazi={mockSpaces} />
      <footer className="site-footer"><p>QuietTorino · Dati sensoriali indicativi, da verificare prima della visita.</p></footer>
    </>
  );
}