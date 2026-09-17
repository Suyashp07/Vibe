'use client';

import React from 'react';
import { EventItem } from '@/types';
import EventConversationModal from '@/components/communication/EventConversationModal';

interface AskHostModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultName?: string;
}

/**
 * AskHostModal acts as a seamless wrapper over the interactive
 * Vibe Host ↔ Guest Communication Gateway (EventConversationModal).
 */
export default function AskHostModal({
  event,
  isOpen,
  onClose,
  defaultEmail = '',
  defaultName = ''
}: AskHostModalProps) {
  return (
    <EventConversationModal
      event={event}
      isOpen={isOpen}
      onClose={onClose}
      guestEmail={defaultEmail}
      guestName={defaultName}
    />
  );
}
