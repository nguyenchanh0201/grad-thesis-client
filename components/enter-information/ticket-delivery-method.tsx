"use client";

import { Mail } from "lucide-react";
import { useBookingStore } from "@/lib/store/booking";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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

export function TicketDeliveryMethod() {
  const { deliveryMethod, setDeliveryMethod } = useBookingStore();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        Ticket Delivery Method
      </h3>

      <RadioGroup
        value={deliveryMethod}
        onValueChange={(value) => setDeliveryMethod(value as DeliveryMethod)}
        className="space-y-2"
      >
        {DELIVERY_OPTIONS.map((option) => {
          const selected = deliveryMethod === option.id;

          return (
            <Label key={option.id} className="cursor-pointer">
              <Card
                className={cn(
                  "flex items-start gap-3 p-4 transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/40",
                )}
              >
                <RadioGroupItem value={option.id} className="mt-1" />

                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <Mail className="mt-0.5 size-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{option.title}</p>
                  </div>

                  <p className="mt-1 pl-6 text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </Card>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
