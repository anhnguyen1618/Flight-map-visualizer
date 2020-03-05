class Stylings {

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
        [DISTANCE_CATEROGY_NAMES.LONG]: {
            [LIGHT_THEME]: '#D84315',
            [DARK_THEME]: '#ffab40'
        },
        [DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM]: {
            [LIGHT_THEME]: '#1A237E',
            [DARK_THEME]: '#448aff'
        },
        [DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM]: {
            [LIGHT_THEME]: '#00BFA5',
            [DARK_THEME]: '#00BFA5'
        },
        [DISTANCE_CATEROGY_NAMES.SHORT]: {
            [LIGHT_THEME]: '#c41497',
            [DARK_THEME]: '#c41497'
        }
    }

    static LINE_WIDTH = {
        [DISTANCE_CATEROGY_NAMES.LONG]: 0.5,
        [DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM]: 1,
        [DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM]: 1.5,
        [DISTANCE_CATEROGY_NAMES.SHORT]: 2
    }

    static MIN_DISTANCE = {
        [DISTANCE_CATEROGY_NAMES.LONG]: 10000,
        [DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM]: 5000,
        [DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM]: 3000,
        [DISTANCE_CATEROGY_NAMES.SHORT]: 0
    }

    theme = localStorage.getItem(THEME_KEY) || LIGHT_THEME;

    constructor() { }

    getTheme() {
        return this.theme;
    }

    setTheme(themeName) {
        this.theme = themeName;
        localStorage.setItem(THEME_KEY) = themeName;
    }

    getLineProperties(distance) {
        const categories = [
            DISTANCE_CATEROGY_NAMES.LONG,
            DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM,
            DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM
        ];

        for (const category of categories) {
            if (distance >= MIN_DISTANCE[category]) {
                return {
                    color: COLORS[category][theme],
                    lineWidth: LINE_WIDTH[category],
                    distance
                }
            }
        }


        return {
            color: COLORS[DISTANCE_CATEROGY_NAMES.SHORT][theme],
            lineWidth: LINE_WIDTH[DISTANCE_CATEROGY_NAMES.SHORT],
            distance
        };
    }


}