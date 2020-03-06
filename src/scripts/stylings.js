export class Stylings {

    static THEME_KEY = 'THEME';
    static LIGHT_THEME = 'light-v10';
    static DARK_THEME = 'dark-v10';

    static DISTANCE_CATEROGY_NAMES = {
        LONG: 'LONG',
        UPPER_MEDIUM: 'UPPER_MEDIUM',
        LOWER_MEDIUM: 'LOWER_MEDIUM',
        SHORT: 'SHORT'
    }

    static COLORS = {
        [Stylings.DISTANCE_CATEROGY_NAMES.LONG]: {
            [Stylings.LIGHT_THEME]: '#D84315',
            [Stylings.DARK_THEME]: '#ffab40'
        },
        [Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM]: {
            [Stylings.LIGHT_THEME]: '#1A237E',
            [Stylings.DARK_THEME]: '#448aff'
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
        [Stylings.DISTANCE_CATEROGY_NAMES.LONG]: 0.5,
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
                ['boolean',
                    ['feature-state', 'hover'],
                    false
                ],
                10,
                ['get', 'lineWidth']
            ],
            'line-opacity': [
                'case',
                ['boolean',
                    ['feature-state', 'hover'],
                    false
                ],
                0.8,
                1
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

    theme = localStorage.getItem(Stylings.THEME_KEY) || Stylings.LIGHT_THEME;

    constructor(theme) {
        this.theme = theme ? theme : localStorage.getItem(Stylings.THEME_KEY) || Stylings.LIGHT_THEME;
    }

    getTheme() {
        return this.theme;
    }

    setTheme(themeName) {
        this.theme = themeName;
        localStorage.setItem(Stylings.THEME_KEY, themeName);
    }

    getLineStyles(distance) {
        const categories = [
            Stylings.DISTANCE_CATEROGY_NAMES.LONG,
            Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM,
            Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM
        ];

        for (const category of categories) {
            if (distance >= Stylings.MIN_DISTANCE[category]) {
                return {
                    color: Stylings.COLORS[category][this.theme],
                    lineWidth: Stylings.LINE_WIDTH[category]
                };
            }
        }


        return {
            color: Stylings.COLORS[Stylings.DISTANCE_CATEROGY_NAMES.SHORT][this.theme],
            lineWidth: Stylings.LINE_WIDTH[Stylings.DISTANCE_CATEROGY_NAMES.SHORT]
        };
    }


}