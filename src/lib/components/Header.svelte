<script lang="ts">
    const navs = [
        { href: "/app", label: "App"},
        { href: "/docs", label: "Docs"},
        { href: "/support", label: "Support"}
    ];
</script>

<div class="w-full flex p-2 justify-between border-b-2 bg-gray">
    <img src="" alt="logo" class="click">
    <nav class="flex gap-2">
        {#each navs as {href, label}}
            <a {href} class="click">{label}</a>
        {/each}
    </nav>
</div>