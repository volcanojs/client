module.exports = {
	entry: './src/index.js',
	output: {
		filename: './dist/volcano-client.js',
    library: 'volcano',
    libraryTarget: 'umd',
    umdNamedDefine: true
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				query: {
					presets: ['es2015']
				},
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
			},
		],
	},
	stats: {
			colors: true
	},
	devtool: 'source-map',
	watch: true
}
