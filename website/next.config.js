module.exports = {
  target: "server",
  webpack: (config, { isServer }) => {
    if (isServer) {
      return config;
    }
    const TerserPlugin = config.optimization.minimizer[0];
    if (TerserPlugin.options.terserOptions) {
      TerserPlugin.options.terserOptions["keep_fnames"] = true;
    }
    return config;
  }
};
