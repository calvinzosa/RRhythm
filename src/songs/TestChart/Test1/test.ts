import * as Types from 'shared/Types';
import * as OsuBeatmapConverter from 'shared/OsuBeatmapConverter';

export default {
    metadata: {
        title: 'Test Song',
        audioName: '<None>',
        setName: 'TestChart',
        description: 'Testing #1',
        difficulty: '--',
        source: '--',
        artist: '--',
        mappers: [],
        searchTags: [],
        totalLanes: 4,
    },
    difficulty: {
        damageRate: 3,
        maxHealth: 10,
        overallDifficulty: 4
    },
    timings: [
        { type: 0, millisecond: 0, bpm: 120 }
    ],
    events: [],
    notes: [
        { type: 0, millisecond: 500, lane: 0 },
        { type: 0, millisecond: 1000, lane: 1 },
        { type: 0, millisecond: 1500, lane: 2 },
        { type: 0, millisecond: 2000, lane: 3 },
        { type: 1, millisecond: 2000, lane: 0, holdLength: 1000 },
    ]
} as Types.Chart;