import { PAGINATION } from "@/core/constants";
import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  CreateEventDTO,
  EventDetailResult,
  EventDetailResultSchema,
  EventPagedListResult,
  EventPagedListResultSchema,
  EventStatsResult,
  EventStatsResultSchema,
  SearchEventsParams,
  CreateTicketTypeDTO,
  UpdateEventDTO,
} from "@/schemas/event";
import { GetEventsParams } from "@/schemas/event/event-search-params.schema";
import { EventSeatsResult, EventSeatsResultSchema } from "@/schemas/seat";

export const getEvents = async ({
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
  ...filters
}: Partial<GetEventsParams> = {}): Promise<EventPagedListResult> => {
  const response = await apiClient.get("/events", {
    params: { page, limit, ...filters },
  });
  return parseOrThrow(EventPagedListResultSchema, response);
};

export const getEventBySlug = async (
  slug: string,
): Promise<EventDetailResult> => {
  const response = await apiClient.get(`/events/slug/${slug}`);
  return parseOrThrow(EventDetailResultSchema, response);
};

export const getEventDetail = async (
  id: string,
): Promise<EventDetailResult> => {
  const response = await apiClient.get(`/events/${id}`);
  return parseOrThrow(EventDetailResultSchema, response);
};

export const searchEvents = async (
  params: SearchEventsParams,
): Promise<EventPagedListResult> => {
  const response = await apiClient.get("/events/search", { params });
  return parseOrThrow(EventPagedListResultSchema, response);
};

export const getEventStats = async (id: string): Promise<EventStatsResult> => {
  const response = await apiClient.get(`/events/${id}/stats`);
  return parseOrThrow(EventStatsResultSchema, response);
};

export const getEventSeats = async (
  eventId: string,
): Promise<EventSeatsResult> => {
  const response = await apiClient.get(`/events/${eventId}/seats`);
  return parseOrThrow(EventSeatsResultSchema, response);
};

export const createEvent = async (
  payload: CreateEventDTO,
): Promise<EventDetailResult> => {
  const response = await apiClient.post("/events", payload);
  return parseOrThrow(EventDetailResultSchema, response);
};

export const updateEvent = async (
  id: string,
  payload: UpdateEventDTO,
): Promise<EventDetailResult> => {
  const response = await apiClient.patch(`/events/${id}`, payload);
  return parseOrThrow(EventDetailResultSchema, response);
};

export const publishEvent = async (id: string): Promise<EventDetailResult> => {
  const response = await apiClient.patch(`/events/${id}/publish`);
  return parseOrThrow(EventDetailResultSchema, response);
};

export const finishEvent = async (id: string): Promise<EventDetailResult> => {
  const response = await apiClient.patch(`/events/${id}/finish`);
  return parseOrThrow(EventDetailResultSchema, response);
};

export const cancelEvent = async (
  id: string,
  cancelReason: string,
): Promise<EventDetailResult> => {
  const response = await apiClient.patch(`/events/${id}/cancel`, {
    cancelReason,
  });
  return parseOrThrow(EventDetailResultSchema, response);
};

export const featureEvent = async (
  id: string,
  isFeatured: boolean,
): Promise<EventDetailResult> => {
  const response = await apiClient.patch(`/events/${id}/feature`, {
    isFeatured,
  });
  return parseOrThrow(EventDetailResultSchema, response);
};

export const createTicketType = async (
  eventId: string,
  payload: CreateTicketTypeDTO,
): Promise<EventDetailResult> => {
  const response = await apiClient.post(
    `/events/${eventId}/ticket-types`,
    payload,
  );
  return parseOrThrow(EventDetailResultSchema, response);
};
