"use client";

import { useEffect } from "react";
import { CheckCircle2, Mail, Ticket } from "lucide-react";
import { useBookingStore } from "@/lib/store/booking";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DeliveryMethod } from "@/schemas/booking";

const DELIVERY_OPTIONS: {
  id: DeliveryMethod;
  title: string;
  description: string;
}[] = [
  {
    id: "email_and_physical",
    title: "Receive online tickets via email and/or physical tickets at event",
    description:
      "E-tickets will be sent to your registered email address. Physical tickets (if applicable) may be collected at the venue on event day.",
  },
];

const DEFAULT_DELIVERY_METHOD = DELIVERY_OPTIONS[0].id;

export function TicketDeliveryMethod() {
  const { deliveryMethod, setDeliveryMethod } = useBookingStore();
  const selectedOption =
    DELIVERY_OPTIONS.find((option) => option.id === deliveryMethod) ??
    DELIVERY_OPTIONS[0];

  useEffect(() => {
    if (deliveryMethod !== DEFAULT_DELIVERY_METHOD) {
      setDeliveryMethod(DEFAULT_DELIVERY_METHOD);
    }
  }, [deliveryMethod, setDeliveryMethod]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Ticket Delivery Method
        </h3>
      </div>

      <Card
        aria-selected="true"
        className="w-full border-primary bg-primary/5 ring-1 ring-primary/30"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-4 text-success" />
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold text-foreground">
                {selectedOption.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Mail className="mt-0.5 size-4" />
            <p>{selectedOption.description}</p>
          </div>
          <Separator />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Ticket className="size-4" />
            <p>
              Current backend supports this delivery method for Step 2 recipient
              update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
