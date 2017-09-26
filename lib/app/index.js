const Core = require('./core');
const createStore = require('./store');
const error = require('../components/error');
const { setLocale } = require('../locale');
const { parse, extend } = require('../params');

const app = module.exports = new Core({ parse });

const routes = [
  [ extend('/'), require('../views/home') ],
  [ extend('/:goal(\\d{1,2}):slug(-[-\\w]+)?'), require('../views/goal') ],
  [ extend('/404'), error.create(404) ],
  [ extend('/error'), error.create(500) ],
  [ extend('/:page'), require('../views/page') ],
  [ extend('/*'), error.create(404) ]
];

routes.map(localize).forEach(([route, view]) => app.route(route, view));

/**
 * Read initial state from DOM and create app state models
 */

let initialState = {};
if (typeof window !== 'undefined') {
  const src = document.querySelector('.js-initialState');
  initialState = JSON.parse(src.innerText);
  src.parentElement.removeChild(src);
}

app.use(createStore(initialState));

/**
 * Start application when running in browser
 */

if (typeof window !== 'undefined') {
  try {
    app.mount('.js-view');
  } catch (err) {
    document.documentElement.classList.remove('has-js');
  }
}

function localize([route, view]) {
  return [route, (state, emit) => {
    setLocale(state.lang);
    return view(state, emit);
  }];
}
