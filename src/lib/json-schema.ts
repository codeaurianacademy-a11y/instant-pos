import { z } from "zod";

// A JSON-safe value schema matching what Prisma's InputJsonValue accepts —
// used for the Product.attributes JSONB column so arbitrary request bodies
// can't smuggle in non-serializable values (functions, undefined, etc).
const jsonPrimitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export type JsonValue = z.infer<typeof jsonPrimitive> | JsonValue[] | { [key: string]: JsonValue };

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([jsonPrimitive, z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)])
);

export const jsonObjectSchema = z.record(z.string(), jsonValueSchema);
