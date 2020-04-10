import { Stylings } from '../stylings.js';
import { DataProcessor } from '../data-processor.js';
import { NUMBER_OF_POINTS_ALONG_THE_LINE } from '../constants.js';

let mockAjax;

jest.mock('../utils.js');
jest.mock('jquery', () => {
    const ajaxMock = jest.fn();
    mockAjax = ajaxMock;
    return {
        ajax: ajaxMock
    };
});

const rawCapitalData = [
    {
        "CountryName": "Jersey",
        "CapitalName": "Saint Helier",
        "CapitalLatitude": "49.18333333333333",
        "CapitalLongitude": "-2.100000",
        "CountryCode": "JE",
        "ContinentName": "Europe"
    },
    {
        "CountryName": "Jordan",
        "CapitalName": "Amman",
        "CapitalLatitude": "31.95",
        "CapitalLongitude": "35.933333",
        "CountryCode": "JO",
        "ContinentName": "Asia"
    }
];

describe('Map wrapper test', () => {
    let styling, dataProcessor;

    beforeEach(() => {
        styling = new Stylings();
        styling.theme = "username/test_theme";
        dataProcessor = new DataProcessor('/test', styling);
    });

    test('test set selected capital', () => {
        expect(dataProcessor.selectedCapital).toBe("Riyadh");
        expect(dataProcessor.setSelectedCapital("Riyadh")).toBeFalsy();

        expect(dataProcessor.setSelectedCapital("Berlin")).toBeTruthy();
        expect(dataProcessor.selectedCapital).toBe("Berlin");
    });

    test('test get arc lines from selected capital', () => {
        const mockComputeStraightRoutes = jest.fn();
        const routes = {
            type: 'FeatureCollection',
            features: [{
                'type': 'Feature',
                'id': 0,
                'properties': {
                    origin: "Riyadh",
                    destination: "Berlin"
                },
                'geometry': {
                    'type': 'LineString',
                    'coordinates': [
                        [1, 2],
                        [3, 4]
                    ]
                }
            }]
        };
        mockComputeStraightRoutes.mockReturnValue(routes);
        dataProcessor._computeStraightLineRoutes = mockComputeStraightRoutes;

        dataProcessor._addDistancesAndConvertStraightLineToArc = jest.fn();

        const result = dataProcessor.arcLinesFromSelectedCapital;

        expect(mockComputeStraightRoutes).toHaveBeenCalledWith("Riyadh");
        expect(dataProcessor._addDistancesAndConvertStraightLineToArc).toHaveBeenCalled();

        expect(result).toEqual(routes);
    });

    test('load data from server', () => {

        dataProcessor._computeCapitalPoints = jest.fn();
        dataProcessor._buildMapFromCapitalNameToInfo = jest.fn();

        dataProcessor.load().then(() => {
            expect(dataProcessor._capitalData).toEqual(rawCapitalData);
            expect(dataProcessor._computeCapitalPoints).toHaveBeenCalled();
            expect(dataProcessor._buildMapFromCapitalNameToInfo).toHaveBeenCalled();
        });

        expect(mockAjax).toHaveBeenCalled();
        const param = mockAjax.mock.calls[0][0];
        expect(param.url).toEqual('/test');
        expect(param.type).toEqual('GET');
        expect(param.dataType).toEqual('json');

        param.success(rawCapitalData);
    });

    test('test compute capital Points, build mappings and get selected capital coordinates', () => {
        dataProcessor._capitalData = rawCapitalData;

        const expectedCapitalPoints = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        capitalName: "Saint Helier",
                        capitalDescription: "Capital of Jersey"
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [-2.100000, 49.18333333333333]
                    }
                },
                {
                    type: 'Feature',
                    properties: {
                        capitalName: "Amman",
                        capitalDescription: "Capital of Jordan"
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [35.933333, 31.95]
                    }
                }
            ]
        };

        expect(dataProcessor.setSelectedCapital("Amman")).toBeTruthy();
        dataProcessor._computeCapitalPoints();
        expect(dataProcessor.capitalMarkers).toEqual(expectedCapitalPoints);

        dataProcessor._buildMapFromCapitalNameToInfo();

        expect(dataProcessor._capitalNameToInfoMappings).toEqual({
            "Saint Helier": dataProcessor._capitalData[0],
            "Amman": dataProcessor._capitalData[1]
        });

        expect(dataProcessor.selectedCapitalCoordinates).toEqual([35.933333, 31.95]);
    });


    test('test compute straight line routes', () => {
        dataProcessor._capitalData = rawCapitalData;
        dataProcessor._buildMapFromCapitalNameToInfo();
        const result = dataProcessor._computeStraightLineRoutes("Amman");
        const expectedResult = {
            type: 'FeatureCollection',
            features:
                [{
                    type: 'Feature',
                    id: 0,

                    'properties': {
                        origin: "Amman",
                        destination: "Saint Helier"
                    },
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            [35.933333, 31.95],
                            [-2.100000, 49.18333333333333]
                        ]
                    }
                }]
        };
        expect(result).toEqual(expectedResult);
    });

    test('test add distance and convert straight line to arc', () => {
        const coordinates = [
            [35.933333, 31.95],
            [-2.100000, 49.18333333333333]
        ];
        const routes = {
            type: 'FeatureCollection',
            features:
                [{
                    type: 'Feature',
                    id: 0,

                    'properties': {
                        origin: "Amman",
                        destination: "Saint Helier"
                    },
                    'geometry': {
                        'type': 'LineString',
                        coordinates
                    }
                }]
        };

        dataProcessor._addDistancesAndConvertStraightLineToArc(routes);

        expect(routes.features[0].geometry.coordinates.length).toBe(NUMBER_OF_POINTS_ALONG_THE_LINE);

        expect(routes.features[0].properties.distance).toBe(3685.0455506874023);
    });
});