import $ from 'jquery';
import { Stylings } from './stylings.js';

export class ThemeSelector {
    static themeChange(styling, callBack) {
        $('#menu').html(
            `
            <input id="light" type="radio" name="rtoggle" value="${Stylings.LIGHT_THEME}" />
            <label for="light">Light</label>
            <input id="dark" type="radio" name="rtoggle" value="${Stylings.DARK_THEME}" />
            <label for="dark">Dark</label>
            `
        );

        const themeSelectors = $('#menu input');

        themeSelectors.each((_, input) => {
            input.checked = input.value === styling.getTheme();
        });

        ThemeSelector.setDescription(styling.getTheme());

        themeSelectors.click(e => {
            const theme = e.target.value;
            if (theme === styling.getTheme()) {
                return;
            }

            ThemeSelector.setDescription(theme);

            callBack(theme);
        });
    }

    static setDescription(theme) {
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

    static colorHighlighterChange(styling, callBack) {
        $('#reset-button').hide();

        $('#description').on('mouseenter', '.color-indicator', e => {
            $('#reset-button').show(200);
            const category = e.target.id;
            if (category === styling.getHighLightedCategory()) {
                return;
            }
            callBack(category);
        })

        $('#reset-button').click(e => {
            $('#reset-button').hide(200);
            callBack();
        })
    }
}