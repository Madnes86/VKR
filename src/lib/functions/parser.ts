import type { IFlatLink, IFlatObject } from "$lib/interface";


export function getText(objects: IFlatObject[], links?: IFlatLink[]) {
    return [...objects, ...(links || [])].map(e => e.name).join(' ');
}
export function getData(t: string) {

}