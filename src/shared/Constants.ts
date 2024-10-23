export namespace Constants {
	export namespace OsuFile {
		export enum NoteType {
			NormalNote = 0b0000_0001,
			HoldNote = 0b1000_0000,
		}
	}
	
	export namespace ImageIds {
		export enum RankImages {
			X = 'rbxassetid://77723793937127',
			S = 'rbxassetid://134774167253219',
			A = 'rbxassetid://133894751806162',
			B = 'rbxassetid://74910966303660',
			C = 'rbxassetid://86986699918371',
			D = 'rbxassetid://71384548149260',
		}
	}
	
	export namespace Attributes {
		export enum Character {
			IsAttachedStage = 'IsAttachedStage',
			StagePlayerNumber = 'StagePlayerNumber',
		}
		
		export enum Stage {
			Status = 'Status',
		}
		
		export enum StagePreview {
			IsOngoing = 'IsOngoing',
		}
	}
}