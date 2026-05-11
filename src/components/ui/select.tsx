import React, { createContext, useContext, useState } from "react";

/* ── Minimal Select ── */

const SelectCtx = createContext<{
    value: string | undefined;
    onValueChange: (v: string) => void;
    open: boolean;
    setOpen: (v: boolean) => void;
}>({
    value: undefined,
    onValueChange: () => { },
    open: false,
    setOpen: () => { },
});

export function Select({
    children,
    value,
    onValueChange,
}: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <SelectCtx.Provider value={{ value, onValueChange: onValueChange || (() => { }), open, setOpen }}>
            <div className="relative">{children}</div>
        </SelectCtx.Provider>
    );
}

export function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
    const { setOpen, open } = useContext(SelectCtx);
    return (
        <button
            type="button"
            className={`input text-left flex items-center justify-between ${className || ""}`}
            onClick={() => setOpen(!open)}
        >
            {children}
            <svg className="h-4 w-4 shrink-0" style={{ color: "var(--text3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
    const { value } = useContext(SelectCtx);
    return (
        <span style={{ color: value ? "var(--text)" : "var(--text3)" }}>
            {value || placeholder || "Select..."}
        </span>
    );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
    const { open, setOpen } = useContext(SelectCtx);
    if (!open) return null;
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
                className="absolute z-50 mt-1 w-full rounded-lg max-h-48 overflow-y-auto"
                style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border2)",
                    boxShadow: "var(--shadow-lg)",
                }}
            >
                {children}
            </div>
        </>
    );
}

export function SelectItem({ children, value }: { children: React.ReactNode; value: string }) {
    const { onValueChange, setOpen, value: current } = useContext(SelectCtx);
    return (
        <div
            className="act-item"
            style={current === value ? { color: "var(--neon)", background: "var(--neon-dim)" } : {}}
            onClick={() => {
                onValueChange(value);
                setOpen(false);
            }}
        >
            {children}
        </div>
    );
}
