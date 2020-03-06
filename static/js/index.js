import { Stylings } from './stylings.js';
import { DataProcessor } from './data-processor.js';
import { capitalsData } from './captitals.js';
import { MapWrapper } from './map-wrapper.js';
import { ThemeSelector } from './theme-selector.js';


function runApp() {
    const styling = new Stylings();

    const dataProcessor = new DataProcessor(capitalsData, styling);

    const mapWrapper = new MapWrapper(styling, dataProcessor);

    mapWrapper.initMap();

    ThemeSelector.themeChange(styling, mapWrapper.changeTheme.bind(mapWrapper));
}

$(document).ready(() => {
    runApp();
})


