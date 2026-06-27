"use client";

import type { WizardFormValues } from "@/lib/schema";
import type { ExtractResponse, Recommendation } from "@/lib/types";

const REVIEW_PAYLOAD_KEY = "netup.reviewPayload";
const RESULTS_PAYLOAD_KEY = "netup.resultsPayload";
const HOME_NAVIGATION_KEY = "netup.homeNavigation";
const REVIEW_AUDIT_TRACE_KEY = "netup.reviewAuditTrace";

type HomeNavigationIntent = {
  entryMode: "guided" | "conversation";
  seedValues?: Partial<WizardFormValues> | null;
  seedStartStep?: number;
};

export type ReviewPayload = {
  response: ExtractResponse;
  originalMessage: string;
};

export type ResultsPayload = {
  recommendation: Recommendation;
  submittedValues: WizardFormValues;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.sessionStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so navigation can still proceed.
  }
}

function removeItem(key: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures during cleanup.
  }
}

export function setReviewPayload(payload: ReviewPayload) {
  writeJson(REVIEW_PAYLOAD_KEY, payload);
}

export function getReviewPayload() {
  return readJson<ReviewPayload>(REVIEW_PAYLOAD_KEY);
}

export function clearReviewPayload() {
  removeItem(REVIEW_PAYLOAD_KEY);
}

export function setReviewAuditTrace(trace: unknown) {
  writeJson(REVIEW_AUDIT_TRACE_KEY, trace);
}

export function getReviewAuditTrace() {
  return readJson<unknown>(REVIEW_AUDIT_TRACE_KEY);
}

export function clearReviewAuditTrace() {
  removeItem(REVIEW_AUDIT_TRACE_KEY);
}

export function setResultsPayload(payload: ResultsPayload) {
  writeJson(RESULTS_PAYLOAD_KEY, payload);
}

export function getResultsPayload() {
  return readJson<ResultsPayload>(RESULTS_PAYLOAD_KEY);
}

export function clearResultsPayload() {
  removeItem(RESULTS_PAYLOAD_KEY);
}

export function setHomeNavigationIntent(intent: HomeNavigationIntent) {
  writeJson(HOME_NAVIGATION_KEY, intent);
}

export function consumeHomeNavigationIntent() {
  const intent = readJson<HomeNavigationIntent>(HOME_NAVIGATION_KEY);
  removeItem(HOME_NAVIGATION_KEY);
  return intent;
}
