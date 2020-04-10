# Flight map visualization

## Technologies:
1. [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) - Library to render map on browser using Web GL
2. [Turf.js](https://turfjs.org/) - Library to calculate great-circles distance
3. [Arc.js](https://github.com/springmeyer/arc.js/) - Library to calculate arc points using great-circles distance
3. [Jquery](https://jquery.com/) - JavaScript library to handle HTML interaction  
4. [Jest](https://jestjs.io/) - Unit test library
5. [Flask](https://palletsprojects.com/p/flask/) - Python server framework
6. Heroku - Free cloud hosting
7. [Docker](https://www.docker.com/) - Linux container for development

## Demo: 
Heroku demo: [Click here](https://flight-map-visualizer.herokuapp.com/)

## Functionality:
1. The map is rendered using `Mapbox GL JS`.
2. The map displays arc lines connecting every capital to Helsinki using `greate-circle distance`.
3. The map with style highlights for better data visualization. Read `Instructions.pdf` for more details.
4. The lines are colored based on distances.
5. The popup with route's distance is shown when the line is **hovered** on.
6. The feature "All flights lead to any city" is implemented by `clicking` into the `air plane` markers(representing capitals). All lines that connect to that **clicked** city.

## General design:

1. The capital data is stored in the file `capitals.json` from [this source](http://techslides.com/list-of-countries-and-capitals). It is served to the front-end by a simple Flask server in `index.py`.

2. The front-end code is stored in `./src` directory. Front-end code has 5 main parts: 
    * **Fetching and transform data to correct format** is done in `src/scripts/data-processor.js`
    * **Controlling mapbox GL** is done in `src/scripts/map-wrapper.js`
    * **Handling stylings, theme** is done in `src/scripts/stylings.js`
    * **Handling HTML DOM element** is done in `src/scripts/dom-handler`
    * **Gluing everything together** is in `src/scripts/index.js`

3. Docker and docker-compose is used for development. Running `webpack-dev-server` in one container and `flask` server in another.

## Project structure:

```bash
mapbox/
└─── docker-files/          # Docker files for front-end and back-end
└─── static/                # Folder to store the built css, js to be served by Flask
└─── templates/             # Html served by Flask
└─── index.py               # Python server
└─── capitals.json          # JSON capital data
└─── .babelrc               # Config for JavaScript ES6 transpiler
└─── .eslintrc              # Config for JavaScript linter
└─── webpack.config.js      # Config for hot reload development server, package builder
└─── package.json           # Package manager config for Javascript project
└─── requirements.txt       # Package list for Python
└─── ProcFile               # Heroku scripts
└─── run                    # Script to execute unit test, lint inside Docker container
└─── Instructions.pdf       # INTRUCTION ON HOW TO USE THE PRODUCT
│
└─── src/scripts/           # Main scripts
    │
    └─── index.js           # Entry point of the app
    └─── data-processor.js  # Fetch data and transform data to GEOJSON format
    └─── map-wrapper.js     # Encapsulate mapbox-gl-js instance and controll the map
    │
    └─── stylings.js        # Handle styling, theme changes
    └─── dom-handler.js     # Handle HTML DOM events
    └─── constants.js       # Constants such as API key...
    └─── utils.js           # Helper functions
    └─── __tests__/         # Unit tests
```

## Installations:

Choose either of the listed methods below(Preferably the first method)

* **USING docker and docker-compose**: Running development servers (with hot reload) 
    1. Installing docker ([Linux](https://cwiki.apache.org/confluence/pages/viewpage.action?pageId=94798094), [MacOs](https://runnable.com/docker/install-docker-on-macos),[Window](https://www.sitepoint.com/docker-windows-10-home/))
    2. Start front-end and back-end development server by the command:
    ```bash
        docker-compose up
    ```
    3. Open browser with the address `http://127.0.0.1:8080/` to see the result. Make sure that port `8080` is available
    4. Add execution permission for the script `run`:
    ```bash
        chmod +x run
    ```
    5. To run unit test, use the command:
    ```bash
        ./run test
    ```
    6. To run unit test, user the command:
    ```bash
        ./run lint
    ```
    7. To build package for production deployment, in which the built files `main.js`, `runtime.js`, `vendor.js` are built into `/static` directory.
    ```bash
        ./run build
    ```


* **Installing in your own machine**
    1. Install `node` and `npm`. Check [here](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04).
    2. Install `python` and `pip`. Check [here](https://linuxize.com/post/how-to-install-pip-on-ubuntu-18.04/)
    3. Install front-end dependencies:
    ```bash
        npm install
    ```
    4. Install back-end dependencies:
    ```bash
        pip install -r ./requirements.txt
    ```
    5. Run back-end development server:
    ```bash
        python index.py
    ```
    6. Run front-end development server on another terminal tab:
    ```bash
        npm run dev
    ```
    7. Open browser with the address `http://127.0.0.1:8080/` to see the result. Make sure that port `8080` is available
    8. Run unit tests:
    ```bash
        npm test
    ```
    9. Run lint:
    ```bash
        npm run lint
    ```
    10. Build production:
    ```bash
        npm run build
    ```
