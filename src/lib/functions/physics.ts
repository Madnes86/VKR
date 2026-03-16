export function physics(objects: any[], centerX: any, centerY: any, center?: boolean) {
    const forces = objects.map(() => ({ fx: 0, fy: 0 }));

    // Приоритет #1: Коллизии с зазором 30%
    for (let i = 0; i < objects.length; i++) {
        const obj1 = objects[i];
        const centerX1 = obj1.x + obj1.size / 2;
        const centerY1 = obj1.y + obj1.size / 2;
        
        for (let j = i + 1; j < objects.length; j++) {
            const obj2 = objects[j];
            const centerX2 = obj2.x + obj2.size / 2;
            const centerY2 = obj2.y + obj2.size / 2;

            const dx = centerX1 - centerX2;
            const dy = centerY1 - centerY2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const desiredDist = (obj1.size + obj2.size) * 0.65;
            
            if (dist < desiredDist && dist > 0.01) {
                const compression = 1 - (dist / desiredDist);
                const strength = Math.pow(compression, 2) * 350;
                const nx = dx / dist;
                const ny = dy / dist;
                
                forces[i].fx += nx * strength;
                forces[i].fy += ny * strength;
                forces[j].fx -= nx * strength;
                forces[j].fy -= ny * strength;
            }
        }
    }

    // Приоритет #2: Гравитация к центру
    // if (center) {
        for (let i = 0; i < objects.length; i++) {
            const obj1 = objects[i];
            const centerX1 = obj1.x + obj1.size / 2;
            const centerY1 = obj1.y + obj1.size / 2;

            const dx = centerX - centerX1;
            const dy = centerY - centerY1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 1) {
                // Большие объекты сильнее притягиваются к центру
                const size = obj1.size;
                const test = Math.max(dist / 50, 1);
                const strength = 0.00002 * size * test;
                
                forces[i].fx += dx * strength;
                forces[i].fy += dy * strength;
            }
        }
    // }

    // Применяем силы
    for (let i = 0; i < objects.length; i++) {
        objects[i].x += forces[i].fx * 0.9;
        objects[i].y += forces[i].fy * 0.9;
    }
}
export function resizeObjects(objects: any[], scale: number) {
    objects.forEach(e => {
        e.size = 100 * (e.mass) * scale;
        if (e.objects.length > 0) {
            resizeObjects(e.objects, scale);
        }
    });
}