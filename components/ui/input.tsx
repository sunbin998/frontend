import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[#87867f] selection:bg-primary selection:text-primary-foreground border-[#e8e6dc] h-10 w-full min-w-0 rounded-xl border bg-[#faf9f5] px-3 py-1 text-base text-[#141413] shadow-[#faf9f5_0_0_0_0,#d1cfc5_0_0_0_1px] transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[#3898ec] focus-visible:ring-[#3898ec]/35 focus-visible:ring-[2px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
