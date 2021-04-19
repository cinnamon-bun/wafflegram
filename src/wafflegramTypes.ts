
export interface GridConfig {
    numX: number,
    numY: number,
}
export enum CellKind {
    Url,    // content is a url to an image
    Color,  // content is a color like #ff9900, or ''
    B64Image,  // content is b64 image data
}
export interface Cell {
    x: number,
    y: number,
    kind: CellKind,
    content: string,
    caption?: string,
}
