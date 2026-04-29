// Пользовательские параметры физики и появления диаграммы.
// Читаются физикой/анимацией каждый кадр — пользователь крутит
// слайдеры в Settings, эффект применяется немедленно. Persist в
// localStorage, чтобы настройки переживали перезагрузку.

const STORAGE_KEY = 'diagram.settings.v1';

export const DIAGRAM_DEFAULTS = {
    // Сила пружины вдоль связи (физика).
    spring: 0.003,
    // Множитель гравитации к центру (умножается на mass²).
    gravity: 0.0005,
    // Множитель отталкивания при коллизии (умножается на compression²).
    repulsion: 350,
    // Базовый размер объекта в пикселях, умножается на mass × scale.
    baseSize: 100,
    // Порог длинной связи в долях от rest-дистанции (untangle).
    longLinkRatio: 2.5,
    // Смещение в px/кадр, ниже которого объект считается замершим.
    restThreshold: 0.05,
    // Базовая задержка появления нового объекта в миллисекундах.
    revealDelay: 100,
} as const;

export type DiagramSettingsValues = typeof DIAGRAM_DEFAULTS;

class DiagramSettingsStore {
    spring = $state(DIAGRAM_DEFAULTS.spring);
    gravity = $state(DIAGRAM_DEFAULTS.gravity);
    repulsion = $state(DIAGRAM_DEFAULTS.repulsion);
    baseSize = $state(DIAGRAM_DEFAULTS.baseSize);
    longLinkRatio = $state(DIAGRAM_DEFAULTS.longLinkRatio);
    restThreshold = $state(DIAGRAM_DEFAULTS.restThreshold);
    revealDelay = $state(DIAGRAM_DEFAULTS.revealDelay);

    constructor() {
        this.#load();
    }

    #load() {
        if (typeof localStorage === 'undefined') return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            const k = (n: keyof DiagramSettingsValues) => {
                const v = (data as Record<string, unknown>)[n];
                if (typeof v === 'number' && Number.isFinite(v)) {
                    (this as unknown as Record<string, number>)[n] = v;
                }
            };
            k('spring'); k('gravity'); k('repulsion'); k('baseSize');
            k('longLinkRatio'); k('restThreshold'); k('revealDelay');
        } catch { /* мусор в storage — игнорируем */ }
    }

    persist() {
        if (typeof localStorage === 'undefined') return;
        try {
            const data: DiagramSettingsValues = {
                spring: this.spring,
                gravity: this.gravity,
                repulsion: this.repulsion,
                baseSize: this.baseSize,
                longLinkRatio: this.longLinkRatio,
                restThreshold: this.restThreshold,
                revealDelay: this.revealDelay,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch { /* quota — игнорируем */ }
    }

    reset() {
        this.spring = DIAGRAM_DEFAULTS.spring;
        this.gravity = DIAGRAM_DEFAULTS.gravity;
        this.repulsion = DIAGRAM_DEFAULTS.repulsion;
        this.baseSize = DIAGRAM_DEFAULTS.baseSize;
        this.longLinkRatio = DIAGRAM_DEFAULTS.longLinkRatio;
        this.restThreshold = DIAGRAM_DEFAULTS.restThreshold;
        this.revealDelay = DIAGRAM_DEFAULTS.revealDelay;
        this.persist();
    }
}

export const diagramSettings = new DiagramSettingsStore();
