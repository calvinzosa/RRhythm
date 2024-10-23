/*
local s = ''
local function check(i,l)
	if #s == 0 then
		s = string.format('\nexport type %s = %s & {\n',i.Name,i.ClassName)
	end
	local indent = string.rep('	',l)
	for _, child in i:GetChildren() do
		local childType = string.format('%s%s: %s', indent, child.Name, child.ClassName)
		if #child:GetChildren() > 0 then
			s..=`{childType} & \{\n`
			check(child,l+1)
			s..=`{indent}};\n`
		else
			s..=`{childType};\n`
		end
	end
end
check(game, 1)s..='};\n'print(s)
*/

// Standard Types

export type Grade = 'X' | 'S' | 'A' | 'B' | 'C' | 'D';

// Replicated Storage

export type EventsFolder = Folder & {
	ChooseSong: RemoteFunction;
	JoinStage: RemoteEvent;
	UpdateStats: RemoteEvent;
	StartSongSelection: RemoteEvent;
	EndSongSelection: RemoteEvent;
	StageStartSong: RemoteEvent;
	UpdateStagePreview: RemoteEvent;
	StartStagePreview: RemoteEvent;
	EndStagePreview: RemoteEvent;
};

export type SkinFolder = Folder & {
	Note: UINote;
	HoldNote: UIHoldNote;
	TailNote: UITailNote;
	BodyNote: UIBodyNote;
	Lane: UILane;
};

// Models

export type StagePlayer = Part & {
	Trigger: ProximityPrompt;
	Attachment0: Attachment;
	RigidConstraint: RigidConstraint;
	Character: ObjectValue;
};

export type StagePreview = Part & {
	SurfaceGui: SurfaceGui & {
		Background: Frame;
		Lanes: Frame;
		AccuracyDisplay: UIAccuracyDisplay;
		ComboCounter: UIComboCounter;
	};
};

export type StageModel = Model & {
	Base: Part;
	Camera: Part;
	SongInfo: Part & {
		SurfaceGui: SurfaceGui & {
			TextLabel: TextLabel;
		}
	}
};

// User Interface

export type UIGrade = Frame & {
	Icon: ImageLabel;
};

export type UISongSelector = Frame & {
	UICorner: UICorner;
	UIListLayout: UIListLayout;
	UIPadding: UIPadding;
	Topbar: Frame & {
		Close: TextButton & {
			UIAspectRatioConstraint: UIAspectRatioConstraint;
		};
		Title: TextLabel & {
			UIFlexItem: UIFlexItem;
		};
		UIListLayout: UIListLayout;
		TimeLeft: TextLabel;
	};
	Content: Frame & {
		UIListLayout: UIListLayout;
		Songs: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIPadding: UIPadding;
			UIFlexItem: UIFlexItem;
		};
		Info: Frame & {
			UIListLayout: UIListLayout;
			Composer: TextLabel;
			UIPadding: UIPadding;
			SongTitle: TextLabel;
			Difficulties: ScrollingFrame & {
				UIListLayout: UIListLayout;
				UIPadding: UIPadding;
			};
			Mappers: TextLabel;
			UIFlexItem: UIFlexItem;
			StarDifficulty: TextLabel;
			Duration: TextLabel;
			MaxHealth: TextLabel;
			OverallDifficulty: TextLabel;
			KeyCount: TextLabel;
		};
		Categories: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIPadding: UIPadding;
			UIFlexItem: UIFlexItem;
		};
		UIFlexItem: UIFlexItem;
	};
	Bottom: Frame & {
		UIListLayout: UIListLayout;
		Skip: TextButton & {
			UIFlexItem: UIFlexItem;
		};
		Select: TextButton & {
			UIFlexItem: UIFlexItem;
		};
	};
};

export type UIStatsContainer = Frame & {
	Header: TextLabel;
	UIPadding: UIPadding;
	UIListLayout: UIListLayout;
	Content: Frame & {
		UIFlexItem: UIFlexItem;
		UIListLayout: UIListLayout;
		Marvelous: TextLabel;
		UIPadding: UIPadding;
		Perfect: TextLabel;
		Great: TextLabel;
		Ok: TextLabel;
		Bad: TextLabel;
		Misses: TextLabel;
		Accuracy: TextLabel;
		HitError: TextLabel;
		HighestCombo: TextLabel;
		TotalScore: TextLabel;
	};
	Close: TextButton & {
		UIPadding: UIPadding;
	};
};

