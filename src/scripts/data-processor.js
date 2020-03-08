import * as turf from "@turf/turf";
import { GreatCircle } from "arc";
import $ from "jquery";

export class DataProcessor {
    static DEFAULT_ORIGIN = 'Helsinki';

    capitalData = [];

    nameToInfoMappings = {};

    capitalPoints = {};

    originCapital = DataProcessor.DEFAULT_ORIGIN;

    url = "/";

    constructor(url, styling) {
        this.url = url;
        this.styling = styling;
    }

    load() {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: this.url,
                dataType: 'json',
                success: (data) => {
                    this.capitalData = data;
                    this.computeCapitalPoints();
                    this.buildMapFromCapitalNameToInfo();

                    resolve();
                },
                error: () => {
                    reject(`Capital data at "${this.url}" is not available`);
                }
            });
        });
    }

    computeCapitalPoints() {

        const features = this.capitalData.map((
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

        this.capitalPoints = {
            type: 'FeatureCollection',
            features
        };
    }

    getCapitalPoints() {
        return this.capitalPoints;
    }

    buildMapFromCapitalNameToInfo() {
        const index = {};
        for (const capital of this.capitalData) {
            index[capital.CapitalName] = capital;
        }
        this.nameToInfoMappings = index;
    }

    getOriginCoordinates() {
        if (!this.nameToInfoMappings || !this.nameToInfoMappings[this.originCapital]) {
            console.warn(`Origin capital not found!!!`);
            return [];
        }

        const { CapitalLongitude: longitude, CapitalLatitude: latitude } = this.nameToInfoMappings[this.originCapital];

        return [longitude, latitude];
    }

    computeStraightLineRoutes(origin) {
        const originInfo = this.nameToInfoMappings[origin];
        if (!originInfo) {
            return {
                'type': 'FeatureCollection',
                'features': []
            };
        }

        return {
            'type': 'FeatureCollection',
            'features': this.capitalData
                .filter(({ CapitalName }) => CapitalName !== origin)
                .map(({ CapitalName: name, CapitalLongitude: longitude, CapitalLatitude: latitude }, index) => {
                    return {
                        'type': 'Feature',
                        'id': index,
                        'properties': {
                            origin: name
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

    addDistancesAndConvertStraightLineToArc(routes) {
        routes.features.forEach(route => {
            /**
             * Arc.js is used here to compute points along the arc as the method to draw arc at https://docs.mapbox.com/mapbox-gl-js/example/animate-point-along-route/
             * is broken for some long distances route. For example, if origin = [-171.933333, -13.95] and destination = [71.416667, 51.166666666666664], the line rendered has a weird shape. For example, https://jsfiddle.net/e1h62qga/
             */
            const [[srcLong, srcLat], [dstLong, dstLat]] = route.geometry.coordinates;
            const src = { x: srcLong, y: srcLat };
            const dest = { x: dstLong, y: dstLat };
            const generator = new GreatCircle(src, dest);


            const NUMBER_OF_POINTS_ALONG_THE_LINE = 500;
            const line = generator.Arc(NUMBER_OF_POINTS_ALONG_THE_LINE);
            const lineDistance = turf.length(route, { units: 'kilometers' });


            route.properties = { ...route.properties, distance: lineDistance, ...this.styling.getLineProperties(lineDistance) };

            route.geometry = line.json().geometry;

        });
    }

    getOriginCapital() {
        return this.originCapital;
    }

    setOriginCapital(newOriginCapital) {
        if (this.originCapital === newOriginCapital) {
            return false;
        }

        this.originCapital = newOriginCapital;
        return true;
    }

    getArcLinesFromOrigin() {
        const routes = this.computeStraightLineRoutes(this.originCapital);
        this.addDistancesAndConvertStraightLineToArc(routes);
        return routes;
    }
}