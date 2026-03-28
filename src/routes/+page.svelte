<script lang="ts">
    import { Header, Wrapper, Icon, Footer, Logo, Card, Modal } from "$lib/components";
    import { modalStore } from "$lib/stores/modal.svelte";

    const hero = [{
        h: 'Новое восприятие структурных диаграмм',
        b: 'Создавайте сложные системы без хаоса',
        p: 'Structura помогает архитекторам, аналитикам и разработчикам визуализировать, проверять и преобразовывать структурные диаграммы с помощью физической модели, семантического анализа и встроенного ИИ.'
    }];
    const cards = [
        { img: '1', title: 'Физическая адаптация', points: [
            { icon: 'radius', title: 'Масса и размер', desc: 'значимые элементы станвятся крупнее.' },
            { icon: 'orbit', title: 'Гравитация и отталкивание', desc: 'диаграмма выстраивается сама, избегая наложений.' },
            { icon: 'mouse', title: 'Навигация скроллом', desc: 'плавное погружение в любой уровень вложенности. Больше никаких «спагетти-диаграмм» — система сама поддерживает порядок.' },
        ]},
        { img: '1', title: 'Семантический валидатор', points: [
            { icon: 'alert', title: '', desc: 'Мгновенно находите логические ошибки.' },
            { icon: 'conflict', title: 'Конфликты контекста', desc: 'Цветовая индикация показывает, что требует исправления, а что — лишь рекомендация.' },
            { icon: '', title: 'Дублирование имён и свойств', desc: 'автоматическое выявление повторяющихся элементов.' },
        ]},
        { img: '1', title: 'Компонентный подход и переиспользование', points: [
            { icon: 'component', title: 'Мастер‑компонент', desc: 'измените один раз — все экземпляры обновятся автоматически.' },
            { icon: 'import', title: 'Импорт сущностей', desc: 'периспользуйте готовые компоненты в любом проекте.' },
            { icon: 'pazzle', title: 'Модульное проектирование', desc: 'собирайте сложные системы из проверенных блоков.' },
        ]},
        { img: '1', title: 'ИИ‑конвертер текста и кода', points: [
            { icon: 'file-text', title: 'Текст → диаграмма', desc: 'опишите систему словами, и ИИ построит структуру.' },
            { icon: 'file-code', title: 'Диаграмма → текст/код ', desc: 'автоматически сгенерируйте описание, интерфейсы для разработчиков.' },
            { icon: 'file-down', title: 'Загрузите документ', desc: 'распознает текст в документах формата pdf и word' },
            { icon: 'refresh', title: 'Двунаправленная синхронизация', desc: 'диаграмма и документация всегда актуальны.' }
        ]},
    ];
    const test = [{
        h: 'Присоеденяйтесь к бета тестированию',
        b: 'Получите полный доступ по итогам тестирования',
        p: 'Пользуйтесь, изучайте и присылайте нам баг репорты'
    }];

    function login() {
        modalStore.open('login');
    }

</script>

<Header />
<Modal show={true} />

<Wrapper>
    <section class="flex h-100 justify-center items-center">
        {#each hero as {h, b, p}}
            <Card>
                <div class="flex gap-2 items-center">
                    <Logo />
                    <h1>{h}</h1>
                </div>
                <b>{b}</b>
                <p>{p}</p>
                <div class="flex gap-4 -1">
                    <a href="/app" class="click px-2 text-lg rounded-sm border border-accent">Попробовать</a>
                    <button onclick={login} class="animate-pulse click px-2 text-lg rounded-sm bg-accent">Зарегистрироваться</button>
                </div>
            </Card>
        {/each}
    </section>
    <section class="flex flex-col gap-8">
        {#each cards as {img, title, points}, i}
            <div class="{i % 2 == 0 && 'flex-row-reverse'} flex items-center justify-between gap-10">
                <Card>
                    <h2>{title}</h2>
                    {#each points as {icon, title, desc}}
                        <div class="flex gap-2 text-justify">
                            <div>
                                <Icon name={icon} />
                            </div>
                            <p class=""> <b>{title}</b> {desc}</p>
                        </div>
                    {/each}
                </Card>
                <div>
                    <img src="src/lib/img/{img}.gif" alt="dsds">
                </div>
            </div>
        {/each}
    </section>
    <section class="flex h-100 items-center justify-center">
        {#each test as {h, b, p}}
            <Card className="p-0!">
                <div class="flex gap-2 items-center p-4">
                    <Icon name="test" stroke="yellow" />
                    <h1>{h}</h1>
                </div>
                <img class="w-full rounded-sm" src="src/lib/svg/test-line.svg" alt="">
                <div class="flex flex-col p-4 gap-4">
                    <b>{b}</b>
                    <p>{p}</p>
                    <div class="flex gap-4">
                        <button onclick={login} class="click px-2 text-lg rounded-sm border text-yellow border-yellow">Зарегистрироваться</button>
                        <button class="animate-pulse click px-2 text-lg rounded-sm text-black bg-yellow ">Протестировать</button>
                    </div>
                </div>
            </Card>
        {/each}
    </section>
</Wrapper>

<Footer />