import $ from 'jquery';

export class ThemeSelector {
    static themeChange(styling, callBack) {
        const themeSelectors = $('#menu input');
        themeSelectors.each((_, input) => {
            input.checked = input.value === styling.getTheme();
        });

        themeSelectors.click(e => {
            const theme = e.target.value;
            if (theme === styling.getTheme()) {
                return;
            }


            styling.setTheme(theme);

            callBack(theme);
        });
    }
}