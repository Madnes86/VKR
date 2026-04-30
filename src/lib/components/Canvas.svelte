<script lang="ts">
	import { untrack } from 'svelte';
	import { Object, Link } from '$lib/components';
	import { treeStore, objects as flatObjects } from '$lib/stores/objects.svelte';
	import { scaleStore } from '$lib/stores/scale.svelte';
	import { dragStore } from '$lib/stores/drag.svelte';
	import { centerObjects, resizeObjects, runPhysicsLoop } from '$lib/functions/physics';
	import { contextStore } from '$lib/stores/context.svelte';
	import { searchStore } from '$lib/stores/search.svelte';
	import { side } from '$lib/stores/other.svelte';
	import { computeSearchVisibility } from '$lib/functions/search';
	import { computeAppearanceOrder, getRevealDelay } from '$lib/functions/appearance';
	import { appearanceStore } from '$lib/stores/appearance.svelte';
	import { untangleLinks } from '$lib/functions/untangle';
	import { diagramSettings } from '$lib/stores/diagram.svelte';
	import { notificationStore } from '$lib/stores/notification.svelte';
	import { validationStore } from '$lib/stores/validation.svelte';
	import { i18n } from '$lib/i18n';
	import type { ITreeObject, ILink } from '$lib/interface';
	import DiagramToolbar from './DiagramToolbar.svelte';

	let width: number = $state(0);
	let height: number = $state(0);
	let centerX = $derived.by(() => {
		const leftWidth = side.v[0]?.width ?? 0;
		const rightWidth = side.v[1]?.width ?? 0;

		return (leftWidth + width - rightWidth) / 2;
	});
	let centerY: number = $derived(height / 2);
	let id: number | null = $state(treeStore.all.id ?? null);
	let objects: ITreeObject[] = $state([]);
	let links: ILink[] = $state([]);

	// Счётчик-«прод» для перезапуска физического цикла после ручных
	// мутаций позиций (например, untangleLinks). Без него цикл может
	// спать и не заметить, что объекты разъехались.
	let physicsNudge: number = $state(0);

	function untangle() {
		// Без связей распутывать нечего — сообщаем явно, иначе клик
		// по кнопке выглядит как «ничего не произошло».
		if (links.length === 0) {
			notificationStore.show({
				icon: 'alert',
				title: i18n.t('diagram.untangle.empty'),
				type: 'info'
			});
			return;
		}
		const moved = untangleLinks(objects, links);
		if (moved === 0) {
			// Связи есть, но все короче порога — повторное нажатие
			// без видимого эффекта. Показываем info-уведомление.
			notificationStore.show({
				icon: 'check',
				title: i18n.t('diagram.untangle.optimized'),
				type: 'info'
			});
			return;
		}
		physicsNudge++;
	}

	// Issues всегда живут актуально — пересчитываем на каждое изменение
	// графа. Подсветку на самой диаграмме включает кнопка в toolbar
	// (validationStore.highlight), иначе при перетаскивании объекты
	// мерцали бы красным.
	$effect(() => {
		flatObjects.all;
		// link store импортирован как `links` через objects.svelte;
		// здесь у нас локальная переменная `links` — это ITree-список,
		// он тоже зависит от flat-сторов косвенно через treeStore.
		untrack(() => validationStore.run());
	});

	function toggleValidation() {
		// Пустая диаграмма — нечего показывать.
		if (flatObjects.all.length === 0) {
			notificationStore.show({
				icon: 'alert',
				title: i18n.t('diagram.validate.empty'),
				type: 'info'
			});
			return;
		}
		// Без issues — пользователю просто сообщаем, что всё чисто.
		// Подсветка не имеет смысла без проблем.
		if (validationStore.issues.length === 0) {
			notificationStore.success(i18n.t('diagram.validate.passed'));
			return;
		}
		// Есть issues — toggle подсветки. Сами объекты/связи окрасятся
		// в Object/Link через severityForObject/severityForLink, но
		// только когда highlight=true.
		validationStore.toggleHighlight();
	}

	function onwheel(e: WheelEvent) {
		scaleStore.value = e.deltaY > 0 ? (scaleStore.value -= 1.01) : (scaleStore.value += 1.01);
		resizeObjects(objects, scaleStore.value);
	}
	function onmousemove(e: MouseEvent) {
		// ?
		const dragObj = dragStore.getValue();

		if (dragObj) {
			const obj = objects.find((o) => o.id === dragObj.id);

			if (!obj) return;
			obj.x = e.clientX - dragObj.offsetX;
			obj.y = e.clientY - dragObj.offsetY;
		}
	}

	function oncontextmenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		// Канвас — фоллбек для пустого места. Если правый клик пришёл
		// от Object/Link, они уже остановят propagation своими
		// listener-ами, и сюда мы не попадём.
		contextStore.set(e, id ?? 0, 'canvas');
	}
	// Подсчёт visibility — не делаем spread, чтобы оригинальные ITreeObject
	// (на которые мутирует physics x/y) сохранились между переключениями
	// фильтра. Filter возвращает массив с теми же refs.
	let visibility: Set<number> | null = $derived.by(() => {
		const q = searchStore.get().trim();
		if (!searchStore.applied || !q) return null;
		return computeSearchVisibility(flatObjects.all, q);
	});

	$effect(() => {
		const data = treeStore.all;
		const v = visibility;
		if (!data || !data.objects) return;

		const baseLinks = data.links ?? [];
		const targetObjects = v ? data.objects.filter((o) => v.has(o.id)) : data.objects;
		const targetLinks = v ? baseLinks.filter((l) => v.has(l.is) && v.has(l.to)) : baseLinks;

		objects = targetObjects;
		links = targetLinks;

		// Собираем все ID в дереве (рекурсивно), чтобы appearanceStore
		// знал актуальный набор и забыл устаревшие. Заодно строим
		// карту id→объект для последующего поиска массы.
		const allIds = new Set<number>();
		const idToObj = new Map<number, ITreeObject>();
		function walk(o: ITreeObject) {
			allIds.add(o.id);
			idToObj.set(o.id, o);
			for (const c of o.objects ?? []) walk(c);
		}
		for (const o of targetObjects) walk(o);

		// untrack: чтения/записи appearanceStore не должны делать этот
		// эффект реактивным к нему — иначе reveal() ре-триггерит эффект
		// и таймер обнуляется на каждой итерации, всё появляется разом.
		const order = computeAppearanceOrder(targetObjects, targetLinks);
		const toReveal = untrack(() => {
			appearanceStore.forget(allIds);
			return order.filter((id) => !appearanceStore.has(id));
		});

		// Размеры нужны корректные для центрирования (центр = x + size/2).
		// buildTree даёт size=100, реальный размер задаёт resizeObjects по
		// массе и scale. Untrack — реактивная подписка на scale тут не нужна.
		untrack(() => resizeObjects(targetObjects, scaleStore.value));

		// Стартовая позиция впервые появляющихся top-level объектов —
		// центр канваса с микро-разбросом. Без этого Math.random() из
		// buildTree даёт стартовые координаты около (0,0) и диаграмма
		// «вылетает» из левого-верхнего угла. Дочерние не трогаем — у них
		// координаты относительны контейнеру родителя.
		const cx =
			untrack(() => centerX) || (typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
		const cy =
			untrack(() => centerY) || (typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
		const revealSet = new Set(toReveal);
		const freshTopLevel = targetObjects.filter((o) => revealSet.has(o.id));
		if (freshTopLevel.length > 0) centerObjects(freshTopLevel, cx, cy);

		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let i = 0;

		function reveal() {
			if (cancelled || i >= toReveal.length) return;
			const id = toReveal[i++];
			appearanceStore.reveal(id);
			if (i < toReveal.length) {
				// Задержка перед СЛЕДУЮЩИМ объектом масштабируется по
				// массе только что показанного — тяжёлые держат паузу.
				const mass = idToObj.get(id)?.mass ?? 1;
				timer = setTimeout(reveal, getRevealDelay(mass));
			}
		}

		if (toReveal.length > 0) reveal();

		return () => {
			cancelled = true;
			if (timer !== undefined) clearTimeout(timer);
		};
	});
	$effect(() => {
		if (objects.length === 0) return;
		physicsNudge; // dependency — пробуждает цикл после untangle
		// Зависимости от настроек диаграммы — чтобы любая правка
		// слайдера в Settings перезапустила цикл с новыми параметрами.
		diagramSettings.spring;
		diagramSettings.gravity;
		diagramSettings.repulsion;
		diagramSettings.baseSize;
		diagramSettings.restThreshold;

		resizeObjects(objects, scaleStore.value);
		return runPhysicsLoop({
			getObjects: () => objects,
			getLinks: () => links,
			getCenter: () => ({ x: centerX, y: centerY }),
			isPaused: () => dragStore.hasValue(),
			onWakeSignal: (wake) => dragStore.subscribe(() => wake())
		});
	});
</script>

<svelte:window {onmousemove} {onwheel} bind:innerWidth={width} bind:innerHeight={height} />

<!-- oncontextmenu вешаем на корневой div, а не на window: иначе
     правый клик в SideBar (он absolute поверх) вызывал бы меню,
     даже если клик не на диаграмме. Object/Link ставят свой kind
     и stopPropagation; пустой канвас сюда долетит как kind=canvas. -->
<div {oncontextmenu} class="fixed top-0 left-0 z-0 size-full">
	{#each objects as { id, name, type, x, y, size, objects, links }, i}
		{#if appearanceStore.has(id)}
			<Object {id} {name} {type} {x} {y} {size} {objects} {links} selParent={false} />
		{/if}
	{/each}
	{#each links as l}
		{@const is = objects.find((o) => o.id === l.is)}
		{@const to = objects.find((o) => o.id === l.to)}

		{#if is && to && appearanceStore.has(l.is) && appearanceStore.has(l.to)}
			<Link
				id={l.id}
				name={l.name}
				type={l.type}
				{is}
				{to}
				isValue={l.isValue}
				toValue={l.toValue}
			/>
		{/if}
	{/each}
</div>

<DiagramToolbar onUntangle={untangle} onValidate={toggleValidation} />
