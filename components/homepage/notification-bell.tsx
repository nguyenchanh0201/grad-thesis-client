"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import {
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Notification } from "@/schemas/notification";
import { cn } from "@/lib/utils";

const LATEST_NOTIFICATIONS_LIMIT = 5;

function formatUnreadBadge(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

function formatNotificationDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function getNotificationMessage(item: Notification): string {
  const body = item.body?.trim();
  if (body) return body;
  const legacyMessage = item.message?.trim();
  return legacyMessage ?? "";
}

function getNotificationAction(item: Notification): string | null {
  const reservationId = item.payload?.reservationId;
  if (
    item.type === "ORDER_CONFIRMED" &&
    (typeof reservationId === "string" || typeof reservationId === "number")
  ) {
    return `/ticket-and-voucher?r=${encodeURIComponent(String(reservationId))}`;
  }

  return item.action ?? null;
}

export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const notificationsQuery = useNotifications(
    userId,
    1,
    LATEST_NOTIFICATIONS_LIMIT,
  );
  const markRead = useMarkNotificationRead();

  const notifications = notificationsQuery.data?.data.items ?? [];
  const unreadCount = notificationsQuery.data?.data.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;

  const latestItems = notifications.slice(0, LATEST_NOTIFICATIONS_LIMIT);

  const handleItemClick = (item: Notification) => {
    const action = getNotificationAction(item);

    if (!item.isRead && !markRead.isPending) {
      markRead.mutate({ id: item.id, userId });
    }
    if (action) {
      setOpen(false);
      router.push(action);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="relative rounded-full p-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
          aria-label="Open notifications"
          aria-expanded={open}
        >
          <Bell className="size-5" />
          {hasUnread && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {formatUnreadBadge(unreadCount)}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(92vw,24rem)] gap-0 p-0"
      >
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
        </div>

        <Separator />

        <div className="max-h-[70vh] overflow-y-auto py-1">
          {notificationsQuery.isLoading && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Loading notifications...
            </p>
          )}

          {!notificationsQuery.isLoading && latestItems.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          )}

          {latestItems.map((item) => {
            const message = getNotificationMessage(item);
            const showMessage = !item.isRead && message.length > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={cn(
                  "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  !item.isRead && "bg-muted/60",
                )}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  {showMessage && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {message}
                    </p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">
                    {formatNotificationDate(item.createdAt)}
                  </p>
                </div>
                {!item.isRead && (
                  <span className="size-2 shrink-0 rounded-full bg-destructive" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
