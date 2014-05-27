var gruntCommons = require('muzzley-grunt-commons');

module.exports = function (grunt) {
  // Get the common Grunt config object
  var commonsConfig = gruntCommons.getInitConfig(grunt);
  grunt.initConfig(commonsConfig);
  gruntCommons.setup(grunt);
};
