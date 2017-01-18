const webpack = require('webpack');
const config = require('./webpack.config.js')('production');

webpack(config, (err, stats) => {
  if (err) {
    return console.error(err);
  }
  if(stats.hasErrors()) {
    return console.error(stats.toString('errors-only'));
  }
  console.log(stats);
});