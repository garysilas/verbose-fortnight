"use client";

import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { Style } from "@/registry/styles";
import { Theme, CssVars, themes } from "@/registry/themes";
import { deriveThemeCssVars, fillDerivedCssVars } from "@/registry/theme-derive";

type Config = {
  style: Style["name"];
  theme: string;
  cssVars: {
    light: Partial<CssVars["light"]>;
    dark: Partial<CssVars["dark"]>;
  };
};

const zincTheme = themes.find((theme) => theme.name === "zinc")!;

const defaultConfig: Config = {
  style: "default",
  theme: "zinc",
  cssVars: deriveThemeCssVars(zincTheme),
};

function resolveStored(value: unknown): Config {
  if (value && typeof value === "object") {
    const stored = value as Partial<Config>;
    const theme = themes.find((t) => t.name === stored.theme) ?? zincTheme;
    const light = {
      ...(theme.cssVars.light as unknown as Record<string, string>),
      ...(stored.cssVars?.light as Record<string, string> | undefined),
    };
    const dark = {
      ...(theme.cssVars.dark as unknown as Record<string, string>),
      ...(stored.cssVars?.dark as Record<string, string> | undefined),
    };
    return {
      style: stored.style ?? "default",
      theme: stored.theme ?? "zinc",
      cssVars: fillDerivedCssVars(light, dark),
    };
  }
  return defaultConfig;
}

const storage = {
  getItem: (_key: string, initialValue: Config): Config => {
    if (typeof window === "undefined") return initialValue;
    const raw = window.localStorage.getItem("config-v2");
    if (!raw) return initialValue;
    try {
      return resolveStored(JSON.parse(raw));
    } catch {
      return initialValue;
    }
  },
  setItem: (_key: string, value: Config) => {
    window.localStorage.setItem("config-v2", JSON.stringify(value));
  },
  removeItem: () => {
    window.localStorage.removeItem("config-v2");
  },
};

const configAtom = atomWithStorage<Config>("config-v2", defaultConfig, storage);

export function useConfig() {
  return useAtom(configAtom);
}
