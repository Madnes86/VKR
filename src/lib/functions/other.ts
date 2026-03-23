export function objectValidation(v: string) {
    return v
        .replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}