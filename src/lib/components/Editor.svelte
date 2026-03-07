<script lang="ts">
    import { Flex, Button } from "$lib/components";

    let text: string = $state('');

    function onclick() {
        alert('Optimization diagramm');
    }
    
</script>

<Flex col className="p-3">
    <textarea 
        bind:value={text}
        name="" 
        id=""
        cols="1"
        class="bg-black w-full border-gray rounded-md h-90">
    </textarea>
    <Flex>
        <Button {onclick} className="bg-accent p-2 rounded-sm">Optimization diagramm</Button>
    </Flex>
</Flex>