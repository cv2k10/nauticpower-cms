import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown, ChevronUp, Plus, Trash, X } from "lucide-react";

/* ----------------------------------------------------------------- toasts */

type ToastTone = "ok" | "warn" | "info";
interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => undefined);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastTone = "ok") => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3400);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`rise pointer-events-auto max-w-xs px-4 py-3 rounded-[5px] border shadow-lg text-[13px] font-medium ${
              toast.tone === "warn"
                ? "bg-[#3a2a08] border-[#8a6a05]/45 text-[#ffd88a]"
                : toast.tone === "info"
                  ? "bg-carbon border-white/20 text-white"
                  : "bg-carbon border-white/15 text-white"
            }`}
          >
            <span className="flex items-start gap-2">
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  toast.tone === "warn" ? "bg-[#ffd88a]" : "bg-ember-bright"
                }`}
              />
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ---------------------------------------------------------------- buttons */

type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-carbon border border-ink",
  accent: "bg-ember text-white hover:brightness-110 border border-ember",
  outline: "bg-white text-ink border border-hairline hover:border-ink",
  ghost: "bg-transparent text-steel border border-transparent hover:bg-chalk hover:text-ink",
  danger: "bg-white text-[#a3231c] border border-[#a3231c]/30 hover:bg-[#a3231c] hover:text-white",
};

export const Button = ({ variant = "outline", size = "md", className = "", ...rest }: ButtonProps) => (
  <button
    type="button"
    {...rest}
    className={`inline-flex items-center justify-center gap-2 rounded-[4px] font-semibold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
      size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13.5px]"
    } ${variantClass[variant]} ${className}`}
  />
);

/* ----------------------------------------------------------------- panels */

interface PanelProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  eyebrow?: string;
}

export const Panel = ({ title, description, actions, children, className = "", eyebrow }: PanelProps) => (
  <section className={`bg-white border border-hairline rounded-[6px] ${className}`}>
    {(title || actions) && (
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-hairline">
        <div>
          {eyebrow && <p className="label-mono text-ember mb-1.5">{eyebrow}</p>}
          {title && <h2 className="display-mid text-[17px] text-ink">{title}</h2>}
          {description && <p className="mt-1 text-[12.5px] text-steel max-w-xl leading-snug">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className="p-5">{children}</div>
  </section>
);

/* ----------------------------------------------------------------- fields */

export const Field = ({
  label,
  hint,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="block text-[12.5px] font-semibold text-ink mb-1.5">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-[11.5px] text-mist leading-snug">{hint}</p>}
  </div>
);

const controlClass =
  "w-full px-3 bg-white border border-hairline rounded-[4px] text-[13.5px] text-ink placeholder:text-mist focus:outline-none focus:border-ink transition-colors";

export const TextInput = ({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...rest} className={`${controlClass} h-10 ${className}`} />
);

export const TextArea = ({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...rest} className={`${controlClass} py-2.5 leading-relaxed resize-y ${className}`} />
);

export const SelectInput = ({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...rest} className={`${controlClass} h-10 cursor-pointer ${className}`}>
    {children}
  </select>
);

export const Toggle = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-[4px] border border-hairline bg-white hover:border-ink transition-colors text-left cursor-pointer"
  >
    <span
      className={`relative w-10 rounded-full transition-colors shrink-0 ${checked ? "bg-ember" : "bg-hairline"}`}
      style={{ height: "22px" }}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${
          checked ? "left-[21px]" : "left-[3px]"
        }`}
      />
    </span>
    <span className="flex-1">
      <span className="block text-[13.5px] font-semibold text-ink">{label}</span>
      {hint && <span className="block text-[12px] text-steel mt-0.5">{hint}</span>}
    </span>
  </button>
);

export const Chip = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "dark" }) => (
  <span
    className={`label-mono px-2 py-1 rounded-[3px] border ${
      tone === "accent"
        ? "bg-ember-soft text-ember border-ember-soft"
        : tone === "dark"
          ? "bg-ink text-white border-ink"
          : "bg-chalk text-steel border-hairline"
    }`}
  >
    {children}
  </span>
);

/* ------------------------------------------------------- sortable list ui */

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  addLabel: string;
  itemTitle: (item: T, index: number) => string;
  children: (item: T, index: number) => ReactNode;
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  onRemove,
  onAdd,
  addLabel,
  itemTitle,
  children,
}: SortableListProps<T>) {
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onReorder(next);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-[13px] text-mist px-3.5 py-6 text-center border border-dashed border-hairline rounded-[5px]">
          Nothing here yet — add the first item below.
        </p>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="border border-hairline rounded-[5px] bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-chalk border-b border-hairline">
            <span className="label-mono text-mist tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            <span className="flex-1 text-[13px] font-semibold text-ink truncate">
              {itemTitle(item, index) || "Untitled"}
            </span>
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="p-1 rounded-[3px] text-steel hover:text-ink hover:bg-white disabled:opacity-30 cursor-pointer"
              aria-label="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === items.length - 1}
              className="p-1 rounded-[3px] text-steel hover:text-ink hover:bg-white disabled:opacity-30 cursor-pointer"
              aria-label="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="p-1 rounded-[3px] text-steel hover:text-[#a3231c] hover:bg-white cursor-pointer"
              aria-label="Remove item"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3.5">{children(item, index)}</div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={onAdd}>
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- dialog  */

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-carbon/55 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rise relative w-full max-w-md bg-white border border-hairline rounded-[6px] shadow-2xl p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="display-mid text-[18px] text-ink">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 -mr-1 text-mist hover:text-ink cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-steel">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ empty state */

export const EmptyState = ({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) => (
  <div className="px-6 py-16 text-center border border-dashed border-hairline rounded-[6px] bg-chalk/50">
    <div className="mx-auto w-11 h-11 rounded-[5px] bg-white border border-hairline flex items-center justify-center text-steel">
      {icon}
    </div>
    <h3 className="display-mid mt-4 text-[17px] text-ink">{title}</h3>
    <p className="mt-2 text-[13.5px] text-steel max-w-sm mx-auto leading-relaxed">{message}</p>
    {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
  </div>
);
