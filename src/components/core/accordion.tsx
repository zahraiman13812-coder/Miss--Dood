"use client";

import {
  createContext, useContext, useId, useState,
  type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode,
} from "react";
import styles from "./accordion.module.css";

type MotionSettings = {
  transition?: { type?: "spring"; stiffness?: number; damping?: number };
  variants?: { expanded?: { opacity?: number; scale?: number }; collapsed?: { opacity?: number; scale?: number } };
};
type AccordionProps = HTMLAttributes<HTMLDivElement> & MotionSettings & {
  children: ReactNode;
  type?: "single" | "multiple";
  defaultValue?: string | string[];
};
type GroupContext = { expanded: string[]; toggle: (value: string) => void; motion: MotionSettings };
type ItemContext = { expanded: boolean; panelId: string; triggerId: string };
const Group = createContext<GroupContext | null>(null);
const Item = createContext<ItemContext | null>(null);
const ItemValue = createContext<string | null>(null);
function useGroup() {
  const value = useContext(Group);
  if (!value) throw new Error("AccordionItem must be inside Accordion");
  return value;
}
function useItem() {
  const value = useContext(Item);
  if (!value) throw new Error("AccordionTrigger/Content must be inside AccordionItem");
  return value;
}
export function Accordion({ children, className = "", type = "single", defaultValue, transition, variants, ...props }: AccordionProps) {
  const [expanded, setExpanded] = useState<string[]>(() =>
    defaultValue === undefined ? [] : Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  );
  const toggle = (value: string) => setExpanded(previous => previous.includes(value)
    ? previous.filter(current => current !== value)
    : type === "multiple" ? [...previous, value] : [value]);
  return <Group.Provider value={{ expanded, toggle, motion: { transition, variants } }}>
    <div {...props} className={`${styles.root} ${className}`}>{children}</div>
  </Group.Provider>;
}
export function AccordionItem({ value, children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { value: string; children: ReactNode }) {
  const { expanded } = useGroup();
  const id = useId();
  const open = expanded.includes(value);
  return <ItemValue.Provider value={value}><Item.Provider value={{ expanded: open, panelId: `${id}-content`, triggerId: `${id}-trigger` }}>
    <div {...props} data-expanded={open ? "true" : undefined} data-state={open ? "open" : "closed"} className={`group ${className}`}>{children}</div>
  </Item.Provider></ItemValue.Provider>;
}
export function AccordionTrigger({ children, className = "", onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { expanded, panelId, triggerId } = useItem();
  const { toggle } = useGroup();
  // The value belongs to this item's context, not to a generated DOM selector.
  const value = useContext(ItemValue);
  if (value === null) throw new Error("AccordionTrigger must be inside AccordionItem");
  return <button {...props} id={triggerId} type="button" aria-expanded={expanded} aria-controls={panelId}
    data-expanded={expanded ? "true" : undefined}
    className={`${styles.trigger} group ${className}`}
    onClick={event => { onClick?.(event); if (!event.defaultPrevented) toggle(value); }}>
    {children}
  </button>;
}
export function AccordionContent({ children, className = "", desktopVisible = false, ...props }: HTMLAttributes<HTMLDivElement> & { desktopVisible?: boolean }) {
  const { expanded, panelId, triggerId } = useItem();
  const { motion } = useGroup();
  const closedScale = motion.variants?.collapsed?.scale ?? .7;
  const openScale = motion.variants?.expanded?.scale ?? 1;
  const closedOpacity = motion.variants?.collapsed?.opacity ?? 0;
  const openOpacity = motion.variants?.expanded?.opacity ?? 1;
  return <div {...props} id={panelId} role="region" aria-labelledby={triggerId}
    aria-hidden={desktopVisible ? undefined : !expanded} data-expanded={expanded ? "true" : undefined}
    className={`${styles.content} ${className}`}
    style={{ ...props.style, "--accordion-collapsed-scale": closedScale,
      "--accordion-expanded-scale": openScale, "--accordion-collapsed-opacity": closedOpacity,
      "--accordion-expanded-opacity": openOpacity } as CSSProperties}>
    <div className={styles.clip} inert={desktopVisible ? undefined : !expanded}>{children}</div>
  </div>;
}
