<script lang="ts">
    import Icon from "./Icon.svelte";

    let {
        onclick,
        name
    } : {
        onclick: () => void;
        name: string;
    } = $props();
</script>

<button {onclick} class="click rounded-full border border-gray bg-gray-glass p-1.5">
    <Icon {name} />
</button>