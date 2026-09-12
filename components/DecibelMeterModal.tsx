"use client";

import { AudioLines, CircleAlert, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioMeterError,
  isAudioMeterSupported,
  startAudioMeter,
  type AudioMeter,
} from "@/lib/audioMeter";
import type { SpazioSensoriale } from "@/types";

interface DecibelMeterModalProps {
  open: boolean;
  onClose: () => void;
  spazi: SpazioSensoriale[];
}

type StatoMisurazione =
  | "intro"
  | "starting"
  | "measuring"
  | "result"
  | "error";

const DURATA_MISURAZIONE_MS = 8000;
const DECIBEL_MINIMI = 20;
const DECIBEL_MASSIMI = 100;

function descriviLivello(decibel: number) {
  if (decibel < 40) return "Molto tranquillo";
  if (decibel < 55) return "Tranquillo";
  if (decibel < 70) return "Moderato";
  if (decibel < 85) return "Rumoroso";
  return "Molto rumoroso";
}

function confrontaSpazio(decibel: number, spazio: SpazioSensoriale) {
  if (decibel < spazio.rumore.decibelMin) {
    return "Più silenzioso della fascia stimata";
  }

  if (decibel > spazio.rumore.decibelMax) {
    return "Più rumoroso della fascia stimata";
  }

  return "Dentro la fascia stimata";
}

