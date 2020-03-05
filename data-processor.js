class DataProcessor {
    static DEFAULT_ORIGIN = 'Helsinki';

    capitalData = [];

    nameToInfoMappings = {}

    constructor(capitalData, styling) {
        this.capitalData = capitalData || [];
        console.log(this.capitalData)
        this.styling = styling;
        this.buildMapFromCapitalNameToInfo();
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


        return {
            type: 'FeatureCollection',
            features
        }
    }

    buildMapFromCapitalNameToInfo() {
        const index = {};
        for (const capital of this.capitalData) {
            index[capital.CapitalName] = capital;
        }
        this.nameToInfoMappings = index;
        console.log(index)
    }

    computeStraightLineRoutes(origin) {
        const originInfo = this.nameToInfoMappings[origin]
        console.log('info', originInfo, origin)
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

            var lineDistance = turf.lineDistance(route, 'kilometers');
            var steps = 1000;
            const arc = []

            // Draw an arc between the `origin` & `destination` of the two points
            for (var i = 0; i <= lineDistance; i += lineDistance / steps) {
                var segment = turf.along(route, i, 'kilometers');
                arc.push(segment.geometry.coordinates);
            }
            route.properties = { ...route.properties, distance: lineDistance, ...this.styling.getLineProperties(lineDistance) }

            route.geometry.coordinates = arc
        })
    }

    getArcLinesFromOrigin(origin) {
        const routes = this.computeStraightLineRoutes(origin);
        console.log('routes', routes)
        this.addDistancesAndConvertStraightLineToArc(routes);
        return routes;
    }
}