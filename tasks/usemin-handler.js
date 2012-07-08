
var fs = require('fs'),
  path = require('path');

//
// Usemin Handler Task
// ===================
//
// Based off @necolas' idea and initial work:
//
// - https://gist.github.com/3024891
//
// > Grunt tasks to process HTML files and produce a deploy directory of
// optimized files
//
// Description
// -----------
//
// The goal of the usemin task is to consider your HTML markup as the primary
// source of information. All the path and reference to assets to optimize should
// be there, and all the necessary info for setting up the build script should be
// available.
//
// Usemin-handler task doesn't do any actual optimizations, it's job is to init
// the Grunt configuration automatically from HTML markup.
//
// Special kind of HTML comments are provided and is your main API to interract
// with the build script. These "block" comments follow the following pattern:
//
//     <!-- build:<type> <path> -->
//       ... HTML Markup, list of script / link tags.
//     <!-- endbuild -->
//
// - type: is either js or css.
// - path: is the file path of the optimized file, the target output.
//
// Internally, the task parses your HTML markup to find each of these blocks, and
// initialize for you the corresponding Grunt config for the concat / min tasks
// when `type=js`, the concat / css tasks when `type=css`.
//
// The task has even some kind of internal logic to detect the typical use of
// require.js, where you specify the main entry point of your application with
// `data-main attribute` something like:
//
//     <!-- build:js js/app.min.js -->
//     <script data-main="js/main" src="js/vendor/require.js"></script>
//     <!-- -->
//
// You don't need to specify a concat / min / css or rjs config anymore (even
// though you still can, the process won't override the initial config, just
// extend it).
//

module.exports = function(grunt) {

  // start build pattern --> <!-- build:[target] output -->
  var regbuild = /<!--\s*build:(\w+)\s*(.+)\s*-->/;

  // end build pattern -- <!-- endbuild -->
  var regend = /<!--\s*endbuild\s*-->/;


  // XXX a bit too much in a single method, create a grunt helper to pass as a forEach handler
  grunt.registerMultiTask('usemin-handler', 'Init Grunt configuration automatically from markup', function() {
    var files = grunt.file.expandFiles(this.data).map(function(filepath) {
      return {
        path: filepath,
        body: grunt.file.read(filepath)
      };
    });

    files.forEach(function(file) {
      var blocks = grunt.helper('usemin:blocks', file.body);

      Object.keys(blocks).forEach(function(dest) {
        var lines = blocks[dest].slice(1, -1),
          parts = dest.split(':'),
          type = parts[0],
          output = parts[1],
          content = lines.join('\n');

        // concat / min / css / rjs config
        var concat = grunt.config('concat') || {},
          min = grunt.config('min') || {},
          css = grunt.config('css') || {},
          rjs = grunt.config('rjs') || {};

        // parse out the list of assets to handle, and update the grunt config accordingly
        var assets = lines.map(function(tag) {
          // a bit more handling to detect data-main path instead
          var main = tag.match(/data-main=['"]([^'"]+)['"]/);
          if(main) {
            rjs.modules = (rjs.modules || []).concat({
              name: path.relative(rjs.appDir, main[1])
            });
            return main[1] + '.js';
          }

          return (tag.match(/(href|src)=["']([^'"]+)["']/) || [])[2];
        });

        // update concat config for this block
        concat[output] = assets;
        grunt.config('concat', concat);


        // update rjs config as well, as during path lookup we might have
        // updated it on data-main attribute
        grunt.config('rjs', rjs);

        // min config, only for js type block
        if(type === 'js') {
          min[output] = output;
          grunt.config('min', min);
        }

        // css config, only for css type block
        if(type === 'css') {
          css[output] = output;
          grunt.config('css', css);
        }
      });
    });
  });


  //
  // Returns an hash object of all the directives for the given html. Results is
  // of the following form:
  //
  //     {
  //        'css/site.css ':[
  //          '  <!-- build:css css/site.css -->',
  //          '  <link rel="stylesheet" href="css/style.css">',
  //          '  <!-- endbuild -->'
  //        ],
  //        'js/head.js ': [
  //          '  <!-- build:js js/head.js -->',
  //          '  <script src="js/libs/modernizr-2.5.3.min.js"></script>',
  //          '  <!-- endbuild -->'
  //        ],
  //        'js/site.js ': [
  //          '  <!-- build:js js/site.js -->',
  //          '  <script src="js/plugins.js"></script>',
  //          '  <script src="js/script.js"></script>',
  //          '  <!-- endbuild -->'
  //        ]
  //     }
  //
  grunt.registerHelper('usemin:blocks', function getBlocks(body) {
    var lines = body.replace(/\r\n/g, '\n').split(/\n/),
      block = false,
      sections = {},
      last;

    lines.forEach(function(l) {
      var build = l.match(regbuild),
        endbuild = regend.test(l);

      if(build) {
        block = true;
        sections[[build[1], build[2].trim()].join(':')] = last = [];
      }

      // switch back block flag when endbuild
      if(block && endbuild) {
        last.push(l);
        block = false;
      }

      if(block && last) {
        last.push(l);
      }
    });

    return sections;
  });
};


