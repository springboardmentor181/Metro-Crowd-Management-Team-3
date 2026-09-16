import { createApi } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { AxiosRequestConfig, AxiosError } from "axios";

import api from "@/lib/axios";
import type {
  CrowdSnapshot,
  Train,
  LiveTrainPosition,
  TrainRoute,
  TrainSchedule,
  Prediction,
} from "@/lib/api/types";

const axiosBaseQuery =
  (): BaseQueryFn<
    { url: string; method?: AxiosRequestConfig["method"]; params?: AxiosRequestConfig["params"] },
    unknown,
    { status?: number; message: string }
  > =>
  async ({ url, method = "get", params }, { signal }) => {
    try {
      
      const result = await api.request({ url, method, params, signal });
      return { data: result.data };
    } catch (err) {
      const error = err as AxiosError;
      if (error.code === "ERR_CANCELED") {
        
        return {
          error: {
            status: "FETCH_ERROR" as unknown as number,
            message: "Request cancelled",
          },
        };
      }
      return {
        error: {
          status: error.response?.status,
          message: error.message,
        },
      };
    }
  };

export const apiSlice = createApi({
  reducerPath: "metroflowApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Crowd", "Trains", "LiveTrainPositions", "TrainRoutes", "Schedules", "Predictions"],
  
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getCrowdDashboard: builder.query<CrowdSnapshot[], string | undefined>({
      query: (state) => ({
        url: "/api/v1/crowd/dashboard",
        params: state ? { state } : undefined,
      }),
      providesTags: ["Crowd"],
    }),
    getTrains: builder.query<Train[], string | undefined>({
      query: (state) => ({
        url: "/api/v1/trains/",
        params: state ? { state } : undefined,
      }),
      providesTags: ["Trains"],
    }),
    getLiveTrainPositions: builder.query<LiveTrainPosition[], string | undefined>({
      query: (state) => ({
        url: "/api/v1/trains/live",
        params: state ? { state } : undefined,
      }),
      providesTags: ["LiveTrainPositions"],
      
      keepUnusedDataFor: 120,
    }),
    getTrainRoutes: builder.query<TrainRoute[], string | undefined>({
      query: (state) => ({
        url: "/api/v1/trains/routes",
        params: state ? { state } : undefined,
      }),
      providesTags: ["TrainRoutes"],
      keepUnusedDataFor: 3600,
    }),
    getDelayedSchedules: builder.query<
      TrainSchedule[],
      { stationId?: number; state?: string } | undefined
    >({
      query: (args) => ({
        url: "/api/v1/schedules/delayed",
        params: {
          ...(args?.stationId ? { station_id: args.stationId } : {}),
          ...(args?.state ? { state: args.state } : {}),
        },
      }),
      providesTags: ["Schedules"],
    }),
    getPredictionInsights: builder.query<
      Prediction[],
      { limit?: number; state?: string } | undefined
    >({
      query: (args) => ({
        url: "/api/v1/analytics/prediction-insights",
        params: {
          limit: args?.limit ?? 20,
          ...(args?.state ? { state: args.state } : {}),
        },
      }),
      providesTags: ["Predictions"],
    }),
  }),
});

export const {
  useGetCrowdDashboardQuery,
  useGetTrainsQuery,
  useGetLiveTrainPositionsQuery,
  useGetTrainRoutesQuery,
  useGetDelayedSchedulesQuery,
  useGetPredictionInsightsQuery,
} = apiSlice;