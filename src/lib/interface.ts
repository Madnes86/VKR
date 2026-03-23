export type IFlatObject = {
    id: number,
    name: string, 
    parent: number | null,
};
export type ITreeObject ={
    id: number;
    name: string;
    x: number;
    y: number;
    size: number;
    mass: number;
    parent: number | null;
    objects: ITreeObject[];
    links: ILink[];
};
export type ILink = {
    id: number;
    name: string;
    is: number;
    to: number;
    isValue: number;
    toValue: number;
};
export type IObject = {
    id: number;
    name: string; 
    objects: IObject[];
    links: ILink[];
};
export type ICategory = {
    name: string;
    icon: string;
    check: boolean;
}