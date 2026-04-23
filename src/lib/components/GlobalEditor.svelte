<script lang="ts">
    import { Icon, Search, LightText } from "$lib/components";
    import { objects as initialObjects } from "$lib/mocs/objects";
    import { links as initialLinks } from "$lib/mocs/links";
    import { selectedStore, viewStore } from "$lib/stores/objects.svelte";
    import { searchStore } from "$lib/stores/search.svelte";
    import { goto } from "$app/navigation";
    import { notificationStore } from "$lib/stores/notification.svelte";
    import { i18n } from "$lib/i18n";
    import type { IFlatObject, IFlatLink } from "$lib/interface";

    let items: IFlatObject[] = $state([...initialObjects]);
    let linkItems: IFlatLink[] = $state([...initialLinks]);

    const initial = [...initialObjects.map(o => o.name), ...initialLinks.map(l => l.name)].join(' ');
    let text: string = $state(initial);

    type Token =
        | { kind: 'object'; text: string; id: number }
        | { kind: 'link'; text: string; id: number }
        | { kind: 'plain'; text: string }
        | { kind: 'space'; text: string };

    const tokens: Token[] = $derived.by(() => {
        const parts = text.split(/(\s+)/);
        const result: Token[] = [];
        for (const part of parts) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { result.push({ kind: 'space', text: part }); continue; }
            const o = items.find(x => x.name === part);
            if (o) { result.push({ kind: 'object', text: part, id: o.id }); continue; }
            const l = linkItems.find(x => x.name === part);
            if (l) { result.push({ kind: 'link', text: part, id: l.id }); continue; }
            result.push({ kind: 'plain', text: part });
        }
        return result;
    });

    const unsyncedCount = $derived(
        new Set(tokens.filter(t => t.kind === 'plain').map(t => t.text)).size
    );

    let filterMode: boolean = $state(false);
    const query = $derived(searchStore.get());
    const normalizedQuery = $derived(query.trim().toLowerCase());
    const hasQuery = $derived(normalizedQuery.length > 0);

    const cats = $derived(searchStore.cats);
    const searchObjects = $derived(cats.some(c => c.name === 'Objects'));
    const searchLinks = $derived(cats.some(c => c.name === 'Links'));

    $effect(() => { if (!hasQuery) filterMode = false; });

    function isMatch(t: Token): boolean {
        if (!hasQuery) return false;
        if (t.kind === 'object') return searchObjects && t.text.toLowerCase().includes(normalizedQuery);
        if (t.kind === 'link') return searchLinks && t.text.toLowerCase().includes(normalizedQuery);
        return false;
    }

    const displayTokens: Token[] = $derived.by(() => {
        if (!filterMode) return tokens;
        const matching = tokens.filter(isMatch);
        const result: Token[] = [];
        matching.forEach((t, i) => {
            if (i > 0) result.push({ kind: 'space', text: ' ' });
            result.push(t);
        });
        return result;
    });

    function runSearch() { filterMode = hasQuery; }

    function click(id: number) {
        selectedStore.set('selected', `o + ${id}`);
        viewStore.set(id);
        goto('/app');
    }
    function hover(id: number) { selectedStore.set('hover', `o + ${id}`); }
    function leave() { selectedStore.clear('hover'); }

    function sync() {
        const words = text.split(/\s+/).filter(Boolean);
        const unique = [...new Set(words)];
        const linkNames = new Set(linkItems.map(l => l.name));

        const remainingObjects = items.filter(o => unique.includes(o.name));
        const existingNames = new Set([...remainingObjects.map(o => o.name), ...linkNames]);
        let nextId = Math.max(0, ...items.map(o => o.id), ...linkItems.map(l => l.id)) + 1;
        const additions: IFlatObject[] = [];
        for (const w of unique) {
            if (!existingNames.has(w)) {
                additions.push({ id: nextId++, name: w, type: 'default', parent: 0 });
            }
        }
        items = [...remainingObjects, ...additions];
        notificationStore.success(i18n.t('global.synced'), 'check');
    }
</script>

<div class="size-full h-screen flex flex-col border-l-2 border-gray">
    <div class="flex items-center gap-2 pr-2">
        <div class="flex-1">
            <Search onSearch={runSearch} />
        </div>
        <button onclick={sync} class="click flex items-center gap-2 rounded-md px-3 py-1 bg-accent hover:brightness-110">
            <Icon name="refresh" />
            <span>{i18n.t('global.sync')}</span>
        </button>
    </div>
    <div class="flex-1 h-full overflow-auto p-6">
        <div class="relative w-full font-mono text-base leading-relaxed">
            {#if !filterMode}
                <textarea
                    bind:value={text}
                    spellcheck="false"
                    aria-label="global-editor"
                    class="absolute inset-0 size-full p-3 bg-zinc-950 text-transparent caret-accent resize-none outline-none rounded-md whitespace-pre-wrap break-words"
                ></textarea>
            {/if}
            <div class="relative p-3 whitespace-pre-wrap break-words pointer-events-none {filterMode ? 'bg-zinc-950 rounded-md min-h-full' : ''}">
                {#each displayTokens as t, i (i)}
                    {#if t.kind === 'object'}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <span
                            class="pointer-events-auto cursor-pointer px-1 -mx-1 text-white hover:bg-accent rounded-sm transition-colors"
                            onmouseenter={() => hover(t.id)}
                            onmouseleave={leave}
                            onclick={() => click(t.id)}
                        >{#if searchObjects}<LightText text={t.text} />{:else}{t.text}{/if}</span>
                    {:else if t.kind === 'link'}
                        <span class="pointer-events-auto italic px-1 -mx-1 text-zinc-400 hover:bg-accent rounded-sm transition-colors">{#if searchLinks}<LightText text={t.text} />{:else}{t.text}{/if}</span>
                    {:else if t.kind === 'space'}
                        <span>{t.text}</span>
                    {:else}
                        <span class="text-zinc-600">{t.text}</span>
                    {/if}
                {/each}
            </div>
        </div>
    </div>
    <div class="flex gap-4 px-3 py-1 my-2 text-xs text-zinc-400 font-mono select-none">
        <span>{i18n.t('global.stats.objects')}: <span class="text-white">{items.length}</span></span>
        <span>{i18n.t('global.stats.links')}: <span class="text-white">{linkItems.length}</span></span>
        <span>{i18n.t('global.stats.unsynced')}: <span class={unsyncedCount > 0 ? 'text-accent' : 'text-white'}>{unsyncedCount}</span></span>
        <span class="ml-auto">{i18n.t('global.stats.chars')}: <span class="text-white">{text.length}</span></span>
    </div>
</div>

<style>
    textarea {
        line-height: inherit;
        font-family: inherit;
    }
</style>
