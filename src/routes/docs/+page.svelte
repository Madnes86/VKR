<script lang="ts">
    import { Header, Wrapper, Footer, Card, Icon, Logo, BgGraph, BgSpace } from "$lib/components";
    import { i18n } from "$lib/i18n";

    type Section = {
        id: string;
        icon: string;
        title: string;
        intro: string;
        points: { icon?: string; title: string; desc: string }[];
    };

    const sections: Section[] = [
        {
            id: 'start',
            icon: 'mouse',
            title: 'docs.start.title',
            intro: 'docs.start.intro',
            points: [
                { icon: 'plus',     title: 'docs.start.step1.title', desc: 'docs.start.step1.desc' },
                { icon: 'object',   title: 'docs.start.step2.title', desc: 'docs.start.step2.desc' },
                { icon: 'link',     title: 'docs.start.step3.title', desc: 'docs.start.step3.desc' },
                { icon: 'check',    title: 'docs.start.step4.title', desc: 'docs.start.step4.desc' },
            ]
        },
        {
            id: 'diagram',
            icon: 'diagramm',
            title: 'docs.diagram.title',
            intro: 'docs.diagram.intro',
            points: [
                { icon: 'orbit',    title: 'docs.diagram.physics.title', desc: 'docs.diagram.physics.desc' },
                { icon: 'object',   title: 'docs.diagram.objects.title', desc: 'docs.diagram.objects.desc' },
                { icon: 'link',     title: 'docs.diagram.links.title',   desc: 'docs.diagram.links.desc' },
                { icon: 'mouse',    title: 'docs.diagram.scroll.title',  desc: 'docs.diagram.scroll.desc' },
            ]
        },
        {
            id: 'components',
            icon: 'component',
            title: 'docs.components.title',
            intro: 'docs.components.intro',
            points: [
                { icon: 'component', title: 'docs.components.master.title',  desc: 'docs.components.master.desc' },
                { icon: 'import',    title: 'docs.components.import.title',  desc: 'docs.components.import.desc' },
                { icon: 'pazzle',    title: 'docs.components.modular.title', desc: 'docs.components.modular.desc' },
            ]
        },
        {
            id: 'ai',
            icon: 'file-text',
            title: 'docs.ai.title',
            intro: 'docs.ai.intro',
            points: [
                { icon: 'file-text', title: 'docs.ai.text.title', desc: 'docs.ai.text.desc' },
                { icon: 'file-code', title: 'docs.ai.code.title', desc: 'docs.ai.code.desc' },
                { icon: 'file-down', title: 'docs.ai.doc.title',  desc: 'docs.ai.doc.desc' },
            ]
        },
        {
            id: 'account',
            icon: 'user',
            title: 'docs.account.title',
            intro: 'docs.account.intro',
            points: [
                { icon: 'addUser',  title: 'docs.account.signup.title', desc: 'docs.account.signup.desc' },
                { icon: 'password', title: 'docs.account.reset.title',  desc: 'docs.account.reset.desc' },
                { icon: 'refresh',  title: 'docs.account.sync.title',   desc: 'docs.account.sync.desc' },
            ]
        },
        {
            id: 'bug',
            icon: 'alert',
            title: 'docs.bug.title',
            intro: 'docs.bug.intro',
            points: [
                { icon: 'alert',   title: 'docs.bug.report.title',     desc: 'docs.bug.report.desc' },
                { icon: 'refresh', title: 'docs.bug.workaround.title', desc: 'docs.bug.workaround.desc' },
            ]
        },
    ];
</script>

<Header />

<div class="relative isolate">
    <BgSpace />
    <BgGraph />
    <Wrapper>
    <section class="flex justify-center items-center py-10">
        <Card className="w-full! max-w-180!">
            <div class="flex gap-2 items-center flex-wrap">
                <Logo />
                <h1>{i18n.t('docs.hero.h')}</h1>
            </div>
            <b>{i18n.t('docs.hero.b')}</b>
            <p>{i18n.t('docs.hero.p')}</p>
            <div class="flex flex-wrap gap-4">
                <a href="/app" class="click px-2 text-lg rounded-sm bg-accent">
                    {i18n.t('docs.hero.try')}
                </a>
                <a href="/support" class="click px-2 text-lg rounded-sm border border-accent">
                    {i18n.t('docs.hero.support')}
                </a>
            </div>
        </Card>
    </section>

    <section class="flex flex-col lg:flex-row gap-6 py-6 items-start">
        <aside class="w-full lg:w-60 lg:sticky lg:top-4">
            <Card className="w-full!">
                <b>{i18n.t('docs.toc.title')}</b>
                <nav class="flex flex-col gap-2">
                    {#each sections as {id, icon, title}}
                        <a href="#{id}" class="click flex items-center gap-2">
                            <Icon name={icon} />
                            <span>{i18n.t(title)}</span>
                        </a>
                    {/each}
                </nav>
            </Card>
        </aside>

        <div class="flex flex-col gap-6 flex-1 w-full">
            {#each sections as {id, icon, title, intro, points}}
                <Card className="w-full!">
                    <div id={id} class="flex gap-2 items-center scroll-mt-4">
                        <Icon name={icon} />
                        <h2>{i18n.t(title)}</h2>
                    </div>
                    <p class="text-justify">{i18n.t(intro)}</p>
                    <ol class="flex flex-col gap-3 list-decimal pl-5">
                        {#each points as {icon, title, desc}}
                            <li>
                                <div class="flex gap-2 items-start">
                                    {#if icon}
                                        <div class="shrink-0">
                                            <Icon name={icon} />
                                        </div>
                                    {/if}
                                    <p class="text-justify"><b>{i18n.t(title)}</b> — {i18n.t(desc)}</p>
                                </div>
                            </li>
                        {/each}
                    </ol>
                </Card>
            {/each}
        </div>
    </section>

    <section class="flex justify-center items-center py-10">
        <Card className="w-full! max-w-180!">
            <div class="flex gap-2 items-center">
                <Icon name="mail" />
                <h2>{i18n.t('docs.cta.title')}</h2>
            </div>
            <p>{i18n.t('docs.cta.p')}</p>
            <div class="flex flex-wrap gap-4">
                <a href="/app" class="click px-2 text-lg rounded-sm bg-accent">
                    {i18n.t('docs.cta.try')}
                </a>
                <a href="/support" class="click px-2 text-lg rounded-sm border border-accent">
                    {i18n.t('docs.cta.support')}
                </a>
            </div>
        </Card>
    </section>
    </Wrapper>
</div>

<Footer />
