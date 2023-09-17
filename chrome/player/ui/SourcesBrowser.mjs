import {VideoSource} from '../VideoSource.mjs';
import {PlayerModes} from '../enums/PlayerModes.mjs';
import {InterfaceUtils} from '../utils/InterfaceUtils.mjs';
import {URLUtils} from '../utils/URLUtils.mjs';
import {WebUtils} from '../utils/WebUtils.mjs';
import {DOMElements} from './DOMElements.mjs';

export class SourcesBrowser {
  constructor(client) {
    this.client = client;

    this.sources = [];
    this.setupUI();
  }

  addSource(source) {
    const existing = this.sources.find((s) => s.equals(source));
    if (existing) {
      return existing;
    }

    this.sources.unshift(source);

    this.setupSourceListing(source);
    this.updateSources();

    return source;
  }

  setupSourceListing(source) {
    // eslint-disable-next-line prefer-const
    let headersInput;
    const sourceContainer = WebUtils.create('div', null, 'linkui-source');
    this.linkui.sourcesList.insertBefore(sourceContainer, this.linkui.sourcesList.firstChild);

    const sourceURL = WebUtils.create('input', null, 'text_input linkui-source-url');
    sourceURL.value = source.url;
    sourceURL.placeholder = 'Source URL';
    sourceURL.addEventListener('input', (e) => {
      source.url = sourceURL.value;
      this.updateSources();
    });
    sourceContainer.appendChild(sourceURL);

    const modes = {};
    modes[PlayerModes.DIRECT] = 'Direct';
    modes[PlayerModes.ACCELERATED_MP4] = 'Accelerated MP4';
    modes[PlayerModes.ACCELERATED_HLS] = 'Accelerated HLS';
    modes[PlayerModes.ACCELERATED_DASH] = 'Accelerated DASH';

    // SPLICER:CENSORYT:REMOVE_START
    modes[PlayerModes.ACCELERATED_YT] = 'Accelerated Youtube';
    // SPLICER:CENSORYT:REMOVE_END

    const sourceMode = WebUtils.createDropdown(source.mode, 'Mode', modes, (val) => {
      source.mode = parseInt(val);
      this.updateSources();
    });
    sourceMode.classList.add('linkui-source-mode');
    sourceContainer.appendChild(sourceMode);

    const sourceHeadersBtn = WebUtils.create('div', null, 'linkui-source-headers-button');
    sourceHeadersBtn.textContent = 'Header Override (' + Object.keys(source.headers).length + ')';
    sourceHeadersBtn.name = 'Toggle header override input';
    sourceHeadersBtn.addEventListener('click', (e) => {
      if (headersInput.style.display == 'none') {
        headersInput.style.display = '';
        sourceHeadersBtn.classList.add('active');
      } else {
        headersInput.style.display = 'none';
        sourceHeadersBtn.classList.remove('active');
      }
    });
    WebUtils.setupTabIndex(sourceHeadersBtn);
    sourceContainer.appendChild(sourceHeadersBtn);

    const sourceSetBtn = WebUtils.create('div', null, 'linkui-source-set-button');
    sourceSetBtn.textContent = 'Play';
    sourceSetBtn.addEventListener('click', async (e) => {
      if (sourceSetBtn.textContent != 'Play') return;
      sourceSetBtn.textContent = 'Loading...';
      await this.client.setSource(source);
      this.updateSources();
      this.client.play();
    });
    WebUtils.setupTabIndex(sourceSetBtn);
    sourceContainer.appendChild(sourceSetBtn);

    const sourceDeleteBtn = WebUtils.create('div', null, 'linkui-source-delete-button');
    sourceDeleteBtn.textContent = 'Delete';
    sourceDeleteBtn.addEventListener('click', (e) => {
      sourceContainer.remove();
      const ind = this.sources.indexOf(source);
      if (ind == -1) return;
      this.sources.splice(ind, 1);
      this.updateSources();
    });
    WebUtils.setupTabIndex(sourceDeleteBtn);
    sourceContainer.appendChild(sourceDeleteBtn);

    headersInput = WebUtils.create('textarea', null, 'text_input linkui-source-headers');
    headersInput.setAttribute('autocapitalize', 'off');
    headersInput.setAttribute('autocomplete', 'off');
    headersInput.setAttribute('autocorrect', 'off');
    headersInput.setAttribute('spellcheck', false);
    headersInput.name = 'Header override input';
    headersInput.placeholder = 'Headers (1 entry per line)\nHeader Name: Header Value\nHeader2 Name: Header2 Value';
    headersInput.value = URLUtils.objToHeadersString(source.headers);
    headersInput.addEventListener('input', (e) => {
      if (URLUtils.validateHeadersString(headersInput.value)) {
        headersInput.classList.remove('invalid');
      } else {
        headersInput.classList.add('invalid');
      }

      source.headers = URLUtils.headersStringToObj(headersInput.value);
      sourceHeadersBtn.textContent = 'Header Override (' + Object.keys(source.headers).length + ')';
      this.updateSources();
    });

    headersInput.style.display = 'none';
    sourceContainer.appendChild(headersInput);

    source.sourceBrowserElements = {
      container: sourceContainer,
      url: sourceURL,
      mode: sourceMode,
      headersBtn: sourceHeadersBtn,
      setBtn: sourceSetBtn,
      deleteBtn: sourceDeleteBtn,
    };
  }

