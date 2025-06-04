import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "../../hooks/use-mobile"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"
import { Sheet, SheetContent } from "../ui/sheet"
import { Skeleton } from "../ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
)

const SidebarProvider = SidebarContext.Provider

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

const sidebarVariants = cva(
  "fixed inset-y-0 left-0 z-40 flex w-full max-w-[280px] flex-col border-r bg-background p-4 transition-all",
  {
    variants: {
      variant: {
        default: "translate-x-0",
        hidden: "-translate-x-full",
        collapsed: "translate-x-[-100%]",
      },
      position: {
        left: "rounded-r-lg",
        right: "rounded-l-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "left",
    },
  }
)

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, variant, position, ...props }, ref) => {
    const isMobile = useIsMobile()
    const sidebarVariant = isMobile ? "hidden" : variant

    return (
      <SidebarProvider value={{ isMobile }}>
        <div
          ref={ref}
          className={cn(sidebarVariants({ variant: sidebarVariant, position }), className)}
          {...props}
        >
          {children}
        </div>
      </SidebarProvider>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-y-auto", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarContent.displayName = "SidebarContent"

const SidebarHeader = ({ className, children, ...props }: SidebarHeaderProps) => {
  return (
    <div className={cn("flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  )
}

const SidebarFooter = ({ className, children, ...props }: SidebarFooterProps) => {
  return (
    <div className={cn("mt-auto", className)} {...props}>
      {children}
    </div>
  )
}

const SidebarSeparator = React.forwardRef<HTMLDivElement, SidebarSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <Separator
        ref={ref}
        className={cn("my-4", className)}
        {...props}
      />
    )
  }
)
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarMenu = React.forwardRef<HTMLDivElement, SidebarMenuProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("w-full justify-start text-left", className)}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuItem = React.forwardRef<HTMLDivElement, SidebarMenuItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center py-2 px-3 text-sm", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuBadge = ({ className, children, ...props }: SidebarMenuBadgeProps) => {
  return (
    <span className={cn("ml-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground", className)} {...props}>
      {children}
    </span>
  )
}

const SidebarMenuSub = React.forwardRef<HTMLDivElement, SidebarMenuSubProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-2 space-y-1", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubButton = React.forwardRef<HTMLButtonElement, SidebarMenuSubButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("w-full justify-start text-left", className)}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

const SidebarGroup = ({ className, children, ...props }: SidebarGroupProps) => {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  )
}

const SidebarGroupLabel = ({ className, children, ...props }: SidebarGroupLabelProps) => {
  return (
    <p className={cn("text-xs font-semibold uppercase text-muted-foreground", className)} {...props}>
      {children}
    </p>
  )
}

const SidebarGroupAction = ({ className, children, ...props }: SidebarGroupActionProps) => {
  return (
    <div className={cn("flex items-center", className)} {...props}>
      {children}
    </div>
  )
}

const SidebarGroupContent = ({ className, children, ...props }: SidebarGroupContentProps) => {
  return (
    <div className={cn("mt-2 space-y-1", className)} {...props}>
      {children}
    </div>
  )
}

const SidebarInset = ({ className, children, ...props }: SidebarInsetProps) => {
  return (
    <div className={cn("px-4", className)} {...props}>
      {children}
    </div>
  )
}

const SidebarInput = React.forwardRef<HTMLInputElement, SidebarInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn("w-full rounded-md border-0 bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-0", className)}
        {...props}
      />
    )
  }
)
SidebarInput.displayName = "SidebarInput"

const SidebarRail = React.forwardRef<HTMLDivElement, SidebarRailProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-full flex-col border-l bg-background", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarRail.displayName = "SidebarRail"

// Type definitions for Sidebar context and components

type SidebarContextValue = {
  isMobile: boolean
}

type SidebarProps = React.ComponentPropsWithRef<"div"> & {
  variant?: "default" | "hidden" | "collapsed"
  position?: "left" | "right"
}

type SidebarContentProps = React.ComponentPropsWithRef<"div">
type SidebarHeaderProps = React.HTMLAttributes<HTMLDivElement>
type SidebarFooterProps = React.HTMLAttributes<HTMLDivElement>
type SidebarSeparatorProps = React.ComponentPropsWithRef<typeof Separator>
type SidebarMenuProps = React.ComponentPropsWithRef<"div">
type SidebarMenuButtonProps = React.ComponentPropsWithRef<"button">
type SidebarMenuItemProps = React.ComponentPropsWithRef<"div">
type SidebarMenuBadgeProps = React.HTMLAttributes<HTMLSpanElement>
type SidebarMenuSubProps = React.ComponentPropsWithRef<"div">
type SidebarMenuSubButtonProps = React.ComponentPropsWithRef<"button">
type SidebarGroupProps = React.HTMLAttributes<HTMLDivElement>
type SidebarGroupLabelProps = React.HTMLAttributes<HTMLParagraphElement>
type SidebarGroupActionProps = React.HTMLAttributes<HTMLDivElement>
type SidebarGroupContentProps = React.HTMLAttributes<HTMLDivElement>
type SidebarInsetProps = React.HTMLAttributes<HTMLDivElement>
type SidebarInputProps = React.ComponentPropsWithRef<"input">
type SidebarRailProps = React.ComponentPropsWithRef<"div">

// Dummy implementations for missing exports
const SidebarMenuAction = () => null
const SidebarMenuSkeleton = () => null
const SidebarMenuSubItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>((props, ref) => <div ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"
const SidebarTrigger = () => null

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
