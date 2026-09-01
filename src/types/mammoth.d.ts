declare module 'mammoth' {
  export interface MammothOptions {
    styleMap?: string[] | string;
    includeDefaultStyleMap?: boolean;
    convertImage?: any;
    ignoreEmptyParagraphs?: boolean;
  }

  export interface MammothResult {
    value: string; // HTML string
    messages: {
      type: 'warning' | 'error';
      message: string;
    }[];
  }

  export function convertToHtml(
    input: { arrayBuffer?: ArrayBuffer; buffer?: Buffer; path?: string },
    options?: MammothOptions
  ): Promise<MammothResult>;

  export function extractRawText(
    input: { arrayBuffer?: ArrayBuffer; buffer?: Buffer; path?: string }
  ): Promise<{ value: string; messages: any[] }>;
}
