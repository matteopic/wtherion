import { expect, test, vi } from "vitest";
import { processProject } from "../../src/export/processProject";
import { defaultLineSettings } from "../../src/objectSettings/model/LineSettings";
import { PointSettings, defaultPointSettings } from "../../src/objectSettings/model/PointSettings";
import { defaultScrapSettings } from "../../src/objectSettings/model/ScrapSettings";
import { defaultAreaSettings } from "../../src/objectSettings/model/AreaSettings";
import { Segment } from "@daem-on/graphite/models";

const randomId = Math.random().toString(36).substring(7);
vi.stubGlobal("crypto", {
	randomUUID: () => randomId
});

function createStationSettings(): PointSettings {
	const pointSettings = defaultPointSettings();
	pointSettings.type = "station";
	pointSettings.name = "0";
	return pointSettings;
}

test("export scrap with 1 station", () => {
	const scrapSettings = defaultScrapSettings();

	const result = processProject([
		["dictionary", []],
		[
			["Layer", {
				children: [
					["SymbolItem", {
						matrix: [1, 0, 0, 1, 10, -20],
						data: { therionData: createStationSettings() },
						symbol: [""],
					}]
				],
				data: { therionData: scrapSettings },
				name: "scrap1"
			}]
		]
	]);

	expect(result).toEqual([
		"encoding utf-8",
		"scrap scrap1 ",
		"	point 10 20 station -name 0",
		"endscrap"
	]);
});

test("export with all scrap settings", () => {
	const scrapSettings = defaultScrapSettings();
	scrapSettings.scale = "0 0 39.3701 0 0 0 1 0 m";
	scrapSettings.projection = "elevation 100";
	scrapSettings.author = `2021.08.01 "Author Name"`;
	scrapSettings.copyright = `2021.08.01 "Author Name"`;
	scrapSettings.stationNames = "prefix1 suffix1";
	scrapSettings.map.set("walls", "on");

	const result = processProject([
		["dictionary", []],
		[
			["Layer", {
				children: [
					["SymbolItem", {
						matrix: [1, 0, 0, 1, 10, -20],
						data: { therionData: createStationSettings() },
						symbol: [""],
					}]
				],
				data: { therionData: scrapSettings },
				name: "scrap1"
			}]
		]
	]);

	expect(result).toEqual([
		"encoding utf-8",
		`scrap scrap1 -scale [0 0 39.3701 0 0 0 1 0 m] -projection [elevation 100] -author 2021.08.01 "Author Name" -copyright 2021.08.01 "Author Name" -station-names prefix1 suffix1 -walls on`,
		"	point 10 20 station -name 0",
		"endscrap"
	]);
});

const mockSegments: Segment[] = [
	[[-580, -92], [2, 5], [-2, -5]],
	[[-566, -125], [-14, 3], [14, -3]],
	[[-524, -126], [-4, -7], [4, 7]],
	[[-524, -90], [1, -4], [-1, 4]]
];

test("export closed line", () => {
	const lineSettings = defaultLineSettings();
	lineSettings.type = "wall";

	const result = processProject([
		["Layer", {
			children: [
				["Path", {
					segments: mockSegments,
					closed: true,
					data: { therionData: lineSettings }
				}]
			],
			name: "scrap1",
			data: { therionData: defaultScrapSettings() }
		}]
	]);

	expect(result).toEqual([
		"encoding utf-8",
		"scrap scrap1 ",
		"	line wall -close on",
		"		-525 86 -578 87 -580 92",
		"		-582 97 -580 122 -566 125",
		"		-552 128 -528 133 -524 126",
		"		-520 119 -523 94 -524 90",
		"		-525 86 -578 87 -580 92",
		"	endline",
		"endscrap"
	]);
});

test("export line with corners and curves", () => {
	const lineSettings = defaultLineSettings();
	lineSettings.type = "wall";

	const result = processProject([
		["Layer", {
			children: [
				["Path", {
					segments: [
						[-130.87, -18.95],
						[-43.84, -18.53],
						[[-24.76, -91.72], [-82.42, 0.21], [82.42, -0.21]],
						[-7.14, -18.74],
						[43.82, -17.48]
					],
					closed: false,
					data: { therionData: lineSettings }
				}]
			],
			name: "scrap1",
			data: { therionData: defaultScrapSettings() }
		}]
	]);

	expect(result).toEqual([
		"encoding utf-8",
		"scrap scrap1 ",
		"	line wall",
		"		-130.87 18.95",
		"		-43.84 18.53",
		"		-43.84 18.53 -107.18 91.51 -24.76 91.72",
		"		57.66 91.93 -7.14 18.74 -7.14 18.74",
		"		43.82 17.48",
		"	endline",
		"endscrap"
	]);
});

