import type { ITreeObject } from "$lib/interface";

export function physics(objects: ITreeObject[], centerX: number, centerY: number) {
    const forces = objects.map(() => ({ fx: 0, fy: 0 }));

    // Приоритет #1: Коллизии. Импульс распределяется обратно
    // пропорционально массе — тяжёлые объекты почти не сдвигаются
    // от ударов лёгких, поэтому могут «заякориться» в центре.
    for (let i = 0; i < objects.length; i++) {
        const obj1 = objects[i];
        const centerX1 = obj1.x + obj1.size / 2;
        const centerY1 = obj1.y + obj1.size / 2;
        const m1 = obj1.mass ?? 1;

        for (let j = i + 1; j < objects.length; j++) {
            const obj2 = objects[j];
            const centerX2 = obj2.x + obj2.size / 2;
            const centerY2 = obj2.y + obj2.size / 2;
            const m2 = obj2.mass ?? 1;

            const dx = centerX1 - centerX2;
            const dy = centerY1 - centerY2;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const desiredDist = (obj1.size + obj2.size) * 0.8;

            if (dist < desiredDist && dist > 0.01) {
                const compression = 1 - (dist / desiredDist);
                const strength = Math.pow(compression, 2) * 350;
                const nx = dx / dist;
                const ny = dy / dist;

                const total = m1 + m2;
                const share1 = m2 / total;
                const share2 = m1 / total;

                forces[i].fx += nx * strength * share1;
                forces[i].fy += ny * strength * share1;
                forces[j].fx -= nx * strength * share2;
                forces[j].fy -= ny * strength * share2;
            }
        }
    }

    // Приоритет #2: Гравитация к центру. Сила ∝ mass², чтобы тяжёлые
    // тянулись к центру существенно сильнее лёгких — формируются
    // дискретные «орбиты» по массе в равновесии с отталкиванием.
    for (let i = 0; i < objects.length; i++) {
        const obj1 = objects[i];
        const centerX1 = obj1.x + obj1.size / 2;
        const centerY1 = obj1.y + obj1.size / 2;
        const m = obj1.mass ?? 1;

        const dx = centerX - centerX1;
        const dy = centerY - centerY1;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            const test = Math.max(dist / 50, 1);
            const strength = 0.0005 * m * m * test;

            forces[i].fx += dx * strength;
            forces[i].fy += dy * strength;
        }
    }

    // Применяем силы. Демпфирование ∝ 1/√m: лёгкие реагируют быстрее,
    // тяжёлые инертнее — центральные орбиты визуально стабильнее.
    for (let i = 0; i < objects.length; i++) {
        const m = objects[i].mass ?? 1;
        const damping = 0.9 / Math.sqrt(m);
        objects[i].x += forces[i].fx * damping;
        objects[i].y += forces[i].fy * damping;
    }
}
export function resizeObjects(objects: ITreeObject[], scale: number) {
    objects.forEach(e => {
        e.size = 100 * (e.mass ?? 1) * scale;
        if (e.objects && e.objects.length > 0) {
            resizeObjects(e.objects, scale);
        }
    });
}
