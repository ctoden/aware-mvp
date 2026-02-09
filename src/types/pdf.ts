export type PdfParseType = {
    text: string;
    metadata: any;
    pages: number;
}

export type PdfParseResponse = {
    textBase64: string;
    metadata: any;
    pages: number;
} 