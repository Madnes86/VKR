/**
 * projectStore — хранит исходный текст текущего проекта.
 *
 * Текст пользователя — единственный артефакт проекта; диаграмма (objects/links)
 * хранится отдельно, заполняется через extract или /sync. Поле в БД исторически
 * называется `code`, но содержит произвольный пользовательский текст.
 */

import {
	listProjects,
	getProject,
	createProject,
	saveProject,
	type Project
} from '$lib/functions/projects';
import { notificationStore } from '$lib/stores/notification.svelte';

class ProjectStore {
	#id: number | null = $state(null);
	#name: string = $state('');
	#version: number = $state(0);
	#text: string = $state('');
	#dirty: boolean = $state(false);
	#saving: boolean = $state(false);
	#saveStatus: string = $state('');

	get id() {
		return this.#id;
	}
	get name() {
		return this.#name;
	}
	get version() {
		return this.#version;
	}
	get text() {
		return this.#text;
	}
	get dirty() {
		return this.#dirty;
	}
	get saving() {
		return this.#saving;
	}
	get saveStatus() {
		return this.#saveStatus;
	}

	async load(): Promise<void> {
		const summaries = await listProjects();
		if (summaries.length > 0) {
			await this.open(summaries[0].id);
			return;
		}
		const p = await createProject('default', '');
		if (p) this.#adopt(p);
	}

	async open(id: number): Promise<void> {
		const p = await getProject(id);
		if (p) this.#adopt(p);
	}

	setText(text: string): void {
		this.#text = text;
		this.#dirty = true;
		this.#saveStatus = 'editing…';
	}

	async save(): Promise<boolean> {
		if (!this.#id || !this.#dirty || this.#saving) return false;
		this.#saving = true;
		this.#saveStatus = 'saving…';
		const res = await saveProject(this.#id, this.#version, { code: this.#text });
		this.#saving = false;
		if (res.ok) {
			this.#version = res.project.version;
			this.#dirty = false;
			this.#saveStatus = `saved v${this.#version}`;
			return true;
		}
		if (res.conflict) {
			this.#saveStatus = `conflict (server v${res.currentVersion}) — reload`;
			notificationStore.error('Другая сессия изменила проект — обновите страницу', 'error');
		} else {
			this.#saveStatus = `save failed: ${res.message}`;
		}
		return false;
	}

	#adopt(p: Project): void {
		this.#id = p.id;
		this.#name = p.name;
		this.#version = p.version;
		this.#text = p.code;
		this.#dirty = false;
		this.#saveStatus = 'loaded';
	}
}

export const projectStore = new ProjectStore();
