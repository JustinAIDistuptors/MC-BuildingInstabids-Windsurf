'use client';

import React from 'react';
import SimpleMessaging, { SimpleMessagingProps } from './SimpleMessaging';

// Ensure we use the same props interface as SimpleMessaging
type SimpleBidCardMessagingProps = SimpleMessagingProps;

/**
 * A wrapper component for SimpleMessaging that can be used in the bid card
 */
export default function SimpleBidCardMessaging({ projectId, projectTitle }: SimpleBidCardMessagingProps) {
  return (
    <div className="w-full">
      <SimpleMessaging projectId={projectId} projectTitle={projectTitle} />
    </div>
  );
}
