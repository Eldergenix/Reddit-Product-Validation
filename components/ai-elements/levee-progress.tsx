"use client"

import { useEffect } from "react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"

import { cn } from "@/lib/utils"

const SIZE_MAP = {
  sm: { size: 32, stroke: 2.5, textSize: "text-[10px]" },
  md: { size: 40, stroke: 3, textSize: "text-[10px]" },
  lg: { size: 64, stroke: 6, textSize: "text-xs" },
} as const

export type LeveeProgressRingProps = React.ComponentProps<"div"> & {
  /** Current progress value (0-100). Clamped to valid range. */
  percentage: number
  /** Ring size preset. @default "sm" */
  size?: keyof typeof SIZE_MAP
  /** Display the percentage value in the center. Defaults to `true` for "lg" size. */
  showValue?: boolean
  /** Override the background track stroke class. @default "stroke-muted" */
  trackClassName?: string
}

/**
 * Animated circular progress ring with configurable size presets.
 *
 * @example
 * <LeveeProgressRing percentage={75} size="lg" />
 */
export function LeveeProgressRing({
  percentage,
  size = "sm",
  className,
  style,
  showValue,
  trackClassName,
  ...props
}: LeveeProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percentage))
  const config = SIZE_MAP[size]
  const radius = (config.size - config.stroke) / 2
  const circumference = 2 * Math.PI * radius

  const progress = useMotionValue(0)
  const dashOffset = useTransform(
    progress,
    (value) => circumference - (value / 100) * circumference
  )

  useEffect(() => {
    const controls = animate(progress, clamped, {
      duration: 0.4,
      ease: "easeOut",
    })
    return () => {
      controls.stop()
    }
  }, [clamped, progress])

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress ${clamped}%`}
      data-slot="progress-ring"
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ ...style, height: config.size, width: config.size }}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="-rotate-90"
        height={config.size}
        viewBox={`0 0 ${config.size} ${config.size}`}
        width={config.size}
      >
        <circle
          className={trackClassName ?? "stroke-muted"}
          cx={config.size / 2}
          cy={config.size / 2}
          fill="none"
          r={radius}
          strokeWidth={config.stroke}
        />
        <motion.circle
          className="stroke-primary"
          cx={config.size / 2}
          cy={config.size / 2}
          fill="none"
          r={radius}
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
          strokeLinecap="round"
          strokeWidth={config.stroke}
        />
      </svg>
      {(showValue ?? size === "lg") && (
        <span
          aria-hidden="true"
          className={cn(
            "text-foreground absolute font-medium tabular-nums",
            config.textSize
          )}
        >
          {clamped}%
        </span>
      )}
    </div>
  )
}
