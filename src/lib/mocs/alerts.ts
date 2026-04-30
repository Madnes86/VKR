import type { IAlert } from '$lib/interface';

export let alerts: IAlert[] = [
	{ title: 'test', text: 'test', type: 'alert' },
	{ title: 'test2', text: 'test', type: 'error' },
	{ title: 'Access Denied', text: 'You do not have permission to edit this node.', type: 'error' },
	{ title: 'Connection Lost', text: 'Reconnecting to the server in 5s...', type: 'alert' },
	{ title: 'Update Available', text: 'A new version of the editor is ready.', type: 'error' }
];
