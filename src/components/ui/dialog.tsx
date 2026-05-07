import React, { createContext, useContext, useState, type ReactNode } from "react";

/* ── Dialog (minimal overlay) ── */

const DialogCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
    open: false,
    setOpen: () => { },
});

interface DialogProps {
    children: ReactNode;
    open?: boolean;
    onOpenChange?: (v: boolean) => void;
}

export function Dialog({ children, open: controlledOpen, onOpenChange }: DialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;
    return <DialogCtx.Provider value={{ open, setOpen }}>{children}</DialogCtx.Provider>;
}

export function DialogTrigger({
    children,
    asChild,
}: {
    children: ReactNode;
    asChild?: boolean;
}) {
    const { setOpen } = useContext(DialogCtx);
    return <span onClick={() => setOpen(true)}>{children}</span>;
}

export function DialogContent({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    const { open, setOpen } = useContext(DialogCtx);
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
            <div className={`modal-box ${className || ""}`} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

export function DialogHeader({ children }: { children: ReactNode }) {
    return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ children }: { children: ReactNode }) {
    return <h2 className="section-title text-base">{children}</h2>;
}

export function DialogDescription({ children }: { children: ReactNode }) {
    return (
        <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>
            {children}
        </p>
    );
}
