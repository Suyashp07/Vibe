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
  is_flash?: boolean;
  flash_activity?: string;
  whatsapp_host_phone?: string;
  vibe_cheers_count?: number;
  flash_tags?: string[];
  spots_limit?: number;
  spots_filled?: number;
  [key: string]: any;
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
  ask_phone?: boolean;
  waitlist_enabled: boolean;
  approval_required?: boolean;
  confirmation_message: string;
  custom_fields?: CustomFieldConfig[];
  custom_questions?: string[];
  is_private?: boolean;
  visibility?: 'public' | 'private';
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
  is_private?: boolean;
  visibility?: 'public' | 'private';
  status: 'draft' | 'live' | 'past' | 'cancelled';
  ai_generated: boolean;
  faq: FAQItem[];
  speakers?: SpeakerItem[];
  agenda?: AgendaItem[];
  gallery?: string[];
  rsvp_form_config: RSVPFormConfig;
  whatsapp_caption?: string;
  instagram_caption?: string;
  source_type?: 'native' | 'external';
  is_external?: boolean;
  source_platform?: 'district' | 'unstop' | 'bookmyshow' | 'insider' | 'luma' | 'telegram' | 'manual' | string;
  external_ticket_url?: string;
  external_price_text?: string;
  category?: string;
  confidence_score?: number;
  is_flash?: boolean;
  flash_activity?: 'cricket' | 'football' | 'badminton' | 'pickleball' | 'coffee' | 'games' | 'music' | 'sprint' | 'other' | string;
  spots_limit?: number;
  spots_filled?: number;
  whatsapp_host_phone?: string;
  vibe_cheers_count?: number;
  flash_tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface RSVPItem {
  id: string;
  event_id: string;
  event_slug?: string;
  name: string;
  email: string;
  guest_name?: string;
  guest_email?: string;
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

export interface EventAnnouncement {
  id: string;
  event_id: string;
  organizer_id?: string;
  title: string;
  message: string;
  target_audience: 'all' | 'confirmed' | 'waitlisted';
  is_urgent?: boolean;
  send_email?: boolean;
  created_at: string;
}

export interface EventDirectMessage {
  id: string;
  event_id: string;
  sender_role: 'guest' | 'host';
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  rsvp_id?: string;
  subject?: string;
  message: string;
  is_read?: boolean;
  parent_id?: string;
  created_at: string;
}

export type ConversationStatus = 'OPEN' | 'CLOSED' | 'BLOCKED';
export type CommunicationChannel = 'WEB' | 'TELEGRAM' | 'WHATSAPP';
export type MessageSenderRole = 'GUEST' | 'HOST' | 'SYSTEM';
export type MessageDeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface Conversation {
  id: string;
  event_id: string;
  guest_id: string;
  host_id: string;
  guest_name?: string;
  guest_email?: string;
  status: ConversationStatus;
  guest_channel: CommunicationChannel;
  host_channel: CommunicationChannel;
  telegram_chat_id?: string | number | null;
  telegram_topic_id?: string | number | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  event_id: string;
  sender_id: string;
  sender_role: MessageSenderRole;
  content: string;
  channel: CommunicationChannel;
  external_message_id?: string | number | null;
  reply_to_message_id?: string | null;
  created_at: string;
  delivery_status: MessageDeliveryStatus;
}
