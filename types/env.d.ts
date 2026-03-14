declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    SMS_WEBHOOK_SECRET?: string;
    SMS_PROVIDER_API_URL?: string;
    SMS_PROVIDER_API_KEY?: string;
    SMS_PROVIDER_FROM_NUMBER?: string;
  }
}
