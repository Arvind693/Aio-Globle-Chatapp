const webpack = require("webpack");

module.exports = function override(config) {
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false, // disable the behavior for `.mjs` files
    },
  });
  const fallback = config.resolve.fallback || {};

  Object.assign(fallback, {
    zlib: require.resolve("browserify-zlib"),
    querystring: require.resolve("querystring-es3"),
    path: require.resolve("path-browserify"),
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    http: require.resolve("stream-http"),
    assert: require.resolve("assert/"),
    vm: require.resolve("vm-browserify"),
    https: false, // Explicitly disable https
    fs: false,    // Explicitly disable fs
    net: false,   // Explicitly disable net
  });

  config.resolve.fallback = fallback;

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ]);
 

  return config;
};
