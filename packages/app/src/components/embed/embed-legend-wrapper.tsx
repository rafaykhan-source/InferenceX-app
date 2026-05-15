'use client';

import { ChevronDown } from 'lucide-react';

/**
 * Embed-only legend shell.
 *
 * Below `lg`: a native `<details>` collapsible with a styled summary button.
 * Closed by default, animates open with no JS state required. Content scrolls
 * up to max-h-64.
 *
 * Above `lg`: the `<details>` is hidden and the legend renders in the sidebar
 * as a plain flex column, sized by the parent `lg:h-[575px]` container.
 */
export function EmbedLegendWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="embed-legend-panel" className="lg:h-full">
      {/* Narrow (<lg): native collapsible */}
      <details className="lg:hidden group">
        <summary className="flex w-full cursor-pointer select-none list-none items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent [&::-webkit-details-marker]:hidden">
          <span>Legend</span>
          <ChevronDown
            size={14}
            className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <div className="mt-1 h-96 flex flex-col rounded-md border border-border overflow-hidden">
          {children}
        </div>
      </details>

      {/* Wide (lg+): always-visible sidebar */}
      <div className="hidden lg:flex lg:h-full lg:flex-col lg:overflow-hidden">{children}</div>
    </div>
  );
}
