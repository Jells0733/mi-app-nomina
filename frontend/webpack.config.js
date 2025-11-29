const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './src/main.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/', // necesario para rutas como /admin en SPA
  },
  devServer: {
    historyApiFallback: true, // permite navegación en rutas como /admin
    port: 3000,
    host: '0.0.0.0', // permite acceso desde fuera del contenedor
    open: false, // no abre navegador automáticamente en Docker
    hot: true, // recarga en caliente
    allowedHosts: 'all', // permite acceso desde cualquier host
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new Dotenv(), // ⬅️ Esto inyecta el .env en process.env
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
