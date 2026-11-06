"use client";

import * as React from "react";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { Paintbrush } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { useConfig } from "@/hooks/use-config";
import { CopyButton, copyToClipboardWithMeta } from "@/components/copy-button";
import { DrawerContent, DrawerTrigger } from "@/components/drawer";
import { ThemeWrapper } from "@/components/theme-wrapper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { themes } from "@/registry/themes";
import { deriveThemeCssVars } from "@/registry/theme-derive";
import { buildThemeCss } from "@/registry/theme-export";

import "@/styles/mdx.css";
import { Drawer } from "vaul";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CustomizerHeader from "./customizer/customizer-header";
import StyleSection from "./customizer/style-section";
import ColorSection from "./customizer/color-section";
import RadiusSection from "./customizer/radius-section";
import ModeSection from "./customizer/mode-section";
import ColorPickerSection from "./customizer/color-picker-section";
import { ParametersSection } from "./customizer/parameters-section";

export function ThemeCustomizer() {
  const [config, setConfig] = useConfig();
  const { resolvedTheme: mode } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <Drawer.Root>
        <DrawerTrigger asChild>
          <Button variant="outline" className="md:hidden">
            <Paintbrush className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85%] p-6 pt-10">
          <Customizer />
        </DrawerContent>
      </Drawer.Root>
      <div className="hidden md:flex">
        <div className="mr-2 hidden items-center space-x-0.5 lg:flex">
          {mounted ? (
            <>
              {["zinc", "rose", "blue", "green", "orange"].map((color) => {
                const theme = themes.find((theme) => theme.name === color);
                const isActive = config.theme === color;

                if (!theme) {
                  return null;
                }

                return (
                  <Tooltip key={theme.name}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          setConfig({
                            theme: theme.name,
                            cssVars: deriveThemeCssVars(theme),
                            style: "default",
                          })
                        }
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs",
                          isActive
                            ? "border-[--theme-primary]"
                            : "border-transparent"
                        )}
                        style={
                          {
                            "--theme-primary": `${
                              theme?.activeColor[
                                mode === "dark" ? "dark" : "light"
                              ]
                            }`,
                          } as React.CSSProperties
                        }
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full bg-[--theme-primary]"
                          )}
                        >
                          {isActive && (
                            <CheckIcon className="w-4 h-4 text-white" />
                          )}
                        </span>
                        <span className="sr-only">{theme.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      align="center"
                      className="rounded-[0.5rem] bg-zinc-900 text-zinc-50"
                    >
                      {theme.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </>
          ) : (
            <div className="flex items-center mr-1 space-x-3">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full" />
            </div>
          )}
        </div>
        <Popover>
          <PopoverTrigger className="hidden md:flex" asChild>
            <Button variant="outline">
              <Paintbrush className="h-4 mr-2" />
              Customize
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="z-40 w-[30rem] rounded-[0.5rem] bg-white p-6 dark:bg-zinc-950"
          >
            <Customizer />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export function Customizer({ className }: { className?: string }) {
  return (
    <ThemeWrapper
      defaultTheme="zinc"
      className={cn(
        "fixed inset-y-0 right-0 flex flex-col md:min-h-[95vh] max-w-[30rem] p-4 space-y-4 overflow-y-scroll border-2 rounded-md shadow-sm scroll-y-auto backdrop-blur-sm bg-white/80 dark:bg-black/80 md:space-y-6",
        className
      )}
    >
      <CustomizerHeader />
      <div className="flex flex-col flex-1 gap-4 md:gap-6">
        <StyleSection />
        <ColorSection />
        <RadiusSection />
        <ModeSection />
        <ColorPickerSection />
        <ParametersSection />
        <CopyCodeButton />
      </div>
    </ThemeWrapper>
  );
}

export function CopyCodeButton() {
  const [config] = useConfig();
  // const activeTheme = themes.find((theme) => theme.name === config.theme);
  const activeTheme = config;
  const [hasCopied, setHasCopied] = React.useState(false);
  const { setTheme: setMode, resolvedTheme: mode } = useTheme();

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  return (
    <>
      {activeTheme && (
        <Button
          onClick={() => {
            copyToClipboardWithMeta(
              buildThemeCss(config),
              {
                name: "copy_theme_code",
                properties: {
                  theme: activeTheme.theme,
                  radius: String(config.cssVars.light?.radius),
                },
              }
            );
            setHasCopied(true);
          }}
          className="md:hidden"
        >
          {hasCopied ? (
            <CheckIcon className="w-4 h-4 mr-2" />
          ) : (
            <CopyIcon className="w-4 h-4 mr-2" />
          )}
          Copy
        </Button>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button className="sticky bottom-0 hidden font-bold rounded md:flex">
            Copy code
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl outline-hidden">
          <DialogHeader>
            <DialogTitle>Theme</DialogTitle>
            <DialogDescription>
              Copy and paste the following code into your CSS file.
            </DialogDescription>
          </DialogHeader>
          <ThemeWrapper defaultTheme="zinc" className="relative">
            <CustomizerCode />
            {activeTheme && (
              <Button
                size="sm"
                onClick={() => {
                  copyToClipboardWithMeta(
                    buildThemeCss(config),
                    {
                      name: "copy_theme_code",
                      properties: {
                        theme: activeTheme.theme,
                        radius: String(config.cssVars.light?.radius),
                      },
                    }
                  );
                  setHasCopied(true);
                }}
                className="absolute right-4 top-4 bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground"
              >
                {hasCopied ? (
                  <CheckIcon className="w-4 h-4 mr-2" />
                ) : (
                  <CopyIcon className="w-4 h-4 mr-2" />
                )}
                Copy
              </Button>
            )}
          </ThemeWrapper>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CustomizerCode() {
  const [config] = useConfig();
  const css = buildThemeCss(config);

  return (
    <ThemeWrapper defaultTheme="zinc" className="relative space-y-4">
      <div data-rehype-pretty-code-fragment="">
        <pre className="max-h-[450px] overflow-x-auto rounded-lg border bg-zinc-950 py-4 dark:bg-zinc-900">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {css}
          </code>
        </pre>
      </div>
    </ThemeWrapper>
  );
}
