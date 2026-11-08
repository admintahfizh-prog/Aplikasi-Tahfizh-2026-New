import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // Subtle tilt angle in degrees (e.g. 1.5 to 2.5)
  perspective?: number; // Perspective distance in pixels
  glare?: boolean; // Dynamic soft specular light reflection
  glareOpacity?: number; // Max glare opacity
  elevation?: number; // Subtle hover lift in px (default 2.5)
  wobble?: boolean;
  as?: React.ElementType;
  disabled?: boolean;
}

/**
 * Card3D: Refined Micro-Motion Floating Card Component
 * - Subtle, gentle 3D tilt tracking (never distracting or shaky)
 * - Soft layered ambient floating shadows
 * - Smooth transition similar to scan hafalan & ummi buttons
 * - GPU Accelerated with RAF (requestAnimationFrame)
 * - Automatically respects prefers-reduced-motion and touch devices
 */
export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  maxTilt = 2.0,
  perspective = 1000,
  glare = false,
  glareOpacity = 0.08,
  elevation = 2.5,
  wobble = false,
  as: Component = 'div',
  disabled = false,
  style,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const target = useRef({
    rotateX: 0,
    rotateY: 0,
    translateY: 0,
    shadowX: 0,
    shadowY: 8,
    shadowBlur: 20,
    glareX: 50,
    glareY: 50,
    glareAlpha: 0,
  });

  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const touchQuery = window.matchMedia('(hover: none)');
    setIsTouchDevice(touchQuery.matches);
    const handleTouchChange = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    touchQuery.addEventListener('change', handleTouchChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      touchQuery.removeEventListener('change', handleTouchChange);
    };
  }, []);

  const updateTransform = useCallback(() => {
    if (disabled || prefersReducedMotion || isTouchDevice) return;

    const t = target.current;

    setCardStyle({
      transform: isHovered
        ? `perspective(${perspective}px) rotateX(${t.rotateX.toFixed(2)}deg) rotateY(${t.rotateY.toFixed(2)}deg) translateY(-${elevation}px) scale(1.004)`
        : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)`,
      boxShadow: isHovered
        ? `${t.shadowX.toFixed(1)}px ${t.shadowY.toFixed(1)}px ${t.shadowBlur.toFixed(1)}px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)`
        : `0 8px 24px -4px rgba(15, 23, 42, 0.07), 0 2px 6px -2px rgba(15, 23, 42, 0.04)`,
      transition: isHovered
        ? 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease-out',
      willChange: 'transform, box-shadow',
      transformStyle: 'preserve-3d',
    });

    if (glare) {
      setGlareStyle({
        opacity: t.glareAlpha,
        background: `radial-gradient(circle at ${t.glareX.toFixed(1)}% ${t.glareY.toFixed(1)}%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)`,
        transition: isHovered ? 'opacity 0.2s ease' : 'opacity 0.3s ease',
      });
    }
  }, [disabled, prefersReducedMotion, isTouchDevice, isHovered, perspective, elevation, glare]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove?.(e);
    if (disabled || prefersReducedMotion || isTouchDevice || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Relative offset from center: -1 to +1
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const normalizedX = (mouseX / width) * 2 - 1;
    const normalizedY = (mouseY / height) * 2 - 1;

    // Gentle micro-tilt without excessive shakiness or wobble
    target.current.rotateX = -normalizedY * maxTilt;
    target.current.rotateY = normalizedX * maxTilt;

    // Subtle dynamic shadow shift following light direction
    target.current.shadowX = -normalizedX * 8;
    target.current.shadowY = 10 - normalizedY * 5;
    target.current.shadowBlur = 20;

    target.current.glareX = (mouseX / width) * 100;
    target.current.glareY = (mouseY / height) * 100;
    target.current.glareAlpha = glareOpacity;

    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        updateTransform();
        rafId.current = null;
      });
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseEnter?.(e);
    if (disabled || prefersReducedMotion || isTouchDevice) return;
    setIsHovered(true);
    target.current.glareAlpha = glareOpacity;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseLeave?.(e);
    if (disabled || prefersReducedMotion || isTouchDevice) return;
    setIsHovered(false);

    target.current.rotateX = 0;
    target.current.rotateY = 0;
    target.current.translateY = 0;
    target.current.shadowX = 0;
    target.current.shadowY = 8;
    target.current.shadowBlur = 20;
    target.current.glareAlpha = 0;

    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        updateTransform();
        rafId.current = null;
      });
    }
  };

  useEffect(() => {
    updateTransform();
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isHovered, updateTransform]);

  const Comp = Component as any;

  return (
    <Comp
      ref={cardRef}
      className={`relative overflow-hidden transition-colors ${className}`}
      style={{
        ...style,
        ...cardStyle,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {glare && !prefersReducedMotion && !isTouchDevice && (
        <div
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
          style={glareStyle}
          aria-hidden="true"
        />
      )}
      {children}
    </Comp>
  );
};
