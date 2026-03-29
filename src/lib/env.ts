import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GITHUB_TOKEN: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function loadServerEnv(processEnv: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(processEnv);

  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${parsed.error.message}`);
  }

  return parsed.data;
}