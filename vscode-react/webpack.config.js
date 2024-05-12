const path = require("node:path");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: {
    configViewer: [
      "./src/view/app/index.tsx"
    ],
  },
  output: {
    path: path.resolve(__dirname, "configViewer"),
    filename: "[name].js"
  },
  // devtool: "eval-source-map",
  devtool: "inline-source-map",
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    plugins: [new TsconfigPathsPlugin({/* options: see below */})]
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: "ts-loader",
        options: {
          configFile: path.resolve(__dirname, "./src/view/app/tsconfig.json")
        }
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader",
            options: { injectType: "styleTag" },
          },
          {
            loader: "css-loader"
          },
          {
            loader: "postcss-loader"
          }
        ]
      }
    ]
  },
  performance: {
    hints: false
  }
};
