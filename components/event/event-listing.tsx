import { cn } from "@/lib/utils";
import { EventCard } from "./event-card";
import type { EventItem } from "./event-card";
import { EventCarousel } from "./event-carousel";
import { ViewMoreBtn } from "../shared/view-more-btn";
import {
  LabelAlign,
  LabelBlock,
  LabelBorder,
  LabelPosition,
} from "./label-block";
export interface EventListingProps {
  variant: "grid" | "horizontal" | "vertical";
  items: EventItem[];
  maxItems?: number;
  label?: string;
  labelPosition?: LabelPosition;
  labelBorder?: LabelBorder;
  labelAlign?: LabelAlign;
  onViewMore?: () => void;
  viewMoreLabel?: string;
  loadingMore?: boolean;
  className?: string;
  cardClassName?: string;
}

const DEFAULT_MAX: Record<EventListingProps["variant"], number> = {
  grid: 8,
  horizontal: 5,
  vertical: 6,
};

export function EventListing({
  variant,
  items,
  maxItems,
  label,
  labelPosition = "top",
  labelBorder = "bottom",
  labelAlign = "left",
  onViewMore,
  viewMoreLabel = "View more",
  loadingMore,
  className,
  cardClassName,
}: EventListingProps) {
  const resolvedMax = maxItems ?? DEFAULT_MAX[variant];

  // Horizontal
  if (variant === "horizontal") {
    return (
      <EventCarousel
        items={items}
        maxItems={resolvedMax}
        label={label}
        labelPosition={labelPosition}
        labelBorder={labelBorder}
        labelAlign={labelAlign}
        onViewMore={onViewMore}
        viewMoreLabel={viewMoreLabel}
        loadingMore={loadingMore}
        className={className}
        cardClassName={cardClassName}
      />
    );
  }

  const displayedItems = items.slice(0, resolvedMax);
  const isLR = labelPosition === "left" || labelPosition === "right";

  // Grid & Vertical
  const itemList = (
    <>
      <div
        className={cn(
          variant === "grid"
            ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-5",
        )}
      >
        {displayedItems.map((item) => (
          <EventCard
            key={item.id}
            item={item}
            variant={variant}
            className={cardClassName}
          />
        ))}
      </div>
      {onViewMore && (
        <div className="mt-3 flex justify-center">
          <ViewMoreBtn
            label={viewMoreLabel}
            loading={loadingMore}
            onClick={onViewMore}
          />
        </div>
      )}
    </>
  );

  if (!label) {
    return <section className={cn("w-full", className)}>{itemList}</section>;
  }

  if (isLR) {
    return (
      <section
        className={cn(
          "flex w-full gap-6",
          labelPosition === "right" && "flex-row-reverse",
          className,
        )}
      >
        <div className="shrink-0 self-start pt-2">
          <LabelBlock
            label={label}
            labelBorder={labelBorder}
            labelAlign={labelAlign}
            vertical
          />
        </div>
        <div className="min-w-0 flex-1">{itemList}</div>
      </section>
    );
  }

  return (
    <section className={cn("flex w-full flex-col gap-4", className)}>
      {labelPosition === "top" && label && (
        <LabelBlock
          label={label}
          labelBorder={labelBorder}
          labelAlign={labelAlign}
        />
      )}
      {itemList}
      {labelPosition === "bottom" && label && (
        <LabelBlock
          label={label}
          labelBorder={labelBorder}
          labelAlign={labelAlign}
        />
      )}
    </section>
  );
}

export type { EventItem };
