"use client";

import React from "react";
import { Bar, BarChart } from "recharts";
import { useTheme } from "next-themes";

import { useConfig } from "@/hooks/use-config";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CHART_KEYS,
  FONT_KEYS,
  SHADOW_KEYS,
  SIDEBAR_KEYS,
} from "@/registry/theme-derive";
import { hexToOklch, oklchToHex } from "./color.utils";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const CHART_DATA = [
  { key: "chart-1", v: 186 },
  { key: "chart-2", v: 305 },
  { key: "chart-3", v: 237 },
  { key: "chart-4", v: 73 },
  { key: "chart-5", v: 209 },
];

const CHART_CONFIG = {
  "chart-1": { label: "Chart 1", color: "var(--chart-1)" },
  "chart-2": { label: "Chart 2", color: "var(--chart-2)" },
  "chart-3": { label: "Chart 3", color: "var(--chart-3)" },
  "chart-4": { label: "Chart 4", color: "var(--chart-4)" },
  "chart-5": { label: "Chart 5", color: "var(--chart-5)" },
} as const;

const SIDEBAR_LABELS: Record<(typeof SIDEBAR_KEYS)[number], string> = {
  sidebar: "Sidebar",
  "sidebar-foreground": "Foreground",
  "sidebar-primary": "Primary",
  "sidebar-primary-foreground": "Primary fg",
  "sidebar-accent": "Accent",
  "sidebar-accent-foreground": "Accent fg",
  "sidebar-border": "Border",
  "sidebar-ring": "Ring",
};

const SHADOW_LABELS: Record<(typeof SHADOW_KEYS)[number], string> = {
  "shadow-color": "Color",
  "shadow-opacity": "Opacity",
  "shadow-blur": "Blur",
  "shadow-spread": "Spread",
  "shadow-offset-x": "Offset X",
  "shadow-offset-y": "Offset Y",
};