test("export invisible area", () => {
	const lineSettings = defaultLineSettings();
	lineSettings.type = "border";
	lineSettings.id = "border1";
	const areaSettings = defaultAreaSettings();
	areaSettings.type = "water";
	areaSettings.lineSettings = lineSettings;
	areaSettings.invisible = true;

	const result = processProject([
		["Layer", {
			children: [
				["Path", {
					segments: mockSegments,
					closed: true,
					data: { therionData: areaSettings }
				}]
			],
			name: "scrap1",
			data: { therionData: defaultScrapSettings() }
		}]
	]);

	expect(result).toEqual([
		"encoding utf-8",
		"scrap scrap1 ",
		"	line border -close on -id border1",
		"		-525 86 -578 87 -580 92",
		"		-582 97 -580 122 -566 125",
		"		-552 128 -528 133 -524 126",
		"		-520 119 -523 94 -524 90",
		"		-525 86 -578 87 -580 92",
		"	endline",
		"	area water -visibility off",
		"		border1",
		"	endarea",
		"endscrap"
	]);
});

test("export area with generated id", () => {
	const lineSettings = defaultLineSettings();
	lineSettings.type = "border";
	const areaSettings = defaultAreaSettings();
	areaSettings.type = "water";
	areaSettings.lineSettings = lineSettings;

	const result = processProject([
		["Layer", {
			children: [
				["Path", {
					segments: mockSegments,
					closed: true,
					data: { therionData: areaSettings }
				}]
			],
			name: "scrap1",
			data: { therionData: defaultScrapSettings() }
		}]
	]);

	expect(result).toEqual([
		"encoding utf-8",
		"scrap scrap1 ",
		`	line border -close on -id ${randomId}`,
		"		-525 86 -578 87 -580 92",
		"		-582 97 -580 122 -566 125",
		"		-552 128 -528 133 -524 126",
		"		-520 119 -523 94 -524 90",
		"		-525 86 -578 87 -580 92",
		"	endline",
		"	area water",
		`		${randomId}`,
		"	endarea",
		"endscrap"
	]);
});


test("export line with size", () => {
	const lineSettings = defaultLineSettings();
	lineSettings.type = "slope";
	lineSettings.size = 2;

	const result = processProject([
		["Layer", {
			children: [
				["Path", {
					segments: mockSegments,
					closed: true,
					data: { therionData: lineSettings }
				}]
			],
			name: "scrap1",
			data: { therionData: defaultScrapSettings() }
		}]
	]);

	expect(result).toEqual([
		"encoding utf-8",
		"scrap scrap1 ",
		"	line slope -close on",
		"		-525 86 -578 87 -580 92",
		"		-582 97 -580 122 -566 125",
		"		-552 128 -528 133 -524 126",
		"		-520 119 -523 94 -524 90",
		"		-525 86 -578 87 -580 92",
		"		size 2",
		"	endline",
		"endscrap"
	]);
});

test("export line with subtypes", () => {
	const lineSettings = defaultLineSettings();
	lineSettings.type = "slope";
	lineSettings.subtypes = { 0: "underlying", 2: "bedrock" };

	const result = processProject([
		["Layer", {
			children: [
				["Path", {
					segments: mockSegments,
					closed: true,
					data: { therionData: lineSettings }
				}]
			],
			name: "scrap1",
			data: { therionData: defaultScrapSettings() }
		}]
	]);

	expect(result).toEqual([
		"encoding utf-8",
		"scrap scrap1 ",
		"	line slope -close on",
		"		-525 86 -578 87 -580 92",
		"		subtype underlying",
		"		-582 97 -580 122 -566 125",
		"		-552 128 -528 133 -524 126",
		"		subtype bedrock",
		"		-520 119 -523 94 -524 90",
		"		-525 86 -578 87 -580 92",
		"	endline",
		"endscrap"
	]);
});

test("export line with segment settings", () => {
	const lineSettings = defaultLineSettings();
	lineSettings.type = "slope";
	lineSettings.segmentSettings = { 0: "smooth off", 2: "smooth on" };

	const result = processProject([
		["Layer", {
			children: [
				["Path", {
					segments: mockSegments,
					closed: true,
					data: { therionData: lineSettings }
				}]
			],
			name: "scrap1",
			data: { therionData: defaultScrapSettings() }
		}]
	]);

	expect(result).toEqual([
		"encoding utf-8",
		"scrap scrap1 ",
		"	line slope -close on",
		"		-525 86 -578 87 -580 92",
		"		smooth off",
		"		-582 97 -580 122 -566 125",
		"		-552 128 -528 133 -524 126",
		"		smooth on",
		"		-520 119 -523 94 -524 90",
		"		-525 86 -578 87 -580 92",
		"	endline",
		"endscrap"
	]);
});

test("export line with multiple segment settings", () => {
	const lineSettings = defaultLineSettings();
	lineSettings.type = "slope";
	lineSettings.segmentSettings = { 0: "setting1;setting2", 2: "setting3\nsetting4" };

	const result = processProject([
		["Layer", {
			children: [
				["Path", {
					segments: mockSegments,
					closed: true,
					data: { therionData: lineSettings }
				}]
			],
			name: "scrap1",
			data: { therionData: defaultScrapSettings() }
		}]
	]);

	expect(result).toEqual([
		"encoding utf-8",
		"scrap scrap1 ",
		"	line slope -close on",
		"		-525 86 -578 87 -580 92",
		"		setting1",
		"		setting2",
		"		-582 97 -580 122 -566 125",
		"		-552 128 -528 133 -524 126",
		"		setting3\nsetting4",
		"		-520 119 -523 94 -524 90",
		"		-525 86 -578 87 -580 92",
		"	endline",
		"endscrap"
	]);
});