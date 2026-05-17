"use client";

import { CheckCircle2, Mail, Ticket } from "lucide-react";
import { useBookingStore } from "@/lib/store/booking";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  const allowedMethods = new Set<DeliveryMethod>(
    DELIVERY_OPTIONS.map((option) => option.id),
  );

  const handleChange = (value: string) => {
    if (!allowedMethods.has(value as DeliveryMethod)) return;
    setDeliveryMethod(value as DeliveryMethod);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Ticket Delivery Method
        </h3>
      </div>

      <RadioGroup
        value={deliveryMethod}
        onValueChange={handleChange}
        className="space-y-2"
      >
        {DELIVERY_OPTIONS.map((option) => {
          const selected = deliveryMethod === option.id;

          return (
            <Label key={option.id} className="cursor-pointer">
              <Card
                className={cn(
                  "w-full transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "hover:bg-muted/40",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={option.id} className="mt-0.5" />
                    <div className="flex-1">
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {option.title}
                      </CardTitle>
                    </div>
                    {selected ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Mail className="mt-0.5 size-4" />
                    <p>{option.description}</p>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Ticket className="size-4" />
                    <p>
                      Current backend supports this delivery method for Step 2
                      recipient update.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
