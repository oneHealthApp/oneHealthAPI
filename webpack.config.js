// Webpack configuration for building the Node.js TypeScript API
// Uses production mode for optimizations
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = (env, argv) => {
  const mode = process.env.NODE_ENV || argv.mode || "production";
  const isProd = mode === "production";

  return {
    mode,
    entry: "./src/index.ts",
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
    },
    devtool: isProd ? false : "source-map",
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    optimization: {
      minimize: isProd,
      minimizer: [new TerserPlugin()],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          { from: "package.json", to: "." },
          { from: "prisma/schema.prisma", to: "prisma/schema.prisma", noErrorOnMissing: true }
        ]
      }),
    ],
    externals: [nodeExternals()],
    ignoreWarnings: [],
    target: "node",
  };
};
