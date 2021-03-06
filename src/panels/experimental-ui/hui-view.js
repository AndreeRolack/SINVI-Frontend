import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import './hui-entities-card.js';
import './hui-entity-filter-card.js';

import applyThemesOnElement from '../../common/dom/apply_themes_on_element.js';

const VALID_TYPES = ['entities', 'entity-filter'];
const CUSTOM_TYPE_PREFIX = 'custom:';

function cardElement(type) {
  if (VALID_TYPES.includes(type)) {
    return `hui-${type}-card`;
  } else if (type.startsWith(CUSTOM_TYPE_PREFIX)) {
    return type.substr(CUSTOM_TYPE_PREFIX.length);
  }
  return null;
}

class HUIView extends PolymerElement {
  static get template() {
    return html`
      <style>
      :host {
        display: block;
        padding: 4px 4px 0;
        transform: translateZ(0);
        position: relative;
      }

      #columns {
        display: flex;
        flex-direction: row;
        justify-content: center;
      }

      .column {
        flex-basis: 0;
        flex-grow: 1;
        max-width: 500px;
        overflow-x: hidden;
      }

      .column > * {
        display: block;
        margin: 4px 4px 8px;
      }

      @media (max-width: 500px) {
        :host {
          padding-left: 0;
          padding-right: 0;
        }

        .column > * {
          margin-left: 0;
          margin-right: 0;
        }
      }

      @media (max-width: 599px) {
        .column {
          max-width: 600px;
        }
      }
      </style>
      <div id='columns'></div>
    `;
  }
  static get properties() {
    return {
      hass: {
        type: Object,
        observer: '_hassChanged',
      },

      columns: {
        type: Number,
        observer: '_configChanged',
      },

      config: {
        type: Object,
        observer: '_configChanged',
      },
    };
  }

  constructor() {
    super();
    this._elements = [];
  }

  _getElements(cards) {
    const elements = [];

    for (let i = 0; i < cards.length; i++) {
      const cardConfig = cards[i];
      const tag = cardElement(cardConfig.type);
      if (!tag) {
        // eslint-disable-next-line
        console.error('Unknown type encountered:', cardConfig.type);
        continue;
      }
      const element = document.createElement(tag);
      element.config = cardConfig;
      element.hass = this.hass;
      elements.push(element);
    }

    return elements;
  }

  _configChanged() {
    const root = this.$.columns;
    const config = this.config;

    while (root.lastChild) {
      root.removeChild(root.lastChild);
    }

    if (!config) {
      this._elements = [];
      return;
    }

    const elements = this._getElements(config.cards);

    let columns = [];
    const columnEntityCount = [];
    for (let i = 0; i < this.columns; i++) {
      columns.push([]);
      columnEntityCount.push(0);
    }

    // Find column with < 5 entities, else column with lowest count
    function getColumnIndex(size) {
      let minIndex = 0;
      for (let i = 0; i < columnEntityCount.length; i++) {
        if (columnEntityCount[i] < 5) {
          minIndex = i;
          break;
        }
        if (columnEntityCount[i] < columnEntityCount[minIndex]) {
          minIndex = i;
        }
      }

      columnEntityCount[minIndex] += size;

      return minIndex;
    }

    elements.forEach(el =>
      columns[getColumnIndex(el.getCardSize())].push(el));

    // Remove empty columns
    columns = columns.filter(val => val.length > 0);

    columns.forEach((column) => {
      const columnEl = document.createElement('div');
      columnEl.classList.add('column');
      column.forEach(el => columnEl.appendChild(el));
      root.appendChild(columnEl);
    });

    this._elements = elements;

    if ('theme' in config) {
      applyThemesOnElement(root, this.hass.themes, config.theme);
    }
  }

  _hassChanged(hass) {
    for (let i = 0; i < this._elements.length; i++) {
      this._elements[i].hass = hass;
    }
  }
}

customElements.define('hui-view', HUIView);
