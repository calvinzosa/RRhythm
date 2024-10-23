import {
	HttpService,
	Workspace
} from '@rbxts/services';

import StringUtils from '@rbxts/string-utils';
import { $print, $warn } from 'rbxts-transform-debug';

import * as Types from 'shared/Types';
import { Constants } from 'shared/Constants';

function mapNumbers(number: string) {
	return tonumber(number) ?? 0;
}

export function parse(beatmap: string, log=false) {
	const chart: Types.Chart = {
		metadata: {
			title: '--',
			audioName: '--',
			setName: '--',
			description: '--',
			difficulty: '--',
			source: '--',
			artist: '--',
			mappers: [],
			searchTags: [],
			totalLanes: -1,
		},
		difficulty: {
			damageRate: -1,
			maxHealth: 10,
			overallDifficulty: -1
		},
		timings: [],
		events: [],
		notes: []
	};
	
	let currentSection: string | undefined = undefined;
	
	for (const [, line] of ipairs(beatmap.split('\n'))) {
		if (line.size() === 0 || StringUtils.startsWith(line, '//')) continue;
		
		if (StringUtils.startsWith(line, '[') && StringUtils.endsWith(line, ']')) {
			currentSection = line.sub(2, -2);
		} else {
			const [propertyName, value] = line.split(':');
			
			if (currentSection === 'Metadata') {
				if (propertyName === 'TitleUnicode') {
					chart.metadata.title = value;
				} else if (propertyName === 'ArtistUnicode') {
					chart.metadata.artist = value;
				} else if (propertyName === 'Creator') {
					chart.metadata.mappers.push(value);
				} else if (propertyName === 'Tags') {
					chart.metadata.searchTags.push(value);
				}
			} else if (currentSection === 'Difficulty') {
				if (propertyName === 'HPDrainRate') {
					chart.difficulty.damageRate = math.clamp(tonumber(value) ?? 0, 0, 10);
				} else if (propertyName === 'OverallDifficulty') {
					chart.difficulty.overallDifficulty = math.clamp(tonumber(value) ?? 0, 0, 10);
				} else if (propertyName === 'CircleSize') {
					chart.metadata.totalLanes = math.round(tonumber(value) ?? 5);
				}
			} else if (currentSection === 'TimingPoints') {
				const [
					millisecond,
					beatLength,
					meter,
					sampleSet,
					sampleIndex,
					volume,
					uninherited,
					effects,
				] = line.split(',').map(mapNumbers);
				
				if (uninherited === 1) {
					chart.timings.push({
						millisecond: millisecond,
						type: 0,
						bpm: 60_000 / beatLength,
						volume: volume
					});
				} else {
					chart.timings.push({
						millisecond: millisecond,
						type: 0,
						scrollSpeed: -100 / beatLength,
						volume: volume
					});
				}
			} else if (currentSection === 'HitObjects') {
				const [
					noteX,
					noteY,
					noteMillisecond,
					noteType,
					noteHitSound,
					noteEndMillisecond,
				] = line.gsub(':', ',')[0].split(',').map(mapNumbers);
				
				const lane = math.clamp(math.floor(noteX * chart.metadata.totalLanes / 512), 0, chart.metadata.totalLanes - 1);
				
				if ((noteType & Constants.OsuFile.NoteType.HoldNote) !== 0) {
					chart.notes.push({
						millisecond: noteMillisecond,
						type: 1,
						lane: lane,
						holdLength: noteEndMillisecond - noteMillisecond,
					});
				} else if ((noteType & Constants.OsuFile.NoteType.NormalNote) !== 0) {
					chart.notes.push({
						millisecond: noteMillisecond,
						type: 0,
						lane: lane
					});
				}
			} else if (currentSection === 'General') {
				if (propertyName === 'AudioFilename') chart.metadata.audioName = StringUtils.trim(value);
			}
		}
	}
	
	if (log) {
		const maxLength = 199_000;
		
		let encodedData = HttpService.JSONEncode(chart);
		let i = 0;
		
		while (encodedData.size() > 0) {
			let chunk = string.sub(encodedData, 1, maxLength);
			
			const value = new Instance('StringValue');
			value.Value = chunk;
			value.Name = `Chunk${i}`;
			value.Parent = Workspace;
			
			encodedData = string.sub(encodedData, maxLength + 1);
			
			i++;
		}
	}
	
	return chart;
}