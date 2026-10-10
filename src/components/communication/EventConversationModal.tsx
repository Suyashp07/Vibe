'use client';

import React from 'react';
import { EventItem } from '@/types';
import ConnectHostModal from '@/components/communication/ConnectHostModal';

interface EventConversationModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  guestName?: string;
  guestEmail?: string;
}

/**
 * EventConversationModal: Delegates directly to ConnectHostModal
 * to display the unified "Upcoming Feature" announcement popup and disable messaging.
 */
export default function EventConversationModal({
  event,
  isOpen,
  onClose,
  guestName,
  guestEmail,
}: EventConversationModalProps) {
  return (
    <ConnectHostModal
      event={event}
      isOpen={isOpen}
      onClose={onClose}
      guestName={guestName}
      guestEmail={guestEmail}
    />
  );
}
