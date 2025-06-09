import path from 'node:path'

export default {
  mode: 'development',
  entry: {
    main: './src/index.tsx',
  },

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(import.meta.dirname, 'dist'),
    publicPath: '/',
  },

  devServer: {
    static: {
      directory: path.join(import.meta.dirname, 'public'),
    },
    port: 9000,
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
}
