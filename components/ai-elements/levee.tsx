"use client"

import type { ComponentProps, ReactNode } from "react"
import {
  createContext,
  Fragment,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useControllableState } from "@radix-ui/react-use-controllable-state"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleDashedIcon,
  CircleIcon,
  LoaderIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { Streamdown } from "streamdown"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"

import { LeveeProgressRing } from "./levee-progress"

export type LeveeStageStatus =
  | "gated"
  | "active"
  | "locked"
  | "revisiting"
  | "stale"
  | "error"

export type LeveeStagePhase =
  | "seeding"
  | "submitting"
  | "conversation"
  | "locked"

export type LeveeInputType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "number"

export type LeveeInputField = {
  id: string
  label: string
  type: LeveeInputType
  placeholder?: string
  description?: string
  required?: boolean
  options?: string[]
}

export type LeveeLockItem = {
  id: string
  label: string
  satisfied: boolean
}

export type LeveeToolSet = {
  askMultipleChoice?: boolean
  askRating?: boolean
  askTextInput?: boolean
}

export type LeveeStageConfig = {
  id: string
  title: string
  description: string
  objective: string
  mode?: "form" | "chat" | "qa" | "synthesis"
  lockItems: LeveeLockItem[]
  initialInputs: LeveeInputField[]
  agentInstructions: string
  tools: LeveeToolSet
  maxSteps?: number
}

export type LeveeStageState = {
  id: string
  status: LeveeStageStatus
  phase: LeveeStagePhase
  formData: Record<string, unknown>
  collectedData: Record<string, unknown>
  lockItems: LeveeLockItem[]
  lockPercentage: number
  summary?: string
}

export type LeveeInterstitialData = {
  summary: string
  completedIndex: number
  nextStageTitle: string
  nextStageDescription?: string
}

type LeveeContextValue = {
  config: LeveeStageConfig[]
  stages: LeveeStageState[]
  activeStageIndex: number
  allowRevisit: boolean
  contextPanelOpen: boolean
  showInterstitial: boolean
  interstitialData: LeveeInterstitialData | null
  setActiveStageIndex: (index: number) => void
  setContextPanelOpen: (open: boolean) => void
  updateFormData: (
    stageIndex: number,
    patch: Record<string, unknown>,
    merge?: boolean
  ) => void
  updateCollectedData: (
    stageIndex: number,
    patch: Record<string, unknown>,
    merge?: boolean
  ) => void
  updateLockItems: (
    stageIndex: number,
    lockItems: LeveeLockItem[],
    summary?: string
  ) => void
  setStagePhase: (stageIndex: number, phase: LeveeStagePhase) => void
  advanceStage: (
    summary: string,
    collectedData?: Record<string, unknown>
  ) => void
  dismissInterstitial: () => void
  revisitStage: (index: number) => void
}

const LeveeContext = createContext<LeveeContextValue | null>(null)

function useLeveeContext() {
  const context = useContext(LeveeContext)
  if (!context) {
    throw new Error("Levee components must be used within LeveeProvider")
  }
  return context
}

function getInitialStageState(config: LeveeStageConfig[]): LeveeStageState[] {
  return config.map((stage, index) => ({
    id: stage.id,
    status: index === 0 ? "active" : "gated",
    phase: "seeding",
    formData: {},
    collectedData: {},
    lockItems: stage.lockItems.map((item) => ({ ...item, satisfied: false })),
    lockPercentage: 0,
  }))
}

type LeveeProviderProps = {
  config: LeveeStageConfig[]
  allowRevisit?: boolean
  activeStageIndex?: number
  defaultActiveStageIndex?: number
  onActiveStageIndexChange?: (index: number) => void
  onComplete?: (stages: LeveeStageState[]) => void
  children: ReactNode
}

