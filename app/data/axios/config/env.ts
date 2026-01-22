import z from "zod";

// Provide safe defaults to prevent server crashes when env vars are missing
const envVariables = z.object({
  VITE_ACTIVE_ENV: z.string().default("STAGING"),
  VITE_CONSOLE_LOGGER: z.string().default("false"),
  VITE_API_URL: z.string().default(""),
});

export const ENV_VARIABLES = envVariables.parse(import.meta.env);
