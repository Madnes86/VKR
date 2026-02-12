<script lang="ts">
	import Form from "./Form.svelte";

    function test(value: string) {
        if (value.length > 3) return 'Name too long';
        return '';
    }
</script>

<Form icon="user" text="test" validate={test}/>
<Form icon="user" text="test"/>
