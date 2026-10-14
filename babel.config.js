module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Required for WatermelonDB decorators (@field, @date, etc.)
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
  ],
};
