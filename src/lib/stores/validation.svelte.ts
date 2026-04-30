/**
 * validationStore — состояние результата проверки диаграммы.
 *
 * Issues пересчитываются автоматически при изменении графа (Canvas
 * подписан через $effect). Подсветка же на самой диаграмме
 * (Object/Link окраска) включается отдельным флагом #highlight, который
 * пользователь явно тогглит кнопкой в DiagramToolbar — иначе в
 * процессе перетаскивания объекты постоянно мерцали бы красным.
 *
 * severityForObject/severityForLink — error > warning > null.
 */

import { objects, links } from '$lib/stores/objects.svelte';
import { validate, type Issue, type Severity } from '$lib/functions/validation';

class ValidationStore {
	#issues: Issue[] = $state([]);
	#lastRunAt: number | null = $state(null);
	#highlight: boolean = $state(false);

	get issues() {
		return this.#issues;
	}
	get lastRunAt() {
		return this.#lastRunAt;
	}
	get errors() {
		return this.#issues.filter((i) => i.severity === 'error');
	}
	get warnings() {
		return this.#issues.filter((i) => i.severity === 'warning');
	}
	/** Активна ли подсветка проблемных узлов на диаграмме. */
	get highlight() {
		return this.#highlight;
	}

	run(): Issue[] {
		this.#issues = validate(objects.all, links.all);
		this.#lastRunAt = Date.now();
		return this.#issues;
	}

	toggleHighlight(): boolean {
		this.#highlight = !this.#highlight;
		return this.#highlight;
	}

	setHighlight(v: boolean): void {
		this.#highlight = v;
	}

	clear() {
		this.#issues = [];
		this.#lastRunAt = null;
		this.#highlight = false;
	}

	/** Финальная серьёзность для объекта по правилу error > warning > null. */
	severityForObject(id: number): Severity | null {
		return this.#severityForTarget('object', id);
	}

	severityForLink(id: number): Severity | null {
		return this.#severityForTarget('link', id);
	}

	#severityForTarget(kind: 'object' | 'link', id: number): Severity | null {
		let result: Severity | null = null;
		for (const issue of this.#issues) {
			for (const t of issue.targets) {
				if (t.kind !== kind || t.id !== id) continue;
				if (issue.severity === 'error') return 'error';
				if (issue.severity === 'warning') result = 'warning';
			}
		}
		return result;
	}
}

export const validationStore = new ValidationStore();
