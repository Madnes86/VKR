<script lang="ts">
    import { onMount } from 'svelte';

    let { density = 35, link = 140 }: { density?: number; link?: number } = $props();

    let canvas: HTMLCanvasElement | undefined = $state();

    let hoverName = $state('');
    let hoverX = $state(0);
    let hoverY = $state(0);
    let hoverR = $state(0);
    let showName = $state(false);

    const NAMES = [
        'User', 'Auth', 'Database', 'Cache', 'Queue', 'API', 'Worker', 'Gateway',
        'Logger', 'Config', 'Router', 'Schema', 'Token', 'Session', 'Request', 'Response',
        'Service', 'Module', 'Component', 'Entity', 'Store', 'View', 'Model', 'Layer',
        'Node', 'Graph', 'System', 'Client', 'Server', 'Job', 'Task', 'Stream',
        'Event', 'Hook', 'Engine', 'Bus', 'Mapper', 'Repo'
    ];

    onMount(() => {
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mobile = window.matchMedia('(max-width: 640px)').matches;
        const count = mobile ? Math.max(10, Math.round(density * 0.45)) : density;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        type Node = { x: number; y: number; vx: number; vy: number; r: number; name: string };
        let nodes: Node[] = [];
        let w = 0;
        let h = 0;
        let mouseX = -9999;
        let mouseY = -9999;
        let overContent = false;
        let hoveredIdx = -1;

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
            nodes = Array.from({ length: count }, (_, i) => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: 9 + Math.random() * 7,
                name: NAMES[(Math.floor(Math.random() * NAMES.length) + i) % NAMES.length]
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

        function onMouseMove(e: MouseEvent) {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
            const el = document.elementFromPoint(e.clientX, e.clientY);
            overContent = !!el?.closest('.bg-gray-glass, button, a, input, textarea');
        }
        function onMouseOut() {
            mouseX = -9999;
            mouseY = -9999;
        }

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mouseout', onMouseOut);

        let raf = 0;
        let running = !document.hidden;
        const onVis = () => {
            running = !document.hidden;
            if (running) raf = requestAnimationFrame(loop);
        };
        document.addEventListener('visibilitychange', onVis);

        function drawNode(n: Node, hovered: boolean) {
            if (hovered) {
                ctx!.fillStyle = '#835CFD';
                ctx!.strokeStyle = '#835CFD';
                ctx!.lineWidth = 1.5;
            } else {
                ctx!.fillStyle = '#000';
                ctx!.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx!.lineWidth = 1;
            }
            ctx!.beginPath();
            ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.stroke();

            if (!hovered) {
                ctx!.strokeStyle = 'rgba(0, 0, 0, 0.9)';
                ctx!.lineWidth = 1;
                ctx!.beginPath();
                ctx!.arc(n.x, n.y, n.r + 1.5, 0, Math.PI * 2);
                ctx!.stroke();
            } else {
                ctx!.strokeStyle = 'rgba(131, 92, 253, 0.45)';
                ctx!.lineWidth = 4;
                ctx!.beginPath();
                ctx!.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2);
                ctx!.stroke();
            }
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
                        const alpha = (1 - d / link) * 0.5;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            let newHover = -1;
            let bestDist = Infinity;
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                if (!reduced) {
                    n.x += n.vx;
                    n.y += n.vy;
                    if (n.x < -20) n.x = w + 20;
                    else if (n.x > w + 20) n.x = -20;
                    if (n.y < -20) n.y = h + 20;
                    else if (n.y > h + 20) n.y = -20;
                }
                if (!overContent) {
                    const dx = n.x - mouseX;
                    const dy = n.y - mouseY;
                    const dist = Math.hypot(dx, dy);
                    if (dist < n.r + 4 && dist < bestDist) {
                        bestDist = dist;
                        newHover = i;
                    }
                }
            }

            for (let i = 0; i < nodes.length; i++) {
                drawNode(nodes[i], i === newHover);
            }

            if (newHover !== hoveredIdx) {
                hoveredIdx = newHover;
                if (newHover === -1) {
                    showName = false;
                } else {
                    hoverName = nodes[newHover].name;
                }
            }
            if (newHover !== -1) {
                const n = nodes[newHover];
                hoverX = n.x;
                hoverY = n.y;
                hoverR = n.r;
                showName = true;
            }

            raf = requestAnimationFrame(loop);
        }

        raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseout', onMouseOut);
        };
    });
</script>

<div class="absolute inset-0 pointer-events-none" aria-hidden="true">
    <canvas bind:this={canvas} class="absolute inset-0 w-full h-full"></canvas>
    {#if showName}
        <div
            class="absolute -translate-x-1/2 text-border whitespace-nowrap select-none text-sm"
            style="left: {hoverX}px; top: {hoverY - hoverR - 22}px;">
            {hoverName}
        </div>
    {/if}
</div>
