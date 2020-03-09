import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';

import { Stylings } from './stylings.js';
import {
    ACCESS_TOKEN, PREFIX_STYLE_URL, DEFAULT_ZOOM_LEVEL,
    FLY_TO_ANIMATION_SPEED
} from './constants.js';
import { notify } from './utils.js';
import { DataProcessor } from './data-processor.js';

/**
 * Wrapper around map to encapsulate map manipulation api
 */
export class MapWrapper {
    /**
     * Stylings instance that contains style information of the selected theme
     * @type {Stylings}
     * @public
     */
    styling = null;

    /**
     * Instance that contains capital data from API and transform data into Geo data of Capital markers, flight arcs
     * @type {DataProcessor}
     * @public
     */
    dataProcessor = null;

    /**
     * Mark if map is loaded the first time
     * @type {boolean}
     * @private
     */
    _isLoaded = false;

    /**
     * Map instance
     * @type {mapboxgl.Map}
     * @private
     */
    _map = null;

    /**
     * Popup instance
     * @type {mapboxgl.Popup}
     * @private
     */
    _popup = null;

    /**
     * Init map instance, load data and render data
     * @param {Stylings} styling styling obj instance
     * @param {DataProcessor} dataProcessor data processor obj instance
     */
    constructor(styling, dataProcessor) {
        this.styling = styling;
        this.dataProcessor = dataProcessor;

        mapboxgl.accessToken = ACCESS_TOKEN;
        this._map = new mapboxgl.Map({
            container: 'map',
            style: `${PREFIX_STYLE_URL}${styling.theme}`,
            zoom: DEFAULT_ZOOM_LEVEL
        });

        this._popup = new mapboxgl.Popup();

        this.loadDataAndRender();
    }

    /**
     * Load map, fetch data from back-end and render markers/lines
     * @returns {void}
     * @public
     */
    loadDataAndRender() {
        this.onLoad()
            .then(this.dataProcessor.load)
            .then(this._initialRender)
            .catch(notify);
    }

    /**
     * Wait for map to be initially loaded
     * @returns {Promise<Boolean>} promise to wait for map to be loaded
     * @public
     */
    onLoad = () => new Promise((resolve, reject) => {
        if (!this._map) {
            notify("Map not found");
            reject(false);
            return;
        }

        if (this._isLoaded) {
            resolve(true);
            return;
        }

        this._map.once('load', () => {
            this._isLoaded = true
            resolve(true);
        })
    })

    /**
     * Function decorator that wrap callBack function and check if map is null before calling callBack function  
     * @param {Function} callBack call back function
     * @returns {Function} wrapper function to swallow nullable map
     * @private
     */
    _swallowNullMap = callBack => (...args) => {
        if (!this._map) {
            notify("Map not found");
            return;
        }
        callBack(...args);
    }

    /**
     * Function decorator that wrap callBack function and check if pop up is null before calling callBack function  
     * @param {Function} callBack call back function
     * @returns {Function} wrapper function to swallow nullable popup
     * @private
     */
    _swallowNullPopup = callBack => (...args) => {
        if (!this._popup) {
            notify("Popup not found");
            return;
        }
        callBack(...args);
    }

    /**
     * Function decorator that wrap callBack function and check if pop up is null or map is null before calling callBack function  
     * @param {Function} callBack call back function
     * @returns {Function} wrapper function to swallow nullable popup, nullable map
     * @private
     */
    _swallowNullMapAndPopup = callBack => this._swallowNullMap(this._swallowNullPopup(callBack))

    /**
     * Change theme style and add sources and layers again
     * @param {string} theme Id of the selected theme
     * @returns {void}
     * @public
     */
    changeTheme = this._swallowNullMap(theme => {
        // Preserve the state of the source before setting style as the state is lost after the setStyle() is called
        const prevRouteSource = this._map.getSource('route');
        if (!prevRouteSource || !prevRouteSource._data || !prevRouteSource._data.features) {
            notify("Layer not found");
            return;
        }

        // automatic style diff failed => force diff to false to rerender the entire map
        this._map.setStyle(`${PREFIX_STYLE_URL}${theme}`, { diff: false });

        this._map.once('styledata', () => {
            const routesInfo = prevRouteSource._data;
            // Recompute styles for lines based on theme state in this.styling
            routesInfo.features.forEach(feature => {
                const { distance } = feature.properties;
                feature.properties = { ...feature.properties, ...this.styling.getLineProperties(distance) };
            });
            this._addSourceAndLayers(routesInfo);

            // Preserve the highlighted route category after changing theme
            this.highLightLines();
        });
    })

    /**
     * Highlight the selected routes in a specific distance category(short, ..., long)
     * @returns {void}
     * @public
     */
    highLightLines = this._swallowNullMap(() => {
        const highlightedCategory = this.styling.highLightedCategory;

        // Reset line opacity of route when there is no highlighted category
        if (!highlightedCategory) {
            return this._map.setPaintProperty(...Stylings.DEFAULT_LINES_OPACITY_STYLE);
        }

        this._map.setPaintProperty(...Stylings.getLineOpacityWithHighLightedCategory(highlightedCategory));
    })

    /**
     * Set INITIAL center position, add markerts, draw arcs, listen to events from map
     * @returns {void}
     * @private
     */
    _initialRender = () => {
        this._initFlightMap();

        this._map.on('mouseenter', 'capitals', this._displayCapitalInfoPopup);
        this._map.on('mouseleave', 'capitals', this._hideCapitalInfoPopup);
        this._map.on('click', 'capitals', this._displayAllFlightsFromChosenCapital);

        const { highLightOneSpecificRoute, unHighLightOneSpecificRoute } = this._getRouteHoverHandler();
        this._map.on('mouseenter', 'route', highLightOneSpecificRoute);
        this._map.on('mouseleave', 'route', unHighLightOneSpecificRoute);
    }

