import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  HeartbeatResult,
  HeartbeatResultSchema,
  WaitRoomResult,
  WaitRoomResultSchema,
} from "@/schemas/queue";

export type RequestAccessPayload = {
  eventId: string;
  userId: string;
};

export type QueueStatusParams = {
  eventId: string;
  userId: string;
};

export type HeartbeatPayload = {
  eventId: string;
  userId: string;
};

export const requestAccess = async (
  payload: RequestAccessPayload,
): Promise<WaitRoomResult> => {
  const response = await apiClient.post("/tickets/request-access", payload);
  return parseOrThrow(WaitRoomResultSchema, response);
};

export const getQueueStatus = async (
  params: QueueStatusParams,
): Promise<WaitRoomResult> => {
  const response = await apiClient.get("/tickets/queue-status", { params });
  return parseOrThrow(WaitRoomResultSchema, response);
};

export const sendHeartbeat = async (
  payload: HeartbeatPayload,
): Promise<HeartbeatResult> => {
  const response = await apiClient.post("/tickets/heartbeat", payload);
  return parseOrThrow(HeartbeatResultSchema, response);
};
