class StyleSelector {
    static initDom(map, capitalPoints, styling) {
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
            const source = map.getSource('route');

            // automatic diff failed => force diff to false to rerender the entire map
            map.setStyle(`mapbox://styles/mapbox/${theme}`, { diff: false });

            const done = new Promise((resolve, reject) => {
                map.on('styledata', function () {
                    resolve("done");
                })
            })

            done.then(() => {
                const data = source._data;
                data.features.forEach(feature => {
                    const { distance } = feature.properties
                    feature.properties = { ...feature.properties, ...styling.getLineProperties(distance) };
                });
                addSourceAndLayers(source._data, capitalPoints);
            })
        })
    }
}