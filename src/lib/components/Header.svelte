<script lang="ts">
    import { Logo, Wrapper, DropDown, Icon } from "$lib/components";
    import { i18n, type Lang } from "$lib/i18n";

    const navs = [
        { href: "/app", key: "nav.app" },
        { href: "/docs", key: "nav.docs" },
        { href: "/support", key: "nav.support" }
    ];
    const items: string[] = ['RU', 'EN'];
    let selectedItem = $state(i18n.lang.toUpperCase());

    $effect(() => {
        const lang = selectedItem.toLowerCase() as Lang;
        if (lang !== i18n.lang) i18n.set(lang);
    });

</script>

<div class="border-b-2 border-gray bg-gray-glass">
    <Wrapper className="p-0! px-10!">
        <header class="w-full flex items-center justify-between">
            <a href="/" class="click">
                <Logo />
            </a>
            <nav class="flex gap-4 px-4">
                {#each navs as {href, key}}
                    <a {href} class="click">{i18n.t(key)}</a>
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
