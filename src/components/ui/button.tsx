import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "default",
  size = "default",
  children,
  className = "",
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200"
  };
  
  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    default: "h-10 px-4 py-2",
    lg: "h-11 px-8 text-lg"
  };

  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};