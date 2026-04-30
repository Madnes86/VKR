import type { IFlatLink } from '$lib/interface';

export const links: IFlatLink[] = [
	{ id: 0, name: 'read', type: 'optional', is: 1, to: 4, isValue: false, toValue: true },
	{ id: 1, name: 'write', type: 'default', is: 2, to: 3, isValue: false, toValue: true }
];
