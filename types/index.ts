export type CategoriaSpazio =
  | "biblioteca"
  | "parco"
  | "museo"
  | "ufficio-pubblico"
  | "centro-culturale";

export type IntensitaRumore = "molto-basso" | "basso" | "moderato" | "alto";

export type IntensitaAffollamento = "molto-basso" | "basso" | "moderato" | "alto";

export type LivelloIlluminazione = "basso" | "medio" | "alto" | "variabile";

export type FonteDato = "stima-editoriale" | "segnalazione-utenti" | "dato-ufficiale";

export type GiornoSettimana =
  | "lunedi"
  | "martedi"
  | "mercoledi"
  | "giovedi"
  | "venerdi"
  | "sabato"
  | "domenica";

export interface LivelloRumore {
  intensita: IntensitaRumore;
  decibelMin: number;
  decibelMax: number;
  sorgentiPrincipali: string[];
  fonte: FonteDato;
  nota?: string;
}

export interface Affollamento {
  giorni: GiornoSettimana[];
  dalle: string;
  alle: string;
  livello: IntensitaAffollamento;
  nota?: string;
}

export interface OrarioTranquillo {
  giorni: GiornoSettimana[];
  dalle: string;
  alle: string;
  motivazione: string;
}

export interface FiltriSensoriali {
  rumoreMassimo?: IntensitaRumore;
  decibelMassimi?: number;
  affollamentoMassimo?: IntensitaAffollamento;
  illuminazione?: LivelloIlluminazione[];
  richiedeQuietRoom?: boolean;
  richiedeAccessoSenzaBarriere?: boolean;
  richiedeSpazioEsterno?: boolean;
  categorie?: CategoriaSpazio[];
  apertoNelGiorno?: GiornoSettimana;
}

export interface CoordinateGeografiche {
  latitudine: number;
  longitudine: number;
}

export interface IlluminazioneSensoriale {
  livello: LivelloIlluminazione;
  luxStimatiMin: number;
  luxStimatiMax: number;
  luceNaturale: boolean;
  luceArtificiale: "calda" | "neutra" | "fredda" | "mista";
  nota?: string;
}

export interface QuietRoom {
  presente: boolean;
  tipologia: "stanza-dedicata" | "area-tranquilla" | "non-disponibile";
  verificata: boolean;
  descrizione: string;
}

export interface AccessibilitaSpazio {
  accessoSenzaBarriere: boolean;
  serviziIgieniciAccessibili: boolean | null;
  seduteDisponibili: boolean;
  nota?: string;
}

export interface SpazioSensoriale {
  id: string;
  nome: string;
  categoria: CategoriaSpazio;
  descrizione: string;
  indirizzo: string;
  quartiere: string;
  coordinate: CoordinateGeografiche;
  sitoWeb?: string;
  spazioEsterno: boolean;
  rumore: LivelloRumore;
  illuminazione: IlluminazioneSensoriale;
  affollamento: Affollamento[];
  orariTranquilli: OrarioTranquillo[];
  quietRoom: QuietRoom;
  accessibilita: AccessibilitaSpazio;
  avvertenze: string[];
  fonteDatiSensoriali: FonteDato;
  ultimoAggiornamento: string;
}