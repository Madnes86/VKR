<script lang="ts">
    import UnknowIcon from './UnknowIcon.svelte';
    let iconModules = import.meta.glob('/src/lib/svg/*.svg', { eager: true, query: '?raw', import: 'default'});

    let {
        name,
        stroke,
        className
    } : {
        name: string;
        stroke?: string; // update
        className?: string;
    } = $props();
    
    let icon = $derived.by(() => {
        const path = Object.keys(iconModules).find(p => p.endsWith(`${name}.svg`));
        if (!path) return null;

        let content = iconModules[path] as string;

        if (stroke) {
            content = content.replace(/stroke="[^"]*"/g, `stroke="${stroke}"`);
        }
        if (className) {
            if (content.includes('class="')) {
                content = content.replace(/class="[^"]*"/g, `class="${className}"`);
            } else {
                content = content.replace(/<svg([^>]*)>/, `<svg$1 class="${className}">`);
            }
        }
        return content;

    });
</script>

{#if name && icon}
    {@html icon}
{:else}
    <UnknowIcon />
{/if}