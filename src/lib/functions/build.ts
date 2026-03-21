import type { ITreeObject, IFlatObject, ILink } from "$lib/interface";
import type { ObjectsStore, LinksStore } from "$lib/stores/objects.svelte";

export function buildTree(visible: number, objects: ObjectsStore, links: LinksStore): ITreeObject {
    const cacheObjects = new Map<number, IFlatObject>(objects.all.map(o => [o.id, o]));
    const cacheLinks   = new Map<number, ILink>(links.all.map(l => [l.id, l]));

    const raw = cacheObjects.get(visible) || { id: visible, name: "Not Found", parent: null };;
    const build = (o: IFlatObject, current: number): ITreeObject => {
        const node: ITreeObject = { ...o, objects: [], links: [], mass: 1, x: Math.random(), y: Math.random(), size: 100 };
        if (current < 3) {
            const children = Array.from(cacheObjects.values()).filter(i => i.parent === o.id);
            
            if (children.length > 0) {
                node.objects = children.map(child => build(child, current + 1));
                node.mass += node.objects.reduce((sum, child) => sum + child.mass, 0); // updateMass
                const links = new Set(children.map(i => i.id));
                node.links = Array.from(cacheLinks.values()).filter(e => 
                    links.has(e.is) && links.has(e.to)
                );
            }
        }
        return node;
    };
    return build(raw, 0);
}