export interface IncomingMessage {
  instanceId: string;
  tenantId: string;
  from: string;
  participant?: string;
  isFromMe?: boolean;
  text: string;
  timestamp: number;
  messageType: MessageType;
  mediaUrl?: string;
  quotedMessage?: string;
}

export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'sticker';

export interface MenuOption {
  id: string;
  title: string;
  description?: string;
}

import { BotState } from './state';

export interface BotResponse {
  messages: string[];
  media?: MediaAttachment;
  nextState: BotState;
}

export interface MediaAttachment {
  type: 'image' | 'document' | 'audio';
  path: string;
  caption?: string;
}