export function ParametersSection() {
  const [config, setConfig] = useConfig();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const vars = (config.cssVars[mode] ?? {}) as Record<string, string>;

  const setColor = (key: string, hex: string) => {
    setConfig({
      ...config,
      cssVars: {
        ...config.cssVars,
        [mode]: { ...config.cssVars[mode], [key]: hexToOklch(hex) },
      },
    });
  };

  const setShared = (key: string, value: string) => {
    setConfig({
      ...config,
      cssVars: {
        ...config.cssVars,
        light: { ...config.cssVars.light, [key]: value },
        dark: { ...config.cssVars.dark, [key]: value },
      },
    });
  };

  const inline = (tokens: readonly string[]): React.CSSProperties =>
    Object.fromEntries(tokens.map((t) => [`--${t}`, vars[t]])) as React.CSSProperties;

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="space-y-1.5">
        <Label className="text-xs">Chart colors</Label>
        <div style={inline(CHART_KEYS)} className="rounded-md border p-2">
          <ChartContainer config={CHART_CONFIG} className="h-[140px] w-full">
            <BarChart data={CHART_DATA} accessibilityLayer>
              <Bar dataKey="v" fill="var(--color-chart-1)" radius={4} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CHART_KEYS.map((key) => (
            <ColorControl
              key={key}
              label={`Chart ${key.slice(-1)}`}
              value={vars[key]}
              onChange={(hex) => setColor(key, hex)}
            />
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-1.5">
        <Label className="text-xs">Sidebar</Label>
        <SidebarSpecimen vars={vars} />
        <div className="grid grid-cols-2 gap-2">
          {SIDEBAR_KEYS.map((key) => (
            <ColorControl
              key={key}
              label={SIDEBAR_LABELS[key]}
              value={vars[key]}
              onChange={(hex) => setColor(key, hex)}
            />
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="space-y-1.5">
        <Label className="text-xs">Typography</Label>
        <div style={inline(FONT_KEYS)} className="space-y-1 rounded-md border p-2">
          <p className="font-sans">The quick brown fox jumps over the lazy dog.</p>
          <p className="font-serif">The quick brown fox jumps over the lazy dog.</p>
          <p className="font-mono">The quick brown fox jumps over the lazy dog.</p>
        </div>
        <div className="space-y-2">
          {FONT_KEYS.map((key) => (
            <TextControl
              key={key}
              label={key.replace("-", " ")}
              value={vars[key]}
              onChange={(value) => setShared(key, value)}
            />
          ))}
        </div>
      </div>

      {/* Tracking */}
      <div className="space-y-1.5">
        <Label className="text-xs">Letter spacing</Label>
        <div style={inline(["letter-spacing"])} className="rounded-md border p-2">
          <p className="tracking-normal">Spaced out specimen text.</p>
        </div>
        <NumberControl
          label="letter-spacing"
          value={vars["letter-spacing"]}
          suffix="em"
          min={-0.5}
          max={1}
          step={0.01}
          onChange={(v) => setShared("letter-spacing", `${v}em`)}
        />
      </div>

      {/* Spacing */}
      <div className="space-y-1.5">
        <Label className="text-xs">Spacing</Label>
        <div style={inline(["spacing"])} className="rounded-md border p-2">
          <div className="flex flex-col gap-4 p-4">
            <div className="h-6 rounded-sm bg-primary/20" />
            <div className="h-6 rounded-sm bg-primary/20" />
          </div>
        </div>
        <NumberControl
          label="spacing"
          value={vars.spacing}
          suffix="rem"
          min={0}
          max={2}
          step={0.05}
          onChange={(v) => setShared("spacing", `${v}rem`)}
        />
      </div>

      {/* Shadows */}
      <div className="space-y-1.5">
        <Label className="text-xs">Shadows</Label>
        <ShadowSpecimen vars={vars} />
        <div className="grid grid-cols-2 gap-2">
          <ColorControl
            label={SHADOW_LABELS["shadow-color"]}
            value={vars["shadow-color"]}
            onChange={(hex) => setColor("shadow-color", hex)}
          />
          {(
            [
              ["shadow-opacity", "Opacity", "", 0, 1, 0.01],
              ["shadow-blur", "Blur", "px", 0, 48, 1],
              ["shadow-spread", "Spread", "px", -24, 24, 1],
              ["shadow-offset-x", "Offset X", "px", -24, 24, 1],
              ["shadow-offset-y", "Offset Y", "px", 0, 48, 1],
            ] as const
          ).map(([key, label, suffix, min, max, step]) => (
            <NumberControl
              key={key}
              label={label}
              value={vars[key]}
              suffix={suffix}
              min={min}
              max={max}
              step={step}
              onChange={(v) => setShared(key, `${v}${suffix}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarSpecimen({ vars }: { vars: Record<string, string> }) {
  const style = Object.fromEntries(
    SIDEBAR_KEYS.map((key) => [`--${key}`, vars[key]])
  ) as React.CSSProperties;

  return (
    <div
      style={style}
      className="grid grid-cols-[140px_1fr] overflow-hidden rounded-md border border-(--sidebar-border) bg-(--sidebar) text-(--sidebar-foreground)"
    >
      <div className="border-r border-(--sidebar-border) p-2">
        <div className="rounded-sm bg-(--sidebar-primary) px-2 py-1 text-xs font-medium text-(--sidebar-primary-foreground)">
          Active
        </div>
        <div className="mt-1 rounded-sm bg-(--sidebar-accent) px-2 py-1 text-xs text-(--sidebar-accent-foreground)">
          Hover
        </div>
      </div>
      <div className="p-2 text-xs">
        <div className="text-(--sidebar-foreground)">Sidebar content</div>
        <div className="text-(--sidebar-foreground)/60">Muted row</div>
      </div>
    </div>
  );
}

function ShadowSpecimen({ vars }: { vars: Record<string, string> }) {
  const style = Object.fromEntries(
    SHADOW_KEYS.map((key) => [`--${key}`, vars[key]])
  ) as React.CSSProperties;

  return (
    <div style={style} className="flex gap-4 p-2">
      <div className="h-16 w-32 rounded-lg border bg-card shadow" />
      <div className="h-16 w-32 rounded-lg border bg-card shadow-lg" />
    </div>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const hex = oklchToHex(value ?? "");
  return (
    <div className="flex items-center gap-2 rounded-md border p-1.5">
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
      />
      <div className="min-w-0">
        <div className="truncate text-[0.65rem] font-medium">{label}</div>
        <div className="font-mono text-[0.65rem] text-muted-foreground">{hex}</div>
      </div>
    </div>
  );
}

function TextControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-[0.65rem] font-medium">{label}</div>
      <Input
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="h-7 font-mono text-xs"
      />
    </div>
  );
}

function NumberControl({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: string;
  suffix: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const num = parseFloat(value ?? "");
  const [draft, setDraft] = React.useState<string>(value ?? "");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const commit = () => {
    const parsed = parseFloat(draft);
    if (Number.isNaN(parsed)) {
      setError(true);
      setDraft(value ?? "");
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    setError(false);
    onChange(clamped);
    setDraft(`${clamped}`);
  };

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] font-medium">{label}</span>
        <span className="font-mono text-[0.65rem] text-muted-foreground">
          {Number.isFinite(num) ? `${num}${suffix}` : value ?? ""}
        </span>
      </div>
      <Input
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(false);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        className={`h-7 font-mono text-xs ${error ? "border-destructive" : ""}`}
      />
    </div>
  );
}
