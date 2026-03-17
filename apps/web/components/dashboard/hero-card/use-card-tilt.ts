"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useSpring, SpringValue } from "@react-spring/web";
import { SPRING_PRESETS } from "@/lib/motion/config";

const MAX_TILT_DESKTOP = 15;
const MAX_TILT_MOBILE = 8;
const SCALE_HOVER = 1.03;

interface CardTiltResult {
  rotateX: SpringValue<number>;
  rotateY: SpringValue<number>;
  scale: SpringValue<number>;
  glareX: SpringValue<number>;
  glareY: SpringValue<number>;
  bind: {
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave: () => void;
    onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
    onTouchEnd: () => void;
  };
}

function getNormalized(
  clientX: number,
  clientY: number,
  rect: DOMRect
): { nx: number; ny: number } {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return {
    nx: (x / rect.width) * 2 - 1,   // -1 to 1
    ny: (y / rect.height) * 2 - 1,   // -1 to 1
  };
}

export function useCardTilt(enabled: boolean = true): CardTiltResult {
  const ref = useRef<DOMRect | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setIsMobile(window.innerWidth < 640);

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const isActive = enabled && !reducedMotion;
  const maxTilt = isMobile ? MAX_TILT_MOBILE : MAX_TILT_DESKTOP;

  const [springs, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    glareX: 0.5,
    glareY: 0.5,
    config: SPRING_PRESETS.gentle,
  }));

  const updateTilt = useCallback(
    (clientX: number, clientY: number, target: HTMLElement) => {
      if (!isActive) return;
      if (!ref.current) {
        ref.current = target.getBoundingClientRect();
      }
      const { nx, ny } = getNormalized(clientX, clientY, ref.current);
      api.start({
        rotateX: -ny * maxTilt,
        rotateY: nx * maxTilt,
        scale: SCALE_HOVER,
        glareX: (nx + 1) / 2,
        glareY: (ny + 1) / 2,
      });
    },
    [api, isActive, maxTilt]
  );

  const resetTilt = useCallback(() => {
    ref.current = null;
    api.start({ rotateX: 0, rotateY: 0, scale: 1, glareX: 0.5, glareY: 0.5 });
  }, [api]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      updateTilt(e.clientX, e.clientY, e.currentTarget);
    },
    [updateTilt]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (touch) {
        updateTilt(touch.clientX, touch.clientY, e.currentTarget);
      }
    },
    [updateTilt]
  );

  return {
    rotateX: springs.rotateX,
    rotateY: springs.rotateY,
    scale: springs.scale,
    glareX: springs.glareX,
    glareY: springs.glareY,
    bind: {
      onMouseMove,
      onMouseLeave: resetTilt,
      onTouchMove,
      onTouchEnd: resetTilt,
    },
  };
}
