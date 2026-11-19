"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type PropsWithChildren } from "react";
import { X } from "lucide-react";
import styles from "./dialog.module.css";

type AnimationConfig = { type?: string; bounce?: number; duration?: number };
type MotionVariants = Record<string, { opacity?: number; scale?: number; y?: number }>;
type ContextValue = { open: boolean; setOpen: (value: boolean) => void; dialog: React.RefObject<HTMLDialogElement | null>; titleId: string; descriptionId: string };
const Context = createContext<ContextValue | null>(null);
function useDialog() { const context = useContext(Context); if (!context) throw new Error("Dialog components must be used inside Dialog"); return context; }

export function Dialog({ children, variants: _variants, transition: _transition }: PropsWithChildren<{ variants?: MotionVariants; transition?: AnimationConfig }>) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    else if (!open && node.open) node.close();
  }, [open]);
  useEffect(() => { return () => { if (dialog.current?.open) dialog.current.close(); }; }, []);
  return <Context.Provider value={{ open, setOpen, dialog, titleId: `dialog-title-${id}`, descriptionId: `dialog-description-${id}` }}>{children}</Context.Provider>;
}
export function DialogTrigger({ children, onClick, ...props }: ComponentPropsWithoutRef<"button">) {
  const { setOpen } = useDialog();
  return <button type="button" aria-haspopup="dialog" {...props} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) setOpen(true); }}>{children}</button>;
}
export function DialogContent({ children, className = "", onClose, ...props }: ComponentPropsWithoutRef<"dialog">) {
  const { dialog, setOpen, titleId, descriptionId } = useDialog();
  return <dialog ref={dialog} {...props} dir="rtl" aria-labelledby={titleId} aria-describedby={descriptionId}
    className={`${styles.dialog} ${className}`}
    onCancel={(event) => { event.preventDefault(); setOpen(false); }}
    onClose={(event) => { setOpen(false); onClose?.(event); }}
    onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
    {children}
  </dialog>;
}
export function DialogHeader({ children, className = "", ...props }: ComponentPropsWithoutRef<"div">) { return <div {...props} className={`flex flex-col gap-2 ${className}`}>{children}</div>; }
export function DialogTitle({ children, ...props }: ComponentPropsWithoutRef<"h2">) { const { titleId } = useDialog(); return <h2 id={titleId} {...props}>{children}</h2>; }
export function DialogDescription({ children, ...props }: ComponentPropsWithoutRef<"p">) { const { descriptionId } = useDialog(); return <p id={descriptionId} {...props}>{children}</p>; }
export function DialogClose({ children, onClick, className = "", ...props }: ComponentPropsWithoutRef<"button">) {
  const { setOpen } = useDialog();
  return <button type="button" aria-label="بستن پنجره" {...props} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#735931] text-[#e4bf76] transition hover:bg-[#9e3438]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e4bf76] ${className}`}
    onClick={event => { onClick?.(event); if (!event.defaultPrevented) setOpen(false); }}>{children ?? <X size={20}/>}</button>;
}