  updateSources() {
    if (this.sources.length == 0) {
      this.linkui.sourcesFound.textContent = 'No Sources Found';
    } else if (this.sources.length == 1) {
      this.linkui.sourcesFound.textContent = '1 Source Found';
    } else {
      this.linkui.sourcesFound.textContent = this.sources.length + ' Sources Found';
    }
    this.sources.forEach((source) => {
      if (this.client.source && this.client.source.equals(source)) {
        source.sourceBrowserElements.container.classList.add('active');
        source.sourceBrowserElements.setBtn.textContent = 'Playing';
      } else {
        source.sourceBrowserElements.container.classList.remove('active');
        source.sourceBrowserElements.setBtn.textContent = 'Play';
      }
    });
  }

  openUI() {
    InterfaceUtils.closeWindows();
    DOMElements.linkuiContainer.style.display = '';
  }

  closeUI() {
    DOMElements.linkuiContainer.style.display = 'none';
  }

  setupUI() {
    DOMElements.linkButton.addEventListener('click', (e) => {
      if (DOMElements.linkuiContainer.style.display == 'none') {
        this.openUI();
      } else {
        this.closeUI();
      }
      e.stopPropagation();
    });

    WebUtils.setupTabIndex(DOMElements.linkButton);

    DOMElements.linkuiContainer.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    DOMElements.linkuiContainer.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });

    DOMElements.linkuiContainer.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    DOMElements.playerContainer.addEventListener('click', (e) => {
      this.closeUI();
    });

    const closeBtn = DOMElements.linkuiContainer.getElementsByClassName('close_button')[0];
    closeBtn.addEventListener('click', (e) => {
      this.closeUI();
    });
    WebUtils.setupTabIndex(closeBtn);

    this.linkui = {};

    this.linkui.sourcesFound = WebUtils.create('div', null, 'linkui-sources-found');
    this.linkui.sourcesFound.textContent = 'No Sources Found';
    DOMElements.linkuiContainer.appendChild(this.linkui.sourcesFound);

    this.linkui.addNewButton = WebUtils.create('div', null, 'linkui-addnew-button');
    this.linkui.addNewButton.textContent = 'Add Source';
    WebUtils.setupTabIndex(this.linkui.addNewButton);
    DOMElements.linkuiContainer.appendChild(this.linkui.addNewButton);


    this.linkui.addNewButton.addEventListener('click', (e) => {
      this.addSource(new VideoSource('', null, PlayerModes.DIRECT));
    });


    this.linkui.clearButton = WebUtils.create('div', null, 'linkui-clear-button');
    this.linkui.clearButton.textContent = 'Clear Sources';
    WebUtils.setupTabIndex(this.linkui.clearButton);
    DOMElements.linkuiContainer.appendChild(this.linkui.clearButton);

    this.linkui.clearButton.addEventListener('click', (e) => {
      this.sources.length = 0;
      this.linkui.sourcesList.innerHTML = '';
    });

    this.linkui.sourcesList = WebUtils.create('div', null, 'linkui-sources-list');
    DOMElements.linkuiContainer.appendChild(this.linkui.sourcesList);
  }
}