<script lang="ts">
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
    
    let icons = new Map();
    Object.entries(iconModules).forEach(([path, content] : [string, any]) => {
        const nameIcon = path.split('/').pop()?.replace('.svg', '') || '';
        if (nameIcon == name) {
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
            icons.set(name, content);
        }
    });
</script>

{#if name && icons.get(name)}
    {@html icons.get(name)}
{/if}