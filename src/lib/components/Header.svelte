<script lang="ts">
    import { Logo } from "$lib/components";
    const navs = [
        { href: "/app", label: "App"},
        { href: "/docs", label: "Docs"},
        { href: "/support", label: "Support"}
    ];

</script>

<div class="w-full flex items-center justify-between border-b-2 border-gray bg-gray-glass">
    <a href="/" class="click">
        <Logo />
    </a>
    <nav class="flex gap-4 px-4">
        {#each navs as {href, label}}
            <a {href} class="click">{label}</a>
        {/each}
    </nav>
</div>