type EventCallback = (data: any) => void;
class DashboardSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectInterval = 3000;
  private isExplicitClose = false;
  public isConnected = false;
  private statusListeners: Set<(connected: boolean) => void> = new Set();
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    let url = import.meta.env.VITE_WS_BASE;
    if (!url && typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "qrmm.qhapana.com" || host.endsWith(".qhapana.com")) {
        url = "wss://qrmm-backend.qhapana.com/ws/v1/dashboard";
      } else {
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        const port = window.location.port === "5173" ? ":8000" : (window.location.port ? `:${window.location.port}` : "");
        url = `${proto}//${host}${port}/ws/v1/dashboard`;
      }
    }
    if (!url) url = "ws://localhost:8000/ws/v1/dashboard";
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.isConnected = true;
      this.notifyStatus(true);
      console.log("[WS Dashboard] Conectado al stream de tiempo real");
    };
    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const eventType = payload.event;
        const data = payload.data;
        if (eventType && this.listeners.has(eventType)) {
          this.listeners.get(eventType)?.forEach((cb) => cb(data));
        }
      } catch (err) {}
    };
    this.ws.onclose = () => {
      this.isConnected = false;
      this.notifyStatus(false);
      if (!this.isExplicitClose) setTimeout(() => this.connect(), this.reconnectInterval);
    };
    this.ws.onerror = (err) => console.warn("[WS Dashboard] Error:", err);
  }
  disconnect() {
    this.isExplicitClose = true;
    if (this.ws) this.ws.close();
  }
  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)?.add(callback);
    return () => { this.listeners.get(event)?.delete(callback); };
  }
  onStatusChange(callback: (connected: boolean) => void) {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => { this.statusListeners.delete(callback); };
  }
  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((cb) => cb(connected));
  }
}
export const dashboardSocket = new DashboardSocket();
