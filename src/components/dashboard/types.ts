"use client";

// Types mirroring the /api/analytics and /api/sessions responses.

import { EventDTO, SessionDTO } from "@/lib/tracker/types";

export interface AnalyticsResponse {
  generatedAt: string;
  totals: {
    sessions: number;
    activeNow: number;
    returning: number;
    clicks: number;
    rageClicks: number;
    deadClicks: number;
    formSubmits: number;
    keyPresses: number;
    scrollEvents: number;
    mouseDistance: number;
    avgEngagedMs: number;
    avgDurationMs: number;
    avgScrollDepth: number;
    avgClicks: number;
  };
  activeSessions: Array<{
    id: string;
    visitorId: string;
    deviceType: string;
    startedAt: string;
    engagedMs: number;
    clickCount: number;
    maxScrollDepth: number;
    isSeed: boolean;
    currentSection?: string;
  }>;
  recentEvents: Array<
    EventDTO & {
      visitorId: string;
      deviceType: string;
      createdAt: string;
    }
  >;
  rageEvents: Array<
    EventDTO & { visitorId: string; startedAt: string }
  >;
  topTargets: Array<{
    label: string;
    clicks: number;
    rage: number;
    dead: number;
  }>;
  scrollHistogram: Array<{ range: string; sessions: number }>;
  devices: Array<{ device: string; count: number }>;
  sections: Array<{ section: string; avgMs: number; sessions: number }>;
  eventsTimeline: Array<{ time: string; count: number }>;
  navFunnel: Array<{ to: string; count: number }>;
  heatmap: {
    pointsByWidth: Record<string, Array<{ x: number; y: number; w: number }>>;
    pageHeights: Record<string, number>;
  };
  sessionDepths: Array<{ deviceType: string; maxScrollDepth: number }>;
}

export interface SessionsResponse {
  sessions: SessionDTO[];
}

export interface SessionDetailResponse {
  session: SessionDTO;
  events: EventDTO[];
}
