/**
 * validationStore — состояние результата проверки диаграммы.
 *
 * Не реактивно-derived: проверка запускается явно (после extract или
 * по кнопке в Alerts), результат сохраняется в #issues. Это
 * сознательно — пересчёт на каждое изменение объектов/связей в
 * сценарии редактирования сейчас не нужен и шумит на UX (объекты
 * краснеют при перетаскивании, пока пользователь не дотащил до
 * нужного места).
 *
 * severityForObject/severityForLink — error > warning > null.
 */

import { objects, links } from '$lib/stores/objects.svelte';
import { validate, type Issue, type Severity } from '$lib/functions/validation';

class ValidationStore {
    #issues: Issue[] = $state([]);
    #lastRunAt: number | null = $state(null);

    get issues() { return this.#issues; }
    get lastRunAt() { return this.#lastRunAt; }
    get errors() { return this.#issues.filter(i => i.severity === 'error'); }
    get warnings() { return this.#issues.filter(i => i.severity === 'warning'); }

    run(): Issue[] {
        this.#issues = validate(objects.all, links.all);
        this.#lastRunAt = Date.now();
        return this.#issues;
    }

    clear() {
        this.#issues = [];
        this.#lastRunAt = null;
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
