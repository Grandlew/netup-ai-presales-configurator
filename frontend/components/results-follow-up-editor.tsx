"use client";

import clsx from "clsx";

import type { WizardFormValues } from "@/lib/schema";
import { getResultsFollowUpDefinition } from "@/lib/results-follow-up";

type SyncState = "idle" | "updating" | "synced" | "error";

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  min?: number;
}) {
  const inputId = `results-followup-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <label htmlFor={inputId} className="space-y-2 text-sm text-slate-700">
      <span className="block font-medium text-ink">{label}</span>
      <input
        id={inputId}
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-blue/20 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const inputId = `results-followup-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <label htmlFor={inputId} className="space-y-2 text-sm text-slate-700">
      <span className="block font-medium text-ink">{label}</span>
      <select
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-blue/20 bg-white px-4 py-3 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleButton({
  label,
  pressed,
  secondary = false,
  onClick,
}: {
  label: string;
  pressed: boolean;
  secondary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        "min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2",
        pressed
          ? secondary
            ? "border border-slate-300 bg-white text-ink"
            : "bg-ink text-white"
          : secondary
            ? "border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-ink"
            : "border border-blue/20 bg-blue-50 text-blue hover:border-blue/40",
      )}
    >
      {label}
    </button>
  );
}

function BooleanChoice({
  label,
  value,
  trueLabel,
  falseLabel,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-2 text-sm text-slate-700">
      <p className="font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">
        <ToggleButton label={trueLabel} pressed={value === true} onClick={() => onChange(true)} />
        <ToggleButton label={falseLabel} pressed={value === false} secondary onClick={() => onChange(false)} />
      </div>
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  values: string[];
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label
              key={option.value}
              className={clsx(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                checked ? "border-blue bg-blue-50 text-ink" : "border-blue/20 bg-white text-slate-700 hover:border-blue/40",
              )}
            >
              <input type="checkbox" className="h-4 w-4 accent-[#2d5b91]" checked={checked} onChange={(event) => onToggle(option.value, event.target.checked)} />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SyncBadge({ state, message }: { state: SyncState; message: string | null }) {
  if (!message || state === "idle") {
    return null;
  }

  const styles =
    state === "synced"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : state === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-blue/20 bg-blue-50 text-blue";

  return <p className={`rounded-2xl border px-3 py-2 text-xs font-medium ${styles}`}>{message}</p>;
}

export function ResultsFollowUpEditor({
  question,
  values,
  syncState,
  syncMessage,
  onPatch,
}: {
  question: string;
  values: WizardFormValues;
  syncState: SyncState;
  syncMessage: string | null;
  onPatch: (patch: Partial<WizardFormValues>) => void;
}) {
  const definition = getResultsFollowUpDefinition(question, values);

  if (!definition) {
    return (
      <div className="space-y-3">
        <p className="mt-1">{question}</p>
        <p className="text-xs text-slate-500">This question is not mapped to an inline editor yet. Use “Edit configuration” to update it in the full form.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mt-1">{definition.question}</p>
      </div>

      {definition.kind === "tv_model" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <FieldInput label="TV manufacturer" value={String(values.hotel_tv_brand ?? "")} onChange={(value) => onPatch({ hotel_tv_brand: value })} />
          <FieldInput label="TV model or series" value={String(values.hotel_tv_model ?? "")} onChange={(value) => onPatch({ hotel_tv_model: value })} />
        </div>
      ) : null}

      {definition.kind === "text" ? (
        <FieldInput label={definition.label} value={String(values[definition.field] ?? "")} onChange={(value) => onPatch({ [definition.field]: value })} />
      ) : null}

      {definition.kind === "number" ? (
        <FieldInput
          label={definition.label}
          type="number"
          min={definition.min}
          value={String(values[definition.field] ?? "")}
          onChange={(value) => onPatch({ [definition.field]: value ? Number(value) : undefined })}
        />
      ) : null}

      {definition.kind === "boolean" ? (
        <BooleanChoice
          label={definition.label}
          value={values[definition.field] as boolean | undefined}
          trueLabel={definition.trueLabel}
          falseLabel={definition.falseLabel}
          onChange={(value) => onPatch({ [definition.field]: value })}
        />
      ) : null}

      {definition.kind === "select" ? (
        <FieldSelect
          label={definition.label}
          value={String(values[definition.field] ?? "")}
          options={definition.options}
          onChange={(value) => onPatch({ [definition.field]: value })}
        />
      ) : null}

      {definition.kind === "multi_select" ? (
        <CheckboxGroup
          label={definition.label}
          options={definition.options}
          values={Array.isArray(values[definition.field]) ? (values[definition.field] as string[]) : []}
          onToggle={(value, checked) => {
            const currentValues = Array.isArray(values[definition.field]) ? ([...(values[definition.field] as string[])] as string[]) : [];
            const nextValues = checked ? Array.from(new Set([...currentValues, value])) : currentValues.filter((item) => item !== value);
            onPatch({ [definition.field]: nextValues });
          }}
        />
      ) : null}

      {definition.kind === "archive_scope" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldInput
              label="Retention period in days"
              type="number"
              min={1}
              value={String(values.archive_days ?? "")}
              onChange={(value) => onPatch({ archive_days: value ? Number(value) : undefined })}
            />
            <FieldInput
              label="Average bitrate (Mbps)"
              type="number"
              min={1}
              value={String(values.average_channel_bitrate_mbps ?? 6)}
              onChange={(value) => onPatch({ average_channel_bitrate_mbps: value ? Number(value) : 6 })}
            />
          </div>

          <BooleanChoice
            label="Record all selected channels?"
            value={definition.recordAllChannels ?? undefined}
            trueLabel="Yes"
            falseLabel="No"
            onChange={(value) =>
              onPatch({
                channels_to_record: value ? Number(values.number_of_channels ?? 0) || undefined : 0,
              })
            }
          />

          {definition.recordAllChannels === false ? (
            <FieldInput
              label="Number of channels to record"
              type="number"
              min={1}
              value={String(values.channels_to_record ?? "")}
              onChange={(value) => onPatch({ channels_to_record: value ? Number(value) : undefined })}
            />
          ) : null}
        </div>
      ) : null}

      <SyncBadge state={syncState} message={syncMessage} />
    </div>
  );
}
