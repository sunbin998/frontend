import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[2px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[#c96442_0_0_0_0,#c96442_0_0_0_1px] hover:bg-[#b85b3b]",
        destructive:
          "bg-destructive text-[#faf9f5] shadow-[#b53333_0_0_0_0,#b53333_0_0_0_1px] hover:bg-[#9f2e2e] focus-visible:ring-destructive/20",
        outline:
          "border border-[#d1cfc5] bg-[#e8e6dc] text-[#4d4c48] shadow-[#e8e6dc_0_0_0_0,#d1cfc5_0_0_0_1px] hover:bg-[#dedbcf]",
        secondary:
          "bg-[#ffffff] text-[#141413] border border-[#f0eee6] shadow-[#ffffff_0_0_0_0,#e8e6dc_0_0_0_1px] hover:bg-[#faf9f5]",
        ghost:
          "text-[#5e5d59] hover:bg-[#e8e6dc] hover:text-[#3d3d3a]",
        link: "text-[#c96442] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
