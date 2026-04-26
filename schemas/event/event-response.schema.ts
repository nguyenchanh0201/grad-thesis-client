import { z } from "zod";

import { BaseResponseSchema, PagedResponseSchema } from "../api";
import { EventSchema } from "./event.schema";
import { EventDetailSchema } from "./event-detail.schema";

export const EventPagedListResultSchema = PagedResponseSchema(EventSchema);
export type EventPagedListResult = z.infer<typeof EventPagedListResultSchema>;

export const EventDetailResultSchema = BaseResponseSchema(EventSchema);
export type EventDetailResult = z.infer<typeof EventDetailResultSchema>;

export const EventDetailPageResultSchema =
  BaseResponseSchema(EventDetailSchema);
export type EventDetailPageResult = z.infer<typeof EventDetailPageResultSchema>;