export default function DecibelMeterModal({
  open,
  onClose,
  spazi,
}: DecibelMeterModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const meterRef = useRef<AudioMeter | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const openedByRef = useRef<HTMLElement | null>(null);
  const samplesRef = useRef<number[]>([]);
  const operationRef = useRef(0);

  const [stato, setStato] = useState<StatoMisurazione>("intro");
  const [livello, setLivello] = useState(DECIBEL_MINIMI);
  const [secondiRimanenti, setSecondiRimanenti] = useState(
    DURATA_MISURAZIONE_MS / 1000,
  );
  const [risultato, setRisultato] = useState<{
    media: number;
    picco: number;
  } | null>(null);
  const [errore, setErrore] = useState("");

  /*
   * IMPORTANT:
   * This must not be calculated during render because the component
   * can be rendered on the server where browser APIs are unavailable.
   *
   * null = capability has not been checked yet.
   */
  const [audioMeterSupported, setAudioMeterSupported] = useState<
    boolean | null
  >(null);

  /*
   * Browser-only capability detection.
   *
   * The initial state is identical during SSR and hydration (`null`),
   * preventing the server/client HTML mismatch.
   */
  useEffect(() => {
    setAudioMeterSupported(isAudioMeterSupported());
  }, []);

  const pulisciMisurazione = useCallback(async () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }

    animationFrameRef.current = null;
    timerRef.current = null;

    const meter = meterRef.current;
    meterRef.current = null;

    await meter?.stop();
  }, []);

  const chiudi = useCallback(() => {
    operationRef.current += 1;
    void pulisciMisurazione();
    onClose();
  }, [onClose, pulisciMisurazione]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      openedByRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      setStato("intro");
      setRisultato(null);
      setErrore("");
      setLivello(DECIBEL_MINIMI);
      setSecondiRimanenti(DURATA_MISURAZIONE_MS / 1000);

      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      openedByRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      operationRef.current += 1;
      void pulisciMisurazione();
    };
  }, [pulisciMisurazione]);

  async function avviaMisurazione() {
    /*
     * Don't attempt to start the meter if the browser has not yet
     * been checked or explicitly doesn't support it.
     */
    if (audioMeterSupported !== true) {
      return;
    }

    const operation = operationRef.current + 1;
    operationRef.current = operation;

    setStato("starting");
    setErrore("");
    setRisultato(null);
    samplesRef.current = [];
    setSecondiRimanenti(DURATA_MISURAZIONE_MS / 1000);

    try {
      const meter = await startAudioMeter();

      if (operationRef.current !== operation || !open) {
        await meter.stop();
        return;
      }

      meterRef.current = meter;
      setStato("measuring");

      const inizio = performance.now();

      const aggiorna = (ora: number) => {
        const valore = meter.readLevel().estimatedDecibelSpl;

        samplesRef.current.push(valore);
        setLivello(valore);

        if (ora - inizio < DURATA_MISURAZIONE_MS) {
          animationFrameRef.current =
            window.requestAnimationFrame(aggiorna);
        }
      };

      animationFrameRef.current =
        window.requestAnimationFrame(aggiorna);

      timerRef.current = window.setInterval(() => {
        const trascorsi = performance.now() - inizio;

        setSecondiRimanenti(
          Math.max(
            0,
            Math.ceil(
              (DURATA_MISURAZIONE_MS - trascorsi) / 1000,
            ),
          ),
        );

        if (trascorsi >= DURATA_MISURAZIONE_MS) {
          void pulisciMisurazione().then(() => {
            if (operationRef.current !== operation) return;

            const campioni = samplesRef.current;

            const media =
              campioni.reduce(
                (totale, valore) => totale + valore,
                0,
              ) / Math.max(campioni.length, 1);

            const picco = campioni.length
              ? Math.max(...campioni)
              : DECIBEL_MINIMI;

            setRisultato({ media, picco });
            setStato("result");
          });
        }
      }, 200);
    } catch (error) {
      await pulisciMisurazione();

      if (operationRef.current !== operation) return;

      setErrore(
        error instanceof AudioMeterError
          ? error.message
          : "Si è verificato un errore imprevisto durante l’accesso al microfono.",
      );

      setStato("error");
    }
  }

  const valoreArrotondato = Math.round(livello);

  const ampiezza = `${Math.max(
    0,
    Math.min(
      100,
      ((livello - DECIBEL_MINIMI) /
        (DECIBEL_MASSIMI - DECIBEL_MINIMI)) *
        100,
    ),
  )}%`;

  return (
    <dialog
      ref={dialogRef}
      className="meter-dialog"
      aria-labelledby="meter-title"
      aria-describedby="meter-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        chiudi();
      }}
      onClose={() => openedByRef.current?.focus()}
    >
      <div className="dialog-heading">
        <div>
          <p className="section-kicker">Strumento sperimentale</p>
          <h2 id="meter-title">Misura rumore live</h2>
        </div>

        <button
          className="icon-button"
          type="button"
          onClick={chiudi}
          aria-label="Chiudi misuratore"
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <p
        id="meter-dialog-description"
        className="sr-only"
      >
        Misuratore orientativo del rumore ambientale tramite il
        microfono del dispositivo.
      </p>

      {stato === "intro" && (
        <div className="meter-content">
          <AudioLines
            className="meter-intro-icon"
            aria-hidden="true"
          />

          <p>
            QuietTorino userà il microfono per stimare il livello
            acustico per 8 secondi. L’audio viene analizzato solo
            sul dispositivo, non viene registrato né inviato.
          </p>

          <div className="notice-box">
            <CircleAlert aria-hidden="true" />

            <p>
              <strong>Stima non calibrata.</strong> I microfoni dei
              dispositivi variano: il risultato non è una misura
              professionale in dB SPL e non va usato per valutare
              rischi per l’udito.
            </p>
          </div>

          {audioMeterSupported === false && (
            <p className="error-message" role="alert">
              Questo browser non supporta l’accesso al microfono
              richiesto dal misuratore.
            </p>
          )}

          <button
            className="primary-button meter-main-button"
            type="button"
            disabled={audioMeterSupported !== true}
            onClick={() => void avviaMisurazione()}
          >
            <AudioLines aria-hidden="true" />
            {audioMeterSupported === null
              ? "Verifica supporto microfono…"
              : "Avvia misurazione di 8 secondi"}
          </button>
        </div>
      )}

      {(stato === "starting" || stato === "measuring") && (
        <div className="meter-content" aria-busy="true">
          <p>
            {stato === "starting"
              ? "Autorizza l’uso del microfono nel browser."
              : `Misurazione in corso: ${secondiRimanenti} secondi rimanenti.`}
          </p>

          <div className="decibel-reading">
            <strong>
              {stato === "starting" ? "—" : valoreArrotondato}
            </strong>

            <span>dB stimati</span>
          </div>

          <div
            className="sound-meter"
            role="meter"
            aria-label="Livello acustico stimato"
            aria-valuemin={DECIBEL_MINIMI}
            aria-valuemax={DECIBEL_MASSIMI}
            aria-valuenow={
              stato === "measuring"
                ? valoreArrotondato
                : undefined
            }
            aria-valuetext={
              stato === "measuring"
                ? `${valoreArrotondato} decibel stimati, ${descriviLivello(livello)}`
                : "In attesa del microfono"
            }
          >
            <span
              style={{
                width:
                  stato === "measuring"
                    ? ampiezza
                    : "0%",
              }}
            />
          </div>

          <p
            className="level-feedback"
            aria-live="polite"
          >
            {stato === "starting"
              ? "In attesa del permesso…"
              : descriviLivello(livello)}
          </p>

          <button
            className="text-button"
            type="button"
            onClick={chiudi}
          >
            Interrompi e chiudi
          </button>
        </div>
      )}

      {stato === "error" && (
        <div className="meter-content">
          <div
            className="notice-box error-message"
            role="alert"
          >
            <CircleAlert aria-hidden="true" />
            <p>{errore}</p>
          </div>

          <p>
            Puoi continuare a consultare le fasce di rumore
            stimate nelle schede dei luoghi senza concedere il
            permesso.
          </p>

          <button
            className="primary-button meter-main-button"
            type="button"
            onClick={() => void avviaMisurazione()}
          >
            <RotateCcw aria-hidden="true" />
            Riprova
          </button>
        </div>
      )}

      {stato === "result" && risultato && (
        <div className="meter-content">
          <p>
            Risultato orientativo della misurazione locale di 8
            secondi.
          </p>

          <div
            className="result-summary"
            role="status"
          >
            <span>Media stimata</span>

            <strong>
              {Math.round(risultato.media)} dB
            </strong>

            <span>
              {descriviLivello(risultato.media)} · picco{" "}
              {Math.round(risultato.picco)} dB
            </span>
          </div>

          <div className="place-comparison">
            <h3>Confronto con i luoghi in app</h3>

            <ul>
              {spazi.map((spazio) => (
                <li key={spazio.id}>
                  <div>
                    <strong>{spazio.nome}</strong>

                    <span>
                      {spazio.rumore.decibelMin}–
                      {spazio.rumore.decibelMax} dB stimati
                    </span>
                  </div>

                  <span className="comparison-label">
                    {confrontaSpazio(
                      risultato.media,
                      spazio,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="meter-disclaimer">
            Il confronto usa stime editoriali dei luoghi e una
            lettura non calibrata del dispositivo: serve solo come
            orientamento.
          </p>

          <button
            className="primary-button meter-main-button"
            type="button"
            onClick={() => void avviaMisurazione()}
          >
            <RotateCcw aria-hidden="true" />
            Misura di nuovo
          </button>
        </div>
      )}
    </dialog>
  );
}