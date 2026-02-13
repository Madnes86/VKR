<script lang="ts">
	import type { Snippet } from "svelte";

    let {
        children,
        className,
        onclick,
        disabled = false
    } : {
        children: Snippet
        className?: string;
        onclick: () => void;
        disabled?: boolean;
    } = $props();

</script>

<button 
    {disabled}
    {onclick}
    class={`${className} click`}
    >
    {@render children()}
</button>