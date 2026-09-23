"use server";

import { auth } from "@clerk/nextjs/server";
import axios, { type AxiosInstance } from "axios";

import { getEnvVar, parseContentDispositionFilename } from "@/lib/utils";

const backendUrl = getEnvVar("BACKEND_URL");

export const backendClient = axios.create({
  baseURL: backendUrl,
});

export const getAuthenticatedBackendClient = async () => {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error("Unable to retrieve Clerk session token");
  }

  return axios.create({
    baseURL: backendUrl,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const callBackend = async <T>(
  request: (client: AxiosInstance) => Promise<T>,
  logMessage: string,
): Promise<T | null> => {
  try {
    const backendClient = await getAuthenticatedBackendClient();
    return await request(backendClient);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(logMessage, error.message);
      return null;
    }

    throw error;
  }
};

export const fetchBackendData = async <T>(
  endpoint: string,
  logMessage = `Failed to fetch backend endpoint: ${endpoint}`,
): Promise<T | null> => {
  const response = await callBackend(
    (client) => client.get<T>(endpoint),
    logMessage,
  );

  return response?.data ?? null;
};

export const saveBackendData = async <T>(
  endpoint: string,
  body: T,
  logMessage = `Failed to save backend endpoint: ${endpoint}`,
): Promise<boolean> => {
  const response = await callBackend(
    (client) => client.put(endpoint, body),
    logMessage,
  );

  return response !== null;
};

export type BackendBlob = {
  data: ArrayBuffer;
  contentType: string;
  filename: string | null;
};

export const fetchBackendBlob = async <T>(
  endpoint: string,
  body: T,
  logMessage = `Failed to fetch backend blob: ${endpoint}`,
): Promise<BackendBlob | null> => {
  const response = await callBackend(
    (client) =>
      client.post<ArrayBuffer>(endpoint, body, { responseType: "arraybuffer" }),
    logMessage,
  );

  if (!response) return null;

  const contentDisposition = response.headers["content-disposition"] as
    string | undefined;
  const contentType = response.headers["content-type"] as string | undefined;

  return {
    data: response.data,
    contentType: contentType ?? "application/octet-stream",
    filename: parseContentDispositionFilename(contentDisposition),
  };
};
