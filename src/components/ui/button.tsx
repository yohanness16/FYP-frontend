import React from "react";

type Variant = "default" | "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "default" | "sm" | "lg" | "icon";

const variantClass: Record<Variant, string> = {
    default: "btn-primary",
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
    ghost: "btn-ghost",
    outline: "btn-secondary",
};

const sizeStyle: Record<Size, React.CSSProperties> = {
    default: {},
    sm: { padding: "4px 10px", fontSize: 12 },
    lg: { padding: "10px 20px", fontSize: 15 },
    icon: { padding: 6, lineHeight: 1 },
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    asChild?: boolean;
}

export function Button({ variant = "default", size = "default", className, style, asChild, children, ...props }: ButtonProps) {
    const cls = `${variantClass[variant]} ${className || ""}`;
    return (
        <button className={cls} style={{ ...sizeStyle[size], ...style }} {...props}>
            {children}
        </button>
    );
}
