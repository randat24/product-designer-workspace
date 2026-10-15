// The database types the code uses: the generated file (`npm run db:types`, never edited by hand) with what the
// generator cannot see written in here. Two things: columns database triggers fill, so an insert may leave them
// out and a stored row always has them; and text columns limited by a check constraint, typed as their values.
import type { Database as Generated, Json } from "./database.generated";

export type { Json };

type GenTables = Generated["public"]["Tables"];

/**
 * Columns a trigger fills on insert. `attach_domain_table()` sets `workspace_id` from `project_id` and `code`
 * from project_counters; `set_workspace_from_request()` sets `workspace_id` from `request_id`; the matrix
 * trigger sets both ids from the competitor.
 */
type FilledOnInsert<T extends keyof GenTables, I = GenTables[T]["Insert"]> =
  T extends "competitor_feature_values" ? "project_id" | "workspace_id"
  : "workspace_id" extends keyof I ? ("project_id" extends keyof I ? "workspace_id" : "request_id" extends keyof I ? "workspace_id" : never)
  : never;

/** Text columns with a `check (… in (…))`: the values the database accepts. */
type Checked = {
  site_notes: { status: "draft" | "published" };
  comparison_features: { kind: "feature" | "ux" };
};
type CheckedOf<T> = T extends keyof Checked ? Checked[T] : Record<never, never>;

type Override<A, B> = Omit<A, keyof B> & B;
type FixRow<T extends keyof GenTables, R = GenTables[T]["Row"]> = Override<
  "code" extends keyof R ? Override<R, { code: NonNullable<R["code" & keyof R]> }> : R,
  CheckedOf<T>
>;
type FixInsert<T extends keyof GenTables, I = GenTables[T]["Insert"]> = Override<
  Override<I, { [K in FilledOnInsert<T> & keyof I]?: I[K] }>,
  Partial<CheckedOf<T>>
>;
type FixUpdate<T extends keyof GenTables> = Override<GenTables[T]["Update"], Partial<CheckedOf<T>>>;

type FixedTables = {
  [T in keyof GenTables]: {
    Row: FixRow<T>;
    Insert: FixInsert<T>;
    Update: FixUpdate<T>;
    Relationships: GenTables[T]["Relationships"];
  };
};

export type Database = Omit<Generated, "public"> & {
  public: Omit<Generated["public"], "Tables"> & { Tables: FixedTables };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
