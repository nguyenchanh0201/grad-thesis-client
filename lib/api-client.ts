import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { API_CONFIG } from "@/core/constants";

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const correlationId = uuidv4();
  config.headers[API_CONFIG.HEADERS.CORRELATION_ID] = correlationId;
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const correlationId = error.config?.correlationId;
    const message = error.response?.data?.message || "There is something wrong";

    if (error.response?.status >= 500) {
      toast.error(`Error: ${message}`, {
        description: `Reference ID: ${correlationId}`,
        duration: 10000,
      });
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  },
);
