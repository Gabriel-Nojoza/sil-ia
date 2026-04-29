"use client";

import type { SilResponse } from "./types";
import { TextBlock } from "./blocks/TextBlock";
import { ChartBlock } from "./blocks/ChartBlock";
import { TableBlock } from "./blocks/TableBlock";
import { InsightBlock } from "./blocks/InsightBlock";
import { ActionBlock } from "./blocks/ActionBlock";

export function SilBubble({ response }: { response: SilResponse }) {
  return (
    <div className="flex flex-col gap-3">
      {response.blocks.map((block, i) => {
        switch (block.type) {
          case "text":    return <TextBlock    key={i} block={block} />;
          case "chart":   return <ChartBlock   key={i} block={block} />;
          case "table":   return <TableBlock   key={i} block={block} />;
          case "insight": return <InsightBlock key={i} block={block} />;
          case "action":  return <ActionBlock  key={i} block={block} />;
          default:        return null;
        }
      })}
    </div>
  );
}
