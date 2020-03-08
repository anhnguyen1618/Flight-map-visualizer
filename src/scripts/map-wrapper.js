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
            style: `${PREFIX_STYLE_URL}${styling.theme}`,
            zoom: DEFAULT_ZOOM_LEVEL
        });

        this.popup = new mapboxgl.Popup();

        this.onLoad()
            .then(this.dataProcessor.load)
            .then(this._render)
            .catch(error => {
                console.error(error);
                alert(error);
            });
    }

    _swallowNullMap = f => (...args) => {
        if (!this.map) {
            notify("Map not found");
            return;
        }
        f(...args);
    }

    _swallowNullPopup = f => (...args) => {
        if (!this.popup) {
            notify("Popup not found");
            return;
        }
        f(...args);
    }

    _swallowNullMapAndPopup = f => this._swallowNullMap(this._swallowNullPopup(f))

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

    changeTheme = this._swallowNullMap(theme => {
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
            this._addSourceAndLayers(routesInfo);

            // Preserve the highlighted route category after changing theme
            const prevHighlightedCategory = this.styling.highLightedCategory;
            this.highLightLines(prevHighlightedCategory);
        });
    })

    highLightLines = this._swallowNullMap(() => {
        const highlightedCategory = this.styling.highLightedCategory;

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


    _render = _ => {
        this._initFlightMap();

        this.map.on('mouseenter', 'capitals', this._displayCapitalInfoPopup);
        this.map.on('mouseleave', 'capitals', this._hideCapitalInfoPopup);
        this.map.on('click', 'capitals', this._displayAllFlightsFromChosenCapital);
        const { highLightRoute, unHighLightRoute } = this._getRouteHoverHandler();
        this.map.on('mouseenter', 'route', highLightRoute);
        this.map.on('mouseleave', 'route', unHighLightRoute);
    }

    _initFlightMap = _ => {
        this._moveCenterTo(this.dataProcessor.selectedCapitalCoordinates);
        const routes = this.dataProcessor.arcLinesFromSelectedCapital;
        this._addSourceAndLayers(routes);
    }

    _addSourceAndLayers = this._swallowNullMap(routes => {
        this.map.addLayer({
            id: 'capitals',
            type: 'symbol',
            source: {
                type: 'geojson',
                data: this.dataProcessor.capitalMarkers
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

    _replaceOrigin = this._swallowNullMap(newOrigin => {
        if (!this.dataProcessor.setSelectedCapital(newOrigin)) {
            return;
        }

        const routeSource = this.map.getSource('route');
        if (!routeSource) {
            notify("Route source is not found")
            return;
        }


        const arcs = this.dataProcessor.arcLinesFromSelectedCapital;
        routeSource.setData(arcs);
    })

    _moveCenterTo = this._swallowNullMap((centerCoordinates) => {
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

    _displayCapitalInfoPopup = this._swallowNullMapAndPopup(({ features }) => {

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

    _hideCapitalInfoPopup = this._swallowNullMapAndPopup(_ => {
        this.map.getCanvas().style.cursor = '';
        this.popup.remove();
    })

    _displayAllFlightsFromChosenCapital = ({ features }) => {
        if (!features.length) {
            return;
        }
        const feature = features[0];
        this._moveCenterTo(feature.geometry.coordinates);
        this._replaceOrigin(feature.properties.Name);
    }

    _getRouteHoverHandler = _ => {
        let hoverId = null;

        const highLightRoute = this._swallowNullMapAndPopup(({ features, lngLat }) => {
            if (!features.length) {
                this.popup.remove();
                return;
            }
            const feature = features[0];

            this.popup.setLngLat(lngLat.toArray())
                .setHTML(`
                <h3>Distance ${feature.properties.origin} - ${this.dataProcessor.selectedCapital}: </h3>
                <p> ${feature.properties.distance} km </p>`)
                .addTo(this.map);

            hoverId = feature.id;
            this.map.setFeatureState(
                { source: 'route', id: hoverId },
                { hover: true }
            );
        });

        const unHighLightRoute = this._swallowNullMapAndPopup(_ => {
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