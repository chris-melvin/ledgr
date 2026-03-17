"use client";

import { animated, SpringValue, to } from "@react-spring/web";

interface CardDepthLayerProps {
  children: React.ReactNode;
  rotateX: SpringValue<number>;
  rotateY: SpringValue<number>;
  zOffset?: number;
  parallax?: number;
  className?: string;
}

export function CardDepthLayer({
  children,
  rotateX,
  rotateY,
  zOffset = 0,
  parallax = 0,
  className,
}: CardDepthLayerProps) {
  if (zOffset === 0 && parallax === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <animated.div
      className={className}
      style={{
        transform: to(
          [rotateX, rotateY],
          (rx, ry) => {
            // Counter-directional movement for parallax effect
            const tx = ry * parallax * -0.5;
            const ty = rx * parallax * 0.5;
            return `translateZ(${zOffset}px) translateX(${tx}px) translateY(${ty}px)`;
          }
        ),
      }}
    >
      {children}
    </animated.div>
  );
}
