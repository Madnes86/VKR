<script lang="ts">
	import { Icon, Wrapper } from '$lib/components';
	import { i18n } from '$lib/i18n';

	const links = [
		{ href: '/docs', key: 'footer.docs' },
		{ href: '/support', key: 'footer.donate' },
		{ href: '/', key: 'footer.legal' },
		{ href: '/bag', key: 'footer.bug' }
	];
	const currentYear = new Date().getFullYear();
</script>

<footer class="flex w-full flex-col items-center border-t-2 border-gray bg-gray-glass">
	<Wrapper className="m-0! w-full!">
		<div class="flex w-full justify-between gap-2">
			<div class="flex flex-col gap-2">
				{#each links as { href, key }}
					<a {href} class="click">{i18n.t(key)}</a>
				{/each}
			</div>
			<div class="flex flex-col gap-2">
				<a
					href="https://github.com/Madnes86"
					class="click w-fit rounded-full border border-gray bg-black p-2"
				>
					<Icon name="git" />
				</a>
				<a href="/support" class="click w-fit rounded-full border border-gray bg-black p-2">
					<Icon name="coffee" />
				</a>
			</div>
		</div>
	</Wrapper>
	<p class="pb-1 text-center">© {currentYear} Orbita</p>
</footer>
