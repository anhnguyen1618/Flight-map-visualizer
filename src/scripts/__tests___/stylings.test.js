import { Stylings } from '../stylings.js';

describe('Map wrapper test', () => {
    let styling;

    beforeEach(() => {
        styling = new Stylings();
    });

    test("test get line properties based on distance", () => {
        styling.theme = Stylings.DARK_THEME;
        expect(styling.theme).toBe(Stylings.DARK_THEME);

        expect(styling.getLineProperties(1000)).toEqual({
            color: Stylings.COLORS[Stylings.DISTANCE_CATEROGY_NAMES.SHORT][Stylings.DARK_THEME],
            lineWidth: Stylings.LINE_WIDTH[Stylings.DISTANCE_CATEROGY_NAMES.SHORT],
            category: Stylings.DISTANCE_CATEROGY_NAMES.SHORT
        });

        expect(styling.getLineProperties(12000)).toEqual({
            color: Stylings.COLORS[Stylings.DISTANCE_CATEROGY_NAMES.LONG][Stylings.DARK_THEME],
            lineWidth: Stylings.LINE_WIDTH[Stylings.DISTANCE_CATEROGY_NAMES.LONG],
            category: Stylings.DISTANCE_CATEROGY_NAMES.LONG
        });

        expect(styling.getLineProperties(3500)).toEqual({
            color: Stylings.COLORS[Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM][Stylings.DARK_THEME],
            lineWidth: Stylings.LINE_WIDTH[Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM],
            category: Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM
        });

        expect(styling.getLineProperties(7000)).toEqual({
            color: Stylings.COLORS[Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM][Stylings.DARK_THEME],
            lineWidth: Stylings.LINE_WIDTH[Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM],
            category: Stylings.DISTANCE_CATEROGY_NAMES.UPPER_MEDIUM
        });

        styling.theme = Stylings.LIGHT_THEME;
        expect(styling.theme).toBe(Stylings.LIGHT_THEME);
        expect(styling.getLineProperties(3500)).toEqual({
            color: Stylings.COLORS[Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM][Stylings.LIGHT_THEME],
            lineWidth: Stylings.LINE_WIDTH[Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM],
            category: Stylings.DISTANCE_CATEROGY_NAMES.LOWER_MEDIUM
        });
    });
});