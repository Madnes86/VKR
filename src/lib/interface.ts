export type IFlatObject = {
    id: number,
    name: string,
    type: string,
    parent: number | null,
    content?: Record<string, unknown> | null,
};
export type ITreeObject ={
    id: number;
    name: string;
    type?: string;
    x: number;
    y: number;
    size: number;
    mass?: number;
    parent?: number | null;
    objects?: ITreeObject[];
    links?: ILink[];
    selParent?: boolean;
};
export type IFlatLink = {
    id: number;
    name: string;
    type: string;
    is: number;
    to: number;
    // Стрелка-наконечник на каждом конце. true — рисуем, false — нет.
    // Для синтаксической связи по умолчанию: isValue=false, toValue=true.
    isValue: boolean;
    toValue: boolean;
};
export type ILink = {
    id: number;
    name: string;
    type: string;
    is: any;
    to: any;

}
export type IObject = {
    id: number;
    name: string;
    type: string;
    objects: IObject[];
    links: ILink[];
};
export type ICategory = {
    name: string;
    icon: string;
    check: boolean;
};
export type IAlert = {
    title: string, 
    text: string, 
    type: 'alert' | 'error'
};