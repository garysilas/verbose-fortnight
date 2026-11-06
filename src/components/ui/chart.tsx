"use client";

import type React from "react";
import { createContext, useContext, useId, useMemo } from "react";
import {
  type DefaultLegendContentProps,
  type DefaultTooltipContentProps,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { cn } from "@/lib/utils";

const THEMES = { dark: ".dark", light: "" } as const;

const INITIAL_DIMENSION = { height: 200, width: 320 } as const;
type TooltipNameType = number | string;

// recharts 2.7.x does not export the v3 type names; define the same shapes locally.
type TooltipValueType = number | string | Array<number | string>;
type TooltipPayload = NonNullable<
  DefaultTooltipContentProps<TooltipValueType, TooltipNameType>["payload"]
>;

export type ChartConfig = Record<
  string,
  {
    icon?: React.ComponentType;
    label?: React.ReactNode;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>;

interface ChartContextProps {
  config: ChartConfig;
}

const ChartContext = createContext<ChartContextProps | null>(null);

function useChart() {
  const context = useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<"div"> & {
  children: React.ComponentProps<typeof ResponsiveContainer>["children"];
  /**
   * Each series by its data key: its `label`, an `icon`, and a `color` (or a
   * `theme` color per light and dark), read by the tooltip and legend and set
   * as `--color-<key>`.
   */
  config: ChartConfig;
  /**
   * The size it renders at before it's measured, so the first paint isn't
   * empty.
   */
  initialDimension?: {
    height: number;
    width: number;
  };
}) {
  const uniqueId = useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className
        )}
        data-chart={chartId}
        data-slot="chart"
        {...props}
      >
        <ChartStyle config={config} id={chartId} />
        <ResponsiveContainer initialDimension={initialDimension}>
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({
  id,
  config,
}: {
  /** The chart config whose colors it writes as `--color-<key>` variables. */
  config: ChartConfig;
  id: string;
}) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.theme ?? itemConfig.color
  );

  if (!colorConfig.length) {
    return null;
  }

  const styleHtml = Object.entries(THEMES)
    .map(
      ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ??
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`
    )
    .join("\n");

  return (
    <style
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Chart color tokens are generated from config.
      dangerouslySetInnerHTML={{
        __html: styleHtml,
      }}
    />
  );
};

const ChartTooltip = Tooltip;

type TooltipPayloadItem = NonNullable<
  DefaultTooltipContentProps<TooltipValueType, TooltipNameType>["payload"]
>[number];

function ChartTooltipItem({
  color,
  formatter,
  hideIndicator,
  index,
  indicator,
  item,
  nameKey,
  nestLabel,
  tooltipLabel,
}: {
  color?: string;
  formatter?: DefaultTooltipContentProps<
    TooltipValueType,
    TooltipNameType
  >["formatter"];
  hideIndicator: boolean;
  index: number;
  indicator: "dashed" | "dot" | "line";
  item: TooltipPayloadItem;
  nameKey?: string;
  nestLabel: boolean;
  tooltipLabel: React.ReactNode;
}) {
  const { config } = useChart();
  const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
  const itemConfig = getPayloadConfigFromPayload(config, item, key);
  const indicatorColor = color ?? item.payload?.fill ?? item.color;
  const hasValue = item.value !== undefined && item.value !== null;

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-stretch gap-2 [&>svg]:size-2.5 [&>svg]:text-muted-foreground",
        indicator === "dot" && "items-center"
      )}
    >
      {formatter && item.value !== undefined && item.name ? (
        formatter(item.value, item.name, item, index, item.payload)
      ) : (
        <>
          {itemConfig?.icon ? (
            <itemConfig.icon />
          ) : (
            !hideIndicator && (
              <div
                className={cn(
                  "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                  {
                    "my-0.5": nestLabel && indicator === "dashed",
                    "size-2.5": indicator === "dot",
                    "w-0 border-[1.5px] border-dashed bg-transparent":
                      indicator === "dashed",
                    "w-1": indicator === "line",
                  }
                )}
                style={
                  {
                    "--color-bg": indicatorColor,
                    "--color-border": indicatorColor,
                  } as React.CSSProperties
                }
              />
            )
          )}
          <div
            className={cn(
              "flex flex-1 justify-between leading-none",
              nestLabel ? "items-end" : "items-center"
            )}
          >
            <div className="grid gap-1.5">
              {nestLabel ? tooltipLabel : null}
              <span className="text-muted-foreground">
                {itemConfig?.label ?? item.name}
              </span>
            </div>
            {hasValue ? (
              <span className="font-medium font-mono text-foreground tabular-nums">
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : String(item.value)}
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: Omit<React.ComponentProps<typeof Tooltip>, "labelFormatter"> &
  React.ComponentProps<"div"> & {
    /** Formats the tooltip's label; its value is untyped, as in recharts 3.8. */
    // biome-ignore lint/suspicious/noExplicitAny: recharts passes the axis value through untyped.
    labelFormatter?: (label: any, payload: TooltipPayload) => React.ReactNode;
    /** Hides each item's color indicator. */
    hideIndicator?: boolean;
    /** Hides the tooltip's label, the hovered point's. */
    hideLabel?: boolean;
    /** The color indicator's shape: a `dot`, a `line` or `dashed`. */
    indicator?: "dashed" | "dot" | "line";
    /** The key in the data to read the label from, looked up in `config`. */
    labelKey?: string;
    /** The key in each item's data to look its name up by in `config`. */
    nameKey?: string;
  } & Omit<
    DefaultTooltipContentProps<TooltipValueType, TooltipNameType>,
    "accessibilityLayer" | "labelFormatter"
  >) {
  const { config } = useChart();

  const tooltipLabel = useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string"
        ? (config[label]?.label ?? label)
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [
    config,
    hideLabel,
    label,
    labelClassName,
    labelFormatter,
    labelKey,
    payload,
  ]);

  if (!(active && payload?.length)) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn("border-border/50 bg-background gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl grid min-w-32 items-start", className)}
    >
      {nestLabel ? null : (tooltipLabel ?? null)}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
            return (
              <ChartTooltipItem
                color={color}
                formatter={formatter}
                hideIndicator={hideIndicator}
                index={index}
                indicator={indicator}
                item={item}
                key={key}
                nameKey={nameKey}
                nestLabel={nestLabel}
                tooltipLabel={tooltipLabel}
              />
            );
          })}
      </div>
    </div>
  );
}

const ChartLegend = Legend as React.ComponentType<
  React.ComponentProps<typeof Legend> & { className?: string }
>;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> & {
  /** Hides each series' icon (from `config`), leaving its color swatch. */
  hideIcon?: boolean;
  /**
   * The key in each legend item's data to look its label up by in `config`.
   * Defaults to the item's `dataKey`.
   */
  nameKey?: string;
} & DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item) => {
          const key = `${
            nameKey ?? (item as { dataKey?: string | number }).dataKey ?? "value"
          }`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              className={cn(
                "flex items-center gap-1.5 [&>svg]:size-3 [&>svg]:text-muted-foreground"
              )}
              key={String(item.value ?? key)}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return;
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
};
