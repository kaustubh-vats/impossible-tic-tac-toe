const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/script.ts",
  output: {
    filename: "script.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "src", "tsconfig.json"),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/index.html", to: "index.html" },
        { from: "src/styles.css", to: "styles.css" },
        { from: "src/public", to: ".", noErrorOnMissing: true },
        { from: "favicon.png", to: "favicon.png", noErrorOnMissing: true },
        { from: "src/assets", to: "assets", noErrorOnMissing: true },
        { from: "assets", to: "assets", noErrorOnMissing: true },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, "dist"),
      watch: true,
    },
    compress: true,
    port: 8080,
    hot: true,
    liveReload: true,
    open: true,
  },
};
