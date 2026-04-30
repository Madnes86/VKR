import { alerts as alertsMock } from '$lib/mocs/alerts';
import type { IAlert } from '$lib/interface';

export class AlertStore {
	#alerts: IAlert[] = $state(alertsMock);

	get all() {
		return this.#alerts;
	}
}
export const alerts = new AlertStore();
