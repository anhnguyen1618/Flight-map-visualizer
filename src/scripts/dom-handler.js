import $ from 'jquery';
import { Stylings } from './stylings.js';

export class DomHandler {

    static subscribeAndReactToStyleChanges = (styling, mapWrapper) => () => {
        DomHandler.themeOnChange(styling, theme => DomHandler._changeTheme(theme, styling, mapWrapper));

        DomHandler._highlightedRoutesOnChange(styling, (category) => {
            DomHandler._changeHighLightedRoutes(category, styling, mapWrapper)
        });
    }


    static themeOnChange(styling, callBack) {
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

    static _setThemeColors(theme) {

        if (theme === Stylings.DARK_THEME) {
            $('#content').addClass("dark-theme");
        } else {
            $('#content').removeClass("dark-theme");
        }

        DomHandler._setDescription(theme);
    }

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

    static _highlightedRoutesOnChange(styling, callBack) {
        $('#reset-button').hide();

        $('#description').on('mouseenter', '.color-indicator', e => {
            $('#reset-button').show(200);
            const category = e.target.id;
            if (category === styling.highLightedCategory) {
                return;
            }
            callBack(category);
        })

        $('#reset-button').click(_ => {
            $('#reset-button').hide(200);
            callBack();
        })
    }

    static _changeTheme(theme, styling, mapWrapper) {
        DomHandler._setThemeColors(theme);
        styling.theme = theme;
        mapWrapper.changeTheme(theme);
    }

    static _changeHighLightedRoutes(category, styling, mapWrapper) {
        styling.highLightedCategory = category;
        mapWrapper.highLightLines();
    }
}