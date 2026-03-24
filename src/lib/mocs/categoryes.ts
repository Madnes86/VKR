import type { ICategory } from "$lib/interface";

export const categoryes: ICategory[] = [
    { name: 'Local search', icon: 'global', check: false},
    { name: 'Objects',    icon: 'object', check: true },
    { name: 'Links',      icon: 'link', check: false},
    { name: 'optional',   icon: 'type', check: false}
];