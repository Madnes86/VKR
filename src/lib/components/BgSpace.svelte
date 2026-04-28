<script lang="ts">
    import { onMount } from 'svelte';

    let { density = 220 }: { density?: number } = $props();

    let canvas: HTMLCanvasElement | undefined = $state();

    onMount(() => {
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mobile = window.matchMedia('(max-width: 640px)').matches;
        const count = mobile ? Math.max(80, Math.round(density * 0.55)) : density;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        type Star = { x: number; y: number; r: number; layer: number; phase: number; speed: number };
        type Comet = { x: number; y: number; vx: number; vy: number; life: number };

        let stars: Star[] = [];
        let comets: Comet[] = [];
        let w = 0;
        let h = 0;
        let nextComet = 6_000 + Math.random() * 8_000;
        let last = performance.now();

        function resize() {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            w = rect.width;
            h = rect.height;
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function spawn() {
            stars = Array.from({ length: count }, () => {
                const layer = Math.random() < 0.7 ? 0 : Math.random() < 0.85 ? 1 : 2;
                return {
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: layer === 2 ? 1.6 + Math.random() * 1.2 : layer === 1 ? 1 + Math.random() * 0.8 : 0.4 + Math.random() * 0.7,
                    layer,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.6 + Math.random() * 1.2
                };
            });
        }

        resize();
        spawn();

        const ro = new ResizeObserver(() => {
            const oldW = w;
            const oldH = h;
            resize();
            if (oldW === 0 || oldH === 0) return;
            for (const s of stars) {
                s.x = (s.x / oldW) * w;
                s.y = (s.y / oldH) * h;
            }
        });
        ro.observe(canvas);

        let raf = 0;
        let running = !document.hidden;
        const onVis = () => {
            running = !document.hidden;
            last = performance.now();
            if (running) raf = requestAnimationFrame(loop);
        };
        document.addEventListener('visibilitychange', onVis);

        function maybeSpawnComet(dt: number) {
            if (reduced) return;
            nextComet -= dt;
            if (nextComet > 0) return;
            nextComet = 8_000 + Math.random() * 12_000;
            const fromLeft = Math.random() < 0.5;
            const startX = fromLeft ? -50 : w + 50;
            const startY = Math.random() * h * 0.6;
            const angle = (fromLeft ? 1 : -1) * (0.25 + Math.random() * 0.35);
            const speed = 0.45 + Math.random() * 0.35;
            comets.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
                vy: Math.sin(angle) * speed,
                life: 1
            });
        }

        function loop(now: number = performance.now()) {
            if (!ctx || !running) return;
            const dt = Math.min(40, now - last);
            last = now;

            ctx.clearRect(0, 0, w, h);

            for (const s of stars) {
                if (!reduced) {
                    s.phase += dt * 0.002 * s.speed;
                    const drift = s.layer * 0.03;
                    s.x += drift;
                    if (s.x > w + 5) s.x = -5;
                }
                const tw = 0.55 + 0.45 * Math.sin(s.phase);
                const alpha = s.layer === 2 ? 0.85 * tw : s.layer === 1 ? 0.7 * tw : 0.45 * tw;
                if (s.layer === 2) {
                    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6);
                    grad.addColorStop(0, `rgba(255, 247, 220, ${alpha})`);
                    grad.addColorStop(0.4, `rgba(131, 92, 253, ${alpha * 0.4})`);
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.r * 6, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }

            maybeSpawnComet(dt);
            comets = comets.filter((c) => {
                c.x += c.vx * dt;
                c.y += c.vy * dt;
                c.life -= dt / 2200;
                if (c.life <= 0) return false;
                if (c.x < -200 || c.x > w + 200 || c.y < -200 || c.y > h + 200) return false;
                const tailX = c.x - c.vx * 90;
                const tailY = c.y - c.vy * 90;
                const grad = ctx!.createLinearGradient(c.x, c.y, tailX, tailY);
                grad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * c.life})`);
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx!.strokeStyle = grad;
                ctx!.lineWidth = 1.4;
                ctx!.beginPath();
                ctx!.moveTo(tailX, tailY);
                ctx!.lineTo(c.x, c.y);
                ctx!.stroke();
                return true;
            });

            raf = requestAnimationFrame(loop);
        }

        raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            document.removeEventListener('visibilitychange', onVis);
        };
    });
</script>

<div class="absolute inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
    <div class="absolute inset-0 nebula"></div>
    <canvas bind:this={canvas} class="absolute inset-0 w-full h-full"></canvas>
</div>

<style>
    .nebula {
        background:
            radial-gradient(ellipse at 18% 25%, rgba(131, 92, 253, 0.18), transparent 45%),
            radial-gradient(ellipse at 82% 75%, rgba(255, 247, 0, 0.07), transparent 40%),
            radial-gradient(ellipse at 50% 50%, rgba(131, 92, 253, 0.05), transparent 60%);
    }
</style>
