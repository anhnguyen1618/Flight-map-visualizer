import $ from 'jquery';
import { Stylings } from './stylings.js';

/**
 * Class to listen to HTML DOM events and react to those events
 */
export class DomHandler {

    /**
     * Subscribe to DOM events and react
     * @param {Stylings} styling instance of styling
     * @param {MapWrapper} mapWrapper instance of map wrapper
     * @return {Function} inner curried function
     */
    static subscribeAndReactToStyleChanges = (styling, mapWrapper) => () => {
        DomHandler.themeOnChange(styling, theme => DomHandler._changeTheme(theme, styling, mapWrapper));

        DomHandler._highlightedRoutesOnChange(styling, (category) => {
            DomHandler._changeHighLightedRoutes(category, styling, mapWrapper);
        });

        DomHandler.showThemeSelectorAndDescription();
    }

    /**
     * Show theme selector and description after loading map
     */
    static showThemeSelectorAndDescription() {
        $("#menu").show(200);
        $("#description-box").show(200);
    }
    /**
     * Listen to theme change in HTML
     * @param {Stylings} styling instance of styling 
     * @param {Function} callBack function that got called when theme is changed
     */
    static themeOnChange(styling, callBack) {
        // Add input elements for theme selector using configured values
        $('#menu').html(
            `
            <input id="light" type="radio" name="theme" value="${Stylings.LIGHT_THEME}" />
            <label for="light">Light</label>
            <input id="dark" type="radio" name="theme" value="${Stylings.DARK_THEME}" />
            <label for="dark">Dark</label>
            `
        );

        const themeSelectors = $('#menu input');

        const defaultTheme = styling.theme;
        // Set inital selected input in theme selector
        themeSelectors.each((_, input) => {
            input.checked = input.value === defaultTheme;
        });

        DomHandler._setThemeColors(defaultTheme);

        themeSelectors.click(e => {
            const theme = e.target.value;
            if (theme === styling.theme) {
                return;
            }

            callBack(theme);
        });
    }

    /**
     * Set theme color for theme selector and descriptions board
     * @param {string} theme name of the selected theme
     */
    static _setThemeColors(theme) {

        if (theme === Stylings.DARK_THEME) {
            $('#content').addClass("dark-theme");
        } else {
            $('#content').removeClass("dark-theme");
        }

        DomHandler._setDescription(theme);
    }

    /**
     * Generate color indicators in the description board.
     * The indicators map colors to distance ranges
     * @param {string} theme name of the theme
     */
    static _setDescription(theme) {
        const categoryDescription = Stylings.CATEGORY_NAMES_IN_DESC_ORDER.map((categoryName, index) => {
            const minDistance = Stylings.MIN_DISTANCE[categoryName];
            const prevMinDistance = index >= 1 ? Stylings.MIN_DISTANCE[Stylings.CATEGORY_NAMES_IN_DESC_ORDER[index - 1]] : "";
            const backgroundColor = Stylings.COLORS[categoryName][theme];

            return `
            <div class="category">
                <div class="color-indicator" id="${categoryName}" style="background-color: ${backgroundColor}"></div>
                <div class="description">
                    ${index > 0 ? `${minDistance} - ${prevMinDistance}` : `>= ${minDistance}`}
                </div>
            </div>
            `;
        }).join("");

        const header = `<h4 class="title">Min distance (km)</h4>`;

        $('#description').html(header + categoryDescription);
    }

    /**
     * Listen and react to changes event when different route category is highlighted
     * @param {*} styling style instance 
     * @param {*} callBack callback to execute when highlighted category is changed
     */
    static _highlightedRoutesOnChange(styling, callBack) {
        $('#reset-button').hide();

        $('#description').on('mouseenter', '.color-indicator', e => {
            $('#reset-button').show(200);
            const category = e.target.id;
            if (category === styling.highLightedCategory) {
                return;
            }
            callBack(category);
        });

        $('#reset-button').click(() => {
            $('#reset-button').hide(200);
            callBack();
        });
    }

    /**
     * Change theme colors
     * @param {*} theme name of the selected theme
     * @param {*} styling style instance
     * @param {*} mapWrapper map wrapper instance
     */
    static _changeTheme(theme, styling, mapWrapper) {
        DomHandler._setThemeColors(theme);
        styling.theme = theme;
        mapWrapper.changeTheme(theme);
    }

    /**
     * Change highlighted routes
     * @param {*} category name of the highlighted distance category
     * @param {*} styling  style instance
     * @param {*} mapWrapper map wrapper instance
     */
    static _changeHighLightedRoutes(category, styling, mapWrapper) {
        styling.highLightedCategory = category;
        mapWrapper.highLightLines();
    }
}