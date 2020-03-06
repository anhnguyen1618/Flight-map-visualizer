import $ from 'jquery';

import { Stylings } from './stylings.js';
import { DataProcessor } from './data-processor.js';
import { MapWrapper } from './map-wrapper.js';
import { ThemeSelector } from './theme-selector.js';

import '../styles/index.css';

const CAPITAL_JSON_URL = '/capitals';

function runApp() {
    const styling = new Stylings();

    const dataProcessor = new DataProcessor(CAPITAL_JSON_URL, styling);

    const mapWrapper = new MapWrapper(styling, dataProcessor);

    ThemeSelector.themeChange(styling, mapWrapper.changeTheme.bind(mapWrapper));
}

$(document).ready(() => {
    runApp();
})


