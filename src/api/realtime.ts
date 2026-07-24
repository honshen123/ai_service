import http from './request';
import type { ApiResponse } from '@/types/api';

export interface WsTicket {
  token: string;
  expires_in: number;
  ws_url: string;
}

export interface RealtimeEnvelope {
  event: string;
  message?: string;
  session_id?: number;
  payload?: Record<string, unknown>;
}

export async function fetchWsTicket(): Promise<WsTicket> {
  const { data } = await http.get<WsTicket>('/tenant/realtime/ws-ticket');
  return data.data;
}

export function resolveWsUrl(ticket: WsTicket): string {
  const base = (import.meta.env.VITE_WS_URL as string | undefined) || ticket.ws_url || 'ws://127.0.0.1:7272';
  const normalized = base.replace(/\/$/, '');
  return `${normalized}?token=${encodeURIComponent(ticket.token)}`;
}
