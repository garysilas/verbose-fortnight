"use client";

import React from "react";
import { useConfig } from "@/hooks/use-config";
import { importTheme, parseThemeLink } from "@/registry/theme-import";
import { CssVars } from "@/registry/themes";
import { oklchToHex } from "./color.utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type Preview = {
  name: string;
  cssVars: CssVars;
  ignored: string[];
};

const SWATCH_KEYS = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "accent",
  "destructive",
  "border",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
] as const;

export function ImportDialog() {
  const [config, setConfig] = useConfig();
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [open, setOpen] = React.useState(false);

  const reset = () => {
    setError(null);
    setPreview(null);
    setLoading(false);
  };

  const runImport = async () => {
    reset();
    const value = text.trim();
    if (!value) return;

    setLoading(true);
    try {
      // Link shape
      const id = parseThemeLink(value);
      if (id) {
        const res = await fetch(`/api/themes/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "That theme id does not exist.");
          return;
        }
        setPreview({
          name: data.name,
          cssVars: data.cssVars,
          ignored: data.ignored ?? [],
        });
        return;
      }

      // JSON shape
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        setError("That is not valid JSON.");
        return;
      }
      const outcome = importTheme(parsed);
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setPreview({
        name: outcome.theme,
        cssVars: outcome.cssVars,
        ignored: outcome.ignored,
      });
    } catch {
      setError("That link could not be read. Paste the registry JSON instead.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    if (!preview) return;
    setConfig({
      ...config,
      theme: preview.name,
      cssVars: preview.cssVars,
    });
    setOpen(false);
    reset();
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg outline-hidden">
        <DialogHeader>
          <DialogTitle>Import a theme</DialogTitle>
          <DialogDescription>
            Paste a tweakcn preset link or its registry JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="import-input">Link or JSON</Label>
            <Textarea
              id="import-input"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                reset();
              }}
              placeholder="https://tweakcn.com/themes/claude"
              className="min-h-[80px] font-mono text-xs"
            />
          </div>

          <Button onClick={runImport} disabled={loading || !text.trim()}>
            {loading ? "Reading…" : "Preview"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {preview && (
            <div className="space-y-2 rounded-md border p-2">
              <div className="text-sm font-medium">Theme: {preview.name}</div>
              <div className="flex flex-wrap gap-1">
                {SWATCH_KEYS.map((key) => {
                  const value = preview.cssVars.light[
                    key as keyof typeof preview.cssVars.light
                  ] as string | undefined;
                  return (
                    <div
                      key={key}
                      title={key}
                      className="h-6 w-6 rounded-full border"
                      style={{ backgroundColor: oklchToHex(value ?? "oklch(0 0 0)") }}
                    />
                  );
                })}
              </div>
              {preview.ignored.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <div>Ignored keys:</div>
                  <div className="font-mono">
                    {preview.ignored.map((k) => `--${k}`).join(", ")}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={confirm} size="sm">
                  Apply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    reset();
                    setText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
