import { z } from "zod";
import { BigIntIdSchema } from "../api";
import { EventSchema } from "./event.schema";

export const CreateEventSchema = EventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  status: true,
  slug: true,
  venue: true,
  ticketTypes: true,
})
  .extend({
    venueId: BigIntIdSchema,
  })
  .superRefine((data, ctx) => {
    const saleStart = new Date(data.saleStartDate).getTime();
    const saleEnd = new Date(data.saleEndDate).getTime();
    const event = new Date(data.eventDate).getTime();

    if ([saleStart, saleEnd, event].some(isNaN)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid date format",
        path: ["saleStartDate"],
      });
      return;
    }

    if (saleStart >= saleEnd) {
      ctx.addIssue({
        code: "custom",
        message: "Sale start must be before sale end",
        path: ["saleEndDate"],
      });
    }

    if (saleEnd >= event) {
      ctx.addIssue({
        code: "custom",
        message: "Sale end must be before event date",
        path: ["eventDate"],
      });
    }
  });

export type CreateEventDTO = z.infer<typeof CreateEventSchema>;
