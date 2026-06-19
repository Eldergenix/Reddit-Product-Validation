"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type HTMLAttributes,
} from "react"
import type { Element } from "hast"
import { CheckIcon, CopyIcon } from "lucide-react"
import { codeToHtml, type BundledLanguage, type ShikiTransformer } from "shiki"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string
  language: BundledLanguage
  showLineNumbers?: boolean
}

type CodeBlockContextType = {
  code: string
}

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
})

const lineNumberTransformer: ShikiTransformer = {
  name: "line-numbers",
  line(node: Element, line: number) {
    node.children.unshift({
      type: "element",
      tagName: "span",
      properties: {
        className: [
          "inline-block",
          "min-w-10",
          "mr-4",
          "text-right",
          "select-none",
          "text-muted-foreground",
        ],
      },
      children: [{ type: "text", value: String(line) }],
    })
  },
}

export async function highlightCode(
  code: string,
  language: BundledLanguage,
  showLineNumbers = false
) {
  // Ensure code is a string and not undefined/null
  const codeString = code ?? ""

  const transformers: ShikiTransformer[] = showLineNumbers
    ? [lineNumberTransformer]
    : []

  return await Promise.all([
    codeToHtml(codeString, {
      lang: language,
      theme: "one-light",
      transformers,
    }),
    codeToHtml(codeString, {
      lang: language,
      theme: "one-dark-pro",
      transformers,
    }),
  ])
}

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const [html, setHtml] = useState<string>("")
  const [darkHtml, setDarkHtml] = useState<string>("")
  const mounted = useRef(false)

  useEffect(() => {
    // Ensure code and language are valid before highlighting
    if (!code || !language) {
      return
    }

    highlightCode(code, language, showLineNumbers)
      .then(([light, dark]) => {
        if (!mounted.current) {
          setHtml(light)
          setDarkHtml(dark)
          mounted.current = true
        }
      })
      .catch(() => {
        // Handle errors gracefully - component will show empty state if highlighting fails
      })

    return () => {
      mounted.current = false
    }
  }, [code, language, showLineNumbers])

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          "group relative max-w-full min-w-0 overflow-hidden rounded-md border bg-background text-foreground",
          className
        )}
        {...props}
      >
        <div className="relative min-w-0">
          <div
            className="max-w-full min-w-0 dark:hidden [&>pre]:m-0 [&>pre]:max-w-full [&>pre]:min-w-0 [&>pre]:!whitespace-pre-wrap [&>pre]:break-all [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-sm [&>pre]:text-foreground! [&_code]:break-all [&_code]:font-mono [&_code]:text-sm"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div
            className="hidden max-w-full min-w-0 dark:block [&>pre]:m-0 [&>pre]:max-w-full [&>pre]:min-w-0 [&>pre]:!whitespace-pre-wrap [&>pre]:break-all [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-sm [&>pre]:text-foreground! [&_code]:break-all [&_code]:font-mono [&_code]:text-sm"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: darkHtml }}
          />
          {children && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </CodeBlockContext.Provider>
  )
}

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void
  onError?: (error: Error) => void
  timeout?: number
}

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const { code } = useContext(CodeBlockContext)

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"))
      return
    }

    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      onCopy?.()
      setTimeout(() => setIsCopied(false), timeout)
    } catch (error) {
      onError?.(error as Error)
    }
  }

  const Icon = isCopied ? CheckIcon : CopyIcon

  return (
    <Button
      className={cn("shrink-0", className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  )
}
