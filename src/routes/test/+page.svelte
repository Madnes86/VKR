<script lang="ts">
    import { Header, Wrapper, Icon, Footer, Logo, Card, Modal, BgGraph } from "$lib/components";
    import { modalStore } from "$lib/stores/modal.svelte";
    import { i18n } from "$lib/i18n";

    const hero = [{
        h: 'landing.hero.h',
        b: 'landing.hero.b',
        p: 'landing.hero.p'
    }];
    const cards = [
        { img: '1', title: 'landing.physical.title', points: [
            { icon: 'radius', title: 'landing.physical.mass.title', desc: 'landing.physical.mass.desc' },
            { icon: 'orbit', title: 'landing.physical.gravity.title', desc: 'landing.physical.gravity.desc' },
            { icon: 'mouse', title: 'landing.physical.scroll.title', desc: 'landing.physical.scroll.desc' },
        ]},
        { img: '1', title: 'landing.semantic.title', points: [
            { icon: 'alert', title: 'landing.semantic.alerts.title', desc: 'landing.semantic.alerts.desc' },
            { icon: 'conflict', title: 'landing.semantic.conflict.title', desc: 'landing.semantic.conflict.desc' },
            { icon: '', title: 'landing.semantic.dupl.title', desc: 'landing.semantic.dupl.desc' },
        ]},
        { img: '1', title: 'landing.components.title', points: [
            { icon: 'component', title: 'landing.components.master.title', desc: 'landing.components.master.desc' },
            { icon: 'import', title: 'landing.components.import.title', desc: 'landing.components.import.desc' },
            { icon: 'pazzle', title: 'landing.components.modular.title', desc: 'landing.components.modular.desc' },
        ]},
        { img: '1', title: 'landing.ai.title', points: [
            { icon: 'file-text', title: 'landing.ai.text.title', desc: 'landing.ai.text.desc' },
            { icon: 'file-code', title: 'landing.ai.code.title', desc: 'landing.ai.code.desc' },
            { icon: 'file-down', title: 'landing.ai.doc.title', desc: 'landing.ai.doc.desc' },
            { icon: 'refresh', title: 'landing.ai.sync.title', desc: 'landing.ai.sync.desc' }
        ]},
    ];
    const test = [{
        h: 'landing.test.h',
        b: 'landing.test.b',
        p: 'landing.test.p'
    }];

    function signup() {
        modalStore.open('registration');
    }
</script>

<Header />
<Modal />

<div class="relative isolate">
    <BgGraph />
    <Wrapper>
        <section class="flex h-100 justify-center items-center relative">
            {#each hero as {h, b, p}}
                <Card>
                    <div class="flex gap-2 items-center">
                        <Logo />
                        <h1>{i18n.t(h)}</h1>
                    </div>
                    <b>{i18n.t(b)}</b>
                    <p>{i18n.t(p)}</p>
                    <div class="flex gap-4 -1">
                        <a href="/app" class="click px-2 text-lg rounded-sm border border-accent">{i18n.t('landing.hero.try')}</a>
                        <button onclick={signup} class="animate-pulse click px-2 text-lg rounded-sm bg-accent">{i18n.t('landing.hero.signup')}</button>
                    </div>
                </Card>
            {/each}
        </section>
        <section class="flex flex-col gap-8 relative">
            {#each cards as {img, title, points}, i}
                <div class="{i % 2 == 0 && 'flex-row-reverse'} flex items-center justify-between gap-10">
                    <Card>
                        <h2>{i18n.t(title)}</h2>
                        {#each points as {icon, title, desc}}
                            <div class="flex gap-2 text-justify">
                                <div>
                                    <Icon name={icon} />
                                </div>
                                <p class=""> <b>{i18n.t(title)}</b> {i18n.t(desc)}</p>
                            </div>
                        {/each}
                    </Card>
                    <div>
                        <img src="src/lib/img/{img}.gif" alt="dsds">
                    </div>
                </div>
            {/each}
        </section>
        <section class="flex h-100 items-center justify-center relative">
            {#each test as {h, b, p}}
                <Card className="p-0!">
                    <div class="flex gap-2 items-center p-4">
                        <Icon name="test" stroke="yellow" />
                        <h1>{i18n.t(h)}</h1>
                    </div>
                    <img class="w-full rounded-sm" src="src/lib/svg/test-line.svg" alt="">
                    <div class="flex flex-col p-4 gap-4">
                        <b>{i18n.t(b)}</b>
                        <p>{i18n.t(p)}</p>
                        <div class="flex gap-4">
                            <button onclick={signup} class="click px-2 text-lg rounded-sm border text-yellow border-yellow">{i18n.t('landing.hero.signup')}</button>
                            <button class="animate-pulse click px-2 text-lg rounded-sm text-black bg-yellow ">{i18n.t('landing.test.test')}</button>
                        </div>
                    </div>
                </Card>
            {/each}
        </section>
    </Wrapper>
</div>

<Footer />
