/**
 * Servicio de Telemetría y Rastreo para Google Analytics 4 (GA4)
 * Permite registrar vistas de página virtuales en Single Page Application (SPA),
 * medir permanencia en cada sección y rastrear eventos clave.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const GA_MEASUREMENT_ID = "G-T5CHHFL2N5";

/**
 * Registra un cambio de vista/página virtual en Google Analytics 4.
 * Sincroniza la barra de direcciones y envía el evento 'page_view' a GA4.
 */
export function trackPageView(pageTitle: string, pagePath: string) {
  if (typeof window === "undefined") return;

  // Actualizar la ruta visual en el navegador
  try {
    if (window.location.pathname !== pagePath) {
      window.history.replaceState(null, pageTitle, pagePath);
    }
  } catch (err) {
    // Silencioso ante restricciones de sandboxing
  }

  // Notificar a Google Analytics
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_title: pageTitle,
      page_location: window.location.origin + pagePath,
      page_path: pagePath,
      send_to: GA_MEASUREMENT_ID,
    });
  }
}

/**
 * Registra eventos de interacción específicos (ej. apertura de ficha de equipo, suscripciones, etc.)
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, {
      ...params,
      send_to: GA_MEASUREMENT_ID,
    });
  }
}
