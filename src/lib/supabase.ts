type SupabaseInsertResult = {
  error: Error | null;
};

interface SupabaseQueryBuilder {
  insert(payload: Record<string, unknown>): Promise<SupabaseInsertResult>;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = {
  from(table: string): SupabaseQueryBuilder {
    return {
      async insert(payload: Record<string, unknown>) {
        if (!supabaseUrl || !supabaseAnonKey) {
          return {
            error: new Error("Supabase credentials are not configured."),
          };
        }

        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const detail = await response.text();
            return {
              error: new Error(detail || "Failed to save employee."),
            };
          }

          return { error: null };
        } catch (err) {
          return {
            error: err instanceof Error ? err : new Error("Failed to save employee."),
          };
        }
      },
    };
  },
};
