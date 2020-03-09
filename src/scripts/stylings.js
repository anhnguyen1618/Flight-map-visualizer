/**
 * Class that is responsible for styling map
 */
export class Stylings {
    /**
     * Key to store/retrieve theme from local storage
     * @type {string}
     */
    static THEME_KEY = 'THEME';

    /**
     * Url path and Key for light theme
     */
    static LIGHT_THEME = 'mapbox/light-v10';

    /**
     * Url path and key for customed dark theme
     */
    static DARK_THEME = 'anhnguyen6281/ck7ir19ij3qoo1inr3qhnowy5';

    /**
     * Mapping constants to distance category
     */
    static DISTANCE_CATEROGY_NAMES = {
        LONG: 'LONG',
        UPPER_MEDIUM: 'UPPER_MEDIUM',
        LOWER_MEDIUM: 'LOWER_MEDIUM',
        SHORT: 'SHORT'
    }

    /**
     * Distance name category in descending order
     */
    static CATEGORY_NAMES_IN_DESC_ORDER = [
        Stylings.DISTANCE_CATEROGY_NAMES.LONG,
        Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM,
        Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM,
        Stylings.DISTANCE_CATEROGY_NAMES.SHORT
    ]

    /**
     * Color mapping for theme and distance, this is used for getting the color of route based on theme and distance
     */
    static COLORS = {
        [Stylings.DISTANCE_CATEROGY_NAMES.LONG]: {
            [Stylings.LIGHT_THEME]: '#D84315',
            [Stylings.DARK_THEME]: '#ffab40'
        },
        [Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM]: {
            [Stylings.LIGHT_THEME]: '#1A237E',
            [Stylings.DARK_THEME]: '#486af3'
        },
        [Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM]: {
            [Stylings.LIGHT_THEME]: '#00BFA5',
            [Stylings.DARK_THEME]: '#00BFA5'
        },
        [Stylings.DISTANCE_CATEROGY_NAMES.SHORT]: {
            [Stylings.LIGHT_THEME]: '#c41497',
            [Stylings.DARK_THEME]: '#c41497'
        }
    }

    /**
     * Mapping between distance category and line with of route
     */
    static LINE_WIDTH = {
        [Stylings.DISTANCE_CATEROGY_NAMES.LONG]: 0.7,
        [Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM]: 1,
        [Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM]: 1.5,
        [Stylings.DISTANCE_CATEROGY_NAMES.SHORT]: 2
    }

    /**
     * Mapping from category name and min distance in that category
     */
    static MIN_DISTANCE = {
        [Stylings.DISTANCE_CATEROGY_NAMES.LONG]: 10000,
        [Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM]: 5000,
        [Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM]: 3000,
        [Stylings.DISTANCE_CATEROGY_NAMES.SHORT]: 0
    }

    /**
     * Style of route, it uses Style conditional expression to handle hover style 
     */
    static ROUTE_STYLES = {
        'paint': {
            'line-width': [
                'case',
                ['==',
                    ['feature-state', 'hover'],
                    true
                ],
                10,
                ['get', 'lineWidth']
            ],
            'line-blur': [
                'case',
                ['==',
                    ['feature-state', 'hover'],
                    true
                ],
                3,
                0
            ],
            'line-color': ['get', 'color']
        },
        'layout': {
            'line-cap': "round"
        }
    }

    static DEFAULT_LINE_OPACITY = 1;
    static UN_HIGHLIGHTED_LINE_OPACITY = 0.1;
    static DEFAULT_LINES_OPACITY_STYLE = ['route', 'line-opacity', Stylings.DEFAULT_LINE_OPACITY]

    static CAPITAL_ICON_STYLES = {
        layout: {
            'icon-image': 'airport-11',
            'icon-allow-overlap': true
        }
    }

    /**
     * Selected theme of the application, Uses Dark theme as default
     * @type {string} selected theme
     * @private
     */
    _theme = localStorage.getItem(Stylings.THEME_KEY) || Stylings.DARK_THEME;

    /**
     * Highlighted category. E.g: ('SHORT','LONG')
     * @type {string} 
     * @private
     */
    _highLightedCategory = '';


    /**
     * @param {string} theme key of the theme
     */
    constructor(theme) {
        this._theme = theme ? theme : localStorage.getItem(Stylings.THEME_KEY) || Stylings.DARK_THEME;
    }

    /**
     * Get theme name
     * @returns {string} name of the theme
     * @public
     */
    get theme() {
        return this._theme;
    }

    /**
     * Get name of theme, also in localstorage
     * @param {string} themeName
     * @public
     */
    set theme(themeName) {
        this._theme = themeName;
        localStorage.setItem(Stylings.THEME_KEY, themeName);
    }

    /**
     * Set highlighted category
     * @param {string} name of the highlighted category(e.g: SHORT)
     * @public
     */
    set highLightedCategory(highLightedCategory) {
        this._highLightedCategory = highLightedCategory;
    }

    /**
     * Get Highlighted category
     * @return {string} name of highlighted category 
     * @public
     */
    get highLightedCategory() {
        return this._highLightedCategory;
    }

    /**
     * Get properties of line based on distance between 2 endpoints
     * @param {number} distance distance between 2 endpoints
     * @return {{color: string, lineWidth: number, category: string}}
     * @public
     */
    getLineProperties = distance => {
        for (const category of Stylings.CATEGORY_NAMES_IN_DESC_ORDER) {
            if (distance >= Stylings.MIN_DISTANCE[category]) {
                return {
                    color: Stylings.COLORS[category][this._theme],
                    lineWidth: Stylings.LINE_WIDTH[category],
                    category
                };
            }
        }

        return {
            color: Stylings.COLORS[Stylings.DISTANCE_CATEROGY_NAMES.SHORT][this._theme],
            lineWidth: Stylings.LINE_WIDTH[Stylings.DISTANCE_CATEROGY_NAMES.SHORT],
            category: Stylings.DISTANCE_CATEROGY_NAMES.SHORT
        };
    }

    /**
     * Get line opacity based on the highlighted category
     * E.g: if category == `SHORT`. All routes that belongs to other category has line opacity = 0.1
     * @param {string} highlightedCategory
     * @return {Array} style arrays
     * @public
     */
    static getLineOpacityWithHighLightedCategory(highlightedCategory) {
        return [
            'route',
            'line-opacity',
            ['case',
                ["==", ['get', 'category'], highlightedCategory], Stylings.DEFAULT_LINE_OPACITY, Stylings.UN_HIGHLIGHTED_LINE_OPACITY
            ]
        ];
    }
}