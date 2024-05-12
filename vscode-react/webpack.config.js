const path = require("node:path");

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
    extensions: [".js", ".ts", ".tsx", ".json", ".css"]
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: "ts-loader",
        options: {}
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
