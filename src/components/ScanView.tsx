import { useEffect, useRef, useState } from 'react';
import { Camera, Keyboard, ScanBarcode, Upload } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import type { FoodDraft, OilSelection } from '../types';
import { lookupBarcode } from '../lib/openFoodFacts';
import { recognizeNutritionLabel } from '../lib/ocr';
import { FoodEditor } from './FoodEditor';

interface ScanViewProps {
  onSave: (draft: FoodDraft, oil: OilSelection) => Promise<void>;
}

type ScanTab = 'barcode' | 'label';

function BarcodeCamera({ active, onDetected }: { active: boolean; onDetected: (barcode: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const seenRef = useRef(false);

  useEffect(() => {
    if (!active) {
      return;
    }

    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;
    seenRef.current = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 160 }, aspectRatio: 1.5 },
        (decodedText) => {
          if (!seenRef.current) {
            seenRef.current = true;
            onDetected(decodedText);
          }
        },
        undefined
      )
      .catch(() => {
        scannerRef.current = null;
      });

    return () => {
      const current = scannerRef.current;
      scannerRef.current = null;
      if (current?.isScanning) {
        void current.stop().then(() => current.clear()).catch(() => undefined);
      } else {
        try {
          current?.clear();
        } catch {
          // Camera cleanup is best-effort because browsers vary here.
        }
      }
    };
  }, [active, onDetected]);

  return <div id="barcode-reader" className="barcode-reader" />;
}

export function ScanView({ onSave }: ScanViewProps) {
  const [tab, setTab] = useState<ScanTab>('barcode');
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState<FoodDraft | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [rawOcr, setRawOcr] = useState('');

  async function handleBarcodeLookup(value = barcode) {
    if (!value.trim()) {
      return;
    }
    setBusy(true);
    setMessage('');
    setScanning(false);
    try {
      const result = await lookupBarcode(value);
      if (result) {
        setDraft(result);
      } else {
        setMessage('Barcode was not found.');
      }
    } catch {
      setMessage('Barcode lookup failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleImage(file?: File) {
    if (!file) {
      return;
    }

    setBusy(true);
    setMessage('');
    setRawOcr('');
    setOcrProgress(0);
    try {
      const result = await recognizeNutritionLabel(file, setOcrProgress);
      setDraft(result.draft);
      setRawOcr(result.text);
      if (result.confidence === 'low') {
        setMessage('Low confidence scan. Retake or correct the fields before logging.');
      }
    } catch {
      setMessage('Label scan failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen stack">
      <div className="segmented nav-segment">
        <button className={tab === 'barcode' ? 'is-active' : ''} onClick={() => setTab('barcode')} type="button">
          Barcode
        </button>
        <button className={tab === 'label' ? 'is-active' : ''} onClick={() => setTab('label')} type="button">
          Label OCR
        </button>
      </div>

      {draft ? <FoodEditor initialDraft={draft} onCancel={() => setDraft(null)} onSave={onSave} title="Review scan" /> : null}

      {tab === 'barcode' && !draft ? (
        <section className="surface stack">
          <div className="section-heading">
            <h2>Barcode</h2>
            <ScanBarcode size={20} />
          </div>

          {scanning ? <BarcodeCamera active={scanning} onDetected={(value) => void handleBarcodeLookup(value)} /> : null}

          <div className="action-row">
            <button className="primary-button" onClick={() => setScanning((current) => !current)} type="button">
              <Camera size={18} />
              {scanning ? 'Stop camera' : 'Camera'}
            </button>
          </div>

          <div className="search-row">
            <input inputMode="numeric" onChange={(event) => setBarcode(event.target.value)} placeholder="Barcode number" value={barcode} />
            <button className="icon-button" disabled={busy || !barcode.trim()} onClick={() => void handleBarcodeLookup()} title="Lookup barcode" type="button">
              <Keyboard size={20} />
            </button>
          </div>
          {message ? <p className="empty-state">{message}</p> : null}
        </section>
      ) : null}

      {tab === 'label' && !draft ? (
        <section className="surface stack">
          <div className="section-heading">
            <h2>Nutrition label</h2>
            <Upload size={20} />
          </div>
          <label className="upload-target">
            <input accept="image/*" capture="environment" onChange={(event) => void handleImage(event.target.files?.[0])} type="file" />
            <Camera size={22} />
            <span>{busy ? `Scanning ${Math.round(ocrProgress * 100)}%` : 'Capture label'}</span>
          </label>
          {message ? <p className="empty-state">{message}</p> : null}
          {rawOcr ? <details className="ocr-text"><summary>OCR text</summary><pre>{rawOcr}</pre></details> : null}
        </section>
      ) : null}
    </div>
  );
}

