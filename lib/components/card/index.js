const html = require('choo/html');
var { asText } = require('prismic-richtext');
const { href } = require('../../params');
const { __ } = require('../../locale');

const GOAL_TAG = /^goal-(\d{1,2})$/;
const TRAILING_WORD = /\s\w+$/;

exports.card = function(state, emit, doc, opts = {}) {
  const date = new Date(doc.data.original_publication_date || doc.first_publication_date);
  const tags = doc.tags.filter(tag => GOAL_TAG.test(tag));

  return html`
    <article onclick=${ onclick } class="Card ${ Object.keys(opts).map(key => opts[key] ? `Card--${ key }` : '').join(' ') }">
      <figure class="Card-figure">
        <!-- TODO: Handle sizes -->
        ${ doc.data.image.url ? html`
          <img src="${ doc.data.image.url }" class="Card-image" alt="${ doc.data.image.alt }" />
        ` : null }
        ${ doc.data.image.copyright ? html`
          <figcaption class="Card-meta Card-meta--caption">
            ${ doc.data.image.copyright }
          </figcaption>
        ` : null }
      </figure>

      <div class="Card-content">
        ${ opts.date ? html`
          <time class="Card-meta" datetime="${ JSON.stringify(date) }">
            ${ __('Published on %s %s, %s', __(`MONTH_${ date.getMonth() }`), date.getDate(), date.getFullYear()) }
          </time>
        ` : null }

        <div class="Text ${ opts.fill ? 'Text--adaptive' : '' }">
          <h1 class="Text-h4">${ asText(doc.data.title) }</h1>
          ${ asSnippet(doc.data.intro || doc.data.body) }
        </div>

        ${ tags.length ? html`
          <div>
            <span class="u-hiddenVisually">${ __('Related goals') }:</span>
            <div class="Card-tags">
              ${ tags.map(tag => tag.match(GOAL_TAG)[1]).map(number => html`
                <span class="Card-tag u-bg${ number }">${ number }</span>
              `) }
            </div>
          </div>
        ` : null }

        <a class="Card-link" href="${ href(state, doc) }">
          ${ doc.type === 'initiative' ? __('View campaign') : __('Read the full article') }
        </a>
    </article>
  `;

  function onclick(e) {
    if (e.target.href) {
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
      window.open(href(state, doc), '_blank');
      return;
    }
    emit(state.events.PUSHSTATE, href(state, doc));
    e.preventDefault();
  }
};

exports.loadingCard = function (opts = {}) {
  return html`
    <div class="Card">
      <div class="Card-figure"></div>
      ${ opts.date ? html`
        <span class="Card-meta"><span class="u-loading">${ __('LOADING_TEXT_SHORT') }</span></span>
      ` : null }
      <div class="Text">
        <h1 class="Text-h4"><span class="u-loading">${ __('LOADING_TEXT_MEDIUM') }</span></h1>
        <p><span class="u-loading">${ __('LOADING_TEXT_LONG') }</span></p>
      </div>
      <span class="Card-link u-removePseudo"><span class="u-loading">${ __('LOADING_TEXT_MEDIUM') }</span></span>
    </div>
  `;
};

function asSnippet(richText) {
  const preamble = richText.find(node => node.type === 'paragraph');

  return html`
    <p>
      ${ preamble.text.substr(0, 140).replace(TRAILING_WORD, '…') }
    </p>
  `;
}