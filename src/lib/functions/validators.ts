import { i18n } from "$lib/i18n";

export function emailRule(v: string): string | null {
    if (!v || v.length === 0) return i18n.t('validate.email.required');
    if (v.length < 5) return i18n.t('validate.email.short');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return i18n.t('validate.email.invalid');
    return null;
}

export function passwordRule(v: string): string | null {
    if (!v || v.length === 0) return i18n.t('validate.password.required');
    if (v.length < 6) return i18n.t('validate.password.short');
    if (!/[A-Z]/.test(v)) return i18n.t('validate.password.upper');
    if (!/[0-9]/.test(v)) return i18n.t('validate.password.digit');
    if (v.includes(' ')) return i18n.t('validate.password.space');
    return null;
}

export function userRule(v: string): string | null {
    if (!v || v.length === 0) return i18n.t('validate.user.required');
    if (v.length < 3) return i18n.t('validate.user.short');
    if (v.length > 20) return i18n.t('validate.user.long');
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return i18n.t('validate.user.chars');
    if (v.includes(' ')) return i18n.t('validate.password.space');
    return null;
}
