<script lang="ts">
    import { Header, Wrapper, Footer, Card, Icon, Logo, BgGraph, BgSpace } from "$lib/components";
    import { i18n } from "$lib/i18n";

    const topics = [
        { icon: 'mouse',      title: 'support.topics.start.title',      desc: 'support.topics.start.desc',      href: '/docs' },
        { icon: 'diagramm',   title: 'support.topics.diagram.title',   desc: 'support.topics.diagram.desc',   href: '/docs' },
        { icon: 'component',  title: 'support.topics.components.title', desc: 'support.topics.components.desc', href: '/docs' },
        { icon: 'file-text',  title: 'support.topics.ai.title',         desc: 'support.topics.ai.desc',         href: '/docs' },
        { icon: 'user',       title: 'support.topics.account.title',    desc: 'support.topics.account.desc',    href: '/auth' },
        { icon: 'alert',      title: 'support.topics.bug.title',        desc: 'support.topics.bug.desc',        href: '/bag' },
    ];

    const faq = [
        { q: 'support.faq.q1', a: 'support.faq.a1' },
        { q: 'support.faq.q2', a: 'support.faq.a2' },
        { q: 'support.faq.q3', a: 'support.faq.a3' },
        { q: 'support.faq.q4', a: 'support.faq.a4' },
        { q: 'support.faq.q5', a: 'support.faq.a5' },
        { q: 'support.faq.q6', a: 'support.faq.a6' },
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
                <h1>{i18n.t('support.hero.h')}</h1>
            </div>
            <b>{i18n.t('support.hero.b')}</b>
            <p>{i18n.t('support.hero.p')}</p>
            <div class="flex flex-wrap gap-4">
                <a href="/docs" class="click px-2 text-lg rounded-sm border border-accent">
                    {i18n.t('support.hero.docs')}
                </a>
                <a href="/bag" class="click px-2 text-lg rounded-sm bg-accent">
                    {i18n.t('support.hero.bug')}
                </a>
            </div>
        </Card>
    </section>

    <section class="flex flex-col gap-6 py-6">
        <h2>{i18n.t('support.topics.title')}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each topics as {icon, title, desc, href}}
                <a {href} class="click">
                    <Card className="w-full! h-full">
                        <div class="flex gap-2 items-center">
                            <Icon name={icon} />
                            <b>{i18n.t(title)}</b>
                        </div>
                        <p class="text-justify">{i18n.t(desc)}</p>
                    </Card>
                </a>
            {/each}
        </div>
    </section>

    <section class="flex flex-col gap-6 py-6">
        <h2>{i18n.t('support.faq.title')}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each faq as {q, a}}
                <Card className="w-full!">
                    <b>{i18n.t(q)}</b>
                    <p class="text-justify">{i18n.t(a)}</p>
                </Card>
            {/each}
        </div>
    </section>

    <section class="flex justify-center items-center py-10">
        <Card className="w-full! max-w-180!">
            <div class="flex gap-2 items-center">
                <Icon name="mail" />
                <h2>{i18n.t('support.contact.title')}</h2>
            </div>
            <p>{i18n.t('support.contact.p')}</p>
            <div class="flex flex-wrap gap-4">
                <a href="mailto:support@structura.app" class="click px-2 text-lg rounded-sm bg-accent">
                    {i18n.t('support.contact.email')}
                </a>
                <a href="https://github.com/Madnes86" class="click px-2 text-lg rounded-sm border border-accent flex items-center gap-2">
                    <Icon name="git" />
                    {i18n.t('support.contact.github')}
                </a>
                <a href="/support" class="click px-2 text-lg rounded-sm border border-yellow text-yellow flex items-center gap-2">
                    <Icon name="coffee" />
                    {i18n.t('support.contact.donate')}
                </a>
            </div>
        </Card>
    </section>
    </Wrapper>
</div>

<Footer />
