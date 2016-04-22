// What we need
var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    ts = require('gulp-typescript'),
    del = require('del'),
    util = require("gulp-util");
    
 // Config and variables
 var config = {
     "server":{
         "dest":"./",
         "src": ["app.ts","controllers/**/*.ts"],
         "project": "./tsconfig.json"
     }
 };

 
 gulp.task("build", function(){
     // Log it
     util.log("Compiling server from project", util.colors.cyan(config.server.project))
     
     // Compile it
     var project = ts.createProject(config.server.project);
     var compiled = gulp.src(config.server.src, {base: "./"})
        .pipe(sourcemaps.init())
        .pipe(ts(project));
        
     return compiled.js
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(config.server.dest));
 });
 
 // Watch task
 gulp.task("watch", function(){   
     // Watch the server
     var _server = config.server.src;
     gulp.watch(_server, ["build"]);
 });

 // The default task
 gulp.task("default", ["build"], function(){});
 
 // Catch watch errors
 var catchError = function(err, taskName){
    util.log(util.colors.magenta("Oops!!"));
    this.emit("end", new util.PluginError(taskName, { showStack: true }));   
 }