export type UserRole = 'organizer' | 'guest';

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  handle: string;
  bio?: string;
  logo_url?: string;
  brand_color?: string;
  brand_font?: string;
  phone?: string;
  email: string;
  onboarded?: boolean;
  created_at: string;
}

export type TemplateType = 'grove' | 'sprint' | 'bloom' | 'vertex' | 'ember';

export interface ThemeConfig {
  palette: string;
  font: string;
  bg_style: 'solid' | 'gradient' | 'texture';
  button_style: 'solid' | 'pill' | 'outline';
  custom_accent?: string;
}

export interface SectionToggles {
  speakers: boolean;
  agenda: boolean;
  gallery: boolean;
  faq: boolean;
}

export interface SpeakerItem {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar: string;
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  description?: string;
}

export interface CustomFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'boolean';
  options?: string[];
  required?: boolean;
}

export interface RSVPFormConfig {
  ask_plus_one: boolean;
  ask_dietary: boolean;
  ask_tshirt: boolean;
  waitlist_enabled: boolean;
  confirmation_message: string;
  custom_fields?: CustomFieldConfig[];
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface EventItem {
  id: string;
  organizer_id: string;
  organizer_name: string;
  organizer_handle: string;
  organizer_logo?: string;
  organizer_brand_color?: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  cover_image_url: string;
  template: TemplateType;
  theme: ThemeConfig;
  sections: SectionToggles;
  event_type: 'in-person' | 'online' | 'hybrid';
  location_name: string;
  location_address: string;
  city: string;
  district?: string;
  state?: string;
  pincode?: string;
  maps_url?: string;
  location_lat?: number;
  location_lng?: number;
  online_link?: string;
  start_at: string;
  end_at: string;
  timezone: string;
  capacity?: number;
  is_public: boolean;
  status: 'draft' | 'live' | 'past' | 'cancelled';
  ai_generated: boolean;
  faq: FAQItem[];
  speakers?: SpeakerItem[];
  agenda?: AgendaItem[];
  gallery?: string[];
  rsvp_form_config: RSVPFormConfig;
  whatsapp_caption?: string;
  instagram_caption?: string;
  created_at: string;
  updated_at: string;
}

export interface RSVPItem {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  plus_one_name?: string;
  dietary?: string;
  tshirt_size?: string;
  custom_responses?: Record<string, string | boolean>;
  created_at: string;
}

export interface CommentItem {
  id: string;
  event_id: string;
  author_name: string;
  author_email: string;
  author_avatar?: string;
  body: string;
  created_at: string;
}

export interface DatePollOption {
  id: string;
  date_label: string;
  votes: string[]; // array of emails
}

export interface DatePoll {
  id: string;
  organizer_id: string;
  organizer_name: string;
  organizer_handle: string;
  title: string;
  slug: string;
  description?: string;
  options: DatePollOption[];
  created_at: string;
}

export interface AICopyResult {
  description: string;
  tagline: string;
  whatsapp_caption: string;
  instagram_caption: string;
  faq: FAQItem[];
  rsvp_confirmation: string;
}

export interface FollowerItem {
  id: string;
  organizer_id: string;
  organizer_handle?: string;
  follower_id?: string;
  follower_name: string;
  follower_email: string;
  follower_avatar?: string;
  created_at: string;
}
