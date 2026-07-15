import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  HeartbeatResponse,
  HeartbeatResponseSchema,
  WaitRoomResponse,
  WaitRoomResponseSchema,
} from "@/schemas/queue";

export type RequestAccessPayload = {
  slug: string;
  lastActivityAt?: string;
};

export type QueueStatusParams = {
  slug: string;
  lastActivityAt?: string;
};

export type QueuePresencePayload = QueueStatusParams;

export type HeartbeatPayload = {
  slug: string;
  token: string;
  lastActivityAt: string;
};

export const requestAccess = async (
  payload: RequestAccessPayload,
): Promise<WaitRoomResponse> => {
  const response = await apiClient.post("/tickets/request-access", payload);
  return parseOrThrow(WaitRoomResponseSchema, response);
};

export const getQueueStatus = async (
  params: QueueStatusParams,
): Promise<WaitRoomResponse> => {
  const response = await apiClient.get("/tickets/queue-status", { params });
  return parseOrThrow(WaitRoomResponseSchema, response);
};

export const sendQueuePresence = async (
  payload: QueuePresencePayload,
): Promise<WaitRoomResponse> => {
  const response = await apiClient.post("/tickets/queue-presence", payload);
  return parseOrThrow(WaitRoomResponseSchema, response);
};

export const sendHeartbeat = async (
  payload: HeartbeatPayload,
): Promise<HeartbeatResponse> => {
  const response = await apiClient.post("/tickets/heartbeat", payload);
  return parseOrThrow(HeartbeatResponseSchema, response);
};
