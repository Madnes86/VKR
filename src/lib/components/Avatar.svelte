<script lang="ts">
    let {
        src = null,
        name = '',
        size = 32,
    }: {
        src?: string | null;
        name?: string;
        size?: number;
    } = $props();

    const initial = $derived((name?.trim().charAt(0) || '?').toUpperCase());
    const fontSize = $derived(Math.round(size / 2.4));
    let imageFailed = $state(false);

    // При смене src — сбрасываем флаг ошибки, чтобы новый URL получил
    // ещё один шанс отрисоваться.
    $effect(() => {
        src;
        imageFailed = false;
    });
</script>

{#if src && !imageFailed}
    <img
        src={src}
        alt={name}
        onerror={() => (imageFailed = true)}
        style="width: {size}px; height: {size}px"
        class="rounded-full object-cover shrink-0"
    />
{:else}
    <div
        aria-label={name}
        style="width: {size}px; height: {size}px; font-size: {fontSize}px"
        class="rounded-full bg-accent text-white font-semibold flex items-center justify-center shrink-0 select-none"
    >
        {initial}
    </div>
{/if}
