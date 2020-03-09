import * as turf from "@turf/turf";
import { GreatCircle } from "arc";
import $ from "jquery";

import { NUMBER_OF_POINTS_ALONG_THE_LINE, DEFAULT_ORIGIN } from './constants.js';
import { Stylings } from "./stylings.js";
import { notify } from "./utils.js";

/**
 * Class to fetch capital data, compute data for markers, arcs
 */
export class DataProcessor {

    /**
     * Raw capital data fetched from back-end
     * @type {Array}
     * @private
     */
    _capitalData = [];

    /**
     * Mapping from {capital_name => capital infomation} to do lookup in O(1)
     * @type {Object}
     * @private
     */
    _capitalNameToInfoMappings = {};

    /**
     * Data to render markers for all capitals
     * @type {GEOJSON.FeatureCollection<Point>}
     * @private
     */
    _capitalMarkers = {};

    /**
     * Currently selected capital name
     * @type {string}
     * @private
     */
    _selectedCapital = DEFAULT_ORIGIN;

    /**
     * Path to fetch data from back-end
     * @type {string}
     * @private
     */
    _url = "/";

    /**
     * @param {string} _url url path to fetch data
     * @param {Stylings} styling Styling object to handle theme changes
     */
    constructor(_url, styling) {
        this._url = _url;
        this.styling = styling;
    }

    /**
     * Get name of the selected Capital
     * @return {string} name of the selected capital
     * @public
     */
    get selectedCapital() {
        return this._selectedCapital;
    }

    /**
     * Set name of the selected capital
     * @param {string} newOriginCapital name of the newly selected capital
     * @returns {boolean} whether the newly selected capital is different from the old one. This is used to avoid recomputation
     * @public
     */
    setSelectedCapital(newOriginCapital) {
        if (this._selectedCapital === newOriginCapital) {
            return false;
        }

        this._selectedCapital = newOriginCapital;
        return true;
    }

    /**
     * Get all arc lines data that starts from the selected capital
     * @returns {GeoJSON.FeatureCollection<LineString>} arcs line data
     * @public
     */
    get arcLinesFromSelectedCapital() {
        const routes = this._computeStraightLineRoutes(this._selectedCapital);
        this._addDistancesAndConvertStraightLineToArc(routes);
        return routes;
    }

    /**
     * Get data to render capital markers
     * @returns {GEOJSON.FeatureCollection<Point>} capital markers
     * @public
     */
    get capitalMarkers() {
        return this._capitalMarkers;
    }

    /**
     * Get coordinates of the selected capital
     * @returns {Array[Number, Number]} [longitude, latitude] of capital
     * @public
     */
    get selectedCapitalCoordinates() {
        if (!this._capitalNameToInfoMappings || !this._capitalNameToInfoMappings[this._selectedCapital]) {
            notify(`Origin capital not found!!!`);
            return [];
        }

        const { CapitalLongitude: longitude, CapitalLatitude: latitude } = this._capitalNameToInfoMappings[this._selectedCapital];

        return [Number(longitude), Number(latitude)];
    }

    /**
     * Fetch data from backend
     * @returns {Promise<any>}
     * @public
     */
    load = () => new Promise((resolve, reject) => {
        $.ajax({
            type: 'GET',
            url: this._url,
            dataType: 'json',
            success: (data) => {
                this._capitalData = data;
                this._computeCapitalPoints();
                this._buildMapFromCapitalNameToInfo();
                resolve();
            },
            error: (err) => {
                console.error(err)
                reject(`Capital data at "${this._url}" is not available`);
            }
        });
    });

    /**
     * Compute capitals Feature<Point> from raw capital data
     * @returns {void}
     * @private
     */
    _computeCapitalPoints = () => {

        const features = this._capitalData.map(capitalInfo => {
            const {
                CapitalName: name,
                CapitalLongitude: longitude,
                CapitalLatitude: latitude,
                CountryName } = capitalInfo
            return {
                type: 'Feature',
                properties: {
                    Name: name,
                    Description: `Capital of ${CountryName}`
                },
                geometry: {
                    type: 'Point',
                    coordinates: [Number(longitude), Number(latitude)]
                }
            };
        });

        this._capitalMarkers = {
            type: 'FeatureCollection',
            features
        };
    }

    /**
     * Build the mapping capital name -> capital data
     * @returns {void}
     * @private
     */
    _buildMapFromCapitalNameToInfo = () => {
        const index = {};
        for (const capital of this._capitalData) {
            index[capital.CapitalName] = capital;
        }
        this._capitalNameToInfoMappings = index;
    }

    /**
     * Compute straight lines between selected capital to other capitals
     * @param {string} selectedCapital name of the selected capital
     * @return {GEOJSON.FeatureCollection<LineString>} features collections of line strings
     * @private
     */
    _computeStraightLineRoutes = selectedCapital => {
        const originInfo = this._capitalNameToInfoMappings[selectedCapital];
        if (!originInfo) {
            return {
                'type': 'FeatureCollection',
                'features': []
            };
        }

        const features = this._capitalData
            .filter(({ CapitalName }) => CapitalName !== selectedCapital)
            .map(({ CapitalName: destination, CapitalLongitude: longitude, CapitalLatitude: latitude }, index) => {
                return {
                    'type': 'Feature',
                    'id': index,
                    'properties': {
                        origin: selectedCapital,
                        destination
                    },
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            [Number(originInfo.CapitalLongitude), Number(originInfo.CapitalLatitude)],
                            [Number(longitude), Number(latitude)]
                        ]
                    }
                };
            });

        return {
            type: 'FeatureCollection',
            features
        };
    }

    /**
     * Calculate distance and add to the properties of each existing line
     * Add style to line based on the distance of each line
     * @param {GEOJSON.FeatureCollection<LineString>} routes straigh lines data from src to dest
     * @return {void}
     * @private
     */
    _addDistancesAndConvertStraightLineToArc = routes => {
        routes.features.forEach(route => {
            /**
             * Arc.js is used here to compute points along the arc since the method to draw arc at https://docs.mapbox.com/mapbox-gl-js/example/animate-point-along-route/
             * is broken for some long distances route. For example, if origin = [-171.933333, -13.95] and destination = [71.416667, 51.166666666666664], the line rendered has a weird shape. For example, https://jsfiddle.net/e1h62qga/
             */
            const [[srcLong, srcLat], [dstLong, dstLat]] = route.geometry.coordinates;
            const src = { x: srcLong, y: srcLat };
            const dest = { x: dstLong, y: dstLat };
            const generator = new GreatCircle(src, dest);

            const line = generator.Arc(NUMBER_OF_POINTS_ALONG_THE_LINE);
            const lineDistance = turf.length(route, { units: 'kilometers' });


            route.properties = { ...route.properties, distance: lineDistance, ...this.styling.getLineProperties(lineDistance) };

            route.geometry = line.json().geometry;

        });
    }
}