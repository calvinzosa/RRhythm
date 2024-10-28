export enum InlineType {
	Text = 0,
	Ref = 1,
}

export enum ModifierType {
	Bold = 0,
	Italic = 1,
	Strike = 2,
	Code = 3,
}

export enum BlockType {
	None = 0,
	Paragraph = 1,
	Heading = 2,
	Code = 3,
	List = 4,
	Ruler = 5,
	Quote = 6,
}

export interface Block {
	Indent?: number;
	Text?: string;
	Level?: number;
	Syntax?: string;
	Code?: string;
	Lines?: Array<ListItem>;
	RawText?: string;
	Iterator?: IterableIterator<Block>;
}

export interface ListItem {
	Level: number;
	Text: string;
	Symbol: string;
}

export function sanitize(input: string): string;
export function parseText(md: string): string;

export function parseTokens(md: string): Map<boolean, string>;
export function parse(md: string, inlineParser?: (text: string) => string): Map<BlockType, Block>;
// i know Map isnt the correct type but its what produces the right lua code so


export const richTextLookup: Record<string, typeof ModifierType>;