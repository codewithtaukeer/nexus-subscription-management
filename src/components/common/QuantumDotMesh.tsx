import React, { useEffect, useRef } from 'react';

interface QuantumDotMeshProps {
  className?: string;
  density?: number;
  interactive?: boolean;
}

export const QuantumDotMesh: React.FC<QuantumDotMeshProps> = ({
  className = '',
  density = 28,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const render = () => {
      time += 0.015;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.floor(width / density);
      const rows = Math.floor(height / density);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = (i + 0.5) * density;
          const y = (j + 0.5) * density;

          // Distances from mouse
          const dx = x - mouseX;
          const dy = y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Wave equation
          const wave = Math.sin(i * 0.2 + time) * Math.cos(j * 0.2 + time * 0.8);
          const mouseInfluence = Math.max(0, 1 - dist / 180);

          const radius = 1.0 + wave * 0.8 + mouseInfluence * 2.5;
          const alpha = 0.08 + Math.abs(wave) * 0.25 + mouseInfluence * 0.45;

          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.6, radius), 0, Math.PI * 2);
          
          if (mouseInfluence > 0.3) {
            ctx.fillStyle = `rgba(141, 255, 203, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(180, 220, 215, ${alpha})`;
          }
          ctx.fill();

          // Rare connective micro-lines
          if (mouseInfluence > 0.4 && (i + j) % 3 === 0) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(mouseX, mouseY);
            ctx.strokeStyle = `rgba(141, 255, 203, ${mouseInfluence * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [density, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-none opacity-80 ${className}`}
    />
  );
};
