import React from "react";

const Button = React.forwardRef(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${
          variant === "default"
            ? "bg-primary text-primary-foreground shadow hover:bg-primary/90"
            : variant === "destructive"
            ? "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
            : variant === "outline"
            ? "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
            : variant === "secondary"
            ? "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
            : variant === "ghost"
            ? "hover:bg-accent hover:text-accent-foreground"
            : "text-primary underline-offset-4 hover:underline"
        } ${
          size === "default"
            ? "h-9 px-4 py-2"
            : size === "sm"
            ? "h-8 rounded-md px-3 text-xs"
            : size === "lg"
            ? "h-10 rounded-md px-8"
            : "h-9 w-9"
        } ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
