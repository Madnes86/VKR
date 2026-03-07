<script lang="ts">

    let {
        id,
        name,
        x1,
        y1,
        x2,
        y2
    } : {
        id: number;
        name: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    } = $props();

    let midX: number = $derived((x1 + x2) / 2);
    let midY: number = $derived((y1 + y2) / 2);

</script>

<div>

</div>

<svg class="absolute top-0 left-0 size-full -z-1">
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke=white stroke-width={1} stroke-linecap="round" />
</svg>
<span style="left: {midX}px; top: {midY}px" class="absolute text-border z-2 -translate-1/2">
    {name}
</span>