    /**
     * Set initial center position, add markers, draw arcs
     * @returns {void}
     * @private
     */
    _initFlightMap = () => {
        this._moveCenterTo(this.dataProcessor.selectedCapitalCoordinates);
        const routes = this.dataProcessor.arcLinesFromSelectedCapital;
        this._addSourceAndLayers(routes);
    }

    /**
     * Add source and layers to show capital markers and routes
     * @param {GeoJSON.FeatureCollection<LineString>} routes FeatureCollection of LineString object
     * @return {void}
     * @private
     */
    _addSourceAndLayers = this._swallowNullMap(routes => {
        this._map.addLayer({
            id: 'capitals',
            type: 'symbol',
            source: {
                type: 'geojson',
                data: this.dataProcessor.capitalMarkers
            },
            ...Stylings.CAPITAL_ICON_STYLES
        });

        this._map.addSource('route', {
            'type': 'geojson',
            'data': routes
        });

        this._map.addLayer({
            'id': 'route',
            'source': 'route',
            'type': 'line',
            ...Stylings.ROUTE_STYLES
        });
    });

    /**
     * Move center to specified coordinates
     * @param {Array<Number>} centerCoordinates array in the shape [longitude, latitude]
     * @return {void}
     * @private
     */
    _moveCenterTo = this._swallowNullMap(centerCoordinates => {
        if (!centerCoordinates || centerCoordinates.length < 2) {
            notify("Center coordinates are invalid!!!");
            return;
        }

        this._map.flyTo({
            center: centerCoordinates,
            speed: FLY_TO_ANIMATION_SPEED,
            easing: t => t
        });
    })

    /**
     * Display popup when capital marker is hovered
     * @param {MapEvent} event emited by hovering on markers
     * @return {void}
     * @private 
     */
    _displayCapitalInfoPopup = this._swallowNullMapAndPopup(({ features }) => {

        if (!features.length) {
            this._popup.remove();
            return;
        }
        const feature = features[0];

        this._popup.setLngLat(feature.geometry.coordinates)
            .setHTML(`<h3>${feature.properties.Name}</h3> <p> ${feature.properties.Description} </p>`)
            .addTo(this._map);

        this._map.getCanvas().style.cursor = 'pointer';
    })

    /**
     * Hide popup when capital marker is unhovered
     * @param {MapEvent} event emited by unhovering on markers
     * @return {void}
     * @private 
     */
    _hideCapitalInfoPopup = this._swallowNullMapAndPopup(() => {
        this._map.getCanvas().style.cursor = '';
        this._popup.remove();
    })

    /**
     * Display all flights from a chosen capital when the capital marker is clicked
     * @param {MapEvent} event emited by clicking on marker
     * @return {void}
     * @private 
     */
    _displayAllFlightsFromChosenCapital = ({ features }) => {
        if (!features.length) {
            return;
        }
        const {
            geometry: { coordinates: capitalCoordinates },
            properties: { Name: capitalName }
        } = features[0];
        this._moveCenterTo(capitalCoordinates);
        this._replaceSelectedCapital(capitalName);
    }

    /**
     * Recompute arcs from the newly selected capital
     * @param {string} newSelectedCapital name of the newly selected capital
     * @returns {void}
     * @private
     */
    _replaceSelectedCapital = this._swallowNullMap(newSelectedCapital => {
        if (!this.dataProcessor.setSelectedCapital(newSelectedCapital)) {
            return;
        }

        const routeSource = this._map.getSource('route');
        if (!routeSource) {
            notify("Route source is not found")
            return;
        }


        const arcs = this.dataProcessor.arcLinesFromSelectedCapital;
        routeSource.setData(arcs);
    })

    /**
     * Get functions to high light a specific route when that route is hovered.
     * Since both functions share the same hoverID, we need to wrap them using higher order function to encapsulate hoverId
     * and make it accessible to only 2 functions
     * @return {{highLightOneSpecificRoute: Function, unHighLightOneSpecificRoute: Function}}
     * @private
     */
    _getRouteHoverHandler = () => {
        // This id is used to track which route should be set hover style when it is hovered
        // as well as unset hover style when it is not hovered anymore
        let hoverId = null;

        const highLightOneSpecificRoute = this._swallowNullMapAndPopup(({ features, lngLat }) => {
            if (!features.length) {
                this._popup.remove();
                return;
            }
            const feature = features[0];

            this._popup.setLngLat(lngLat.toArray())
                .setHTML(`
                <h3>Distance ${feature.properties.otherDestination} - ${this.dataProcessor.selectedCapital}: </h3>
                <p> ${feature.properties.distance} km </p>`)
                .addTo(this._map);

            hoverId = feature.id;
            this._map.setFeatureState(
                { source: 'route', id: hoverId },
                { hover: true }
            );
        });

        const unHighLightOneSpecificRoute = this._swallowNullMapAndPopup(_ => {
            if (hoverId !== null) {
                this._map.getCanvas().style.cursor = '';
                this._popup.remove();
                this._map.setFeatureState(
                    { source: 'route', id: hoverId },
                    { hover: false }
                );
                hoverId = null;
            }
        });

        return {
            highLightOneSpecificRoute,
            unHighLightOneSpecificRoute
        };
    }
}