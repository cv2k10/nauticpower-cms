import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Image as ImageIcon, Images, Trash, Upload, X } from "lucide-react";
import { errorMessage } from "../cms/api";
import { useCms, type MediaItem } from "../cms/store";
import { formatRelative } from "../cms/content";
import { Button, ConfirmDialog, EmptyState, Field, Panel, TextInput, useToast } from "./ui";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

const formatSize = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Loads the R2 media index and exposes upload/delete with toasts. */
const useMediaLibrary = (enabled = true) => {
  const { listMedia, uploadMedia, deleteMedia } = useCms();
  const toast = useToast();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [uploading, setUploading] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setItems(await listMedia());
    } catch (err) {
      toast(`Could not load media: ${errorMessage(err)}`, "warn");
      setItems([]);
    }
  }, [listMedia, toast]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const upload = useCallback(
    async (files: File[]): Promise<MediaItem[]> => {
      const done: MediaItem[] = [];
      setUploading((n) => n + files.length);
      for (const file of files) {
        try {
          const item = await uploadMedia(file);
          done.push(item);
          setItems((prev) => [item, ...(prev ?? [])]);
        } catch (err) {
          toast(`${file.name}: ${errorMessage(err)}`, "warn");
        } finally {
          setUploading((n) => n - 1);
        }
      }
      if (done.length) toast(`${done.length} image${done.length === 1 ? "" : "s"} uploaded`);
      return done;
    },
    [toast, uploadMedia]
  );

  const remove = useCallback(
    async (key: string) => {
      try {
        await deleteMedia(key);
        setItems((prev) => (prev ?? []).filter((item) => item.key !== key));
        toast("Image deleted", "warn");
      } catch (err) {
        toast(`Image not deleted: ${errorMessage(err)}`, "warn");
      }
    },
    [deleteMedia, toast]
  );

  return { items, uploading, upload, remove };
};

/* ------------------------------------------------------------ picker modal */

const MediaPicker = ({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) => {
  const { items, uploading, upload } = useMediaLibrary();
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon/55 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose an image"
        className="rise relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white border border-hairline rounded-[6px] shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-hairline">
          <h3 className="display-mid text-[18px] text-ink">Media library</h3>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={async (event) => {
                const files = [...(event.target.files ?? [])];
                event.target.value = "";
                const [first] = await upload(files);
                if (first) onPick(first.url);
              }}
            />
            <Button size="sm" variant="primary" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
              <Upload className="w-3.5 h-3.5" />
              {uploading > 0 ? "Uploading…" : "Upload new"}
            </Button>
            <button type="button" onClick={onClose} className="p-1 text-mist hover:text-ink cursor-pointer" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto scroll-slim">
          {items === null ? (
            <p className="text-[13px] text-mist">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-[13px] text-mist py-10 text-center">No uploads yet — upload an image to use it here.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onPick(item.url)}
                  className="group text-left border border-hairline rounded-[5px] overflow-hidden hover:border-ink transition-colors cursor-pointer"
                >
                  <img src={item.url} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover bg-chalk" />
                  <span className="block px-2 py-1.5 text-[11.5px] text-steel truncate">{item.filename}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ image field */

/** Image URL input with Upload (to R2) and "choose from library" actions. */
export const ImageField = ({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
}) => {
  const { uploadMedia } = useCms();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const item = await uploadMedia(file);
      onChange(item.url);
      toast("Image uploaded and applied");
    } catch (err) {
      toast(`Upload failed: ${errorMessage(err)}`, "warn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} htmlFor={id}>
      <TextInput id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void handleFile(file);
          }}
        />
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload className="w-3.5 h-3.5" />
          {busy ? "Uploading…" : "Upload"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPicking(true)}>
          <Images className="w-3.5 h-3.5" />
          Library
        </Button>
      </div>
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(url) => {
            onChange(url);
            setPicking(false);
          }}
        />
      )}
    </Field>
  );
};

/* -------------------------------------------------------------- media page */

export const Media = () => {
  const { items, uploading, upload, remove } = useMediaLibrary();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(new URL(item.url, window.location.origin).toString());
      setCopied(item.key);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono text-ember">ADMIN · MEDIA</p>
        <h1 className="display-wide mt-2 text-[clamp(1.7rem,3.2vw,2.4rem)] text-ink">Media library</h1>
        <p className="mt-2 text-[13.5px] text-steel max-w-2xl">
          Images uploaded here are stored in Cloudflare R2 and can be used in any image field. JPG, PNG, WebP,
          GIF or AVIF, up to 10 MB each.
        </p>
      </header>

      <Panel
        eyebrow="UPLOAD"
        title="Add images"
        actions={
          <Button variant="primary" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
            <Upload className="w-4 h-4" />
            {uploading > 0 ? `Uploading ${uploading}…` : "Choose files"}
          </Button>
        }
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = "";
            void upload(files);
          }}
        />
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void upload([...event.dataTransfer.files]);
          }}
          className={`px-6 py-10 text-center border border-dashed rounded-[6px] transition-colors ${
            dragging ? "border-ember bg-ember-soft" : "border-hairline bg-chalk/50"
          }`}
        >
          <ImageIcon className="w-6 h-6 mx-auto text-steel" />
          <p className="mt-2 text-[13.5px] text-steel">Drag &amp; drop images here</p>
        </div>
      </Panel>

      {items === null ? (
        <p className="text-[13px] text-mist">Loading media…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-5 h-5" />}
          title="No uploads yet"
          message="Upload photos of recent jobs, the workshop or the fleet, then pick them from any image field."
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <figure key={item.key} className="bg-white border border-hairline rounded-[6px] overflow-hidden">
              <img src={item.url} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover bg-chalk" />
              <figcaption className="p-3">
                <p className="text-[13px] font-semibold text-ink truncate" title={item.filename}>
                  {item.filename}
                </p>
                <p className="mt-0.5 text-[11.5px] text-mist">
                  {formatSize(item.size)} · {formatRelative(item.createdAt)}
                </p>
                <div className="mt-2.5 flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => void copyUrl(item)}>
                    {copied === item.key ? <Check className="w-3.5 h-3.5 text-ember" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === item.key ? "Copied" : "Copy URL"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(item)} aria-label="Delete image">
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this image?"
        message="It will be removed from storage. Any section still using its URL will show a broken image until you pick another."
        confirmLabel="Delete image"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete.key);
          setPendingDelete(null);
        }}
      />
    </div>
  );
};
