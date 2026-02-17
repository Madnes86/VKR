<script lang="ts">
	import Flex from "./Flex.svelte";

    let commands: string[] = [
        'h1',
        'h2',
        'Bold'
    ];

    let text: string = $state('');

    
</script>

<Flex col className="p-3">
    <Flex>
        {#each commands as command }
            <h3>{command}</h3>
        {/each}
    </Flex>
    <textarea 
        bind:value={text}
        name="" 
        id=""
        cols="1"
        class="bg-gray-glass w-full border-none rounded-md h-90">
    </textarea>
    <!-- <input type="text" class="bg-gray-glass border-none "> -->
</Flex>