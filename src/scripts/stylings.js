export class Stylings {

    static THEME_KEY = 'THEME';
    static LIGHT_THEME = 'mapbox/light-v10';
    static DARK_THEME = 'anhnguyen6281/ck7ir19ij3qoo1inr3qhnowy5';

    static DISTANCE_CATEROGY_NAMES = {
        LONG: 'LONG',
        UPPER_MEDIUM: 'UPPER_MEDIUM',
        LOWER_MEDIUM: 'LOWER_MEDIUM',
        SHORT: 'SHORT'
    }

    static CATEGORY_NAMES_IN_DESC_ORDER = [
        Stylings.DISTANCE_CATEROGY_NAMES.LONG,
        Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM,
        Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM,
        Stylings.DISTANCE_CATEROGY_NAMES.SHORT
    ]

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

    static LINE_WIDTH = {
        [Stylings.DISTANCE_CATEROGY_NAMES.LONG]: 0.7,
        [Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM]: 1,
        [Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM]: 1.5,
        [Stylings.DISTANCE_CATEROGY_NAMES.SHORT]: 2
    }

    static MIN_DISTANCE = {
        [Stylings.DISTANCE_CATEROGY_NAMES.LONG]: 10000,
        [Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM]: 5000,
        [Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM]: 3000,
        [Stylings.DISTANCE_CATEROGY_NAMES.SHORT]: 0
    }

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

    static CAPITAL_ICON_STYLES = {
        layout: {
            'icon-image': 'airport-11',
            'icon-allow-overlap': true
        }
    }

    theme = localStorage.getItem(Stylings.THEME_KEY) || Stylings.DARK_THEME;

    highLightedCategory = '';

    constructor(theme) {
        this.theme = theme ? theme : localStorage.getItem(Stylings.THEME_KEY) || Stylings.DARK_THEME;
    }

    getTheme() {
        return this.theme;
    }

    setTheme(themeName) {
        this.theme = themeName;
        localStorage.setItem(Stylings.THEME_KEY, themeName);
    }

    setHighLightedCategory(highLightedCategory) {
        this.highLightedCategory = highLightedCategory;
    }

    getHighLightedCategory() {
        return this.highLightedCategory;
    }

    getLineProperties(distance) {
        for (const category of Stylings.CATEGORY_NAMES_IN_DESC_ORDER) {
            if (distance >= Stylings.MIN_DISTANCE[category]) {
                return {
                    color: Stylings.COLORS[category][this.theme],
                    lineWidth: Stylings.LINE_WIDTH[category],
                    category
                };
            }
        }


        return {
            color: Stylings.COLORS[Stylings.DISTANCE_CATEROGY_NAMES.SHORT][this.theme],
            lineWidth: Stylings.LINE_WIDTH[Stylings.DISTANCE_CATEROGY_NAMES.SHORT],
            category
        };
    }


}