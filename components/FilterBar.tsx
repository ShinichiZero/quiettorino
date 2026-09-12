"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { IntensitaAffollamento } from "@/types";

export type PreferenzaIlluminazione = "soffusa" | "naturale" | "intensa";
export interface StatoFiltri { decibelMassimi: number; illuminazione: PreferenzaIlluminazione[]; soloQuietRoom: boolean; soloAccessibili: boolean; affollamentoMassimo: IntensitaAffollamento; }
interface FilterBarProps { filtri: StatoFiltri; onChange: (filtri: StatoFiltri) => void; onReset: () => void; }
const opzioni: Array<{ value: PreferenzaIlluminazione; label: string }> = [{ value: "soffusa", label: "Soffusa" }, { value: "naturale", label: "Naturale" }, { value: "intensa", label: "Intensa" }];

export default function FilterBar({ filtri, onChange, onReset }: FilterBarProps) {
  function aggiornaLuce(valore: PreferenzaIlluminazione, selezionata: boolean) {
    onChange({ ...filtri, illuminazione: selezionata ? [...filtri.illuminazione, valore] : filtri.illuminazione.filter((item) => item !== valore) });
  }
  return (
    <section className="filter-panel" aria-labelledby="titolo-filtri">
      <div className="filter-heading"><div><p className="section-kicker">Personalizza l’ambiente</p><h2 id="titolo-filtri"><SlidersHorizontal aria-hidden="true" /> Filtri sensoriali</h2></div><button className="text-button" type="button" onClick={onReset}><RotateCcw aria-hidden="true" /> Azzera filtri</button></div>
      <div className="filter-grid">
        <div className="filter-group range-group">
          <div className="range-label-row"><label htmlFor="rumore-massimo">Rumore massimo</label><output htmlFor="rumore-massimo" aria-live="polite">{filtri.decibelMassimi} dB</output></div>
          <input id="rumore-massimo" type="range" min="35" max="75" step="5" value={filtri.decibelMassimi} onChange={(event) => onChange({ ...filtri, decibelMassimi: Number(event.currentTarget.value) })} aria-valuetext={`${filtri.decibelMassimi} decibel`} />
          <div className="range-extremes" aria-hidden="true"><span>35 dB · molto quieto</span><span>75 dB · vivace</span></div>
        </div>
        <fieldset className="filter-group"><legend>Illuminazione desiderata</legend><div className="choice-row">{opzioni.map((opzione) => <label className="choice-chip" key={opzione.value}><input type="checkbox" checked={filtri.illuminazione.includes(opzione.value)} onChange={(event) => aggiornaLuce(opzione.value, event.currentTarget.checked)} /><span>{opzione.label}</span></label>)}</div></fieldset>
        <div className="filter-group"><label htmlFor="affollamento-massimo">Affollamento massimo</label><select id="affollamento-massimo" value={filtri.affollamentoMassimo} onChange={(event) => onChange({ ...filtri, affollamentoMassimo: event.currentTarget.value as IntensitaAffollamento })}><option value="basso">Basso</option><option value="moderato">Medio</option><option value="alto">Alto</option></select></div>
        <fieldset className="filter-group toggle-group"><legend>Servizi necessari</legend>
          <label className="switch-row"><input type="checkbox" role="switch" checked={filtri.soloQuietRoom} onChange={(event) => onChange({ ...filtri, soloQuietRoom: event.currentTarget.checked })} /><span className="switch-track" aria-hidden="true" /><span>Solo con Quiet Room</span></label>
          <label className="switch-row"><input type="checkbox" role="switch" checked={filtri.soloAccessibili} onChange={(event) => onChange({ ...filtri, soloAccessibili: event.currentTarget.checked })} /><span className="switch-track" aria-hidden="true" /><span>Accessibilità disabili</span></label>
        </fieldset>
      </div>
    </section>
  );
}