const path = require("path");
const webpack = require('webpack');

module.exports = {
    target: 'web',
    entry: path.resolve(__dirname, 'src/scripts/index.js'),
    output: {
        path: path.resolve(__dirname, "static/"),
        filename: "[name].js"
    },
    optimization: {
        minimize: true,

        runtimeChunk: "single", // enable "runtime" chunk
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendor",
                    chunks: "all"
                }
            }
        }

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
        host: '0.0.0.0',
        port: 8080,
        contentBase: path.resolve(__dirname, "templates"),
        publicPath: '/static/',
        inline: true,
        hot: true,
        proxy: {
            '/capitals': {
                target: {
                    host: "back-end",
                    protocol: 'http:',
                    port: 5000
                }
            }
        }
    }
};