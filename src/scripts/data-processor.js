import * as turf from "@turf/turf";
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

                    resolve()
                },
                error: () => {
                    reject(`Capital data at "${this.url}" is not available`)
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
            }
        })

        this.capitalPoints = {
            type: 'FeatureCollection',
            features
        }
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

    computeStraightLineRoutes(origin) {
        const originInfo = this.nameToInfoMappings[origin]
        if (!originInfo) {
            return {
                'type': 'FeatureCollection',
                'features': []
            }
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
        }
    }

    addDistancesAndConvertStraightLineToArc(routes) {
        routes.features.forEach(route => {

            var lineDistance = turf.length(route, { units: 'kilometers' });
            var steps = 1000;
            const arc = [];

            // Draw an arc between the `origin` & `destination` of the two points
            for (var i = 0; i <= lineDistance; i += lineDistance / steps) {
                var segment = turf.along(route, i, { units: 'kilometers' });
                arc.push(segment.geometry.coordinates);
            }
            route.properties = { ...route.properties, distance: lineDistance, ...this.styling.getLineStyles(lineDistance) }

            route.geometry.coordinates = arc
        })
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