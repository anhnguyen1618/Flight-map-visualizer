const path = require("path");

module.exports = {
    target: 'web',
    entry: {
        app: ["./src/scripts/index.js"]
    },
    output: {
        path: path.resolve(__dirname, "static/"),
        filename: "index.js"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    devServer: {
        contentBase: path.resolve(__dirname, "templates"),
        publicPath: '/static/',
        inline: true,
        stats: 'errors-only',
        proxy: {
            '/capitals': {
                target: 'http://127.0.0.1:5000/',
                secure: false
            }
        }
    }
};