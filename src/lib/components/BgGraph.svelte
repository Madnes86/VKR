<script lang="ts">
    import { onMount } from 'svelte';

    let { density = 35, link = 140 }: { density?: number; link?: number } = $props();

    let canvas: HTMLCanvasElement | undefined = $state();

    onMount(() => {
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mobile = window.matchMedia('(max-width: 640px)').matches;
        const count = mobile ? Math.max(10, Math.round(density * 0.45)) : density;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        type Node = { x: number; y: number; vx: number; vy: number; r: number };
        let nodes: Node[] = [];
        let w = 0;
        let h = 0;

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
            nodes = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: 4 + Math.random() * 6
            }));
        }

        resize();
        spawn();

        const ro = new ResizeObserver(() => {
            const oldW = w;
            const oldH = h;
            resize();
            if (oldW === 0 || oldH === 0) return;
            for (const n of nodes) {
                n.x = (n.x / oldW) * w;
                n.y = (n.y / oldH) * h;
            }
        });
        ro.observe(canvas);

        let raf = 0;
        let running = !document.hidden;
        const onVis = () => {
            running = !document.hidden;
            if (running) raf = requestAnimationFrame(loop);
        };
        document.addEventListener('visibilitychange', onVis);

        function drawNode(n: Node) {
            const glow = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx!.fillStyle = glow;
            ctx!.beginPath();
            ctx!.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
            ctx!.fill();

            ctx!.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx!.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.stroke();
        }

        function loop() {
            if (!ctx || !running) return;
            ctx.clearRect(0, 0, w, h);

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i];
                    const b = nodes[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d = Math.hypot(dx, dy);
                    if (d < link) {
                        const alpha = (1 - d / link) * 0.55;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            for (const n of nodes) {
                if (!reduced) {
                    n.x += n.vx;
                    n.y += n.vy;
                    if (n.x < -20) n.x = w + 20;
                    else if (n.x > w + 20) n.x = -20;
                    if (n.y < -20) n.y = h + 20;
                    else if (n.y > h + 20) n.y = -20;
                }
                drawNode(n);
            }

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

<canvas bind:this={canvas} class="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true"></canvas>
