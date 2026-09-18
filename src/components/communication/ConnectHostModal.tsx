'use client';

import React from 'react';
import { EventItem } from '@/types';
import EventConversationModal from '@/components/communication/EventConversationModal';

interface ConnectHostModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  guestEmail?: string;
  guestName?: string;
}

/**
 * ConnectHostModal: Connect directly with the event host via secure in-app messaging.
 * Preserves organizer and attendee privacy with zero exposure of personal phone numbers.
 */
export default function ConnectHostModal({
  event,
  isOpen,
  onClose,
  guestEmail = '',
  guestName = '',
}: ConnectHostModalProps) {
  if (!isOpen || !event) return null;

  return (
    <EventConversationModal
      event={event}
      isOpen={isOpen}
      onClose={onClose}
      guestEmail={guestEmail}
      guestName={guestName}
    />
  );
}
