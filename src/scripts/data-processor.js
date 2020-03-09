import * as turf from "@turf/turf";
import { GreatCircle } from "arc";
import $ from "jquery";

import { NUMBER_OF_POINTS_ALONG_THE_LINE, DEFAULT_ORIGIN } from './constants.js';

export class DataProcessor {

    _capitalData = [];

    _nameToInfoMappings = {};

    _capitalMarkers = {};

    _selectedCapital = DEFAULT_ORIGIN;

    _url = "/hahah";

    constructor(_url, styling) {
        this._url = _url;
        this.styling = styling;
    }

    get selectedCapital() {
        return this._selectedCapital;
    }

    setSelectedCapital(newOriginCapital) {
        if (this._selectedCapital === newOriginCapital) {
            return false;
        }

        this._selectedCapital = newOriginCapital;
        return true;
    }

    get arcLinesFromSelectedCapital() {
        const routes = this._computeStraightLineRoutes(this._selectedCapital);
        this._addDistancesAndConvertStraightLineToArc(routes);
        return routes;
    }

    get capitalMarkers() {
        return this._capitalMarkers;
    }

    get selectedCapitalCoordinates() {
        if (!this._nameToInfoMappings || !this._nameToInfoMappings[this._selectedCapital]) {
            console.warn(`Origin capital not found!!!`);
            return [];
        }

        const { CapitalLongitude: longitude, CapitalLatitude: latitude } = this._nameToInfoMappings[this._selectedCapital];

        return [longitude, latitude];
    }

    load = _ => new Promise((resolve, reject) => {
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
                console.log(err)
                reject(`Capital data at "${this._url}" is not available`);
            }
        });
    });


    _computeCapitalPoints = _ => {

        const features = this._capitalData.map((
            { CapitalName: name,
                CapitalLongitude: longitude,
                CapitalLatitude: latitude,
                CountryName }) => {
            return {
                type: 'Feature',
                properties: {
                    Name: name,
                    Description: `Capital of ${CountryName}`
                },
                geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                }
            };
        });

        this._capitalMarkers = {
            type: 'FeatureCollection',
            features
        };
    }

    _buildMapFromCapitalNameToInfo = _ => {
        const index = {};
        for (const capital of this._capitalData) {
            index[capital.CapitalName] = capital;
        }
        this._nameToInfoMappings = index;
    }

    _computeStraightLineRoutes = selectedCapital => {
        const originInfo = this._nameToInfoMappings[selectedCapital];
        if (!originInfo) {
            return {
                'type': 'FeatureCollection',
                'features': []
            };
        }

        return {
            'type': 'FeatureCollection',
            'features': this._capitalData
                .filter(({ CapitalName }) => CapitalName !== selectedCapital)
                .map(({ CapitalName: name, CapitalLongitude: longitude, CapitalLatitude: latitude }, index) => {
                    return {
                        'type': 'Feature',
                        'id': index,
                        'properties': {
                            otherDestination: name
                        },
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': [
                                [Number(originInfo.CapitalLongitude), Number(originInfo.CapitalLatitude)],
                                [Number(longitude), Number(latitude)]
                            ]
                        }
                    };
                })
        };
    }

    _addDistancesAndConvertStraightLineToArc = routes => {
        routes.features.forEach(route => {
            /**
             * Arc.js is used here to compute points along the arc as the method to draw arc at https://docs.mapbox.com/mapbox-gl-js/example/animate-point-along-route/
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