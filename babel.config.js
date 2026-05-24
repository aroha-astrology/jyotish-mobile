module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // Inline NativeWind babel plugins (mirrors react-native-css-interop's babel.js
      // but omits the broken `react-native-worklets/plugin` entry that's hardcoded
      // in css-interop@0.2.3 even when worklets is unused).
      require.resolve('react-native-css-interop/dist/babel-plugin'),
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: 'react-native-css-interop',
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
