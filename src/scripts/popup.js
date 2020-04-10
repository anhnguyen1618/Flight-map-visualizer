import { Popup } from 'mapbox-gl/dist/mapbox-gl.js';

export class PopupWrapper {

    /**
     * This id is used to track which route should be set hover style when it is hovered
     * as well as unset hover style when it is not hovered anymore
     * @type {string}
     * @private
     */
    _hoverId = '';

    /**
     * Instance of map wrapper
     * @type {mapboxgl.Map}
     * @private
     */
    _map = null;

    /**
     * Instance of mapbox popup
     * @type {mapboxgl.Popup}
     * @private
     */
    _popup = null;

    /**
     * @param {mapboxgl.Map} mapInstance 
     */
    constructor(mapInstance) {
        this._map = mapInstance;
        this._popup = new Popup();
    }

    /**
     * Display popup message at position lngLat
     * @param {string} message message string
     * @param {mapboxgl.coordinates} coordinates long-lat array of location
     */
    displayMessageAtPosition = (message, coordinates) => {
        this._popup.setLngLat(coordinates)
            .setHTML(message)
            .addTo(this._map);
    }

    /**
     * Remove pop up
     * @returns {void}
     * @public
     */
    remove = () => {
        this._popup.remove();
    }

    /**
     * Highlight one specific route
     * @param {MapboxHoverEvent} event
     * @return {void} 
     */
    highLightSpecificRoute = ({ features, lngLat }) => {
        if (!features.length) {
            this._popup.remove();
            return;
        }
        const feature = features[0];

        const message = `
            <h3>Distance ${feature.properties.origin} - ${feature.properties.destination}: </h3>
            <p> ${feature.properties.distance} km </p>`;

        this.displayMessageAtPosition(message, lngLat.toArray());

        this._hoverId = feature.id;
        this._map.setFeatureState(
            { source: 'route', id: this._hoverId },
            { hover: true }
        );
    }

    /**
     * Unhighlight one specific route
     * @return {void}
     */
    unHighLightSpecificRoute = () => {
        if (!this._hoverId) {
            return;
        }

        this._map.getCanvas().style.cursor = '';
        this._popup.remove();
        this._map.setFeatureState(
            { source: 'route', id: this._hoverId },
            { hover: false }
        );
        this._hoverId = null;
    }
}