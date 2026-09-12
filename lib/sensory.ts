import type { Affollamento, GiornoSettimana, IntensitaAffollamento, SpazioSensoriale } from "@/types";

const giorniSettimana: GiornoSettimana[] = ["domenica", "lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato"];

export const etichetteAffollamento: Record<IntensitaAffollamento, string> = {
  "molto-basso": "Molto basso",
  basso: "Basso",
  moderato: "Medio",
  alto: "Alto",
};

export const ordineAffollamento: Record<IntensitaAffollamento, number> = {
  "molto-basso": 0,
  basso: 1,
  moderato: 2,
  alto: 3,
};

function minutiDaOrario(orario: string): number {
  const [ore, minuti] = orario.split(":").map(Number);
  return ore * 60 + minuti;
}

function dataOraTorino(data: Date): { giorno: GiornoSettimana; minuti: number } {
  const parti = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const giornoBreve = parti.find((parte) => parte.type === "weekday")?.value.toLocaleLowerCase("it-IT").replace("ì", "i");
  const giorni: Record<string, GiornoSettimana> = { dom: "domenica", lun: "lunedi", mar: "martedi", mer: "mercoledi", gio: "giovedi", ven: "venerdi", sab: "sabato" };
  const ore = Number(parti.find((parte) => parte.type === "hour")?.value ?? 0);
  const minuti = Number(parti.find((parte) => parte.type === "minute")?.value ?? 0);
  return { giorno: giorni[giornoBreve ?? ""] ?? giorniSettimana[data.getDay()], minuti: ore * 60 + minuti };
}

export function trovaAffollamentoAttuale(spazio: SpazioSensoriale, data = new Date()): Affollamento | null {
  const { giorno, minuti } = dataOraTorino(data);
  return spazio.affollamento.find((fascia) => fascia.giorni.includes(giorno) && minuti >= minutiDaOrario(fascia.dalle) && minuti < minutiDaOrario(fascia.alle)) ?? null;
}

export function formattaGiorni(giorni: GiornoSettimana[]): string {
  const etichette: Record<GiornoSettimana, string> = { lunedi: "lun", martedi: "mar", mercoledi: "mer", giovedi: "gio", venerdi: "ven", sabato: "sab", domenica: "dom" };
  if (giorni.length === 5 && !giorni.includes("sabato") && !giorni.includes("domenica")) return "lun–ven";
  return giorni.map((giorno) => etichette[giorno]).join(", ");
}