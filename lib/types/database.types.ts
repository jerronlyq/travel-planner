// Hand-written to match supabase/migrations/*.sql until a live Supabase
// project exists to generate this via `supabase gen types typescript`.
// Shape mirrors the CLI's generated output so @supabase/supabase-js's
// generics (which require Tables/Views/Functions + Relationships per table)
// resolve correctly instead of silently falling back to `never`.

export type TripRole = "owner" | "editor" | "viewer";
export type ItineraryItemType =
  | "accommodation"
  | "food"
  | "activity"
  | "transport"
  | "place";
export type InviteStatus = "pending" | "accepted" | "revoked";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          is_platform_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_platform_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_platform_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          destination: string | null;
          start_date: string | null;
          end_date: string | null;
          timezone: string | null;
          country_code: string | null;
          cover_photo_path: string | null;
          cover_blur: string | null;
          default_currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          destination?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          timezone?: string | null;
          country_code?: string | null;
          cover_photo_path?: string | null;
          cover_blur?: string | null;
          default_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          destination?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          timezone?: string | null;
          country_code?: string | null;
          cover_photo_path?: string | null;
          cover_blur?: string | null;
          default_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trip_members: {
        Row: {
          trip_id: string;
          user_id: string;
          role: TripRole;
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          trip_id: string;
          user_id: string;
          role: TripRole;
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          trip_id?: string;
          user_id?: string;
          role?: TripRole;
          invited_by?: string | null;
          joined_at?: string;
        };
        Relationships: [];
      };
      trip_invites: {
        Row: {
          id: string;
          trip_id: string;
          email: string;
          role: Extract<TripRole, "editor" | "viewer">;
          invited_by: string;
          status: InviteStatus;
          token: string;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          email: string;
          role: Extract<TripRole, "editor" | "viewer">;
          invited_by: string;
          status?: InviteStatus;
          token?: string;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          trip_id?: string;
          email?: string;
          role?: Extract<TripRole, "editor" | "viewer">;
          invited_by?: string;
          status?: InviteStatus;
          token?: string;
          created_at?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      itinerary_days: {
        Row: {
          id: string;
          trip_id: string;
          date: string;
          notes: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          trip_id: string;
          date: string;
          notes?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          trip_id?: string;
          date?: string;
          notes?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      itinerary_items: {
        Row: {
          id: string;
          trip_id: string;
          day_id: string | null;
          type: ItineraryItemType;
          title: string;
          notes: string | null;
          location_name: string | null;
          location_address: string | null;
          lat: number | null;
          lng: number | null;
          start_time: string | null;
          end_time: string | null;
          all_day: boolean;
          price_amount: number | null;
          price_currency: string | null;
          url: string | null;
          sort_order: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_id?: string | null;
          type: ItineraryItemType;
          title: string;
          notes?: string | null;
          location_name?: string | null;
          location_address?: string | null;
          lat?: number | null;
          lng?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          all_day?: boolean;
          price_amount?: number | null;
          price_currency?: string | null;
          url?: string | null;
          sort_order?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          day_id?: string | null;
          type?: ItineraryItemType;
          title?: string;
          notes?: string | null;
          location_name?: string | null;
          location_address?: string | null;
          lat?: number | null;
          lng?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          all_day?: boolean;
          price_amount?: number | null;
          price_currency?: string | null;
          url?: string | null;
          sort_order?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      item_attachments: {
        Row: {
          id: string;
          item_id: string;
          trip_id: string;
          storage_path: string;
          caption: string | null;
          mime_type: string | null;
          file_name: string | null;
          uploaded_by: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          trip_id: string;
          storage_path: string;
          caption?: string | null;
          mime_type?: string | null;
          file_name?: string | null;
          uploaded_by: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          trip_id?: string;
          storage_path?: string;
          caption?: string | null;
          mime_type?: string | null;
          file_name?: string | null;
          uploaded_by?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_trip_invite: {
        Args: { _token: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
