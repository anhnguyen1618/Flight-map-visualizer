import $ from 'jquery';
import { Stylings } from './stylings.js';

export class ThemeSelector {
    static themeChange(styling, callBack) {
        const themeSelectors = $('#menu input');

        themeSelectors.each((_, input) => {
            input.checked = input.value === styling.getTheme();
        });

        this.setDescription(styling.getTheme());

        themeSelectors.click(e => {
            const theme = e.target.value;
            if (theme === styling.getTheme()) {
                return;
            }

            this.setDescription(theme);
            styling.setTheme(theme);

            callBack(theme);
        });
    }

    static setDescription(theme) {
        const categoryDescription = Stylings.CATEGORY_NAMES_IN_DESC_ORDER.map((name, index) => {
            const minDistance = Stylings.MIN_DISTANCE[name];
            const prevMinDistance = index >= 1 ? Stylings.MIN_DISTANCE[Stylings.CATEGORY_NAMES_IN_DESC_ORDER[index - 1]] : "";
            return `
            <div class="category">
                <div class="color-indicator" style="background-color: ${Stylings.COLORS[name][theme]}"></div>
                <div class="description">
                    ${index > 0 ? `${minDistance} - ${prevMinDistance}` : `>= ${minDistance}`}
                </div>
            </div>
            `;
        }).join("");

        const header = `<h4 class="title">Min distance (km)</h4>`;

        $('#description').html(header + categoryDescription);
    }
}