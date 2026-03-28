<script lang="ts">
    import { Logo, Wrapper, DropDown, Icon } from "$lib/components";
    const navs = [
        { href: "/app", label: "App"},
        { href: "/docs", label: "Docs"},
        { href: "/support", label: "Support"}
    ];
    const items = ['RU', 'EU'];
    let selectedItem = $state('RU');

</script>

<div class="border-b-2 border-gray bg-gray-glass">
    <Wrapper className="p-0! px-10!">
        <header class="w-full flex items-center justify-between">
            <a href="/" class="click">
                <Logo />
            </a>
            <nav class="flex gap-4 px-4">
                {#each navs as {href, label}}
                    <a {href} class="click">{label}</a>
                {/each}
                <DropDown {items} bind:selectedItem={selectedItem}>
                    <div class="flex gap-1">
                        <Icon name="lang" />
                        {selectedItem}
                    </div>
                </DropDown>
            </nav>
        </header>
    </Wrapper>
</div>
