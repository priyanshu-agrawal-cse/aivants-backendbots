export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_memory: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key: string
          memory_type: string
          metadata: Json | null
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
          memory_type?: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
          value?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
          memory_type?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          max_tokens: number | null
          model_name: string | null
          provider: string
          temperature: number | null
          updated_at: string
          user_id: string
          widget_enabled: boolean
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          max_tokens?: number | null
          model_name?: string | null
          provider?: string
          temperature?: number | null
          updated_at?: string
          user_id: string
          widget_enabled?: boolean
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          max_tokens?: number | null
          model_name?: string | null
          provider?: string
          temperature?: number | null
          updated_at?: string
          user_id?: string
          widget_enabled?: boolean
        }
        Relationships: []
      }
      automation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          payload: Json | null
          result: Json | null
          scheduled_for: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          payload?: Json | null
          result?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          payload?: Json | null
          result?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          action_type: string
          condition_json: Json | null
          created_at: string
          delay_hours: number
          id: string
          is_active: boolean
          name: string
          trigger_event: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          condition_json?: Json | null
          created_at?: string
          delay_hours?: number
          id?: string
          is_active?: boolean
          name: string
          trigger_event: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          condition_json?: Json | null
          created_at?: string
          delay_hours?: number
          id?: string
          is_active?: boolean
          name?: string
          trigger_event?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_leads: {
        Row: {
          added_at: string
          campaign_id: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          campaign_id: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          campaign_id?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          body: string | null
          created_at: string
          id: string
          name: string
          status: string
          subject: string | null
          template_id: string | null
          updated_at: string
          user_id: string
          voice_enabled: boolean
          voice_from_number: string | null
          voice_persona_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
          voice_enabled?: boolean
          voice_from_number?: string | null
          voice_persona_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
          voice_enabled?: boolean
          voice_from_number?: string | null
          voice_persona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_activities: {
        Row: {
          activity_type: string
          campaign_id: string | null
          channel: string
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          activity_type?: string
          campaign_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          campaign_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_activities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          role?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          monthly_payment: number | null
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          monthly_payment?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          monthly_payment?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          industry: string | null
          name: string
          size: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          industry?: string | null
          name: string
          size?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          industry?: string | null
          name?: string
          size?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_intelligence: {
        Row: {
          ai_opening_line: string | null
          company_id: string | null
          created_at: string
          growth_signals: string | null
          hiring_signals: string | null
          id: string
          industry_focus: string | null
          lead_id: string
          marketing_activity: string | null
          outreach_angle: string | null
          raw_data: Json | null
          researched_at: string
          services: string | null
          user_id: string
          website_summary: string | null
        }
        Insert: {
          ai_opening_line?: string | null
          company_id?: string | null
          created_at?: string
          growth_signals?: string | null
          hiring_signals?: string | null
          id?: string
          industry_focus?: string | null
          lead_id: string
          marketing_activity?: string | null
          outreach_angle?: string | null
          raw_data?: Json | null
          researched_at?: string
          services?: string | null
          user_id: string
          website_summary?: string | null
        }
        Update: {
          ai_opening_line?: string | null
          company_id?: string | null
          created_at?: string
          growth_signals?: string | null
          hiring_signals?: string | null
          id?: string
          industry_focus?: string | null
          lead_id?: string
          marketing_activity?: string | null
          outreach_angle?: string | null
          raw_data?: Json | null
          researched_at?: string
          services?: string | null
          user_id?: string
          website_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_intelligence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_intelligence_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      content_assets: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_url: string
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          bounced: boolean
          campaign_id: string | null
          channel: string | null
          created_at: string
          id: string
          lead_id: string | null
          opened_at: string | null
          replied_at: string | null
          reply_body: string | null
          reply_classification: string | null
          reply_sentiment: string | null
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          bounced?: boolean
          campaign_id?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          replied_at?: string | null
          reply_body?: string | null
          reply_classification?: string | null
          reply_sentiment?: string | null
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          bounced?: boolean
          campaign_id?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          replied_at?: string | null
          reply_body?: string | null
          reply_classification?: string | null
          reply_sentiment?: string | null
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string
          id: string
          name: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          id?: string
          name: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      followup_sequences: {
        Row: {
          campaign_id: string | null
          created_at: string
          description: string | null
          followup_type: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          followup_type?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          followup_type?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_status: {
        Row: {
          campaign_id: string | null
          category: string
          client_company: string | null
          client_email: string | null
          client_name: string | null
          condition_stop_on: string | null
          created_at: string
          current_step: number
          end_date: string | null
          followup_type: string
          id: string
          last_email_sent_at: string | null
          lead_id: string
          next_followup_date: string | null
          notes: string | null
          purpose: string | null
          scheduled_date: string | null
          sender_email: string | null
          sender_name: string | null
          sequence_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          category?: string
          client_company?: string | null
          client_email?: string | null
          client_name?: string | null
          condition_stop_on?: string | null
          created_at?: string
          current_step?: number
          end_date?: string | null
          followup_type?: string
          id?: string
          last_email_sent_at?: string | null
          lead_id: string
          next_followup_date?: string | null
          notes?: string | null
          purpose?: string | null
          scheduled_date?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sequence_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          category?: string
          client_company?: string | null
          client_email?: string | null
          client_name?: string | null
          condition_stop_on?: string | null
          created_at?: string
          current_step?: number
          end_date?: string | null
          followup_type?: string
          id?: string
          last_email_sent_at?: string | null
          lead_id?: string
          next_followup_date?: string | null
          notes?: string | null
          purpose?: string | null
          scheduled_date?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sequence_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_status_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_status_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_status_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "followup_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_steps: {
        Row: {
          action_type: string
          body_override: string | null
          channel: string
          content_asset_id: string | null
          created_at: string
          delay_days: number
          id: string
          notes: string | null
          script_id: string | null
          sequence_id: string
          step_number: number
          subject_override: string | null
          template_id: string | null
          voice_from_number: string | null
          voice_persona_id: string | null
        }
        Insert: {
          action_type?: string
          body_override?: string | null
          channel?: string
          content_asset_id?: string | null
          created_at?: string
          delay_days?: number
          id?: string
          notes?: string | null
          script_id?: string | null
          sequence_id: string
          step_number?: number
          subject_override?: string | null
          template_id?: string | null
          voice_from_number?: string | null
          voice_persona_id?: string | null
        }
        Update: {
          action_type?: string
          body_override?: string | null
          channel?: string
          content_asset_id?: string | null
          created_at?: string
          delay_days?: number
          id?: string
          notes?: string | null
          script_id?: string | null
          sequence_id?: string
          step_number?: number
          subject_override?: string | null
          template_id?: string | null
          voice_from_number?: string | null
          voice_persona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_steps_content_asset_id_fkey"
            columns: ["content_asset_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_steps_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "outreach_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "followup_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      general_settings: {
        Row: {
          brand_primary_color: string
          brand_secondary_color: string
          company_name: string
          created_at: string
          currency: string
          date_format: string
          id: string
          language: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_primary_color?: string
          brand_secondary_color?: string
          company_name?: string
          created_at?: string
          currency?: string
          date_format?: string
          id?: string
          language?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_primary_color?: string
          brand_secondary_color?: string
          company_name?: string
          created_at?: string
          currency?: string
          date_format?: string
          id?: string
          language?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          api_key: string | null
          config: Json | null
          connected_at: string | null
          created_at: string
          id: string
          integration_name: string
          is_connected: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key?: string | null
          config?: Json | null
          connected_at?: string | null
          created_at?: string
          id?: string
          integration_name: string
          is_connected?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string | null
          config?: Json | null
          connected_at?: string | null
          created_at?: string
          id?: string
          integration_name?: string
          is_connected?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          industry_type: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry_type?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry_type?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_sheets: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          lead_count: number
          name: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          lead_count?: number
          name: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_count?: number
          name?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sheets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lead_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          company_id: string | null
          company_name: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          industry: string | null
          last_name: string | null
          linkedin: string | null
          location: string | null
          notes: string | null
          phone: string | null
          query: string | null
          rating: number | null
          reviews: number | null
          score: number | null
          sheet_id: string | null
          source: string | null
          status: string
          tags: string[] | null
          title: string | null
          updated_at: string
          url: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          industry?: string | null
          last_name?: string | null
          linkedin?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          query?: string | null
          rating?: number | null
          reviews?: number | null
          score?: number | null
          sheet_id?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          industry?: string | null
          last_name?: string | null
          linkedin?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          query?: string | null
          rating?: number | null
          reviews?: number | null
          score?: number | null
          sheet_id?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "lead_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outreach_scripts: {
        Row: {
          call_to_action: string
          category: string
          context: string
          created_at: string
          full_template: string
          hook: string
          id: string
          name: string
          proof: string
          updated_at: string
          user_id: string
          value_proposition: string
          variables: string[] | null
        }
        Insert: {
          call_to_action?: string
          category?: string
          context?: string
          created_at?: string
          full_template?: string
          hook?: string
          id?: string
          name: string
          proof?: string
          updated_at?: string
          user_id: string
          value_proposition?: string
          variables?: string[] | null
        }
        Update: {
          call_to_action?: string
          category?: string
          context?: string
          created_at?: string
          full_template?: string
          hook?: string
          id?: string
          name?: string
          proof?: string
          updated_at?: string
          user_id?: string
          value_proposition?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          client_won: boolean
          created_at: string
          deal_value: number | null
          id: string
          lead_id: string
          meeting_booked: boolean
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_won?: boolean
          created_at?: string
          deal_value?: number | null
          id?: string
          lead_id: string
          meeting_booked?: boolean
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_won?: boolean
          created_at?: string
          deal_value?: number | null
          id?: string
          lead_id?: string
          meeting_booked?: boolean
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          title: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team_assignments: {
        Row: {
          assigned_at: string
          id: string
          project_id: string
          role: string | null
          team_member_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          project_id: string
          role?: string | null
          team_member_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          project_id?: string
          role?: string | null
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string | null
          client_notifications: boolean
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          name: string
          notes: string | null
          start_date: string | null
          status: string
          team_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          client_notifications?: boolean
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string
          team_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          client_notifications?: boolean
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          team_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          amount: number | null
          client_id: string | null
          client_name: string | null
          created_at: string
          description: string | null
          document_name: string | null
          document_url: string | null
          id: string
          industry: string | null
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          description?: string | null
          document_name?: string | null
          document_url?: string | null
          id?: string
          industry?: string | null
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          description?: string | null
          document_name?: string | null
          document_url?: string | null
          id?: string
          industry?: string | null
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_entries: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          is_recurring: boolean
          notes: string | null
          recurring_interval: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          recurring_interval?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          recurring_interval?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      security_settings: {
        Row: {
          created_at: string
          id: string
          ip_whitelist: string[] | null
          last_api_key_rotation: string | null
          session_timeout_minutes: number
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_whitelist?: string[] | null
          last_api_key_rotation?: string | null
          session_timeout_minutes?: number
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_whitelist?: string[] | null
          last_api_key_rotation?: string | null
          session_timeout_minutes?: number
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          category: string
          created_at: string
          details: Json | null
          error_message: string | null
          id: string
          ip_address: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          action: string
          category?: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          category?: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          monthly_cost: number | null
          name: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          monthly_cost?: number | null
          name: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          monthly_cost?: number | null
          name?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          pending_action: Json | null
          role: string
          telegram_chat_id: number
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          pending_action?: Json | null
          role?: string
          telegram_chat_id: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          pending_action?: Json | null
          role?: string
          telegram_chat_id?: number
          user_id?: string
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          id: string
          is_active: boolean
          linked_at: string
          notification_prefs: Json
          telegram_chat_id: number
          telegram_username: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          linked_at?: string
          notification_prefs?: Json
          telegram_chat_id: number
          telegram_username?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          linked_at?: string
          notification_prefs?: Json
          telegram_chat_id?: number
          telegram_username?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          email_provider: string | null
          from_email: string | null
          id: string
          updated_at: string
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string
          email_provider?: string | null
          from_email?: string | null
          id?: string
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string
          email_provider?: string | null
          from_email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      voice_calls: {
        Row: {
          call_id: string | null
          campaign_id: string | null
          completed_at: string | null
          created_at: string
          from_number: string
          id: string
          interest_level: string | null
          key_points: Json | null
          persona_id: string | null
          response_data: Json | null
          status: string
          summary: string | null
          to_number: string
          transcript: string | null
          user_id: string | null
        }
        Insert: {
          call_id?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          from_number: string
          id?: string
          interest_level?: string | null
          key_points?: Json | null
          persona_id?: string | null
          response_data?: Json | null
          status?: string
          summary?: string | null
          to_number: string
          transcript?: string | null
          user_id?: string | null
        }
        Update: {
          call_id?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          from_number?: string
          id?: string
          interest_level?: string | null
          key_points?: Json | null
          persona_id?: string | null
          response_data?: Json | null
          status?: string
          summary?: string | null
          to_number?: string
          transcript?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_calls_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "voice_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_numbers: {
        Row: {
          created_at: string
          id: string
          phone_number: string
          provider: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number: string
          provider?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string
          provider?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "team_member" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "team_member", "viewer"],
    },
  },
} as const
