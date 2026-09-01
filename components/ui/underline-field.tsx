"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  wrapperClassName?: string;
};

/**
 * Editorial underlined field: mono uppercase label, 38px value row,
 * 1.5px baseline that turns brand on focus. No box.
 */
export function UnderlineField({
  label,
  hint,
  wrapperClassName,
  className,
  id: idProp,
  ...props
}: Props) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  return (
    <div className={cn("flex flex-col gap-1", wrapperClassName)}>
      <label
        htmlFor={id}
        className="font-mono text-muted-foreground text-[10px] tracking-[0.14em] uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "border-border focus:border-brand placeholder:text-muted-foreground/50 h-[38px] w-full border-b-[1.5px] bg-transparent text-[15px] outline-none transition-colors",
          className
        )}
        {...props}
      />
      {hint && <p className="text-muted-foreground text-[12px]">{hint}</p>}
    </div>
  );
}
