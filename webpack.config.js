'use strict';

const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV === "development" ? "development" : "production",

    entry: './client/index.js',

    output: {
        path: path.resolve(__dirname, 'public'),
        publicPath: '/public/',
        filename: 'bundle.js'
    },

    module: {
        rules: [
          {
            test: [ /\.vert$/, /\.frag$/ ],
            use: 'raw-loader'
          }
        ]
    },

    optimization: {
        minimizer: [new TerserPlugin({
          extractComments: false,
        })],
      },

    plugins: [
        new webpack.DefinePlugin({
            'CANVAS_RENDERER': JSON.stringify(true),
            'WEBGL_RENDERER': JSON.stringify(true)
        })
    ]

};
