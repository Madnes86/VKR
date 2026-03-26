<script lang="ts">

    let show: boolean = $state(false);

    
    const ondragleave = () => show = false;
    const ondragover = (e: DragEvent) => {
        e.preventDefault(); 
        show = true;
    };
    function ondrop(e: DragEvent) {
        e.preventDefault();
        show = false;
        alert(e.dataTransfer?.getData("text/plain"))
    }

</script>

<div {ondrop} {ondragover} {ondragleave} class="{show && 'bg-gray-glass'} fixed left-0 top-0 h-screen w-10 z-10">
    <div class=""></div>
</div>

<div class="fixed right-0 top-0 h-screen w-10 hover:bg-gray-glass z-10">

</div>