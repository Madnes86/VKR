import { writable } from 'svelte/store';

export type LinkType = {
    id: number,
    name: string, 
    objects: {is: number, to: number}[]
};

const { subscribe, update, set } = writable<LinkType[]>([
    {id: 1, name: "read", objects: [{is: 1, to: 2}]},
    {id: 1, name: "read", objects: [{is: 2, to: 3}]},
]);


export const linksStore = {
    subscribe,
    set,
    
    addLink: (link: LinkType) => update(links => [...links, link]),

    update: (link: LinkType) => update(links => links.map(e => e.id === link.id ? link : e)),
    
    removeLink: (id: number) => update(links => 
        links.filter(link => link.id !== id)
    )
};