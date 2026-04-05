"use client";

import { useEffect, useRef } from "react";

const NODES = [
  { label: "Leads", angle: -90, r: 140 },
  { label: "Email", angle: -30, r: 140 },
  { label: "WhatsApp", angle: 30, r: 140 },
  { label: "Calls", angle: 90, r: 140 },
  { label: "Campaigns", angle: 150, r: 140 },
  { label: "Clients", angle: 210, r: 140 },
];

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export default function HeroNode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const SIZE = 340;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    // Particle system
    type Particle = { node: number; t: number; speed: number; opacity: number };
    const particles: Particle[] = [];
    NODES.forEach((_, i) => {
      for (let p = 0; p < 2; p++) {
        particles.push({
          node: i,
          t: Math.random(),
          speed: 0.003 + Math.random() * 0.002,
          opacity: 0.4 + Math.random() * 0.4,
        });
      }
    });

    function draw(time: number) {
      timeRef.current = time;
      ctx.clearRect(0, 0, SIZE, SIZE);

      NODES.forEach((n) => {
        const nx = cx + n.r * Math.cos(toRad(n.angle));
        const ny = cy + n.r * Math.sin(toRad(n.angle));

        // Line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = "rgba(10,10,10,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Animate particles
      particles.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1) p.t -= 1;
        const n = NODES[p.node];
        const nx = cx + n.r * Math.cos(toRad(n.angle));
        const ny = cy + n.r * Math.sin(toRad(n.angle));

        // Bidirectional: even go out, odd come in
        const tt = p.node % 2 === 0 ? p.t : 1 - p.t;
        const px = cx + (nx - cx) * tt;
        const py = cy + (ny - cy) * tt;

        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(10,10,10,${p.opacity})`;
        ctx.fill();
      });

      // Outer nodes
      NODES.forEach((n) => {
        const nx = cx + n.r * Math.cos(toRad(n.angle));
        const ny = cy + n.r * Math.sin(toRad(n.angle));

        // Node circle
        ctx.beginPath();
        ctx.arc(nx, ny, 22, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fill();
        ctx.strokeStyle = "rgba(10,10,10,0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#0a0a0a";
        ctx.font = "500 9.5px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, nx, ny);
      });

      // Center pulse ring
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.0015);
      const ringR = 30 + pulse * 5;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(10,10,10,${0.06 - pulse * 0.04})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Center node
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0a0a";
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "600 8px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("AIVANTS", cx, cy - 4);
      ctx.font = "400 6.5px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("AI CORE", cx, cy + 5);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="opacity-90"
        style={{ width: 340, height: 340 }}
      />
    </div>
  );
}
