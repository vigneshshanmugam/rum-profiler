module.exports = {
  target: "server",
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    const TerserPlugin = config.optimization.minimizer[0];
    if (TerserPlugin.options.terserOptions) {
      TerserPlugin.options.terserOptions["keep_fnames"] = true;
    }
    return config;
  }
};
