/**
 * ImageCropModal — full-screen crop editor with live preview.
 * Supports: drag, zoom, rotate, flip, safe zone guide, responsive device preview.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import {
  X, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  RefreshCw, Maximize2, ZoomIn, ZoomOut, Upload, Monitor, Tablet, Smartphone,
  Loader2, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { IMAGE_PRESETS, type ImagePresetKey } from '@/lib/image-presets';
import {
  getCroppedImageBlob, getImageMeta, formatBytes,
  type CropArea, type ImageMeta,
} from '@/lib/image-processing';

export type { ImagePresetKey };

type DeviceTab = 'desktop' | 'tablet' | 'mobile';

const DEVICE_PREVIEW_WIDTHS: Record<DeviceTab, number> = {
  desktop: 320,
  tablet:  200,
  mobile:  130,
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface ImageCropModalProps {
  isOpen:        boolean;
  file:          File | null;
  preset:        ImagePresetKey;
  onConfirm:     (blob: Blob) => void;
  onCancel:      () => void;
  onChangeImage: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImageCropModal({
  isOpen, file, preset, onConfirm, onCancel, onChangeImage,
}: ImageCropModalProps) {
  const cfg = IMAGE_PRESETS[preset];

  const [imageSrc,     setImageSrc]     = useState<string>('');
  const [meta,         setMeta]         = useState<ImageMeta | null>(null);
  const [crop,         setCrop]         = useState<Point>({ x: 0, y: 0 });
  const [zoom,         setZoom]         = useState(1);
  const [rotation,     setRotation]     = useState(0);
  const [flipH,        setFlipH]        = useState(false);
  const [flipV,        setFlipV]        = useState(false);
  const [croppedArea,  setCroppedArea]  = useState<CropArea | null>(null);
  const [previewUrl,   setPreviewUrl]   = useState<string>('');
  const [previewStale, setPreviewStale] = useState(false);
  const [device,       setDevice]       = useState<DeviceTab>('desktop');
  const [processing,   setProcessing]   = useState(false);
  const [error,        setError]        = useState('');

  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPreviewUrl  = useRef<string>('');

  // Load file into object URL
  useEffect(() => {
    if (!file || !isOpen) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCroppedArea(null);
    setPreviewUrl('');
    setError('');

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    getImageMeta(file).then(setMeta).catch(() => {});

    return () => URL.revokeObjectURL(url);
  }, [file, isOpen]);

  // Cleanup preview blob URLs on unmount
  useEffect(() => {
    return () => {
      if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
    };
  }, []);

  // Update live preview (debounced 300ms)
  const updatePreview = useCallback((area: CropArea) => {
    if (!imageSrc) return;
    setPreviewStale(true);
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(async () => {
      try {
        const pw   = DEVICE_PREVIEW_WIDTHS.desktop;
        const ph   = Math.round(pw / cfg.ratio);
        const blob = await getCroppedImageBlob(
          imageSrc, area, rotation, flipH, flipV, pw, ph, 10 * 1024 * 1024,
        );
        const newUrl = URL.createObjectURL(blob);
        if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
        prevPreviewUrl.current = newUrl;
        setPreviewUrl(newUrl);
        setPreviewStale(false);
      } catch {
        setPreviewStale(false);
      }
    }, 300);
  }, [imageSrc, rotation, flipH, flipV, cfg.ratio]);

  // Re-render preview when rotation / flip changes
  useEffect(() => {
    if (croppedArea) updatePreview(croppedArea);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation, flipH, flipV]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    const area: CropArea = {
      x: areaPixels.x, y: areaPixels.y,
      width: areaPixels.width, height: areaPixels.height,
    };
    setCroppedArea(area);
    updatePreview(area);
  }, [updatePreview]);

  const handleRotateCW  = () => setRotation(r => (r + 90) % 360);
  const handleRotateCCW = () => setRotation(r => (r - 90 + 360) % 360);
  const handleReset     = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };
  const handleCenter = () => setCrop({ x: 0, y: 0 });

  const handleSave = async () => {
    if (!imageSrc || !croppedArea) return;
    setProcessing(true);
    setError('');
    try {
      const blob = await getCroppedImageBlob(
        imageSrc, croppedArea, rotation, flipH, flipV,
        cfg.width, cfg.height, cfg.maxBytes,
      );
      onConfirm(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memproses gambar');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !file) return null;

  const previewW = DEVICE_PREVIEW_WIDTHS[device];
  const previewH = Math.round(previewW / cfg.ratio);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-md">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-foreground text-sm flex-shrink-0">{cfg.label}</span>
          {meta && (
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground truncate">
              <span className="hidden md:block">|</span>
              <span className="truncate max-w-[140px]">{meta.name}</span>
              <span className="hidden md:block">{meta.width} × {meta.height} px</span>
              <span className="hidden md:block">{formatBytes(meta.size)}</span>
              <span className="hidden md:block uppercase">{meta.format.replace('image/', '')}</span>
            </div>
          )}
        </div>
        <Button size="icon" variant="ghost" className="rounded-xl flex-shrink-0" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">

        {/* LEFT: Crop Editor */}
        <div className="relative flex-1 min-h-[260px] lg:min-h-0 bg-zinc-900">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={cfg.ratio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              style={{
                containerStyle: { borderRadius: 0 },
                cropAreaStyle:  { borderColor: 'hsl(var(--primary))', borderWidth: 2 },
              }}
            />
          )}
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="text-[10px] text-white/50 bg-black/40 rounded-full px-2 py-0.5">
              Crop area = gambar yang akan diupload
            </span>
          </div>
        </div>

        {/* RIGHT: Controls + Preview */}
        <div className="flex flex-col w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-border bg-card overflow-y-auto flex-shrink-0">

          {/* Controls */}
          <div className="p-4 border-b border-border space-y-4">
            {/* Zoom */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Zoom</span>
                <span className="text-xs text-muted-foreground">{zoom.toFixed(2)}×</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg flex-shrink-0"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <Slider min={0.5} max={3} step={0.01} value={[zoom]}
                  onValueChange={([v]) => setZoom(v)} className="flex-1" />
                <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg flex-shrink-0"
                  onClick={() => setZoom(z => Math.min(3, z + 0.1))}>
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Transform */}
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs h-8" onClick={handleRotateCCW}>
                <RotateCcw className="w-3.5 h-3.5" /> CCW
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs h-8" onClick={handleRotateCW}>
                <RotateCw className="w-3.5 h-3.5" /> CW
              </Button>
              <Button size="sm" variant={flipH ? 'default' : 'outline'} className="rounded-xl gap-1 text-xs h-8"
                onClick={() => setFlipH(v => !v)}>
                <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
              </Button>
              <Button size="sm" variant={flipV ? 'default' : 'outline'} className="rounded-xl gap-1 text-xs h-8"
                onClick={() => setFlipV(v => !v)}>
                <FlipVertical className="w-3.5 h-3.5" /> Flip V
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs h-8" onClick={handleCenter}>
                <Maximize2 className="w-3.5 h-3.5" /> Center
              </Button>
              <Button size="sm" variant="outline"
                className="rounded-xl gap-1 text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleReset}>
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Rotasi: {rotation}°{flipH ? ' · Flip H' : ''}{flipV ? ' · Flip V' : ''}
            </p>
          </div>

          {/* Live Preview */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Live Preview
              </span>
              <div className="flex gap-1">
                {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as [DeviceTab, typeof Monitor][]).map(([d, Icon]) => (
                  <button key={d} onClick={() => setDevice(d)}
                    className={cn('p-1 rounded-lg transition-colors',
                      device === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted"
                style={{ width: previewW, height: Math.max(previewH, 60) }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="w-full h-full object-cover"
                    style={{ opacity: previewStale ? 0.5 : 1, transition: 'opacity 0.2s' }} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                    <div className="w-5 h-5 rounded bg-muted-foreground/20" />
                    <p className="text-[10px] text-muted-foreground text-center">Geser gambar</p>
                  </div>
                )}
                {previewStale && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 text-center space-y-0.5">
              <p className="text-xs text-muted-foreground">{cfg.hint}</p>
              <p className="text-xs text-muted-foreground">Max: {formatBytes(cfg.maxBytes)} · WebP</p>
            </div>
          </div>

          {error && (
            <div className="px-4 pb-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-4 border-t border-border flex flex-col gap-2">
            <Button onClick={handleSave} disabled={processing || !croppedArea}
              className="w-full rounded-xl gap-2 bg-primary text-primary-foreground btn-glow">
              {processing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                : <><Check className="w-4 h-4" /> Simpan &amp; Upload</>}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs"
                onClick={onChangeImage} disabled={processing}>
                <Upload className="w-3.5 h-3.5" /> Ganti Gambar
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs"
                onClick={handleReset} disabled={processing}>
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </Button>
            </div>
            <Button size="sm" variant="ghost"
              className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
              onClick={onCancel} disabled={processing}>
              Batal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
