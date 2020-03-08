import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';

import { Stylings } from './stylings.js';

export class MapWrapper {
    constructor(styling, dataProcessor) {
        this.styling = styling;
        this.dataProcessor = dataProcessor;

        mapboxgl.accessToken = 'pk.eyJ1IjoiYW5obmd1eWVuNjI4MSIsImEiOiJjazdpc3ZiOXkwajZkM2dwcnZiYmdycWpoIn0.miItHbnpDwLSnkbssDoQww';
        this.map = new mapboxgl.Map({
            container: 'map',
            style: `mapbox://styles/${styling.getTheme()}`,
            zoom: 2
        });


        this.dataProcessor.load()
            .then(() => this.render())
            .catch(err => alert(err));
    }

    changeTheme(theme) {
        const source = this.map.getSource('route');
        // automatic diff failed => force diff to false to rerender the entire map
        this.map.setStyle(`mapbox://styles/${theme}`, { diff: false });

        const done = new Promise((resolve) => {
            this.map.on('styledata', function () {
                resolve("done");
            });
        });


        done.then(() => {
            const data = source._data;
            data.features.forEach(feature => {
                const { distance } = feature.properties;
                feature.properties = { ...feature.properties, ...this.styling.getLineProperties(distance) };
            });
            this.addSourceAndLayers(source._data);
            this.highLightLines(this.styling.getHighLightedCategory());
        });
    }

    replaceOrigin(newOrigin) {
        const hasChange = this.dataProcessor.setOriginCapital(newOrigin);
        if (!hasChange) {
            return;
        }

        const source = this.map.getSource('route');
        if (source) {
            const arcs = this.dataProcessor.getArcLinesFromOrigin();
            source.setData(arcs);
        }
    }

    addSourceAndLayers(routes) {
        this.map.addLayer({
            id: 'capitals',
            type: 'symbol',
            source: {
                type: 'geojson',
                data: this.dataProcessor.getCapitalPoints()
            },
            ...Stylings.CAPITAL_ICON_STYLES
        });

        this.map.addSource('route', {
            'type': 'geojson',
            'data': routes
        });

        this.map.addLayer({
            'id': 'route',
            'source': 'route',
            'type': 'line',
            ...Stylings.ROUTE_STYLES
        });
    }

    flyTo(centerCoordinates) {
        if (!centerCoordinates || centerCoordinates.length < 2) {
            return;
        }

        this.map.flyTo({
            center: centerCoordinates, speed: 0.5, easing: function (t) {
                return t;
            }
        });
    }

    highLightLines() {
        const category = this.styling.getHighLightedCategory();

        if (!category) {
            this.map.setPaintProperty(
                'route',
                'line-opacity',
                1
            );
            return;
        }

        this.map.setPaintProperty(
            'route',
            'line-opacity',
            ['case',
                ["==", ['get', 'category'], category], 1, 0.1
            ]
        );
    }

    render() {
        this.map.on('load', () => {

            this.flyTo(this.dataProcessor.getOriginCoordinates());
            this.dataProcessor.getOriginCoordinates();
            const routes = this.dataProcessor.getArcLinesFromOrigin();
            this.addSourceAndLayers(routes);

            const popup = new mapboxgl.Popup();

            this.map.on('mouseenter', 'capitals', ({ features }) => {
                if (!features.length) {
                    popup.remove();
                    return;
                }
                const feature = features[0];

                popup.setLngLat(feature.geometry.coordinates)
                    .setHTML(`<h3>${feature.properties.Name}</h3> <p> ${feature.properties.Description} </p>`)
                    .addTo(this.map);

                this.map.getCanvas().style.cursor = features.length ? 'pointer' : '';

            });

            this.map.on('click', 'capitals', ({ features }) => {
                if (!features.length) {
                    return;
                }
                const feature = features[0];
                this.flyTo(feature.geometry.coordinates);

                this.replaceOrigin(feature.properties.Name);
            });


            this.map.on('mouseleave', 'capitals', () => {
                this.map.getCanvas().style.cursor = '';
                popup.remove();
            });

            let hoverId = null;


            this.map.on('mouseenter', 'route', ({ features, lngLat }) => {
                if (!features.length) {
                    popup.remove();
                    return;
                }
                const feature = features[0];

                popup.setLngLat(lngLat.toArray())
                    .setHTML(`<h3>Distance ${feature.properties.origin} - ${this.dataProcessor.getOriginCapital()}: </h3> <p> ${feature.properties.distance} km </p>`)
                    .addTo(this.map);

                hoverId = feature.id;
                this.map.setFeatureState(
                    { source: 'route', id: hoverId },
                    { hover: true }
                );
            });


            this.map.on('mouseleave', 'route', () => {
                const id = hoverId;

                this.map.getCanvas().style.cursor = '';
                popup.remove();

                if (id !== null) {
                    this.map.setFeatureState(
                        { source: 'route', id },
                        { hover: false }
                    );
                    hoverId = null;
                }
            });
        });
    }

}