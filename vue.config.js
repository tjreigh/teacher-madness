/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { merge } = require('webpack-merge');

const srcDir = path.resolve(__dirname, 'src');
const webDir = path.resolve(srcDir, 'web');

const utilDir = path.resolve(__dirname, srcDir, 'util');
const storeDir = path.resolve(__dirname, srcDir, webDir, 'stores');
const typesDir = path.resolve(__dirname, srcDir, 'types');

const includePaths = [webDir, utilDir, storeDir, typesDir];

// Safely check env string
const isDevEnv = process.env.NODE_ENV.trim().substring(0, 3).toLowerCase() === 'dev';

const webpackConfig = {
	base: {
		mode: 'production',
		entry: path.resolve(__dirname, webDir, 'main.ts'),
		devtool: 'hidden-source-map',
		// output: {
		// 	path: path.join(__dirname, 'dist'),
		// 	filename: 'bundle.js',
		// },
		resolve: {
			roots: [srcDir],
			modules: [srcDir],
			alias: {
				'@web': webDir,
				'@util': path.resolve(__dirname, srcDir, 'util'),
				'@store': path.resolve(__dirname, webDir, 'stores'),
				'@typings': path.resolve(__dirname, srcDir, 'types'),
			},
		},
	},
	dev: {
		mode: 'development',
		devtool: 'eval-cheap-module-source-map',
	},
};

const configureWebpack = isDevEnv
	? merge(webpackConfig.base, webpackConfig.dev)
	: webpackConfig.base;

module.exports = {
	outputDir: path.join(__dirname, 'dist'),
	//publicPath: path.resolve(__dirname, webDir, 'public'),
	configureWebpack,
	chainWebpack: config => {
		// prettier-ignore
		config.module
			.rule('ts')
				.include.clear().add(includePaths).end()
				.exclude.add([/node_modules/, /src\/api/]).end()
				.use('thread-loader')
					.loader('thread-loader')
					.before('cache-loader')
					.end()
				.use('ts-loader')
					.tap(options =>
						merge(options, {
							happyPackMode: true,
						})
					)
					.end()

		config.plugin('html').tap(options => {
			options[0].title = 'Humans of Legacy';
			options[0].template = path.resolve(__dirname, srcDir, webDir, 'public', 'index.html');
			return options;
		});

		config.plugin('fork-ts-checker').use(require('fork-ts-checker-webpack-plugin'), [
			{
				typescript: {
					diagnosticOptions: {
						semantic: true,
						syntactic: true,
					},
				},
				eslint: {
					files: './src/**/*.{ts,vue}',
				},
			},
		]);
	},
	css: {
		loaderOptions: {
			postcss: {
				plugins: [require('autoprefixer')],
			},
		},
	},
	devServer: {
		contentBase: path.resolve(__dirname, 'dist'),
		hot: true,
		watchOptions: {
			poll: 1000,
			aggregateTimeout: 5000,
			ignored: ['node_modules/**', 'src/api/**'],
		},
		compress: true,
		port: 8080,
		clientLogLevel: 'info',
	},
};
