webpackJsonp([2,3],{

/***/ "1Q41":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "2twT":
/***/ (function(module, exports, __webpack_require__) {

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_react__ = __webpack_require__("U7vG");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_react___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_react__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_purecss__ = __webpack_require__("c5m/");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_purecss___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_purecss__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__main_css__ = __webpack_require__("1Q41");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__main_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__main_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__component__ = __webpack_require__("YL6N");





let demoComponent = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__component__["default"])();

document.body.appendChild(demoComponent);

// HMR interface
if(true) {
  // Capture hot update
  module.hot.accept("YL6N", function(__WEBPACK_OUTDATED_DEPENDENCIES__) { /* harmony import */ __WEBPACK_IMPORTED_MODULE_3__component__ = __webpack_require__("YL6N"); (() => {
    // We have go through CommonJS here and capture the
    // default export explicitly!
    const nextComponent = __webpack_require__("YL6N").default();

    // Replace old content with the hot loaded one
    document.body.replaceChild(nextComponent, demoComponent);

    demoComponent = nextComponent;
  })(__WEBPACK_OUTDATED_DEPENDENCIES__); });
}

/***/ }),

/***/ "YL6N":
/***/ (function(module, exports, __webpack_require__) {

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* harmony default export */ exports["default"] = function () {
  const element = document.createElement('h1');

  element.className = 'pure-button';
  element.innerHTML = 'Hello world';
  element.onclick = () => {
    __webpack_require__.e/* import() */(0).then(__webpack_require__.bind(null, "co9Y")).then((lazy) => {
      element.textContent = lazy.default;
    }).catch((err) => {
      console.error(err);
    });
  };

  return element;
};

/***/ }),

/***/ "c5m/":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })

},["2twT"]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9hcHAvbWFpbi5jc3MiLCJ3ZWJwYWNrOi8vLy4vYXBwL2luZGV4LmpzIiwid2VicGFjazovLy8uL2FwcC9jb21wb25lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9wdXJlY3NzL2J1aWxkL3B1cmUtbWluLmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHlDOzs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSCxDOzs7Ozs7Ozs7QUN0QkE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0EsQzs7Ozs7OztBQ2RBLHlDIiwiZmlsZSI6ImFwcC4xNzQ2NzFmMzFkM2U4YzBmZDM5Zi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHJlbW92ZWQgYnkgZXh0cmFjdC10ZXh0LXdlYnBhY2stcGx1Z2luXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9hcHAvbWFpbi5jc3Ncbi8vIG1vZHVsZSBpZCA9IDFRNDFcbi8vIG1vZHVsZSBjaHVua3MgPSAyIiwiaW1wb3J0ICdyZWFjdCc7XG5pbXBvcnQgJ3B1cmVjc3MnO1xuaW1wb3J0ICcuL21haW4uY3NzJztcbmltcG9ydCBjb21wb25lbnQgZnJvbSAnLi9jb21wb25lbnQnO1xuXG5sZXQgZGVtb0NvbXBvbmVudCA9IGNvbXBvbmVudCgpO1xuXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRlbW9Db21wb25lbnQpO1xuXG4vLyBITVIgaW50ZXJmYWNlXG5pZihtb2R1bGUuaG90KSB7XG4gIC8vIENhcHR1cmUgaG90IHVwZGF0ZVxuICBtb2R1bGUuaG90LmFjY2VwdCgnLi9jb21wb25lbnQnLCAoKSA9PiB7XG4gICAgLy8gV2UgaGF2ZSBnbyB0aHJvdWdoIENvbW1vbkpTIGhlcmUgYW5kIGNhcHR1cmUgdGhlXG4gICAgLy8gZGVmYXVsdCBleHBvcnQgZXhwbGljaXRseSFcbiAgICBjb25zdCBuZXh0Q29tcG9uZW50ID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKS5kZWZhdWx0KCk7XG5cbiAgICAvLyBSZXBsYWNlIG9sZCBjb250ZW50IHdpdGggdGhlIGhvdCBsb2FkZWQgb25lXG4gICAgZG9jdW1lbnQuYm9keS5yZXBsYWNlQ2hpbGQobmV4dENvbXBvbmVudCwgZGVtb0NvbXBvbmVudCk7XG5cbiAgICBkZW1vQ29tcG9uZW50ID0gbmV4dENvbXBvbmVudDtcbiAgfSk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9hcHAvaW5kZXguanNcbi8vIG1vZHVsZSBpZCA9IDJ0d1Rcbi8vIG1vZHVsZSBjaHVua3MgPSAyIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKCkge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcblxuICBlbGVtZW50LmNsYXNzTmFtZSA9ICdwdXJlLWJ1dHRvbic7XG4gIGVsZW1lbnQuaW5uZXJIVE1MID0gJ0hlbGxvIHdvcmxkJztcbiAgZWxlbWVudC5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGltcG9ydCgnLi9sYXp5JykudGhlbigobGF6eSkgPT4ge1xuICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGxhenkuZGVmYXVsdDtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9hcHAvY29tcG9uZW50LmpzXG4vLyBtb2R1bGUgaWQgPSBZTDZOXG4vLyBtb2R1bGUgY2h1bmtzID0gMiIsIi8vIHJlbW92ZWQgYnkgZXh0cmFjdC10ZXh0LXdlYnBhY2stcGx1Z2luXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3B1cmVjc3MvYnVpbGQvcHVyZS1taW4uY3NzXG4vLyBtb2R1bGUgaWQgPSBjNW0vXG4vLyBtb2R1bGUgY2h1bmtzID0gMiJdLCJzb3VyY2VSb290IjoiIn0=