import { Stylings } from '../stylings.js';
import { DataProcessor } from '../data-processor.js';
import { MapWrapper } from '../map-wrapper.js';
import { DEFAULT_ZOOM_LEVEL, PREFIX_STYLE_URL } from '../constants.js';

global.alert = jest.fn();

let mockMapConstructor, mockPopupConstructor;


jest.mock('mapbox-gl/dist/mapbox-gl.js', () => {
    const mapConstructor = jest.fn();
    const popupConstructor = jest.fn();

    mockMapConstructor = mapConstructor;
    mockPopupConstructor = popupConstructor;

    mapConstructor.mockReturnValue({})
    return {
        Map: mapConstructor,
        Popup: mockPopupConstructor
    }
});

jest.mock('../data-processor.js');
jest.mock('../utils.js');

const mockLoadDataAndRender = jest.fn();
MapWrapper.prototype.loadDataAndRender = mockLoadDataAndRender;

describe('Map wrapper test', () => {
    let styling, dataProcessor, mapWrapper;

    beforeEach(() => {
        styling = new Stylings();
        styling.theme = "username/test_theme";
        dataProcessor = new DataProcessor('test', styling);
        mapWrapper = new MapWrapper(styling, dataProcessor);
    });

    test('Map and popup is initialized', () => {
        expect(mapWrapper.styling).toBe(styling);
        expect(mapWrapper.dataProcessor).toBe(dataProcessor);
        expect(mockMapConstructor).toHaveBeenCalled();
        expect(mockPopupConstructor).toHaveBeenCalled();


        const { container, zoom, style } = mockMapConstructor.mock.calls[0][0];
        expect(container).toBe("map");
        expect(zoom).toBe(DEFAULT_ZOOM_LEVEL);
        expect(style).toBe(`${PREFIX_STYLE_URL}username/test_theme`);

        expect(mockLoadDataAndRender).toHaveBeenCalled();
    });

    test('Wait for map to load', () => {
        expect(mapWrapper._isLoaded).toBeFalsy();

        mapWrapper._map.once = (keyword, callBack) => {
            expect(keyword).toBe("load");
            callBack();
        }

        mapWrapper.onLoad()
            .then(result => expect(result).toBeTruthy());

        expect(mapWrapper._isLoaded).toBeTruthy();

        mapWrapper._map.once = jest.fn();
        mapWrapper.onLoad().then();
        expect(mapWrapper._map.once).not.toHaveBeenCalled();
    });

    test('test swallow null map', () => {
        const mockFn = jest.fn();
        mapWrapper._map = null;

        const composedFunc = mapWrapper._swallowNullMap(mockFn);
        composedFunc("arg1", "arg2", "arg3");
        expect(mockFn).not.toHaveBeenCalled();

        mapWrapper._map = {};
        composedFunc("arg1", "arg2", "arg3");
        expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", "arg3");
    });

    test('test swallow null popup', () => {
        const mockFn = jest.fn();
        mapWrapper._popup = null;
        const composedFunc = mapWrapper._swallowNullPopup(mockFn);
        composedFunc("arg1", "arg2", "arg3");
        expect(mockFn).not.toHaveBeenCalled();

        mapWrapper._popup = {};
        composedFunc("arg1", "arg2", "arg3");
        expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", "arg3");
    });

    test('test swallow null map and popup', () => {
        const mockFn = jest.fn();
        mapWrapper._popup = null;
        const composedFunc = mapWrapper._swallowNullMapAndPopup(mockFn);
        composedFunc("arg1", "arg2", "arg3");
        expect(mockFn).not.toHaveBeenCalled();

        mapWrapper._popup = {};
        composedFunc("arg1", "arg2", "arg3");
        expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", "arg3");

        expect(mockFn.mock.calls.length).toBe(1);
        mapWrapper._map = null;
        composedFunc("arg1", "arg2", "arg3");
        expect(mockFn.mock.calls.length).toBe(1);

        mapWrapper._map = {};
        composedFunc("arg1", "arg2", "arg3");
        expect(mockFn.mock.calls.length).toBe(2);
    });

    test('changeTheme', () => {
        const mockGetSource = jest.fn();
        mockGetSource.mockReturnValue({
            _data: {
                features: [
                    {
                        properties: { distance: 500 },
                    },
                    {
                        properties: { distance: 7000 },
                    },
                    {
                        properties: { distance: 15000 },
                    },
                    {
                        properties: { distance: 4000 },
                    }
                ]
            }
        });
        mapWrapper._map.getSource = mockGetSource;

        const mockSetStyle = jest.fn();
        mapWrapper._map.setStyle = mockSetStyle;

        mapWrapper._map.once = (name, callBack) => {
            expect(name).toBe('styledata');
            callBack();
        };

        mapWrapper._addSourceAndLayers = jest.fn();
        mapWrapper.highLightLines = jest.fn();

        const themeName = "dark-v10";
        mapWrapper.changeTheme(themeName);

        expect(mockSetStyle).toHaveBeenCalled();
        const [url, option] = mockSetStyle.mock.calls[0];
        expect(url).toBe(`${PREFIX_STYLE_URL}${themeName}`);
        expect(option).toEqual({ diff: false });

        expect(mapWrapper._addSourceAndLayers).toHaveBeenCalled();

        const { features } = mapWrapper._addSourceAndLayers.mock.calls[0][0];

        expect(features[0].properties.category).toBe(Stylings.DISTANCE_CATEROGY_NAMES.SHORT);
        expect(features[0].properties.lineWidth).toBeTruthy();

        expect(features[1].properties.category).toBe(Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM);
        expect(features[1].properties.lineWidth).toBeTruthy();

        expect(features[2].properties.category).toBe(Stylings.DISTANCE_CATEROGY_NAMES.LONG);
        expect(features[2].properties.lineWidth).toBeTruthy();

        expect(features[3].properties.category).toBe(Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM);
        expect(features[3].properties.lineWidth).toBeTruthy();
    });

    test("test highLightLines", () => {
        const mockSetPaint = jest.fn();
        mapWrapper._map.setPaintProperty = mockSetPaint;
        mapWrapper.highLightLines();

        expect(mockSetPaint).toHaveBeenCalled();
        expect(mockSetPaint.mock.calls[0]).toEqual(Stylings.DEFAULT_LINES_OPACITY_STYLE);

        styling.highLightedCategory = Stylings.DISTANCE_CATEROGY_NAMES.SHORT;
        mapWrapper.highLightLines();
        expect(mockSetPaint.mock.calls.length).toBe(2);
        expect(mockSetPaint.mock.calls[1]).toEqual(Stylings.getLineOpacityWithHighLightedCategory(Stylings.DISTANCE_CATEROGY_NAMES.SHORT));
    });

    test("test initialRender", () => {
        mapWrapper._initFlightMap = jest.fn();
        mapWrapper._displayCapitalInfoPopup = jest.fn();
        mapWrapper._displayAllFlightsFromChosenCapital = jest.fn();

        const mockOnCall = jest.fn();
        mapWrapper._map.on = mockOnCall;

        mapWrapper._getRouteHoverHandler = jest.fn();
        const highLightOneSpecificRoute = jest.fn();
        const unHighLightOneSpecificRoute = jest.fn();
        mapWrapper._getRouteHoverHandler.mockReturnValue({
            highLightOneSpecificRoute, unHighLightOneSpecificRoute
        });

        mapWrapper._initialRender();
        expect(mapWrapper._initFlightMap).toHaveBeenCalled();
        expect(mockOnCall.mock.calls.length >= 5).toBeTruthy();
    });

    test("test initFlightMap", () => {
        mapWrapper._moveCenterTo = jest.fn();
        dataProcessor.selectedCapitalCoordinates = [1, 0];
        dataProcessor.arcLinesFromSelectedCapital = {
            'type': 'FeatureCollection',
            'features': []
        };
        mapWrapper._addSourceAndLayers = jest.fn();

        mapWrapper._initFlightMap();

        expect(mapWrapper._moveCenterTo).toHaveBeenCalled();
        expect(mapWrapper._moveCenterTo.mock.calls[0][0]).toEqual([1, 0]);
        expect(mapWrapper._addSourceAndLayers).toHaveBeenCalled();
        expect(mapWrapper._addSourceAndLayers.mock.calls[0][0]).toEqual({
            'type': 'FeatureCollection',
            'features': []
        });
    });

    test("test addSourceAndLayer", () => {
        const mockAddLayer = jest.fn();
        const mockAddSource = jest.fn();
        mapWrapper._map.addLayer = mockAddLayer;
        mapWrapper._map.addSource = mockAddSource;

        mapWrapper._addSourceAndLayers({
            'type': 'FeatureCollection',
            'features': []
        });

        expect(mockAddLayer).toHaveBeenCalled();
        const addLayerCalls = mockAddLayer.mock.calls;
        expect(addLayerCalls.length >= 2).toBeTruthy();
        expect(addLayerCalls[0][0].id).toEqual("capitals");
        expect(addLayerCalls[0][0].type).toEqual("symbol");

        expect(addLayerCalls[1][0].id).toEqual("route");
        expect(addLayerCalls[1][0].type).toEqual("line");
        expect(addLayerCalls[1][0].source).toEqual("route");

        const addSourceCalls = mockAddSource.mock.calls;
        expect(mockAddSource).toHaveBeenCalled();
        expect(addSourceCalls[0][0]).toEqual("route");
        expect(addSourceCalls[0][1].type).toEqual("geojson");
        expect(addSourceCalls[0][1].data).toEqual({
            'type': 'FeatureCollection',
            'features': []
        });
    });

});