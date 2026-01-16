declare module "linebreak" {
	export interface Break {
		position: number;
		required: boolean;
	}

	export default class LineBreaker {
		constructor(input: string);
		nextBreak(): Break | null;
	}
}