export function LeveeProvider({
  config,
  allowRevisit = false,
  activeStageIndex: activeStageIndexProp,
  defaultActiveStageIndex = 0,
  onActiveStageIndexChange,
  onComplete,
  children,
}: LeveeProviderProps) {
  const [stages, setStages] = useState<LeveeStageState[]>(() =>
    getInitialStageState(config)
  )
  const [contextPanelOpen, setContextPanelOpen] = useState(true)
  const [showInterstitial, setShowInterstitial] = useState(false)
  const [interstitialData, setInterstitialData] =
    useState<LeveeInterstitialData | null>(null)
  const interstitialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const pendingNextIndexRef = useRef<number | null>(null)

  const [activeStageIndex, setActiveStageIndex] = useControllableState({
    prop: activeStageIndexProp,
    defaultProp: defaultActiveStageIndex,
    onChange: onActiveStageIndexChange,
  })

  const prevConfigRef = useRef(config)
  useEffect(() => {
    if (prevConfigRef.current === config) return
    prevConfigRef.current = config
    setStages(getInitialStageState(config))
    setActiveStageIndex(0)
    setShowInterstitial(false)
    setInterstitialData(null)
  }, [config, setActiveStageIndex])

  const markCompleteIfFinished = useCallback(
    (nextStages: LeveeStageState[]) => {
      const allLocked = nextStages.every((stage) => stage.status === "locked")
      if (allLocked) {
        onComplete?.(nextStages)
      }
    },
    [onComplete]
  )

  const updateFormData = useCallback(
    (stageIndex: number, patch: Record<string, unknown>, merge = true) => {
      setStages((prev) =>
        prev.map((stage, index) => {
          if (index !== stageIndex) return stage
          return {
            ...stage,
            formData: merge ? { ...stage.formData, ...patch } : patch,
          }
        })
      )
    },
    []
  )

  const updateCollectedData = useCallback(
    (stageIndex: number, patch: Record<string, unknown>, merge = true) => {
      setStages((prev) =>
        prev.map((stage, index) => {
          if (index !== stageIndex) return stage
          return {
            ...stage,
            collectedData: merge ? { ...stage.collectedData, ...patch } : patch,
          }
        })
      )
    },
    []
  )

  const setStagePhase = useCallback(
    (stageIndex: number, phase: LeveeStagePhase) => {
      setStages((prev) =>
        prev.map((stage, index) =>
          index === stageIndex
            ? {
                ...stage,
                phase,
              }
            : stage
        )
      )
    },
    []
  )

  const updateLockItems = useCallback(
    (stageIndex: number, lockItems: LeveeLockItem[], summary?: string) => {
      setStages((prev) =>
        prev.map((stage, index) => {
          if (index !== stageIndex) return stage
          const satisfiedCount = lockItems.filter(
            (item) => item.satisfied
          ).length
          const lockPercentage =
            lockItems.length === 0
              ? 0
              : Math.round((satisfiedCount / lockItems.length) * 100)
          return {
            ...stage,
            lockItems,
            lockPercentage,
            summary: summary ?? stage.summary,
          }
        })
      )
    },
    []
  )

  const advanceStage = useCallback(
    (summary: string, collectedData?: Record<string, unknown>) => {
      setStages((prev) => {
        const current = prev[activeStageIndex]
        if (!current) return prev

        const nextIndex = activeStageIndex + 1
        const nextStage = config.at(nextIndex)

        const nextStages = prev.map((stage, index) => {
          if (index === activeStageIndex) {
            return {
              ...stage,
              status: "locked" as const,
              phase: "locked" as const,
              summary,
              lockItems: stage.lockItems.map((item) => ({
                ...item,
                satisfied: true,
              })),
              lockPercentage: 100,
              collectedData: collectedData
                ? { ...stage.collectedData, ...collectedData }
                : stage.collectedData,
            }
          }
          if (index === nextIndex) {
            return {
              ...stage,
              status: "active" as const,
              phase: "seeding" as const,
            }
          }
          return stage
        })

        if (nextStage) {
          setInterstitialData({
            summary,
            completedIndex: activeStageIndex,
            nextStageTitle: nextStage.title,
            nextStageDescription: nextStage.description,
          })
          setShowInterstitial(true)
          pendingNextIndexRef.current = nextIndex
          if (interstitialTimerRef.current)
            clearTimeout(interstitialTimerRef.current)
          interstitialTimerRef.current = setTimeout(() => {
            setShowInterstitial(false)
            setActiveStageIndex(nextIndex)
            pendingNextIndexRef.current = null
            interstitialTimerRef.current = null
          }, 4000)
        } else {
          markCompleteIfFinished(nextStages)
        }

        return nextStages
      })
    },
    [activeStageIndex, config, markCompleteIfFinished, setActiveStageIndex]
  )

  const dismissInterstitial = useCallback(() => {
    if (interstitialTimerRef.current) {
      clearTimeout(interstitialTimerRef.current)
      interstitialTimerRef.current = null
    }
    setShowInterstitial(false)
    if (pendingNextIndexRef.current !== null) {
      setActiveStageIndex(pendingNextIndexRef.current)
      pendingNextIndexRef.current = null
    }
  }, [setActiveStageIndex])

  const revisitStage = useCallback(
    (index: number) => {
      if (!allowRevisit) return
      setStages((prev) =>
        prev.map((stage, stageIndex) => {
          if (stageIndex === index) {
            return {
              ...stage,
              status: "revisiting",
              phase: "conversation",
            }
          }
          if (stageIndex > index && stage.status === "locked") {
            return {
              ...stage,
              status: "stale",
            }
          }
          return stage
        })
      )
      setActiveStageIndex(index)
    },
    [allowRevisit, setActiveStageIndex]
  )

  const value = useMemo(
    () => ({
      config,
      stages,
      activeStageIndex,
      allowRevisit,
      contextPanelOpen,
      showInterstitial,
      interstitialData,
      setActiveStageIndex,
      setContextPanelOpen,
      updateFormData,
      updateCollectedData,
      updateLockItems,
      setStagePhase,
      advanceStage,
      dismissInterstitial,
      revisitStage,
    }),
    [
      config,
      stages,
      activeStageIndex,
      allowRevisit,
      contextPanelOpen,
      showInterstitial,
      interstitialData,
      setActiveStageIndex,
      updateFormData,
      updateCollectedData,
      updateLockItems,
      setStagePhase,
      advanceStage,
      dismissInterstitial,
      revisitStage,
    ]
  )

  return <LeveeContext.Provider value={value}>{children}</LeveeContext.Provider>
}

