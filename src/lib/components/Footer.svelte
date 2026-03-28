<script lang="ts">
    import { Icon, Wrapper } from "$lib/components";

    const links = [
        { href: '/docs', text: 'Документация' },
        { href: '/support', text: 'Поддержать проект' },
        { href: '/', text: 'Правовая информация' },
        { href: '/bag', text: 'Баг-репорт' },
    ];
    const currentYear = new Date().getFullYear();
</script>

<footer class="w-full flex flex-col border-t-2 border-gray bg-gray-glass">
    <Wrapper className="m-0!">
        <div class="flex gap-2 justify-between w-full">
            <div class="flex flex-col gap-2">
                {#each links as {href, text}}
                    <a {href} class="click">{text}</a>
                {/each}
            </div>
            <div class="flex flex-col gap-2">
                <a href="https://github.com/Madnes86" class="click p-2 rounded-full w-fit border border-gray bg-black">
                    <Icon name="git" />
                </a>
                <a href="/support" class="click p-2 rounded-full w-fit border border-gray bg-black">
                    <Icon name="coffee" />
                </a>
            </div>
        </div>
    </Wrapper>
    <p class="text-center pb-1">© {currentYear} Orbita</p>
</footer>