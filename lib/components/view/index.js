const html = require('choo/html');
const errors = require('../error');
const { __ } = require('../../locale');
const header = require('../header');
const footer = require('../footer');
require('../focus');

const DEFAULT_TITLE = process.env.GLOBALGOALS_NAME;

/**
 * Create an application view with given view function and title. If there's an
 * error or if the view function throws, a corresponding error view will be
 * rendered in its place.
 *
 * @example
 * module.exports = view(main, title);
 *
 * function main(state, emit) {
 *   if (!state.somethingImportant) {
 *     const error = new Error('Missing important thing');
 *     error.status = 500;
 *     throw error;
 *   }
 *
 *   return html`
 *     <div>
 *       <h1>Welcome!</h1>
 *     </div>
 *   `;
 * }
 *
 * function title(state) {
 *   return 'Welcome';
 * }
 *
 * @param {function} render Render application view
 * @param {function} title Get view title
 * @returns {Element}
 */

module.exports = function createView(render, title) {
  return function view(state, emit) {
    let content, error;

    /**
     * Try render the view, falling back to appropiate error view if it throws
     */

    if (!state.error) {
      try {
        content = render(state, emit);
      } catch (err) {
        error = err;
        err.status = err.status || 500;
        content = errors[err.status](err);
        emit('track:exception', err);
      }
    } else {
      const status = errors[state.error.status] ? state.error.status : 500;
      error = state.error;
      content = errors[status](state.error);
    }

    /**
     * Set title, falling back to a default if it's missing or there's an error
     */

    if (state.error) {
      emit(state.events.DOMTITLECHANGE, composeTitle(state.error.status));
    } else if (title) {
      emit(state.events.DOMTITLECHANGE, composeTitle(title(state)));
    } else {
      emit(state.events.DOMTITLECHANGE, DEFAULT_TITLE);
    }

    const goal = state.params.goal;

    return html`
      <body class="View js-view">
        <div class="View-header" id="view-header">
          ${ !error || error.status < 500 ? header(state, emit, goal) : null }
        </div>
        ${ content }
        <div class="View-footer u-transformTarget">
          ${ !error || error.status < 500 ? footer(state) : null }
        </div>

        ${ process.env.NODE_ENV !== 'development' ? html`
          <script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default,Element.prototype.dataset,Object.entries,Array.prototype.includes,Array.prototype.find,Array.prototype.findIndex"></script>
        ` : null }
      </body>
    `;
  };
};

/**
 * Compose a title string from string or error code
 * @param {string|number} title Title string or error code
 * @return {string}
 */

function composeTitle(title) {
  switch (title) {
    case 404: return `${ __('Not found') } | ${ __(DEFAULT_TITLE) } `;
    case 500: return `${ __('An error occured') } | ${ __(DEFAULT_TITLE) } `;
    default: {
      if (typeof title === 'string') {
        return `${ title.replace(/\s+/g, ' ') } | ${ __(DEFAULT_TITLE) }`;
      }
      return __(DEFAULT_TITLE);
    }
  }
}