export type LeveeProps = ComponentProps<"div"> & {
  config: LeveeStageConfig[]
  allowRevisit?: boolean
  activeStageIndex?: number
  defaultActiveStageIndex?: number
  onActiveStageIndexChange?: (index: number) => void
  onComplete?: (stages: LeveeStageState[]) => void
}

/**
 * Root layout for a multi-stage guided workflow. Wraps children in a
 * `LeveeProvider` that supplies stage state to all sub-components.
 *
 * @example
 * <Levee config={stages} allowRevisit>
 *   <LeveeRail />
 *   <LeveeStageView>{content}</LeveeStageView>
 * </Levee>
 */
export function Levee({
  config,
  allowRevisit,
  activeStageIndex,
  defaultActiveStageIndex,
  onActiveStageIndexChange,
  onComplete,
  className,
  children,
  ...props
}: LeveeProps) {
  return (
    <LeveeProvider
      activeStageIndex={activeStageIndex}
      allowRevisit={allowRevisit}
      config={config}
      defaultActiveStageIndex={defaultActiveStageIndex}
      onActiveStageIndexChange={onActiveStageIndexChange}
      onComplete={onComplete}
    >
      <div
        data-slot="levee"
        className={cn("flex h-screen w-full overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    </LeveeProvider>
  )
}

/**
 * Access the Levee workflow context (stages, config, mutation helpers).
 * Must be called within a `Levee` or `LeveeProvider` tree.
 *
 * @example
 * const { stages, activeStageIndex, advanceStage } = useLevee();
 */
export const useLevee = useLeveeContext

export type LeveeRailProps = ComponentProps<"aside"> & {
  compact?: boolean
}

/**
 * Sidebar navigation rail displaying all stages with status indicators.
 * Accepts children to render additional content (e.g. lock checklist)
 * below the stage items when not in compact mode.
 *
 * @example
 * <LeveeRail>
 *   <LeveeStageLockChecklist items={items} percentage={80} />
 * </LeveeRail>
 */
export const LeveeRail = memo(
  ({ compact = false, className, children, ...props }: LeveeRailProps) => {
    const { config, stages, activeStageIndex } = useLeveeContext()

    return (
      <aside
        data-slot="levee-rail"
        data-state={compact ? "compact" : "expanded"}
        className={cn(
          "bg-muted/20 border-r transition-[width] duration-200",
          compact ? "w-16" : "w-72",
          className
        )}
        {...props}
      >
        <ScrollArea className="h-full">
          <div
            className={cn(
              "flex flex-col py-5",
              compact ? "items-center px-2" : "gap-1 px-4"
            )}
          >
            {config.map((stage, index) => (
              <Fragment key={stage.id}>
                <LeveeRailItem
                  compact={compact}
                  index={index}
                  isActive={index === activeStageIndex}
                  stage={stage}
                  stageState={stages[index]}
                />
                {compact && index < config.length - 1 && (
                  <div className="flex justify-center" aria-hidden="true">
                    <div
                      className={cn(
                        "h-4 w-px",
                        stages[index]?.status === "locked"
                          ? "bg-primary/30"
                          : "bg-border/60"
                      )}
                    />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
          {children && !compact && (
            <div className="space-y-6 px-4 pt-4 pb-6">
              <Separator className="bg-border/80" />
              {children}
            </div>
          )}
        </ScrollArea>
      </aside>
    )
  }
)

LeveeRail.displayName = "LeveeRail"

export type LeveeRailItemProps = ComponentProps<"button"> & {
  stage: LeveeStageConfig
  stageState?: LeveeStageState
  index: number
  isActive: boolean
  compact: boolean
}

/**
 * Individual stage button inside `LeveeRail`. Shows status icon,
 * lock progress ring, and optional label text.
 */
export function LeveeRailItem({
  stage,
  stageState,
  index,
  isActive,
  compact,
  className,
  ...props
}: LeveeRailItemProps) {
  const { allowRevisit, revisitStage } = useLeveeContext()

  if (!stageState) return null

  const canNavigate =
    allowRevisit &&
    (stageState.status === "locked" ||
      stageState.status === "revisiting" ||
      stageState.status === "stale")

  const isComplete = stageState.status === "locked"
  const isGated = stageState.status === "gated"

  return (
    <button
      aria-current={isActive ? "step" : undefined}
      data-slot="levee-rail-item"
      data-state={stageState.status}
      title={
        compact ? `${stage.title} — ${stageState.lockPercentage}%` : undefined
      }
      className={cn(
        "group relative flex w-full items-center text-left transition-all duration-150",
        compact ? "justify-center rounded-xl p-2" : "gap-3 rounded-lg px-3",
        isActive &&
          compact &&
          "bg-primary/6 text-primary shadow-primary/5 ring-primary/15 shadow-sm ring-1",
        isActive &&
          !compact &&
          "bg-primary/6 text-primary ring-primary/10 py-3 ring-1",
        !isActive && compact && "py-2",
        !isActive && !compact && "py-2.5",
        !isActive && "text-muted-foreground",
        !isActive && canNavigate && "hover:bg-muted/60 hover:text-foreground",
        !canNavigate && !isActive && "cursor-default",
        isGated && "opacity-50",
        className
      )}
      disabled={!canNavigate && !isActive}
      onClick={() => {
        if (canNavigate) revisitStage(index)
      }}
      type="button"
      {...props}
    >
      <div className="relative flex size-8 shrink-0 items-center justify-center">
        <LeveeProgressRing
          className="absolute inset-0"
          percentage={stageState.lockPercentage}
          size="sm"
          trackClassName={isActive ? "stroke-card" : undefined}
        />
        {isComplete ? (
          <CheckCircle2Icon className="text-primary relative size-4" />
        ) : isGated ? (
          <span className="relative text-[11px] font-medium tabular-nums select-none">
            {index + 1}
          </span>
        ) : stageState.status === "error" ? (
          <CircleDashedIcon className="relative size-3.5" />
        ) : (
          <CircleIcon className="relative size-3.5" />
        )}
      </div>
      {!compact && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm leading-tight font-medium">
            {stage.title}
          </div>
          <div className="mt-0.5 truncate text-xs opacity-60">
            {stageState.lockPercentage}% locked
          </div>
        </div>
      )}
    </button>
  )
}

export type LeveeStageViewProps = ComponentProps<"section">

/**
 * Main content area for the active stage. Renders children plus the
 * interstitial overlay that appears on stage completion.
 *
 * @example
 * <LeveeStageView>
 *   <LeveeStageHeader />
 *   <LeveeStageSplit chat={chatNode} context={contextNode} />
 * </LeveeStageView>
 */
export function LeveeStageView({
  className,
  children,
  ...props
}: LeveeStageViewProps) {
  return (
    <section
      data-slot="levee-stage-view"
      className={cn("relative min-w-0 flex-1", className)}
      {...props}
    >
      {children}
      <LeveeInterstitial />
    </section>
  )
}

export type LeveeStageHeaderProps = ComponentProps<"header"> & {
  title?: string
  description?: string
}

/**
 * Header bar for the active stage showing title, description, and a
 * toggle button for the sidebar.
 *
 * @example
 * <LeveeStageHeader title="Discovery" description="Gather requirements" />
 */
export function LeveeStageHeader({
  title,
  description,
  className,
  ...props
}: LeveeStageHeaderProps) {
  const { config, activeStageIndex, contextPanelOpen, setContextPanelOpen } =
    useLeveeContext()
  const active = config[activeStageIndex]

  return (
    <header
      data-slot="levee-stage-header"
      className={cn(
        "flex items-center justify-between border-b px-4 py-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Button
          aria-label={contextPanelOpen ? "Collapse sidebar" : "Expand sidebar"}
          onClick={() => setContextPanelOpen(!contextPanelOpen)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          {contextPanelOpen ? (
            <ChevronLeftIcon className="size-4" />
          ) : (
            <ChevronRightIcon className="size-4" />
          )}
        </Button>
        <div>
          <h2 className="text-base font-semibold">
            {title ?? active?.title ?? "Stage"}
          </h2>
          <p className="text-muted-foreground text-xs">
            {description ?? active?.description}
          </p>
        </div>
      </div>
    </header>
  )
}

export type LeveeStageSplitProps = ComponentProps<"div"> & {
  chat: ReactNode
  context: ReactNode
}

/**
 * Resizable split layout that renders `chat` and `context` side by side.
 * Collapses to chat-only when the context panel is closed.
 *
 * @example
 * <LeveeStageSplit chat={<ChatPanel />} context={<ContextPanel />} />
 */
export function LeveeStageSplit({
  chat,
  context,
  className,
  ...props
}: LeveeStageSplitProps) {
  const { contextPanelOpen } = useLeveeContext()

  if (!contextPanelOpen) {
    return (
      <div
        data-slot="levee-stage-split"
        data-state="closed"
        className={cn("h-[calc(100%-57px)]", className)}
        {...props}
      >
        {chat}
      </div>
    )
  }

  return (
    <div
      data-slot="levee-stage-split"
      data-state="open"
      className={cn("h-[calc(100%-57px)]", className)}
      {...props}
    >
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={70} minSize={50}>
          {chat}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          {context}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export type LeveeStageChatProps = ComponentProps<"div">

/**
 * Flex column container for chat content within a stage.
 *
 * @example
 * <LeveeStageChat>
 *   <LeveeConversation>{messages}</LeveeConversation>
 *   <PromptInput />
 * </LeveeStageChat>
 */
export function LeveeStageChat({
  className,
  children,
  ...props
}: LeveeStageChatProps) {
  return (
    <div
      data-slot="levee-stage-chat"
      className={cn("flex h-full flex-col", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export type LeveeConversationProps = ComponentProps<typeof Conversation>

/**
 * Scrollable conversation container with auto-scroll button.
 *
 * @example
 * <LeveeConversation>{messages}</LeveeConversation>
 */
export function LeveeConversation({
  className,
  children,
  ...props
}: LeveeConversationProps) {
  return (
    <Conversation className={cn("h-full px-4", className)} {...props}>
      <ConversationContent>{children}</ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}

export type LeveeStageContextPanelProps = ComponentProps<"aside">

/**
 * Scrollable side panel for displaying stage context (lock checklist,
 * collected data, forms, etc.).
 *
 * @example
 * <LeveeStageContextPanel>
 *   <LeveeStageLockChecklist items={items} percentage={80} />
 * </LeveeStageContextPanel>
 */
export function LeveeStageContextPanel({
  className,
  children,
  ...props
}: LeveeStageContextPanelProps) {
  return (
    <aside
      data-slot="levee-context-panel"
      className={cn("bg-muted/15 h-full", className)}
      {...props}
    >
      <ScrollArea className="h-full px-4 py-4">{children}</ScrollArea>
    </aside>
  )
}

export type LeveeStageFormProps = ComponentProps<"div"> & {
  fields: LeveeInputField[]
  values: Record<string, unknown>
  readOnly?: boolean
  onFieldChange: (fieldId: string, value: unknown) => void
}

/**
 * Editable or read-only form displaying stage input fields in the context panel.
 *
 * @example
 * <LeveeStageForm
 *   fields={stage.initialInputs}
 *   values={formData}
 *   onFieldChange={handleChange}
 * />
 */
export function LeveeStageForm({
  fields,
  values,
  readOnly = false,
  onFieldChange,
  className,
  ...props
}: LeveeStageFormProps) {
  return (
    <div
      data-slot="levee-stage-form"
      className={cn("space-y-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Stage Context</h3>
        <Badge variant="secondary">{readOnly ? "Read-only" : "Editable"}</Badge>
      </div>
      {fields.map((field) => (
        <div className="space-y-1.5" key={field.id}>
          <label
            className="text-xs font-medium"
            htmlFor={`levee-field-${field.id}`}
          >
            {field.label}
          </label>
          {field.type === "textarea" ? (
            <Textarea
              disabled={readOnly}
              id={`levee-field-${field.id}`}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              value={(values[field.id] as string | undefined) ?? ""}
            />
          ) : null}
          {field.type === "select" ? (
            <Select
              disabled={readOnly}
              onValueChange={(value) => onFieldChange(field.id, value)}
              value={(values[field.id] as string | undefined) ?? ""}
            >
              <SelectTrigger id={`levee-field-${field.id}`}>
                <SelectValue
                  placeholder={field.placeholder ?? "Select an option"}
                />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {field.type === "multiselect" ? (
            <div className="space-y-2 rounded-md border p-2">
              {(field.options ?? []).map((option) => {
                const current = Array.isArray(values[field.id])
                  ? (values[field.id] as string[])
                  : []
                const checked = current.includes(option)
                return (
                  <label
                    className="flex items-center gap-2 text-sm"
                    key={option}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={readOnly}
                      onCheckedChange={(next) => {
                        if (readOnly) return
                        const nextValue = next
                          ? [...current, option]
                          : current.filter((item) => item !== option)
                        onFieldChange(field.id, nextValue)
                      }}
                    />
                    {option}
                  </label>
                )
              })}
            </div>
          ) : null}
          {(field.type === "text" || field.type === "number") && (
            <Input
              disabled={readOnly}
              id={`levee-field-${field.id}`}
              onChange={(e) =>
                onFieldChange(
                  field.id,
                  field.type === "number"
                    ? Number(e.target.value)
                    : e.target.value
                )
              }
              placeholder={field.placeholder}
              type={field.type === "number" ? "number" : "text"}
              value={(values[field.id] as string | number | undefined) ?? ""}
            />
          )}
          {field.description && (
            <p className="text-muted-foreground text-xs">{field.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export type LeveeStageLockChecklistProps = ComponentProps<"div"> & {
  items: LeveeLockItem[]
  percentage: number
}

/**
 * Checklist displaying lock item progress with an animated progress ring.
 *
 * @example
 * <LeveeStageLockChecklist items={lockItems} percentage={75} />
 */
export function LeveeStageLockChecklist({
  items,
  percentage,
  className,
  ...props
}: LeveeStageLockChecklistProps) {
  const satisfiedCount = items.filter((item) => item.satisfied).length

  return (
    <div
      data-slot="levee-lock-checklist"
      className={cn("space-y-4", className)}
      {...props}
    >
      <div className="flex items-center gap-4">
        <LeveeProgressRing percentage={percentage} size="md" />
        <div className="min-w-0">
          <p className="text-sm leading-tight font-medium">Lock Progress</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {satisfiedCount} of {items.length} items satisfied
          </p>
        </div>
      </div>
      <div className="space-y-2" role="list">
        {items.map((item) => (
          <motion.div
            animate={{ opacity: item.satisfied ? 1 : 0.85, y: 0 }}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-2 py-1.5",
              item.satisfied
                ? "border-emerald-500/30 bg-emerald-100/5"
                : "bg-muted/30 border-transparent"
            )}
            initial={{ opacity: 0, y: 6 }}
            key={item.id}
            role="listitem"
          >
            {item.satisfied ? (
              <CheckCircle2Icon
                className="size-4 shrink-0 text-emerald-600"
                aria-hidden
              />
            ) : (
              <CircleIcon
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden
              />
            )}
            <span className="text-[10px] leading-snug">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export type LeveeStageCollectedDataProps = ComponentProps<"div"> & {
  data: Record<string, unknown>
}

/**
 * Key-value display of data collected during a stage's conversation.
 *
 * @example
 * <LeveeStageCollectedData data={{ industry: "SaaS", audience: "Developers" }} />
 */
export function LeveeStageCollectedData({
  data,
  className,
  ...props
}: LeveeStageCollectedDataProps) {
  const entries = Object.entries(data)
  return (
    <div
      data-slot="levee-collected-data"
      className={cn("space-y-3", className)}
      {...props}
    >
      {entries.length > 0 ? (
        <>
          <h4 className="text-sm leading-tight font-medium">Collected Data</h4>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-xs leading-relaxed">
              No data captured yet.
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map(([key, value]) => (
                <div
                  className="bg-muted/20 rounded-lg border px-3 py-2 text-sm"
                  key={key}
                >
                  <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {key}
                  </div>
                  <div className="mt-1 leading-snug break-words">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

export type LeveeStageFormViewProps = ComponentProps<"div"> & {
  fields: LeveeInputField[]
  values: Record<string, unknown>
  onFieldChange: (fieldId: string, value: unknown) => void
  onSubmit: () => void
  isSubmitting: boolean
  confirmationText?: string
}

/**
 * Full-page form view for stages that use `mode: "form"`. Includes
 * validation, submit button, and optional confirmation message.
 *
 * @example
 * <LeveeStageFormView
 *   fields={fields}
 *   values={values}
 *   onFieldChange={handleChange}
 *   onSubmit={handleSubmit}
 *   isSubmitting={false}
 * />
 */
export function LeveeStageFormView({
  fields,
  values,
  onFieldChange,
  onSubmit,
  isSubmitting,
  confirmationText,
  className,
  ...props
}: LeveeStageFormViewProps) {
  const requiredFields = fields.filter((f) => f.required)
  const allRequiredFilled = requiredFields.every((f) => {
    const val = values[f.id]
    if (typeof val === "string") return val.trim().length > 0
    if (Array.isArray(val)) return val.length > 0
    return val !== undefined && val !== null
  })

  return (
    <div
      data-slot="levee-form-view"
      className={cn("flex h-[calc(100%-57px)] flex-col", className)}
      {...props}
    >
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-xl px-6 py-8">
          {!confirmationText ? (
            <div className="space-y-5">
              {fields.map((field) => (
                <div className="space-y-1.5" key={field.id}>
                  <label
                    className="text-sm font-medium"
                    htmlFor={`levee-form-${field.id}`}
                  >
                    {field.label}
                    {field.required ? (
                      <span className="text-destructive ml-1">*</span>
                    ) : null}
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea
                      disabled={isSubmitting}
                      id={`levee-form-${field.id}`}
                      onChange={(e) => onFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      value={(values[field.id] as string | undefined) ?? ""}
                    />
                  ) : null}
                  {field.type === "select" ? (
                    <Select
                      disabled={isSubmitting}
                      onValueChange={(value) => onFieldChange(field.id, value)}
                      value={(values[field.id] as string | undefined) ?? ""}
                    >
                      <SelectTrigger id={`levee-form-${field.id}`}>
                        <SelectValue
                          placeholder={field.placeholder ?? "Select an option"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options ?? []).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  {field.type === "multiselect" ? (
                    <div className="space-y-2 rounded-md border p-2">
                      {(field.options ?? []).map((option, optionIndex) => {
                        const current = Array.isArray(values[field.id])
                          ? (values[field.id] as string[])
                          : []
                        const checked = current.includes(option)
                        const optionId = `levee-form-${field.id}-${String(optionIndex)}`
                        return (
                          <div
                            className="flex items-center gap-2 text-sm"
                            key={option}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={isSubmitting}
                              id={optionId}
                              onCheckedChange={(next) => {
                                if (isSubmitting) return
                                const nextValue = next
                                  ? [...current, option]
                                  : current.filter((item) => item !== option)
                                onFieldChange(field.id, nextValue)
                              }}
                            />
                            <label htmlFor={optionId}>{option}</label>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                  {(field.type === "text" || field.type === "number") && (
                    <Input
                      disabled={isSubmitting}
                      id={`levee-form-${field.id}`}
                      onChange={(e) =>
                        onFieldChange(
                          field.id,
                          field.type === "number"
                            ? Number(e.target.value)
                            : e.target.value
                        )
                      }
                      placeholder={field.placeholder}
                      type={field.type === "number" ? "number" : "text"}
                      value={
                        (values[field.id] as string | number | undefined) ?? ""
                      }
                    />
                  )}
                  {field.description && (
                    <p className="text-muted-foreground text-xs">
                      {field.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8">
            <Button
              className="w-full"
              disabled={!allRequiredFilled || isSubmitting}
              onClick={onSubmit}
              type="button"
            >
              {isSubmitting ? (
                <>
                  <LoaderIcon className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRightIcon className="size-4" />
                </>
              )}
            </Button>
          </div>

          {confirmationText ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/30 mt-6 rounded-lg border p-4"
              initial={{ opacity: 0, y: 8 }}
            >
              <Streamdown>{confirmationText}</Streamdown>
            </motion.div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}

export type LeveeInterstitialProps = Omit<
  ComponentProps<"div">,
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
  | "onDragOver"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragExit"
  | "onAnimationStart"
  | "onAnimationEnd"
>

const INTERSTITIAL_DURATION_MS = 4000

/**
 * Animated overlay shown between stage transitions to confirm
 * completion and preview the next stage.
 */
export function LeveeInterstitial({
  className,
  ...props
}: LeveeInterstitialProps) {
  const { config, showInterstitial, interstitialData, dismissInterstitial } =
    useLeveeContext()

  return (
    <AnimatePresence>
      {showInterstitial && interstitialData && (
        <motion.div
          role="status"
          aria-live="polite"
          data-slot="levee-interstitial"
          animate={{ opacity: 1 }}
          className={cn(
            "bg-background/80 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm",
            className
          )}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          {...props}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 12 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="bg-card rounded-2xl border shadow-xl">
              <div className="p-6">
                {/* Progress dots */}
                <div className="mb-5 flex items-center justify-center gap-1.5">
                  {config.map((stage, i) => (
                    <div
                      aria-hidden="true"
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i <= interstitialData.completedIndex
                          ? "bg-primary w-6"
                          : "bg-muted w-1.5"
                      )}
                      key={stage.id}
                    />
                  ))}
                </div>

                {/* Success icon + label */}
                <div className="mb-3 flex flex-col items-center text-center">
                  <motion.div
                    animate={{ scale: 1 }}
                    className="bg-primary/10 mb-3 flex size-10 items-center justify-center rounded-full"
                    initial={{ scale: 0.5 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: 0.15,
                    }}
                  >
                    <CheckCircle2Icon className="text-primary size-5" />
                  </motion.div>
                  <h3 className="text-base font-semibold">
                    {config.at(interstitialData.completedIndex)?.title ??
                      "Stage"}{" "}
                    complete
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {interstitialData.summary}
                  </p>
                </div>
              </div>

              {/* Next stage preview + continue */}
              <div className="bg-muted/30 border-t px-6 py-4">
                <div className="mb-3">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Up next
                  </p>
                  <p className="mt-0.5 text-sm font-medium">
                    {interstitialData.nextStageTitle}
                  </p>
                  {interstitialData.nextStageDescription && (
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {interstitialData.nextStageDescription}
                    </p>
                  )}
                </div>
                <Button
                  className="w-full gap-1.5"
                  onClick={dismissInterstitial}
                  type="button"
                >
                  Continue
                  <ArrowRightIcon className="size-3.5" />
                </Button>
              </div>

              {/* Auto-advance countdown bar */}
              <div className="flex justify-center pt-2">
                <div className="w-3/4 overflow-hidden rounded-full">
                  <motion.div
                    animate={{ scaleX: 0 }}
                    className="bg-primary/40 h-0.5 origin-left"
                    initial={{ scaleX: 1 }}
                    transition={{
                      duration: INTERSTITIAL_DURATION_MS / 1000,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
