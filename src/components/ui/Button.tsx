"use client";

import Link from "next/link";
import { ComponentPropsWithoutRef, ReactNode, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  asChild?: boolean;
};

type ButtonProps = BaseProps & ComponentPropsWithoutRef<"button">;

type AnchorProps = BaseProps & ComponentPropsWithoutRef<"a">;

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A5473]/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer";

const variantClasses: Record<Variant, string> = {
  primary: "bg-[#2A5473] hover:opacity-90 text-white",
  secondary: "bg-[#355444] hover:opacity-90 text-white",
  danger: "bg-[#BE1622] hover:opacity-90 text-white",
  outline: "border border-neutral-300 text-neutral-800 hover:bg-neutral-50",
  ghost: "text-neutral-800 hover:bg-neutral-100",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3",
};

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps | AnchorProps>(
  function Button(
    { variant = "primary", size = "md", href, className = "", leftIcon, rightIcon, loading = false, asChild = false, children, ...props },
    ref
  ) {
    const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    const content = (
      <>
        {loading ? <Spinner /> : leftIcon}
        <span>{children}</span>
        {rightIcon}
      </>
    );

    if (href) {
      const anchorProps = props as AnchorProps;
      return (
        <Link href={href} className={classes} ref={ref as any} {...(anchorProps as any)}>
          {content}
        </Link>
      );
    }

    if (asChild) {
      const Any = (props as any).as || "span";
      return (
        <Any className={classes} ref={ref as any} {...(props as any)}>
          {content}
        </Any>
      );
    }

    const buttonProps = props as ButtonProps;
    const { type = "button", ...rest } = buttonProps as any;
    return (
      <button className={classes} ref={ref as any} type={type} {...(rest as any)}>
        {content}
      </button>
    );
  }
);

export default Button;
