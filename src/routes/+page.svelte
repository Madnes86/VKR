<script lang="ts">
    import { Header, Wrapper, Icon, Footer } from "$lib/components";

    const hero = {}
    const cards = [
        { img: '1', title: 'Физическая адаптация', points: [
            { icon: 'radius', title: 'Масса и размер', desc: 'значимые элементы станвятся крупнее.' },
            { icon: 'orbit', title: 'Гравитация и отталкивание', desc: 'диаграмма выстраивается сама, избегая наложений.' },
            { icon: 'mouse', title: 'Навигация скроллом', desc: 'плавное погружение в любой уровень вложенности. Больше никаких «спагетти-диаграмм» — система сама поддерживает порядок.' },
        ]},
        { img: '1', title: 'Семантический валидатор', points: [
            { icon: 'alert', title: '', desc: 'Мгновенно находите логические ошибки.' },
            { icon: 'conflict', title: 'Конфликты контекста', desc: 'Цветовая индикация показывает, что требует исправления, а что — лишь рекомендация.' },
            { icon: '', title: 'Дублирование имён и свойств', desc: '' },
        ]},
        { img: '1', title: 'Компонентный подход и переиспользование', points: [
            { icon: 'component', title: 'Изменяйте мастер‑компонент', desc: 'все его экземпляры обновятся автоматически.' },
            { icon: 'import', title: '', desc: 'Импортируйте сущности в любой проект.' },
            { icon: 'pazzle', title: 'Проектирование становится модульным и быстрым.', desc: '' },
        ]},
        { img: '1', title: 'ИИ‑конвертер текста и кода', points: [
            { icon: 'file-text', title: 'Текст → диаграмма', desc: 'опишите систему словами, и ИИ построит структуру.' },
            { icon: 'file-code', title: 'Диаграмма → текст/код ', desc: 'автоматически сгенерируйте описание, интерфейсы для разработчиков.' },
            { icon: 'file-down', title: 'Загрузите документ', desc: 'распознает текст в документах формата pdf и word' },
        ]},
    ];
</script>

<Header />

<Wrapper>
    <section class="flex h-100 justify-center items-center">
        <div class="flex flex-col p-4 gap-2 w-160 rounded-md bg-gray-glass">
            <h1>Новое восприятие структурных диаграмм</h1>
            <b>Создавайте сложные системы без хаоса</b>
            <p>Structura помогает архитекторам, аналитикам и разработчикам визуализировать, проверять и преобразовывать структурные диаграммы с помощью физической модели, семантического анализа и встроенного ИИ.</p>
            <div class="flex gap-4 -1">
                <button class="click px-2 text-lg rounded-sm bg-accent">Попробовать</button>
                <button class="click">Зарегистрироваться</button>
            </div>
        </div>
    </section>
    <section>
        {#each cards as {img, title, points}, i}
            <div class="{i % 2 == 0 && 'flex-row-reverse'} flex items-center justify-between gap-10">
                <div class="max-w-200 p-4 gap-2 flex flex-col rounded-md w-1/2 bg-gray-glass">
                    <h2>{title}</h2>
                    {#each points as {icon, title, desc}}
                        <div class="flex gap-2 text-justify">
                            <div>
                                <Icon name={icon} />
                            </div>
                            <p class=""> <b>{title}</b> {desc}</p>
                        </div>
                    {/each}
                </div>
                <div>
                    <img src="src/lib/img/{img}.gif" alt="dsds">
                </div>
            </div>
        {/each}
    </section>
    <section class="flex h-100 items-center justify-center">
        <div class="flex flex-col p-4 gap-2 w-160 rounded-md bg-gray-glass">
            <div class="flex gap-2 items-center">
                <Icon name="test" stroke="yellow" />
                <h1>Присоеденяйтесь к бета тестированию</h1>
            </div>
            <b>Создавайте сложные системы без хаоса</b>
            <p>Structura помогает архитекторам, аналитикам и разработчикам визуализировать, проверять и преобразовывать структурные диаграммы с помощью физической модели, семантического анализа и встроенного ИИ.</p>
            <div class="flex gap-4 -1">
                <button class="click px-2 text-lg rounded-sm border border-yellow">Протестировать</button>
                <button class="click px-2 text-lg rounded-sm text-black bg-yellow">Зарегистрироваться</button>
            </div>
        </div>
    </section>
</Wrapper>

<Footer />