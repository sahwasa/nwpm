// load packages
const { src, dest, lastRun, watch, series, parallel } = require("gulp"),
      gulpInc = require("gulp-file-include"),
      merge = require('merge-stream'),            // 여러 스트림 병합
      concat = require("gulp-concat"),                  // 파일 병합
      imgmin = require("gulp-imagemin"),                // 이미지압축
      sass = require('gulp-sass')(require('sass')),     // scss 컴파일
      newer = require("gulp-newer"),                    // dist 폴더의 결과물보다 최신의 timestamp를 가진 경우만 실행
      del = require('del'),
      bs = require("browser-sync").create();            // browser-sync 호출, create 메서드로 생성을 먼저 해줘야 함(브라우저 자동 *refresh 어플리케이션)

// babel = require("gulp-babel"),                    // js 컴파일
//sourcemaps = require('gulp-sourcemaps'),          // 소스맵생성.gulp 4.0이상부턴 필요 x
//const autoprefixer = require('gulp-autoprefixer');      // css prefix
//const gcmq = require("gulp-group-css-media-queries");   // 중복되는 mediaquery 구문 merge
//const cleanCSS = require('gulp-clean-css');             // css minify -> gcmq 사용 시 sass outputStyle이 적용이 안되므로 css compressed를 위해 추가

const dev = "dev";
const dist = "dist";

// 작업용 폴더 파일 path
const path = {
  html:dev + "/**/*.html",
  scss: dev + "/**/css/*.scss",
  js: dev + "/**/js/*.js",
  images: dev + "/**/images/*"
};

// js, scss concat(병합) 시 파일 이름 지정
var mergefileName = {
    style: "merge.css",
    //javascript: "merge.js"
};

// browser-sync index file
const browserSyncFileName = "/html/login.html";

// 배포 시 삭제할 폴더
const cleanPaths = [
  dist + '/**/temp' 
];

// task start
function inc(){
  return merge(
    src(path.html)
    .pipe(gulpInc({
      prefix : '@@',
      basepath : '@file'
    }))
    .pipe(dest(dist + '/'))
    .pipe(bs.stream())
  )
}
function imgMin(){
  return src(path.images,)
  .pipe(newer(dist + "/"))
  .pipe(imgmin())
  .pipe(dest(dist + '/'))
  .pipe(bs.stream())
}
// scss options
var scssOptions = {
  outputStyle : "expanded",// nested, expanded, compact, compressed
  indentType : "tab",// 들여쓰기 space, tab
  indentWidth : 1,// 들여쓰기 갯수 / default: 2  
  sourceComments: false // 컴파일 된 css에 원본 소스이 위치와 줄 수 주석 표시
}

function scss(){
  return merge(
    src([path.scss], {sourcemaps: true })
    //.pipe(concat(mergefileName.style))
    .pipe(sass(scssOptions).on('error', sass.logError))
    //.pipe(sourcemaps.write('/maps'))
    .pipe(dest(dist + '/',{ sourcemaps: true }))
    .pipe(bs.stream())
  )
}
function js(){
  return merge(
    src(path.js)
    //.pipe(babel())
    .pipe(dest(dist + '/'))
    .pipe(bs.stream())
  )
}
function setBs(){
  bs.init({
    server :{
      baseDir : 'dist/',
      index: browserSyncFileName
    }
  });
}
function watchs(){  
  watch(path.html, inc);
  watch(path.images, imgMin);
  watch(path.js, js);
  watch(path.scss, scss);  
}
  

// dist 폴더 정리
function clean(cd){
  return del(cleanPaths,cd).then(paths => {
    console.log('Deleted files and folders:\n', paths.join('\n'));
  });
};

/* 
 * ==============================
 * gulp 실행
 * Command Line Texting -> watch: gulp, build: gulp build
 * series 함수는 Task를 순차적으로 실행
 * parallel 함수는 Task를 병렬로 실행
 * ==============================
*/


module.exports = {
  default:series(clean, inc, parallel(js,scss,imgMin), parallel(watchs, setBs)),
  watch:parallel(watchs, setBs),
  build:series(clean, parallel(inc,js,scss,imgMin)),
  clean : clean,
  inc : inc,
  js : js,
  scss : scss,
  imgMin : imgMin,
  setBs : setBs,
};