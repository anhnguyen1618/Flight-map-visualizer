import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';

import { Stylings } from './stylings.js';
import {
    ACCESS_TOKEN, PREFIX_STYLE_URL, DEFAULT_ZOOM_LEVEL,
    FLY_TO_ANIMATION_SPEED, UN_HIGHLIGHTED_LINE_OPACITY,
    DEFAULT_LINE_OPACITY
} from './constants.js';
import { notify } from './utils.js';

export class MapWrapper {
    constructor(styling, dataProcessor) {
        this.styling = styling;
        this.dataProcessor = dataProcessor;
        this.isLoaded = false;

        mapboxgl.accessToken = ACCESS_TOKEN;
        this.map = new mapboxgl.Map({
            container: 'map',
            style: `${PREFIX_STYLE_URL}${styling.getTheme()}`,
            zoom: DEFAULT_ZOOM_LEVEL
        });

        this.popup = new mapboxgl.Popup();

        this.onLoad()
            .then(this.dataProcessor.load)
            .then(this.render)
            .catch(alert);
    }

    onLoad = _ => new Promise((resolve, reject) => {
        if (!this.map) {
            notify("Map not found");
            reject(false);
            return;
        }

        if (this.isLoaded) {
            resolve(true);
            return;
        }

        this.map.once('load', _ => {
            this.isLoaded = true
            resolve(true);
        })
    })

    swallowNullMap = f => (...args) => {
        if (!this.map) {
            notify("Map not found");
            return;
        }
        f(...args);
    }

    swallowNullPopup = f => (...args) => {
        if (!this.popup) {
            notify("Popup not found");
            return;
        }
        f(...args);
    }

    swallowNullMapAndPopup = f => this.swallowNullMap(this.swallowNullPopup(f))


    render = _ => {
        this.initFlightMap();

        this.map.on('mouseenter', 'capitals', this.displayCapitalInfoPopup);
        this.map.on('mouseleave', 'capitals', this.hideCapitalInfoPopup);
        this.map.on('click', 'capitals', this.displayAllFlightsFromChosenCapital);
        const { highLightRoute, unHighLightRoute } = this.getRouteHoverHandler();
        this.map.on('mouseenter', 'route', highLightRoute);
        this.map.on('mouseleave', 'route', unHighLightRoute);
    }

    initFlightMap = _ => {
        this.moveCenterTo(this.dataProcessor.getOriginCoordinates());
        const routes = this.dataProcessor.getArcLinesFromOrigin();
        this.addSourceAndLayers(routes);
    }

    addSourceAndLayers = this.swallowNullMap(routes => {
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
    });

    changeTheme = this.swallowNullMap(theme => {
        // Preserve the state of the source before setting style as the state is lost after the setStyle() is called
        const prevRouteSource = this.map.getSource('route');
        if (!prevRouteSource || !prevRouteSource._data || !prevRouteSource._data.features) {
            notify("Layer not found");
            return;
        }

        // automatic style diff failed => force diff to false to rerender the entire map
        this.map.setStyle(`${PREFIX_STYLE_URL}${theme}`, { diff: false });

        this.map.once('styledata', _ => {
            const routesInfo = prevRouteSource._data;
            // Recompute styles for lines based on theme state in this.styling
            routesInfo.features.forEach(feature => {
                const { distance } = feature.properties;
                feature.properties = { ...feature.properties, ...this.styling.getLineProperties(distance) };
            });
            this.addSourceAndLayers(routesInfo);

            // Preserve the highlighted route category after changing theme
            const prevHighlightedCategory = this.styling.getHighLightedCategory();
            this.highLightLines(prevHighlightedCategory);
        });
    })

    replaceOrigin = this.swallowNullMap(newOrigin => {
        if (!this.dataProcessor.setOriginCapital(newOrigin)) {
            return;
        }

        const routeSource = this.map.getSource('route');
        if (!routeSource) {
            notify("Route source is not found")
            return;
        }


        const arcs = this.dataProcessor.getArcLinesFromOrigin();
        routeSource.setData(arcs);
    })

    moveCenterTo = this.swallowNullMap((centerCoordinates) => {
        if (!centerCoordinates || centerCoordinates.length < 2) {
            notify("Center coordinates are invalid!!!");
            return;
        }

        this.map.flyTo({
            center: centerCoordinates,
            speed: FLY_TO_ANIMATION_SPEED,
            easing: t => t
        });
    })

    highLightLines = this.swallowNullMap(() => {
        const highlightedCategory = this.styling.getHighLightedCategory();

        // Reset line opacity of route when there is no highlighted category
        if (!highlightedCategory) {
            this.map.setPaintProperty(
                'route',
                'line-opacity',
                DEFAULT_LINE_OPACITY
            );
            return;
        }

        this.map.setPaintProperty(
            'route',
            'line-opacity',
            ['case',
                ["==", ['get', 'category'], highlightedCategory], DEFAULT_LINE_OPACITY, UN_HIGHLIGHTED_LINE_OPACITY
            ]
        );
    })



    displayCapitalInfoPopup = this.swallowNullMapAndPopup(({ features }) => {

        if (!features.length) {
            this.popup.remove();
            return;
        }
        const feature = features[0];

        this.popup.setLngLat(feature.geometry.coordinates)
            .setHTML(`<h3>${feature.properties.Name}</h3> <p> ${feature.properties.Description} </p>`)
            .addTo(this.map);

        this.map.getCanvas().style.cursor = features.length ? 'pointer' : '';
    })

    hideCapitalInfoPopup = this.swallowNullMapAndPopup(_ => {
        this.map.getCanvas().style.cursor = '';
        this.popup.remove();
    })

    displayAllFlightsFromChosenCapital = ({ features }) => {
        if (!features.length) {
            return;
        }
        const feature = features[0];
        this.moveCenterTo(feature.geometry.coordinates);
        this.replaceOrigin(feature.properties.Name);
    }



    getRouteHoverHandler = _ => {
        let hoverId = null;

        const highLightRoute = this.swallowNullMapAndPopup(({ features, lngLat }) => {
            if (!features.length) {
                this.popup.remove();
                return;
            }
            const feature = features[0];

            this.popup.setLngLat(lngLat.toArray())
                .setHTML(`<h3>Distance ${feature.properties.origin} - ${this.dataProcessor.getOriginCapital()}: </h3> <p> ${feature.properties.distance} km </p>`)
                .addTo(this.map);

            hoverId = feature.id;
            this.map.setFeatureState(
                { source: 'route', id: hoverId },
                { hover: true }
            );
        });

        const unHighLightRoute = this.swallowNullMapAndPopup(_ => {
            if (!this.map) {
                notify("Map is unavailable")
                return;
            }

            if (!this.popup) {
                notify("Popup is not found")
                return;
            }

            if (hoverId !== null) {
                this.map.getCanvas().style.cursor = '';
                this.popup.remove();
                this.map.setFeatureState(
                    { source: 'route', id: hoverId },
                    { hover: false }
                );
                hoverId = null;
            }
        });

        return {
            highLightRoute,
            unHighLightRoute
        }
    }



}