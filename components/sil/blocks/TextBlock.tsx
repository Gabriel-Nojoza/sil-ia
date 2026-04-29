import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TextBlock as TextBlockType } from "../types";

export function TextBlock({ block }: { block: TextBlockType }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none leading-7 text-foreground/90">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
    </div>
  );
}
