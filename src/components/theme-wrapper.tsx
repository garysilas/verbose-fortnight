"use client";

import { cn } from "@/lib/utils";
import { useConfig } from "@/hooks/use-config";
import { useTheme } from "next-themes";
import { FONT_KEYS, SHADOW_KEYS } from "@/registry/theme-derive";

const PRESENTATION_KEYS = new Set([
  ...FONT_KEYS,
  ...SHADOW_KEYS,
  "letter-spacing",
  "spacing",
]);

interface ThemeWrapperProps extends React.ComponentProps<"div"> {
  defaultTheme?: string;
}

export function ThemeWrapper({
  defaultTheme,
  children,
  className,
}: ThemeWrapperProps) {
  const [config] = useConfig();
  const { resolvedTheme: mode } = useTheme();

  const currentTheme = mode === "dark" ? "dark" : "light";

  const prefixedCssVars = Object.keys(config.cssVars[currentTheme])
    .filter((key) => !PRESENTATION_KEYS.has(key))
    .reduce((acc, key) => {
      const value =
        config.cssVars[currentTheme as keyof typeof config.cssVars][
          key as keyof (typeof config.cssVars)["light"]
        ];
      acc[`--${key}`] = value !== undefined ? `${value}` : "";
      return acc;
    },
    {} as Record<string, string>
  );

  const style = {
    ...prefixedCssVars,
    "--radius": defaultTheme ? "0.5rem" : config.cssVars.light.radius ?? "0.5rem",
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        `theme-${defaultTheme || config.theme}`,
        "w-full",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
