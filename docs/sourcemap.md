
Sourcemap task
--------------

The `sourcemap` task needs to know where to locate the Closure Compiler
compiler.jar file. You can download this file here:

    http://closure-compiler.googlecode.com/files/compiler-latest.zip

and save it wherever you like.

You'll next need to setup the path where compiler.jar in grunt's
config('compiler') value:

    grunt.initConfig({
      compiler: '/path/to/compiler-latest/compiler.jar',
      ...
    });

or setup the `$H5BP_COMPILER` environment variable:

    export H5BP_COMPILER=/path/to/compiler-latest/compiler.jar

The task will look into grunt's configuration before searching for
`$H5BP_COMPILER`

