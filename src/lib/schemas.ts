import { z } from "zod";

export const takeoverDetailsSchema = z.object({
  askingPrice: z.number({ required_error: "Asking price is required" }).positive("Asking price must be positive"),
  monthlyRevenue: z.number().positive("Monthly revenue must be positive").optional().nullable(),
  yearsInOperation: z.number().int().positive("Years must be positive").optional().nullable(),
  includedEquipment: z.string().optional().nullable(),
});

export const leaseDetailsSchema = z.object({
  monthlyRent: z.number({ required_error: "Monthly rent is required" }).positive("Monthly rent must be positive"),
  squareFootage: z.number({ required_error: "Square footage is required" }).positive("Square footage must be positive"),
  leaseTerm: z.number({ required_error: "Lease term is required" }).int().positive("Lease term must be positive"),
  condition: z.enum(["new", "good", "fair", "needs_renovation"], { required_error: "Condition is required" }),
});

export const analysisFormSchema = z.object({
  address: z.string().min(1, "Location address is required"),
  placeId: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  cuisine: z.string().min(1, "Cuisine type is required"),
  model: z.enum(["takeover", "lease"], { required_error: "Business model is required" }),
  takeoverDetails: takeoverDetailsSchema.optional().nullable(),
  leaseDetails: leaseDetailsSchema.optional().nullable(),
  budget: z.number({ required_error: "Total budget is required" }).positive("Budget must be positive"),
  targetRevenue: z.number({ required_error: "Target monthly revenue is required" }).positive("Target revenue must be positive"),
}).refine(
  (data) => {
    if (data.model === "takeover") return data.takeoverDetails != null;
    return data.leaseDetails != null;
  },
  { message: "Business model details are required for the selected model" }
);

export type AnalysisFormData = z.infer<typeof analysisFormSchema>;
export type TakeoverDetails = z.infer<typeof takeoverDetailsSchema>;
export type LeaseDetails = z.infer<typeof leaseDetailsSchema>;
