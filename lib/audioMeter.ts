export type AudioMeterErrorCode = "not-supported" | "permission-denied" | "device-not-found" | "device-busy" | "unknown";

export class AudioMeterError extends Error {
  readonly code: AudioMeterErrorCode;

  constructor(code: AudioMeterErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "AudioMeterError";
    this.code = code;
  }
}

export interface AudioLevel {
  rms: number;
  decibelFullScale: number;
  estimatedDecibelSpl: number;
}

export interface AudioMeter {
  readLevel: () => AudioLevel;
  stop: () => Promise<void>;
}

const MINIMUM_ESTIMATED_DECIBELS = 20;
const MAXIMUM_ESTIMATED_DECIBELS = 100;
const ESTIMATED_CALIBRATION_OFFSET = 90;

function normalizeError(error: unknown): AudioMeterError {
  if (error instanceof AudioMeterError) return error;
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return new AudioMeterError("permission-denied", "Accesso al microfono negato. Abilitalo nelle impostazioni del browser e riprova.", error);
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return new AudioMeterError("device-not-found", "Non è stato trovato un microfono disponibile sul dispositivo.", error);
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError" || error.name === "AbortError") {
      return new AudioMeterError("device-busy", "Il microfono non è accessibile. Potrebbe essere già usato da un’altra applicazione.", error);
    }
  }
  return new AudioMeterError("unknown", "Non è stato possibile avviare la misurazione del rumore.", error);
}

export function isAudioMeterSupported(): boolean {
  return typeof window !== "undefined"
    && typeof navigator.mediaDevices?.getUserMedia === "function"
    && (typeof window.AudioContext === "function" || typeof window.webkitAudioContext === "function");
}

export async function startAudioMeter(): Promise<AudioMeter> {
  if (!isAudioMeterSupported()) {
    throw new AudioMeterError("not-supported", "Questo browser non supporta la misurazione tramite microfono. Prova una versione recente di Safari, Chrome, Edge o Firefox.");
  }

  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
      },
      video: false,
    });

    const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
    audioContext = new AudioContextConstructor();
    await audioContext.resume();

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.25;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let stopped = false;

    return {
      readLevel() {
        if (stopped) return { rms: 0, decibelFullScale: -Infinity, estimatedDecibelSpl: MINIMUM_ESTIMATED_DECIBELS };
        analyser.getFloatTimeDomainData(samples);
        let sumOfSquares = 0;
        for (const sample of samples) sumOfSquares += sample * sample;
        const rms = Math.sqrt(sumOfSquares / samples.length);
        const decibelFullScale = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
        const estimatedDecibelSpl = Number.isFinite(decibelFullScale)
          ? Math.min(MAXIMUM_ESTIMATED_DECIBELS, Math.max(MINIMUM_ESTIMATED_DECIBELS, decibelFullScale + ESTIMATED_CALIBRATION_OFFSET))
          : MINIMUM_ESTIMATED_DECIBELS;
        return { rms, decibelFullScale, estimatedDecibelSpl };
      },
      async stop() {
        if (stopped) return;
        stopped = true;
        source.disconnect();
        analyser.disconnect();
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        if (audioContext && audioContext.state !== "closed") await audioContext.close();
        audioContext = null;
      },
    };
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    if (audioContext && audioContext.state !== "closed") await audioContext.close().catch(() => undefined);
    throw normalizeError(error);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}