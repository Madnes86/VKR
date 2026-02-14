<script lang="ts">
    import Button from "./Button.svelte";
	import Flex from "./Flex.svelte";

    let {
        power = $bindable(false),
        text
    } : {
        power: boolean;
        text: string;
    } = $props();

    function toggle() {
        power = !power;
    }

</script>

<Flex className="gap-2 p-2">
    <Button onclick={toggle} className={`${power ? 'justify-end! bg-accent' : 'justify-start! bg-black'} duration-300! p-0.5 rounded-2xl w-8 border border-gray flex justify-start`}>
        <div class="size-3 rounded-full bg-gray"></div>
    </Button>
    <p class="select-none">{text}</p>
</Flex>