import type { ITreeObject, IFlatObject, ILink } from "$lib/interface";
import type { ObjectsStore, LinksStore } from "$lib/stores/objects.svelte";

export function objectValidation(v: string) {
    return v
        .replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
export function buildTree(visible: number, objects: ObjectsStore, links: LinksStore): ITreeObject {
    const cacheObjects = new Map<number, IFlatObject>(objects.all.map(o => [o.id, o]));
    const cacheLinks   = new Map<number, ILink>(links.all.map(l => [l.id, l]));

    const build = (o: IFlatObject, current: number): ITreeObject => {
        const node: ITreeObject = { ...o, objects: [], links: [], mass: 1, x: Math.random(), y: Math.random(), size: 100 };
        if (current < 3) {
            const children = Array.from(cacheObjects.values()).filter(i => i.parent === o.id);

            if (children.length > 0) {
                node.objects = children.map(child => build(child, current + 1));
                node.mass += node.objects.reduce((sum, child) => sum + child.mass, 0);
                // Включаем сам узел — чтобы связи «родитель → ребёнок» тоже рендерились
                // внутри этого контейнера (одним концом — центр самого o, другим — child).
                const subtreeIds = new Set<number>([o.id, ...children.map(i => i.id)]);
                node.links = Array.from(cacheLinks.values()).filter(e =>
                    subtreeIds.has(e.is) && subtreeIds.has(e.to)
                );
            }
        }
        return node;
    };

    const existing = cacheObjects.get(visible);
    if (existing) return build(existing, 0);

    // Виртуальный корень: показывает все объекты верхнего уровня (parent === null).
    const roots = Array.from(cacheObjects.values()).filter(o => o.parent === null);
    const rootIds = new Set(roots.map(r => r.id));
    const builtRoots = roots.map(r => build(r, 0));
    const virtualRoot: ITreeObject = {
        id: 0,
        name: "Root",
        type: "default",
        parent: null,
        objects: builtRoots,
        links: Array.from(cacheLinks.values()).filter(e => rootIds.has(e.is) && rootIds.has(e.to)),
        mass: 1 + builtRoots.reduce((sum, c) => sum + (c.mass ?? 0), 0),
        x: Math.random(),
        y: Math.random(),
        size: 100,
    };
    return virtualRoot;
}
export function flatTree(node: ITreeObject): Set<number> {
    const ids = new Set<number>([node.id]);
    if (node.objects.length > 0) {
        node.objects.forEach(e => {
            const eIds = flatTree(e);
            eIds.forEach(id => ids.add(id));
        });
    }
    return ids;
}