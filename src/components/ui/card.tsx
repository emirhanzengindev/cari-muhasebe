import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return <div className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(28,55,75,0.05)] ${className}`}>{children}</div>;
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = "" }) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = "" }) => {
  return (
    <h3 className={`text-lg font-semibold leading-tight tracking-tight text-[var(--foreground)] ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = "" }) => {
  return (
    <p className={`text-sm text-[var(--muted)] ${className}`}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardContentProps> = ({ children, className = "" }) => {
  return (
    <div className={`p-5 pt-0 sm:p-6 sm:pt-0 ${className}`}>
      {children}
    </div>
  );
};