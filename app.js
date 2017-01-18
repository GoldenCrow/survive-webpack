webpackJsonp([1],{

/***/ 2:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* harmony default export */ exports["default"] = function () {
  const element = document.createElement('h1');

  element.className = 'pure-button';
  element.innerHTML = 'Hello world';
  element.onclick = () => {
    __webpack_require__.e/* import() */(0).then(__webpack_require__.bind(null, 36)).then((lazy) => {
      element.textContent = lazy.default;
    }).catch((err) => {
      console.error(err);
    });
  };

  return element;
};

/***/ }),

/***/ 20:
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ 21:
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ 34:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_react__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_react___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_react__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_purecss__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_purecss___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_purecss__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__main_css__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__main_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__main_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__component__ = __webpack_require__(2);





let demoComponent = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__component__["default"])();

document.body.appendChild(demoComponent);

// HMR interface
if(true) {
  // Capture hot update
  module.hot.accept(2, function(__WEBPACK_OUTDATED_DEPENDENCIES__) { /* harmony import */ __WEBPACK_IMPORTED_MODULE_3__component__ = __webpack_require__(2); (() => {
    // We have go through CommonJS here and capture the
    // default export explicitly!
    const nextComponent = __webpack_require__(2).default();

    // Replace old content with the hot loaded one
    document.body.replaceChild(nextComponent, demoComponent);

    demoComponent = nextComponent;
  })(__WEBPACK_OUTDATED_DEPENDENCIES__); });
}

/***/ })

},[34]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9hcHAvY29tcG9uZW50LmpzIiwid2VicGFjazovLy8uL2FwcC9tYWluLmNzcyIsIndlYnBhY2s6Ly8vLi9+L3B1cmVjc3MvYnVpbGQvcHVyZS1taW4uY3NzIiwid2VicGFjazovLy8uL2FwcC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0EsQzs7Ozs7OztBQ2RBLHlDOzs7Ozs7O0FDQUEseUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsR0FBRztBQUNILEMiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKCkge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcblxuICBlbGVtZW50LmNsYXNzTmFtZSA9ICdwdXJlLWJ1dHRvbic7XG4gIGVsZW1lbnQuaW5uZXJIVE1MID0gJ0hlbGxvIHdvcmxkJztcbiAgZWxlbWVudC5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGltcG9ydCgnLi9sYXp5JykudGhlbigobGF6eSkgPT4ge1xuICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGxhenkuZGVmYXVsdDtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9hcHAvY29tcG9uZW50LmpzXG4vLyBtb2R1bGUgaWQgPSAyXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHJlbW92ZWQgYnkgZXh0cmFjdC10ZXh0LXdlYnBhY2stcGx1Z2luXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9hcHAvbWFpbi5jc3Ncbi8vIG1vZHVsZSBpZCA9IDIwXG4vLyBtb2R1bGUgY2h1bmtzID0gMSIsIi8vIHJlbW92ZWQgYnkgZXh0cmFjdC10ZXh0LXdlYnBhY2stcGx1Z2luXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3B1cmVjc3MvYnVpbGQvcHVyZS1taW4uY3NzXG4vLyBtb2R1bGUgaWQgPSAyMVxuLy8gbW9kdWxlIGNodW5rcyA9IDEiLCJpbXBvcnQgJ3JlYWN0JztcbmltcG9ydCAncHVyZWNzcyc7XG5pbXBvcnQgJy4vbWFpbi5jc3MnO1xuaW1wb3J0IGNvbXBvbmVudCBmcm9tICcuL2NvbXBvbmVudCc7XG5cbmxldCBkZW1vQ29tcG9uZW50ID0gY29tcG9uZW50KCk7XG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGVtb0NvbXBvbmVudCk7XG5cbi8vIEhNUiBpbnRlcmZhY2VcbmlmKG1vZHVsZS5ob3QpIHtcbiAgLy8gQ2FwdHVyZSBob3QgdXBkYXRlXG4gIG1vZHVsZS5ob3QuYWNjZXB0KCcuL2NvbXBvbmVudCcsICgpID0+IHtcbiAgICAvLyBXZSBoYXZlIGdvIHRocm91Z2ggQ29tbW9uSlMgaGVyZSBhbmQgY2FwdHVyZSB0aGVcbiAgICAvLyBkZWZhdWx0IGV4cG9ydCBleHBsaWNpdGx5IVxuICAgIGNvbnN0IG5leHRDb21wb25lbnQgPSByZXF1aXJlKCcuL2NvbXBvbmVudCcpLmRlZmF1bHQoKTtcblxuICAgIC8vIFJlcGxhY2Ugb2xkIGNvbnRlbnQgd2l0aCB0aGUgaG90IGxvYWRlZCBvbmVcbiAgICBkb2N1bWVudC5ib2R5LnJlcGxhY2VDaGlsZChuZXh0Q29tcG9uZW50LCBkZW1vQ29tcG9uZW50KTtcblxuICAgIGRlbW9Db21wb25lbnQgPSBuZXh0Q29tcG9uZW50O1xuICB9KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL2FwcC9pbmRleC5qc1xuLy8gbW9kdWxlIGlkID0gMzRcbi8vIG1vZHVsZSBjaHVua3MgPSAxIl0sInNvdXJjZVJvb3QiOiIifQ==