export type UIComboCounter = CanvasGroup & {
	Combo: TextLabel & {
		UIScale: UIScale;
	};
};

export type UIAccuracyDisplay = CanvasGroup & {
	Accuracy: TextLabel & {
		UIScale: UIScale;
	};
};

export type UIInfoHUD = Frame & {
	UIListLayout: UIListLayout;
	Accuracy: TextLabel;
	Combo: TextLabel;
	Misses: TextLabel;
	Score: TextLabel;
};

export type UIDebugHUD = Frame & {
	FPS: TextLabel;
	NoteSkin: TextLabel;
	Autoplay: TextLabel;
	HitPosition: TextLabel;
	AverageError: TextLabel;
	PressedNotes: TextLabel;
	RenderedNotes: TextLabel;
	Time: TextLabel;
	PixelsPerSecond: TextLabel;
	BPM: TextLabel;
	ScrollSpeed: TextLabel;
	NoteSpeed: TextLabel;
	UIListLayout: UIListLayout;
};

export type UILane = CanvasGroup & {
	UIPadding: UIPadding;
	Notes: Frame;
	JudgementLine: Frame & {
		UIAspectRatioConstraint: UIAspectRatioConstraint;
		Note: Frame & {
			UICorner: UICorner;
			UIStroke: UIStroke;
		};
	};
};

export type UINote = Frame & {
	UIAspectRatioConstraint: UIAspectRatioConstraint;
	Note: Frame & {
		UICorner: UICorner;
	};
};

export type UIHoldNote = Frame & {
	UIAspectRatioConstraint: UIAspectRatioConstraint;
	Note: Frame & {
		UICorner: UICorner;
	};
};

export type UITailNote = Frame & {
	UIAspectRatioConstraint: UIAspectRatioConstraint;
	Note: Frame & {
		UICorner: UICorner;
	};
};

export type UIBodyNote = Frame & {
	UIAspectRatioConstraint: UIAspectRatioConstraint;
	Note: Frame & {
		UICorner: UICorner;
	};
};

export type UIMain = ScreenGui & {
	Lanes: Frame;
	Transition: Frame;
	Grade: UIGrade;
	SongSelector: UISongSelector;
	StatsContainer: UIStatsContainer;
	ComboCounter: UIComboCounter;
	AccuracyDisplay: UIAccuracyDisplay;
	InfoHUD: UIInfoHUD;
	DebugHUD: UIDebugHUD;
};

// Gameplay

export type NormalCreatedNote = BaseCreatedNote & {
	isTailNote: false;
	isHoldNote: false;
	note: UINote;
};

export type TailCreatedNote = BaseCreatedNote & {
	isTailNote: true;
	isHoldNote: false;
	note: UITailNote;
	holdNote?: HoldCreatedNote;
};

export type HoldCreatedNote = BaseCreatedNote & {
	isTailNote: false;
	isHoldNote: true;
	note: UIHoldNote;
	bodyNote: UIBodyNote;
	tailNote?: TailCreatedNote;
	isHeld: boolean;
	isReleased: boolean;
};

export type BaseCreatedNote = {
	isHoldNote: boolean;
	isTailNote: boolean;
	noteData: NoteObject;
	didPress: boolean;
	didAutoPress: boolean;
	id: number;
};

export type CreatedNote =
	| NormalCreatedNote
	| TailCreatedNote
	| HoldCreatedNote;

export type BaseTimingObject = {
	type: number;
	millisecond: number;
	volume: number;
};

export type NormalTimingObject = BaseTimingObject & {
	type: 0;
	bpm?: number | -1;
	scrollSpeed?: number | -1;
};

export type BaseNoteObject = {
	type: number;
	millisecond: number;
	lane: number;
};

export type NormalNoteObject = BaseNoteObject & {
	type: 0;
};

export type HoldNoteObject = BaseNoteObject & {
	type: 1;
	holdLength: number;
};

export type TimingObject =
	| NormalTimingObject;

export type NoteObject =
	| NormalNoteObject
	| HoldNoteObject;

export type EventObject = {};

export interface Chart {
	metadata: {
		title: string;
		audioName: string;
		setName: string;
		description: string;
		difficulty: string;
		source: string;
		artist: string;
		mappers: (number | string)[];
		searchTags: string[];
		totalLanes: number;
	},
	difficulty: {
		damageRate: number;
		maxHealth: number;
		overallDifficulty: number;
	},
	events?: EventObject[];
	timings: TimingObject[];
	notes: NoteObject[];
};