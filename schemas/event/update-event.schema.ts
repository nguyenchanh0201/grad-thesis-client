import { z } from "zod";
import { EventSchema } from "./event.schema";

const UpdateEventBaseSchema = EventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  status: true,
  slug: true,
}).partial();

export const UpdateEventSchema = UpdateEventBaseSchema.superRefine(
  (data, ctx) => {
    const { saleStartDate, saleEndDate, eventDate } = data;

    if (!saleStartDate || !saleEndDate || !eventDate) {
      return;
    }

    const saleStart = new Date(saleStartDate).getTime();
    const saleEnd = new Date(saleEndDate).getTime();
    const event = new Date(eventDate).getTime();

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
  },
);

export type UpdateEventDTO = z.infer<typeof UpdateEventSchema>;
