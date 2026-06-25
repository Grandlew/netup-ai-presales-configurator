import { z } from "zod";

export const wizardSchema = z.object({
  project_type: z.string().min(1, "Project type is required"),
  country: z.string().optional(),
  company_name: z.string().optional(),
  subscribers_or_rooms: z.coerce.number().int().positive("Enter a positive number"),
  number_of_channels: z.coerce.number().int().positive("Enter a positive number"),
  signal_sources: z.array(z.string()).min(1, "Select at least one signal source"),
  services: z.array(z.string()).min(1, "Select at least one service"),
  archive_days: z.coerce.number().int().min(0).default(0),
  estimated_vod_library_size_tb: z.coerce.number().min(0).optional(),
  need_subscriber_packages: z.boolean().default(false),
  need_local_advertising: z.boolean().default(false),
  viewer_devices: z.array(z.string()).min(1, "Select at least one device type"),
  delivery_mode: z.string().min(1, "Delivery mode is required"),
  adaptive_bitrate_required: z.boolean().default(false),
  output_type: z.string().default("ip"),
  expected_concurrent_viewers: z.coerce.number().int().positive().optional(),
  average_channel_bitrate_mbps: z.coerce.number().positive().default(6),
  available_storage_tb: z.coerce.number().min(0).optional(),
  redundancy_required: z.boolean().default(false),
  existing_network_bandwidth_mbps: z.coerce.number().min(0).optional(),
  existing_equipment: z.string().optional(),
  target_launch_date: z.string().optional(),
  budget_range: z.string().optional(),
  contact_name: z.string().min(1, "Contact name is required"),
  email: z.string().email("Enter a valid work email"),
  company: z.string().optional(),
  phone: z.string().optional(),
  additional_project_notes: z.string().optional(),
  consent_given: z.literal<boolean>(true, {
    errorMap: () => ({ message: "Consent is required before submission" }),
  }),
});

export type WizardFormValues = z.infer<typeof wizardSchema>;
