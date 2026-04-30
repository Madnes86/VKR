<script lang="ts">
	import {
		Header,
		Wrapper,
		Footer,
		Card,
		Icon,
		Logo,
		BgGraph,
		BgSpace,
		DocsNav
	} from '$lib/components';
	import type { DocsNavNode } from '$lib/components/DocsNav.svelte';
	import { i18n } from '$lib/i18n';

	type Section = {
		id: string;
		icon: string;
		title: string;
		intro: string;
		points: { icon?: string; title: string; desc: string }[];
	};

	type Category = {
		id: string;
		icon: string;
		title: string;
		sectionIds: string[];
	};

	const sections: Section[] = [
		{
			id: 'start',
			icon: 'mouse',
			title: 'docs.start.title',
			intro: 'docs.start.intro',
			points: [
				{ icon: 'plus', title: 'docs.start.step1.title', desc: 'docs.start.step1.desc' },
				{ icon: 'object', title: 'docs.start.step2.title', desc: 'docs.start.step2.desc' },
				{ icon: 'link', title: 'docs.start.step3.title', desc: 'docs.start.step3.desc' },
				{ icon: 'check', title: 'docs.start.step4.title', desc: 'docs.start.step4.desc' }
			]
		},
		{
			id: 'diagram',
			icon: 'diagramm',
			title: 'docs.diagram.title',
			intro: 'docs.diagram.intro',
			points: [
				{ icon: 'orbit', title: 'docs.diagram.physics.title', desc: 'docs.diagram.physics.desc' },
				{ icon: 'object', title: 'docs.diagram.objects.title', desc: 'docs.diagram.objects.desc' },
				{ icon: 'link', title: 'docs.diagram.links.title', desc: 'docs.diagram.links.desc' },
				{ icon: 'mouse', title: 'docs.diagram.scroll.title', desc: 'docs.diagram.scroll.desc' }
			]
		},
		{
			id: 'components',
			icon: 'component',
			title: 'docs.components.title',
			intro: 'docs.components.intro',
			points: [
				{
					icon: 'component',
					title: 'docs.components.master.title',
					desc: 'docs.components.master.desc'
				},
				{
					icon: 'import',
					title: 'docs.components.import.title',
					desc: 'docs.components.import.desc'
				},
				{
					icon: 'pazzle',
					title: 'docs.components.modular.title',
					desc: 'docs.components.modular.desc'
				}
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
				{ icon: 'file-down', title: 'docs.ai.doc.title', desc: 'docs.ai.doc.desc' }
			]
		},
		{
			id: 'account',
			icon: 'user',
			title: 'docs.account.title',
			intro: 'docs.account.intro',
			points: [
				{ icon: 'addUser', title: 'docs.account.signup.title', desc: 'docs.account.signup.desc' },
				{ icon: 'password', title: 'docs.account.reset.title', desc: 'docs.account.reset.desc' },
				{ icon: 'refresh', title: 'docs.account.sync.title', desc: 'docs.account.sync.desc' }
			]
		},
		{
			id: 'bug',
			icon: 'alert',
			title: 'docs.bug.title',
			intro: 'docs.bug.intro',
			points: [
				{ icon: 'alert', title: 'docs.bug.report.title', desc: 'docs.bug.report.desc' },
				{ icon: 'refresh', title: 'docs.bug.workaround.title', desc: 'docs.bug.workaround.desc' }
			]
		}
	];

	const categories: Category[] = [
		{ id: 'basics', icon: 'category', title: 'docs.cat.basics', sectionIds: ['start', 'diagram'] },
		{
			id: 'advanced',
			icon: 'category',
			title: 'docs.cat.advanced',
			sectionIds: ['components', 'ai']
		},
		{ id: 'support', icon: 'category', title: 'docs.cat.support', sectionIds: ['account', 'bug'] }
	];

	const sectionsById = new Map(sections.map((s) => [s.id, s]));
	const navNodes: DocsNavNode[] = $derived(
		categories.map((cat) => ({
			title: i18n.t(cat.title),
			icon: cat.icon,
			children: cat.sectionIds
				.map((sid) => sectionsById.get(sid))
				.filter((s): s is Section => !!s)
				.map((s) => ({
					title: i18n.t(s.title),
					icon: s.icon,
					href: `#${s.id}`
				}))
		}))
	);
</script>

<Header />

<div class="relative isolate">
	<BgSpace />
	<BgGraph />
	<Wrapper>
		<section class="flex items-center justify-center py-10">
			<Card className="w-full! max-w-180!">
				<div class="flex flex-wrap items-center gap-2">
					<Logo />
					<h1>{i18n.t('docs.hero.h')}</h1>
				</div>
				<b>{i18n.t('docs.hero.b')}</b>
				<p>{i18n.t('docs.hero.p')}</p>
				<div class="flex flex-wrap gap-4">
					<a href="/app" class="click rounded-sm bg-accent px-2 text-lg">
						{i18n.t('docs.hero.try')}
					</a>
					<a href="/support" class="click rounded-sm border border-accent px-2 text-lg">
						{i18n.t('docs.hero.support')}
					</a>
				</div>
			</Card>
		</section>

		<section class="flex flex-col items-start gap-6 py-6 lg:flex-row">
			<aside class="w-full lg:sticky lg:top-4 lg:w-72">
				<Card className="w-full!">
					<b>{i18n.t('docs.toc.title')}</b>
					<DocsNav nodes={navNodes} />
				</Card>
			</aside>

			<div class="flex w-full flex-1 flex-col gap-8">
				{#each categories as cat}
					<div class="flex flex-col gap-4">
						<div id={cat.id} class="flex scroll-mt-4 items-center gap-2">
							<Icon name={cat.icon} />
							<h2>{i18n.t(cat.title)}</h2>
						</div>
						{#each cat.sectionIds as sid}
							{@const s = sectionsById.get(sid)}
							{#if s}
								<Card className="w-full!">
									<div id={s.id} class="flex scroll-mt-4 items-center gap-2">
										<Icon name={s.icon} />
										<h3>{i18n.t(s.title)}</h3>
									</div>
									<p class="text-justify">{i18n.t(s.intro)}</p>
									<ol class="flex list-decimal flex-col gap-3 pl-5">
										{#each s.points as { icon, title, desc }}
											<li>
												<div class="flex items-start gap-2">
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
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</section>

		<section class="flex items-center justify-center py-10">
			<Card className="w-full! max-w-180!">
				<div class="flex items-center gap-2">
					<Icon name="mail" />
					<h2>{i18n.t('docs.cta.title')}</h2>
				</div>
				<p>{i18n.t('docs.cta.p')}</p>
				<div class="flex flex-wrap gap-4">
					<a href="/app" class="click rounded-sm bg-accent px-2 text-lg">
						{i18n.t('docs.cta.try')}
					</a>
					<a href="/support" class="click rounded-sm border border-accent px-2 text-lg">
						{i18n.t('docs.cta.support')}
					</a>
				</div>
			</Card>
		</section>
	</Wrapper>
</div>

<Footer />
