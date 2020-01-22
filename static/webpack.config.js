const webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

const config = {
    entry:  {
        app: __dirname + '/js/index.jsx',
        bundle: [
            __dirname + '/css/main.css',
            __dirname + '/css/util.css'
        ]
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name].js'
    },
    resolve: {
        extensions: [".js", ".jsx", ".css"]
    },
    module: {
        rules: [
            {
                test: /\.jsx?/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader',
                })
            },
            {
                test: /\.(ico|eot|svg|ttf|woff|woff2|png|svg|jpg|gif)$/,
                use: [
			{
			loader: 'file-loader',
			options: {
					name: '[name].[ext]'

				}
			}
			]
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('[name].css'),
    ]
};

module.exports = config;
