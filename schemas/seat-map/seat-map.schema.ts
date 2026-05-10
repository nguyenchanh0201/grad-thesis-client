import { z } from "zod";
import { BaseResponseSchema } from "../api/base-response.schema";
import { BigIntIdSchema } from "../api/bigint-id.schema";

const RowConfigSchema = z.object({
  label: z.string(),
  seatCount: z.number().int().positive(),
});

const SectionElementSchema = z.object({
  id: z.string(),
  type: z.literal("section"),
  name: z.string(),
  rowConfigs: z.array(RowConfigSchema).optional(),
  rows: z.number().int().optional(),
  seatsPerRow: z.number().int().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string().optional(),
  ticketTypeId: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().optional(),
  rowSpacing: z.number().optional(),
  seatSpacing: z.number().optional(),
});

const ZoneElementSchema = z.object({
  id: z.string(),
  type: z.literal("zone"),
  name: z.string(),
  capacity: z.number().int().positive(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string().optional(),
  ticketTypeId: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().optional(),
});

const StageElementSchema = z.object({
  id: z.string(),
  type: z.literal("stage"),
  label: z.string().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const LabelElementSchema = z.object({
  id: z.string(),
  type: z.literal("label"),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  fontSize: z.number().optional(),
  color: z.string().optional(),
});

export const SeatMapElementSchema = z.discriminatedUnion("type", [
  SectionElementSchema,
  ZoneElementSchema,
  StageElementSchema,
  LabelElementSchema,
]);

export const SeatMapCanvasSchema = z.object({
  width: z.number(),
  height: z.number(),
  gridSize: z.number().optional(),
  backgroundColor: z.string().optional(),
  elements: z.array(SeatMapElementSchema),
});

export const SeatMapSchema = z.object({
  id: BigIntIdSchema,
  name: z.string(),
  description: z.string().nullish(),
  canvas: SeatMapCanvasSchema,
  isSystem: z.boolean(),
  isCommitted: z.boolean(),
  venueId: BigIntIdSchema.nullish(),
  organizerId: BigIntIdSchema.nullish(),
  previewImageUrl: z.string().nullish(),
  createdAt: z.iso.datetime().optional(),
});

export const SeatMapResultSchema = BaseResponseSchema(SeatMapSchema);

export type SeatMapElement = z.infer<typeof SeatMapElementSchema>;
export type SeatMapCanvas = z.infer<typeof SeatMapCanvasSchema>;
export type SeatMap = z.infer<typeof SeatMapSchema>;
export type SeatMapResult = z.infer<typeof SeatMapResultSchema>;
export type SectionElement = z.infer<typeof SectionElementSchema>;
export type ZoneElement = z.infer<typeof ZoneElementSchema>;
export type StageElement = z.infer<typeof StageElementSchema>;
export type LabelElement = z.infer<typeof LabelElementSchema>;
export type RowConfig = z.infer<typeof RowConfigSchema>;
