
export interface GridConfig {
    numX: number,
    numY: number,
}

export type CellKind =
    'COLOR'  // '#ff9900', or '' for blank
    | 'IMAGE_URL'  // url to an image on the web
    | 'IMAGE_B64';  // raw b64 image data in jpeg format but with no mimetype or anything

export interface Cell {
    x: number,
    y: number,
    kind: CellKind,
    content: string,  // color string, image url, image b64 data
    caption?: string,
}
