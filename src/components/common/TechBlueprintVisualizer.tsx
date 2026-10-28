import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export type TechMode = 'database' | 'aircraft' | 'neural' | 'quantum';

interface TechBlueprintVisualizerProps {
  mode: TechMode | number;
  className?: string;
  interactive?: boolean;
}

export const TechBlueprintVisualizer: React.FC<TechBlueprintVisualizerProps> = ({
  mode,
  className = '',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Resolve numerical tabIndex to TechMode
  const activeMode: TechMode = typeof mode === 'number' 
    ? (['database', 'aircraft', 'neural', 'quantum'][mode % 4] as TechMode)
    : mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || 600);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio || 300);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    const displayWidth = canvas.offsetWidth || 600;
    const displayHeight = canvas.offsetHeight || 300;

    let time = 0;
    let localMouseX = displayWidth / 2;
    let localMouseY = displayHeight / 2;
    let targetMouseX = localMouseX;
    let targetMouseY = localMouseY;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
      setMousePos({ x: targetMouseX, y: targetMouseY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Particle pool for dynamic effects
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * displayWidth,
      y: Math.random() * displayHeight,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI,
    }));

    const render = () => {
      time += 0.025;
      localMouseX += (targetMouseX - localMouseX) * 0.06;
      localMouseY += (targetMouseY - localMouseY) * 0.06;

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Background subtle grid
      ctx.strokeStyle = 'rgba(141, 255, 203, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < displayWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayHeight);
        ctx.stroke();
      }
      for (let y = 0; y < displayHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
        ctx.stroke();
      }

      // Draw mode-specific technical blueprints
      if (activeMode === 'database') {
        drawDatabaseSchema(ctx, displayWidth, displayHeight, time, localMouseX, localMouseY);
      } else if (activeMode === 'aircraft') {
        drawAerospaceCAD(ctx, displayWidth, displayHeight, time, localMouseX, localMouseY);
      } else if (activeMode === 'neural') {
        drawNeuralNetwork(ctx, displayWidth, displayHeight, time, localMouseX, localMouseY);
      } else {
        drawQuantumInterface(ctx, displayWidth, displayHeight, time, localMouseX, localMouseY);
      }

      // Ambient dynamic glowing particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = displayWidth;
        if (p.x > displayWidth) p.x = 0;
        if (p.y < 0) p.y = displayHeight;
        if (p.y > displayHeight) p.y = 0;
        p.pulse += 0.04;

        const currentAlpha = Math.sin(p.pulse) * 0.3 + 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(141, 255, 203, ${currentAlpha * 0.6})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [activeMode, interactive]);

  // 1. DATABASE SCHEMA TOPOLOGY
  const drawDatabaseSchema = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    mx: number,
    my: number
  ) => {
    const cx = w / 2;
    const cy = h / 2;

    // Central Database Cylinder
    ctx.save();
    ctx.translate(cx, cy);

    // Rotating outer ring
    ctx.beginPath();
    ctx.arc(0, 0, 75 + Math.sin(t) * 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(141, 255, 203, 0.25)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Central PostgreSQL Core Discs
    for (let i = -2; i <= 2; i++) {
      const yOffset = i * 14;
      ctx.beginPath();
      ctx.ellipse(0, yOffset, 38, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? 'rgba(141, 255, 203, 0.22)' : 'rgba(141, 255, 203, 0.08)';
      ctx.fill();
      ctx.strokeStyle = '#8DFFCB';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Central Pulse Dot
    ctx.beginPath();
    ctx.arc(0, 0, 4 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
    ctx.fillStyle = '#8DFFCB';
    ctx.shadowColor = '#8DFFCB';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Surrounding Schema Nodes
    const nodes = [
      { label: 'PROFILES (PK)', x: cx - 180, y: cy - 65, color: '#8DFFCB' },
      { label: 'SUBSCRIPTIONS (FK)', x: cx + 180, y: cy - 65, color: '#D9FF72' },
      { label: 'INVOICES (ACID)', x: cx + 160, y: cy + 70, color: '#8DFFCB' },
      { label: 'USAGE_EVENTS', x: cx - 160, y: cy + 70, color: '#8DFFCB' },
    ];

    nodes.forEach((node, i) => {
      // Connecting circuit lines
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.quadraticCurveTo(cx, node.y, cx, cy);
      ctx.strokeStyle = 'rgba(141, 255, 203, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Traveling data packet
      const packetT = (t * 0.6 + i * 0.25) % 1;
      const px = node.x + (cx - node.x) * packetT;
      const py = node.y + (cy - node.y) * packetT;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#D9FF72';
      ctx.shadowColor = '#D9FF72';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Node Box
      ctx.fillStyle = 'rgba(13, 25, 25, 0.9)';
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(node.x - 65, node.y - 15, 130, 30, 6);
      ctx.fill();
      ctx.stroke();

      // Node text
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = node.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });

    // Technical HUD overlay text
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(141, 255, 203, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('TOPOLOGY: 3NF RELATIONAL CLUSTER', 16, 24);
    ctx.fillText('FOREIGN KEYS: 100% ENFORCED', 16, 38);
    ctx.textAlign = 'right';
    ctx.fillText('CONCURRENCY: ROW-LEVEL LOCKS', w - 16, 24);
    ctx.fillText(`TRANSACTION ISOLATION: SERIALIZABLE`, w - 16, 38);
  };

  // 2. AEROSPACE CAD BLUEPRINT (AIRCRAFT VECTOR WIREFRAME)
  const drawAerospaceCAD = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    mx: number,
    my: number
  ) => {
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w / 640, h / 300) * 0.85;

    ctx.save();
    ctx.translate(cx, cy);

    // Subtle pitch/roll response to mouse
    const rollAngle = ((mx - cx) / w) * 0.25;
    const pitchOffset = ((my - cy) / h) * 15;
    ctx.rotate(rollAngle);
    ctx.translate(0, pitchOffset);

    // Outer HUD Radar Rings
    ctx.beginPath();
    ctx.arc(0, 0, 110, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(141, 255, 203, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pitch Ladder Lines
    for (let p = -2; p <= 2; p++) {
      if (p === 0) continue;
      const py = p * 32;
      ctx.beginPath();
      ctx.moveTo(-35, py);
      ctx.lineTo(35, py);
      ctx.strokeStyle = 'rgba(141, 255, 203, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(141, 255, 203, 0.4)';
      ctx.fillText(`${Math.abs(p) * 10}°`, 42, py + 3);
    }

    // AIRCRAFT WIREFRAME (Supersonic Delta Fighter Silhouette)
    ctx.strokeStyle = '#8DFFCB';
    ctx.lineWidth = 1.8;
    ctx.fillStyle = 'rgba(13, 25, 25, 0.6)';

    ctx.beginPath();
    // Nose cone
    ctx.moveTo(0, -95 * scale);
    // Right canopy & strake
    ctx.lineTo(12 * scale, -45 * scale);
    ctx.lineTo(18 * scale, -15 * scale);
    // Right wing tip
    ctx.lineTo(140 * scale, 35 * scale);
    // Right elevon & wing trailing edge
    ctx.lineTo(110 * scale, 55 * scale);
    ctx.lineTo(35 * scale, 45 * scale);
    // Right engine exhaust
    ctx.lineTo(22 * scale, 75 * scale);
    ctx.lineTo(8 * scale, 75 * scale);
    // Center fuselage tail notch
    ctx.lineTo(0, 68 * scale);
    // Left engine exhaust
    ctx.lineTo(-8 * scale, 75 * scale);
    ctx.lineTo(-22 * scale, 75 * scale);
    // Left trailing edge
    ctx.lineTo(-35 * scale, 45 * scale);
    ctx.lineTo(-110 * scale, 55 * scale);
    // Left wing tip
    ctx.lineTo(-140 * scale, 35 * scale);
    // Left canopy & strake
    ctx.lineTo(-18 * scale, -15 * scale);
    ctx.lineTo(-12 * scale, -45 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin Vertical Stabilizers (Fins)
    ctx.beginPath();
    ctx.moveTo(18 * scale, 10 * scale);
    ctx.lineTo(26 * scale, 55 * scale);
    ctx.moveTo(-18 * scale, 10 * scale);
    ctx.lineTo(-26 * scale, 55 * scale);
    ctx.strokeStyle = '#D9FF72';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Cockpit Canopy Glass Highlight
    ctx.beginPath();
    ctx.ellipse(0, -32 * scale, 6 * scale, 22 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(141, 255, 203, 0.35)';
    ctx.fill();
    ctx.strokeStyle = '#8DFFCB';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Animated Afterburner Thrust Jets
    const thrustLen = 35 + Math.sin(t * 12) * 12;
    const gradient = ctx.createLinearGradient(0, 75 * scale, 0, (75 + thrustLen) * scale);
    gradient.addColorStop(0, '#8DFFCB');
    gradient.addColorStop(0.5, '#D9FF72');
    gradient.addColorStop(1, 'rgba(0, 255, 170, 0)');

    // Left Afterburner Flame
    ctx.beginPath();
    ctx.moveTo(-15 * scale, 75 * scale);
    ctx.lineTo(-11 * scale, (75 + thrustLen) * scale);
    ctx.lineTo(-7 * scale, 75 * scale);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Right Afterburner Flame
    ctx.beginPath();
    ctx.moveTo(7 * scale, 75 * scale);
    ctx.lineTo(11 * scale, (75 + thrustLen) * scale);
    ctx.lineTo(15 * scale, 75 * scale);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Mach / Shockwave Ring
    ctx.beginPath();
    const shockR = (t * 80) % 180;
    ctx.ellipse(0, -95 * scale + shockR * 0.4, shockR * 1.2, shockR * 0.4, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(141, 255, 203, ${Math.max(0, 0.4 - shockR / 180)})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // HUD Telemetry Overlay
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#8DFFCB';
    ctx.textAlign = 'left';
    ctx.fillText('PROPULSION: MACH 3.42 HYPERSONIC', 16, 24);
    ctx.fillText('ALTITUDE: 64,800 FT • THRUST: 98.6%', 16, 38);
    ctx.fillText('LATENCY: 1.2ms CONCURRENT EXEC', 16, 52);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#D9FF72';
    ctx.fillText('VECTOR LOCK: STABLE', w - 16, 24);
    ctx.fillText('THROUGHPUT: 45,000 TPS', w - 16, 38);
    ctx.fillText('IDEMPOTENCY: ACTIVE', w - 16, 52);
  };

  // 3. NEURAL NETWORK & RETENTION INTELLIGENCE
  const drawNeuralNetwork = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    mx: number,
    my: number
  ) => {
    const layers = [3, 5, 5, 2];
    const layerNames = ['INPUT (7-D)', 'CONV / RELU', 'DECISION TREE', 'CHURN RISK'];
    const layerX = [w * 0.18, w * 0.40, w * 0.62, w * 0.84];

    // Compute node coordinates
    const nodeCoords: Array<Array<{ x: number; y: number }>> = [];
    layers.forEach((count, lIdx) => {
      const coords: Array<{ x: number; y: number }> = [];
      const x = layerX[lIdx];
      const spacing = h / (count + 1);
      for (let i = 1; i <= count; i++) {
        coords.push({ x, y: i * spacing });
      }
      nodeCoords.push(coords);
    });

    // Draw Synaptic Connections
    for (let l = 0; l < nodeCoords.length - 1; l++) {
      const fromNodes = nodeCoords[l];
      const toNodes = nodeCoords[l + 1];

      fromNodes.forEach((from, fIdx) => {
        toNodes.forEach((to, tIdx) => {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = 'rgba(141, 255, 203, 0.08)';
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Action Potential / Signal pulse
          const signalT = (t * 0.8 + (fIdx + tIdx) * 0.15) % 1;
          const sx = from.x + (to.x - from.x) * signalT;
          const sy = from.y + (to.y - from.y) * signalT;
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#8DFFCB';
          ctx.shadowColor = '#8DFFCB';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      });
    }

    // Draw Nodes
    nodeCoords.forEach((layer, lIdx) => {
      layer.forEach((node, nIdx) => {
        const isOutput = lIdx === nodeCoords.length - 1;
        const radius = isOutput ? 12 : 7;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isOutput ? (nIdx === 0 ? 'rgba(141, 255, 203, 0.3)' : 'rgba(255, 107, 107, 0.3)') : 'rgba(13, 25, 25, 0.9)';
        ctx.fill();
        ctx.strokeStyle = isOutput ? (nIdx === 0 ? '#8DFFCB' : '#FF6B6B') : '#8DFFCB';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (isOutput) {
          ctx.font = '8px JetBrains Mono, monospace';
          ctx.fillStyle = nIdx === 0 ? '#8DFFCB' : '#FF6B6B';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(nIdx === 0 ? 'RETAIN' : 'CHURN', node.x, node.y);
        }
      });

      // Layer headers
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(141, 255, 203, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText(layerNames[lIdx], layerX[lIdx], 20);
    });

    // Telemetry Box
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#D9FF72';
    ctx.textAlign = 'left';
    ctx.fillText('MODEL: RANDOM FOREST + LOGISTIC ENSEMBLE', 16, h - 28);
    ctx.fillText('ISOTONIC CALIBRATION: ROC-AUC = 0.9124', 16, h - 14);
    ctx.textAlign = 'right';
    ctx.fillText('TRAIN/TEST SPLIT: 80/20 (NO LEAKAGE)', w - 16, h - 14);
  };

  // 4. QUANTUM INTERFACE & HOLOGRAPHIC SCANNER
  const drawQuantumInterface = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    mx: number,
    my: number
  ) => {
    const cx = w / 2;
    const cy = h / 2;

    // Laser vertical scan line
    const scanY = (t * 70) % h;
    const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY);
    scanGrad.addColorStop(0, 'rgba(141, 255, 203, 0)');
    scanGrad.addColorStop(1, 'rgba(141, 255, 203, 0.25)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 20, w, 20);

    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(w, scanY);
    ctx.strokeStyle = '#8DFFCB';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#8DFFCB';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Isometric 3D Holographic Cube
    ctx.save();
    ctx.translate(cx, cy);
    const cubeSize = 55;
    const rot = t * 0.6;

    const vertices = [
      { x: -cubeSize, y: -cubeSize, z: -cubeSize },
      { x: cubeSize, y: -cubeSize, z: -cubeSize },
      { x: cubeSize, y: cubeSize, z: -cubeSize },
      { x: -cubeSize, y: cubeSize, z: -cubeSize },
      { x: -cubeSize, y: -cubeSize, z: cubeSize },
      { x: cubeSize, y: -cubeSize, z: cubeSize },
      { x: cubeSize, y: cubeSize, z: cubeSize },
      { x: -cubeSize, y: cubeSize, z: cubeSize },
    ];

    // Simple 3D projection
    const projected = vertices.map((v) => {
      const cosY = Math.cos(rot);
      const sinY = Math.sin(rot);
      const cosX = Math.cos(0.5);
      const sinX = Math.sin(0.5);

      const x1 = v.x * cosY + v.z * sinY;
      const z1 = -v.x * sinY + v.z * cosY;
      const y2 = v.y * cosX - z1 * sinX;
      const z2 = v.y * sinX + z1 * cosX;

      const fov = 350;
      const scale = fov / (fov + z2);
      return { x: x1 * scale, y: y2 * scale };
    });

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    ctx.strokeStyle = '#8DFFCB';
    ctx.lineWidth = 1.2;
    edges.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(projected[i].x, projected[i].y);
      ctx.lineTo(projected[j].x, projected[j].y);
      ctx.stroke();
    });

    ctx.restore();

    // Orbital Compass Tick Reticles
    ctx.beginPath();
    ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(141, 255, 203, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const x1 = cx + Math.cos(rad) * 92;
      const y1 = cy + Math.sin(rad) * 92;
      const x2 = cx + Math.cos(rad) * 98;
      const y2 = cy + Math.sin(rad) * 98;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(141, 255, 203, 0.4)';
      ctx.stroke();
    }

    // Telemetry text
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#8DFFCB';
    ctx.textAlign = 'left';
    ctx.fillText('HOLOGRAPHIC INTERFACE: REACT 19 + FIBER', 16, 24);
    ctx.fillText('RENDER VELOCITY: 120 FPS • ZERO LATENCY', 16, 38);
    ctx.textAlign = 'right';
    ctx.fillText('OPTICAL GLASSMORPHISM: GPU ACTIVE', w - 16, 24);
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
};
