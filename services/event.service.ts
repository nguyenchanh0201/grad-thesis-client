import { PAGINATION } from "@/core/constants";
import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  CreateEventDTO,
  EventDetailResult,
  EventDetailResultSchema,
  EventPagedListResult,
  EventPagedListResultSchema,
  UpdateEventDTO,
} from "@/schemas/event";
import { GetEventsParams } from "@/schemas/event/event-search-params.schema";

export const getEvents = async ({
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
  ...filters
}: GetEventsParams): Promise<EventPagedListResult> => {
  const response = await apiClient.get("/events", {
    params: { page, limit, ...filters },
  });
  return parseOrThrow(EventPagedListResultSchema, response);
};

export const getEventDetail = async (
  eventCode: string,
): Promise<EventDetailResult> => {
  const response = await apiClient.get(`/events/${eventCode}`);
  return parseOrThrow(EventDetailResultSchema, response);
};

export const createEvent = async (
  payload: CreateEventDTO,
): Promise<EventDetailResult> => {
  const response = await apiClient.post("/events", payload);
  return parseOrThrow(EventDetailResultSchema, response);
};

export const updateEvent = async (
  eventCode: string,
  payload: UpdateEventDTO,
): Promise<EventDetailResult> => {
  const response = await apiClient.patch(`/events/${eventCode}`, payload);
  return parseOrThrow(EventDetailResultSchema, response);
};
