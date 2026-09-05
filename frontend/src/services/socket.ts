import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : 'http://localhost:5000');

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

let socket: Socket | null = null;
const statusListeners = new Set<(status: ConnectionStatus) => void>();
let currentStatus: ConnectionStatus = 'disconnected';

function notifyStatus(status: ConnectionStatus) {
  currentStatus = status;
  statusListeners.forEach((listener) => listener(status));
}

let currentRoomQuotationId: string | null = null;

/**
 * Initialize or retrieve the shared Socket.io client instance
 */
export function getSocket(): Socket {
  const token = localStorage.getItem('accessToken');

  if (!socket) {
    notifyStatus('connecting');
    socket = io(SOCKET_URL, {
      auth: (cb) => {
        cb({ token: localStorage.getItem('accessToken') });
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      notifyStatus('connected');
      // Re-join active room if set
      if (currentRoomQuotationId && socket) {
        socket.emit('join_negotiation', { quotationId: currentRoomQuotationId });
      }
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        socket?.connect();
      }
      notifyStatus('disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connect_error:', err.message);
      notifyStatus('reconnecting');
    });

    socket.on('reconnect_attempt', () => {
      notifyStatus('reconnecting');
    });

    socket.on('reconnect', () => {
      notifyStatus('connected');
      if (currentRoomQuotationId && socket) {
        socket.emit('join_negotiation', { quotationId: currentRoomQuotationId });
      }
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

/**
 * Track current room quotation ID for auto-rejoin on reconnect
 */
export function setActiveRoomQuotationId(quotationId: string | null): void {
  currentRoomQuotationId = quotationId;
}

/**
 * Subscribe to connection status changes
 */
export function onConnectionStatusChange(listener: (status: ConnectionStatus) => void): () => void {
  statusListeners.add(listener);
  listener(currentStatus);
  return () => {
    statusListeners.delete(listener);
  };
}

/**
 * Disconnect socket on logout or cleanup
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    notifyStatus('disconnected');
  }
}

/**
 * Join a quotation negotiation room
 */
export function joinNegotiation(quotationId: string): Promise<any> {
  const s = getSocket();
  return new Promise((resolve, reject) => {
    s.emit('join_negotiation', { quotationId }, (res: any) => {
      if (res?.error) {
        reject(new Error(res.error));
      } else {
        resolve(res);
      }
    });
  });
}

/**
 * Leave a quotation negotiation room
 */
export function leaveNegotiation(quotationId: string): void {
  if (socket && socket.connected) {
    socket.emit('leave_negotiation', { quotationId });
  }
}

/**
 * Send real-time chat message with ACK callback
 */
export function sendChatMessage(payload: {
  quotationId: string;
  message: string;
  quotationLineId?: string;
  clientMessageId?: string;
}): Promise<any> {
  const s = getSocket();
  return new Promise((resolve, reject) => {
    s.emit('send_message', payload, (res: any) => {
      if (res?.error) {
        reject(new Error(res.error));
      } else {
        resolve(res);
      }
    });
  });
}

/**
 * Submit counter-discount request via WebSocket
 */
export function sendCounterDiscountOffer(payload: {
  quotationId: string;
  requestedDiscountPercent: number;
  notes?: string;
  message?: string;
  quotationLineId?: string;
}): Promise<any> {
  const s = getSocket();
  return new Promise((resolve, reject) => {
    s.emit('request_counter_discount', payload, (res: any) => {
      if (res?.error) {
        reject(new Error(res.error));
      } else {
        resolve(res);
      }
    });
  });
}

/**
 * Broadcast typing state (ephemeral)
 */
export function emitTyping(quotationId: string, isTyping: boolean): void {
  const s = getSocket();
  s.emit('typing', { quotationId, isTyping });
}
