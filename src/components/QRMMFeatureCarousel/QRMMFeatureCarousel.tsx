import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./QRMMFeatureCarousel.css";

interface Slide {
  id: string;
  img: string;
  tagEs: string;
  tagEn: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
}

const slides: Slide[] = [
  {
    id: "remote-desktop",
    img: "/showcase/remote-control-mockup.jpg",
    tagEs: "REMOTE DESKTOP",
    tagEn: "REMOTE DESKTOP",
    titleEs: "Control remoto web",
    titleEn: "Web Remote Control",
    descEs: "Conéctate a tus equipos directamente desde el navegador.",
    descEn: "Connect to your endpoints straight from the browser.",
  },
  {
    id: "rmm-monitoring",
    img: "/showcase/real-dashboard.png",
    tagEs: "RMM",
    tagEn: "RMM",
    titleEs: "Monitoreo en tiempo real",
    titleEn: "Real-time Monitoring",
    descEs: "CPU, RAM, discos, red y estado de tus equipos desde una sola consola.",
    descEn: "CPU, RAM, disks, network, and endpoint status from a single console.",
  },
  {
    id: "network-discovery",
    img: "/showcase/real-discovery.png",
    tagEs: "NETWORK DISCOVERY",
    tagEn: "NETWORK DISCOVERY",
    titleEs: "Descubre tu red",
    titleEn: "Discover your network",
    descEs: "Identifica dispositivos y servicios de tu infraestructura LAN.",
    descEn: "Identify devices and services across your LAN infrastructure.",
  },
  {
    id: "ai-health",
    img: "/showcase/real-ai-health.png",
    tagEs: "HEALTH SCORE / AIOPS",
    tagEn: "HEALTH SCORE / AIOPS",
    titleEs: "Detecta problemas antes de que ocurran",
    titleEn: "Detect problems before they occur",
    descEs: "Health Score, anomalías y diagnóstico inteligente para anticiparte.",
    descEn: "Health Score, anomalies, and intelligent diagnostics to stay ahead.",
  },
  {
    id: "inventory",
    img: "/showcase/real-device-modal.png",
    tagEs: "PERIPHERAL AUDIT",
    tagEn: "PERIPHERAL AUDIT",
    titleEs: "Conoce cada equipo",
    titleEn: "Know every endpoint",
    descEs: "Inventario y auditoría de hardware desde la misma consola.",
    descEn: "Hardware inventory and auditing right from the same console.",
  },
  {
    id: "msp",
    img: "/showcase/real-os-distribution.png",
    tagEs: "MULTI-TENANT / MSP",
    tagEn: "MULTI-TENANT / MSP",
    titleEs: "Gestiona múltiples clientes",
    titleEn: "Manage multiple clients",
    descEs: "Organizaciones separadas, técnicos y permisos desde una sola plataforma.",
    descEn: "Isolated organizations, technicians, and permissions from one platform.",
  },
];

interface Props {
  lang: "es" | "en";
}

export const QRMMFeatureCarousel: React.FC<Props> = ({ lang }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const total = slides.length;
  const timeoutRef = useRef<number | null>(null);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nextSlide = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setActiveIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (idx: number) => {
    setActiveIdx(idx);
  };

  // Autoplay
  useEffect(() => {
    if (reducedMotion) return; // No autoplay for reduced motion

    if (!isHovered) {
      timeoutRef.current = window.setTimeout(nextSlide, 4500);
    }
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [activeIdx, isHovered, nextSlide, reducedMotion]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) nextSlide();
    if (touchStart - touchEnd < -50) prevSlide();
  };

  const getSlideStyles = (index: number) => {
    let diff = (index - activeIdx + total) % total;
    if (diff > Math.floor(total / 2)) diff -= total;

    if (diff === 0) {
      return {
        transform: "translate3d(0, 0, 0) scale(1)",
        opacity: 1,
        zIndex: 10,
        filter: "blur(0px)",
      };
    }
    if (diff === 1) {
      return {
        transform: "translate3d(40%, 0, -100px) scale(0.85)",
        opacity: 0.65,
        zIndex: 5,
        filter: reducedMotion ? "none" : "blur(2px)",
      };
    }
    if (diff === -1) {
      return {
        transform: "translate3d(-40%, 0, -100px) scale(0.85)",
        opacity: 0.65,
        zIndex: 5,
        filter: reducedMotion ? "none" : "blur(2px)",
      };
    }
    if (diff > 1) {
      return {
        transform: "translate3d(70%, 0, -200px) scale(0.75)",
        opacity: 0.35,
        zIndex: 1,
        filter: reducedMotion ? "none" : "blur(4px)",
      };
    }
    if (diff < -1) {
      return {
        transform: "translate3d(-70%, 0, -200px) scale(0.75)",
        opacity: 0.35,
        zIndex: 1,
        filter: reducedMotion ? "none" : "blur(4px)",
      };
    }
    return {
      transform: "translate3d(0, 0, -300px) scale(0.5)",
      opacity: 0,
      zIndex: 0,
      filter: "blur(10px)",
    };
  };

  const currentSlide = slides[activeIdx];

  return (
    <div
      className="qrmm-carousel-section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="qrmm-carousel-header">
        <h2 className="qrmm-carousel-maintitle">
          {lang === "es"
            ? "Todo lo que necesitas para gestionar tu infraestructura."
            : "Everything you need to manage your infrastructure."}
        </h2>
      </div>

      <div
        className="qrmm-carousel-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="qrmm-carousel-scene">
          {slides.map((slide, index) => {
            const styles = getSlideStyles(index);
            const isActive = index === activeIdx;

            return (
              <div
                key={slide.id}
                className={`qrmm-carousel-card ${isActive ? "active" : ""}`}
                style={{
                  transform: styles.transform,
                  opacity: styles.opacity,
                  zIndex: styles.zIndex,
                  filter: styles.filter,
                }}
                onClick={() => !isActive && goToSlide(index)}
              >
                <div className="qrmm-carousel-img-wrapper">
                  <div className="qrmm-carousel-mac-header">
                    <span className="dot dot-red"></span>
                    <span className="dot dot-yel"></span>
                    <span className="dot dot-grn"></span>
                  </div>
                  <img
                    src={slide.img}
                    alt={lang === "es" ? slide.titleEs : slide.titleEn}
                    className="qrmm-carousel-img"
                    loading={isActive ? "eager" : "lazy"}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="qrmm-carousel-btn qrmm-carousel-btn-prev"
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          className="qrmm-carousel-btn qrmm-carousel-btn-next"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="qrmm-carousel-info-box">
        <span className="qrmm-carousel-tag">
          {lang === "es" ? currentSlide.tagEs : currentSlide.tagEn}
        </span>
        <h3 className="qrmm-carousel-title" key={`title-${activeIdx}`}>
          {lang === "es" ? currentSlide.titleEs : currentSlide.titleEn}
        </h3>
        <p className="qrmm-carousel-desc" key={`desc-${activeIdx}`}>
          {lang === "es" ? currentSlide.descEs : currentSlide.descEn}
        </p>
      </div>

      <div className="qrmm-carousel-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`qrmm-carousel-dot ${i === activeIdx ? "active" : ""}`}
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
