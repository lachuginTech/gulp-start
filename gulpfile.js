const {src, dest, watch, parallel, series} = require('gulp');

const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default; 
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const clean = require('gulp-clean');
const avif = require('gulp-avif');
const webp = require('gulp-webp');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const fonter = require('gulp-fonter');
const ttf2woff2 = require('gulp-ttf2woff2');
const svgSprite = require('gulp-svg-sprite');
const include = require('gulp-include');

// Обработка HTML страниц
function pages() {
  return src('app/pages/*.html') // исходные HTML файлы
    .pipe(include({
      includePaths: 'app/components' // пути для включаемых файлов
    }))
    .pipe(dest('app')) // сохраняем обработанные файлы
    .pipe(browserSync.stream()) // обновляем браузер
}

// Обработка шрифтов
function fonts() {
  return src('app/fonts/src/*.*') // исходные шрифты
    .pipe(fonter({
      formats: ['woff', 'ttf'] // конвертация в форматы woff и ttf
    }))
    .pipe(src('app/fonts/*.ttf')) // выбираем ttf файлы
    .pipe(ttf2woff2()) // конвертация ttf в woff2
    .pipe(dest('app/fonts')) // сохраняем обработанные файлы
}

// Обработка изображений
function images(){
  return src(['app/images/src/*.*', '!app/images/src/*.svg']) // исходные изображения, кроме SVG
    .pipe(newer('app/images')) // обрабатываем только новые файлы
    .pipe(avif({ quality : 50})) // конвертация в формат AVIF

    .pipe(src('app/images/src/*.*')) // повторно выбираем исходные файлы
    .pipe(newer('app/images')) // обрабатываем только новые файлы
    .pipe(webp()) // конвертация в формат WebP

    .pipe(src('app/images/src/*.*')) // повторно выбираем исходные файлы
    .pipe(newer('app/images')) // обрабатываем только новые файлы
    .pipe(imagemin()) // сжатие изображений

    .pipe(dest('app/images')) // сохраняем обработанные файлы
}

// Создание SVG спрайтов
function sprite () {
  return src('app/images/*.svg') // исходные SVG файлы
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: '../sprite.svg', // имя файла спрайта
          example: true // создаем пример
        }
      }
    }))
    .pipe(dest('app/images')) // сохраняем спрайт
}

// Обработка JavaScript
function scripts() {
  return src([
    'app/js/main.js', // исходный JavaScript файл
  ])
    .pipe(concat('main.min.js')) // объединяем в один файл
    .pipe(uglify()) // минифицируем JavaScript
    .pipe(dest('app/js')) // сохраняем файл
    .pipe(browserSync.stream()) // обновляем браузер
}

// Обработка стилей
function styles() {
  return src('app/scss/style.scss') // исходные SASS файлы
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 version']})) // добавляем префиксы
    .pipe(concat('style.min.css')) // объединяем в один файл
    .pipe(scss({ outputStyle: 'compressed' })) // компилируем и минифицируем SASS в CSS
    .pipe(dest('app/css')) // сохраняем файл
    .pipe(browserSync.stream()) // обновляем браузер
}

// Наблюдение за изменениями в файлах
function watching() {
  browserSync.init({
    server: {
      baseDir: "app/" // корневая папка сервера
    }
  });
  watch(['app/scss/style.scss'], styles) // наблюдаем за изменениями в SASS файлах
  watch(['app/images/src'], images) // наблюдаем за изменениями в изображениях
  watch(['app/js/main.js'], scripts) // наблюдаем за изменениями в JavaScript
  watch(['app/components/*', 'app/pages/*'], pages) // наблюдаем за изменениями в HTML компонентах и страницах
  watch(['app/*.html']).on('change', browserSync.reload); // обновляем браузер при изменении HTML
}

// Очистка папки dist
function cleanDist() {
  return src('dist')
    .pipe(clean()) // удаляем содержимое папки dist
}

// Сборка проекта
function building() {
  return src([
    'app/css/style.min.css', // стили
    '!app/images/**/*.html', // исключаем HTML файлы
    'app/images/*.*', // изображения
    '!app/images/*.svg', // исключаем SVG файлы
    'app/images/sprite.svg', // включаем спрайты
    'app/fonts/*.*', // шрифты
    'app/js/main.min.js', // JavaScript
    'app/**/*.html' // HTML файлы
  ], {base : 'app'}) // сохраняем структуру папок
    .pipe(dest('dist')) // сохраняем файлы в папке dist
}

// Экспортируем функции для использования в командной строке
exports.styles = styles;
exports.images = images;
exports.fonts = fonts;
exports.pages = pages;
exports.building = building;
exports.sprite = sprite;
exports.scripts = scripts;
exports.watching = watching;

// Команда для сборки проекта
exports.build = series(cleanDist, building);
// Команда по умолчанию для разработки
exports.default = parallel(styles, images, scripts, pages, watching);
