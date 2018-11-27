// ==UserScript==
// @name        LibC Scaffolding
// @version     4.0.0
// @description Scaffolding and API for libConglomerate
// @namespace   https://github.com/AnneTrue/
// @author      Anne True
// @homepage    https://github.com/AnneTrue/libConglomerate
// @match       *://nexusclash.com/modules.php?name=Game*
// @match       *://www.nexusclash.com/modules.php?name=Game*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceURL
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.deleteValue
// @grant       GM.getResourceUrl
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==

// todo: scaffolding CSS, inject style

function LibCScaffolding() {
  'use strict';
  this.version = '4.0.0'; // version updates go here too!
  // logs to console; can disable if you want
  this.logging = true;
  // verbose logging, set true for dev-work
  this.verbose = false;

  this.log = async (message) => {
    if (this.logging) {
      console.log(`[LibC-${this.version}]:  ${message}`);
    }
  }

  this.debug = async (message) => {
    if (this.verbose) {
      await this.log(message);
    }
  }

  this.error = async (message) => {
    console.error(`[LibC-${this.version}]:  ${message}`);
  }

  // true if a character is logged into the game module
  // used to determine whether the scripts can run
  this.inGame = false;

  // Character Info
  this.charinfo = {
    'level':null,
    'class':null,
    'id':null,
    'ap':null,
    'mp':null,
    'hp':null,
    'div':null,
  };

  // libC Promises: libC will only run after all promises complete
  this.promises = [];
  this.runCalled = false;
  
  function DeferredPromise() {
    let res, rej;
    const p = new Promise(
      (resolve, reject) => { res = resolve; rej = reject; }
    );
    p.resolve = res;
    p.reject = rej;
    return p;
  }
  
  this.registerPromise = () => {
    const promise = DeferredPromise();
    this.promises.push(promise);
    return promise
  }


  // libC Modules
  this.modules = [];

  this.registerModule = async (id, name, type, description) => {
    const mod = new LibCModule(id, name, type, description);
    this.modules.push(mod);
    this.debug(`Registered module ${mod.name}`);
    return mod
  }

  const addToRow = (tdid, element) => {
    const td = document.getElementById(`libc-setting-${tdid}`);
    if (!td) {
      this.error(`addToRow failed to find settingsRow with <td>.id ${tdid}`);
      return;
    }
    const tempspan = document.createElement('span');
    tempspan.className = 'libc-settingspan';
    tempspan.appendChild(element);
    td.appendChild(tempspan);
    td.appendChild(document.createElement('br'));
  }

  const createSettingsRow = async (settingTable, mod) => {
    const settingsRow = document.createElement('tr');
    settingsRow.className = 'libc-settingrow';
    const settingTitle = document.createElement('td');
    settingTitle.className = 'libc-settingname';
    settingTitle.appendChild(await mod.getModuleEnableElement());
    const settingList = document.createElement('td');
    settingList.className = 'libc-settinglist';
    settingList.id = `libc-setting-${mod.id}`;
    settingsRow.appendChild(settingTitle);
    settingsRow.appendChild(settingList);
    settingTable.appendChild(settingsRow);
  }

  const createSettingsPane = async () => {
    const tableSnapshot = document.evaluate(
      '//td/form/textarea[@name="Scratchpad"]/ancestor::table[1]',
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
      );
    if (tableSnapshot.snapshotLength !== 1) {
      this.debug('No scratchpad detected');
      return;
    }
    const table = tableSnapshot.snapshotItem(0);
    table.appendChild(document.createElement('tr'));
    table.lastElementChild.appendChild(document.createElement('td'));
    const temptable = document.createElement('table');
    temptable.id = 'libc-settingtable';
    temptable.className = 'libc-settingtable';
    temptable.appendChild(document.createElement('tbody'));
    const link = document.createElement('a');
    link.href = '/modules.php?name=Forums&file=viewtopic&t=7291';
    link.textContent = 'libConglomerate';
    const verspan = document.createElement('span');
    verspan.appendChild(document.createTextNode(`Version ${this.version}`));
    const temptablerow = document.createElement('tr');
    temptablerow.className = 'libc-settingrow';
    temptablerow.appendChild(document.createElement('td'));
    temptablerow.lastElementChild.className = 'libc-settingname';
    temptablerow.lastElementChild.appendChild(link);
    temptablerow.appendChild(document.createElement('td'));
    temptablerow.lastElementChild.className = 'libc-settinglist';
    temptablerow.lastElementChild.appendChild(verspan);
    temptable.lastElementChild.appendChild(temptablerow);
    table.lastElementChild.lastElementChild.appendChild(temptable);

    // todo: get elems async, add to row sync
    for (const libCMod of this.modules) {
      await createSettingsRow(temptable, libCMod);
      const settingElements = await libCMod.getSettingElements();
      for (const setElem of settingElements) {
        addToRow(libCMod.id, setElem);
      }
    }
  }

  this.runLibC = async () => {
    if (this.runCalled) {
      this.log('runLibC has already been called. Preventing duplicate run.');
      return
    }
    this.runCalled = true;
    // wait for module registration promises
    Promise.all(this.promises);

    for (const libCMod of this.modules) {
      if (await libCMod.isEnabled() !== true) { continue; }
      try {
        this.debug(`Running (sync) module [${libCMod.name}]`);
        libCMod.runSync();
      } catch (err) {
        this.error(`Error while (sync) running ${libCMod.name}: ${err.message}`);
      }
    }

    await createSettingsPane();

    for (const libCMod of this.modules) {
      if (!await libCMod.isEnabled()) { continue; }
      try {
        this.debug(`Running (async) module [${libCMod.name}]`);
        libCMod.runAsync();
      } catch (err) {
        this.error(`Error while (async) running ${libCMod.name}: ${err.message}`);
      }
    }
  }

  // Character Info Parsing
  (() => {
    try {
      if (!document.getElementById('CharacterInfo')) { return; }
      // used to determine if script can safely run without errors
      this.inGame = true;
      this.charinfo.div = document.getElementById('CharacterInfo');
      this.charinfo.id = this.charinfo.div.getElementsByTagName('a')[0].href.match(/character&id=(\d+)$/)[1];

      const levelclass = this.charinfo.div.getElementsByTagName('td')[1];
      const levelclassdata = /Level ([0-9]{1,3}) (.+)/.exec(levelclass.innerHTML);
      this.charinfo.level = levelclassdata[1];
      this.charinfo.class = levelclassdata[2];

      const statParser = async (div, title, match) => {
        try {
          const node = document.evaluate(
            "//td/a[contains(@title, 'Action Points')]",
            div, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
          ).snapshotItem(0);
          let matchResult = node.textContent.match(new RegExp(`(\d+) ${match}`));
          if (matchResult) {
            return matchResult[1]
          }
          return null
        } catch (err) {
          this.log(`Charinfo Parse ${match} error: ${err.message}`);
        }
      }

      const ap = statParser(this.charinfo.div, 'Action Points', 'AP')
        .then((ap) => { this.charinfo.ap = ap; });
      const hp = statParser(this.charinfo.div, 'Hit Points', 'HP')
        .then((hp) => { this.charinfo.hp = hp; });
      const mp = statParser(this.charinfo.div, 'Magic Points', 'MP')
        .then((mp) => { this.charinfo.mp = mp; });
      Promise.all([ap, hp, mp]);
    } catch (err) {
      this.error(`Error in getCharacterInfo: ${err.message}`);
    }
  })();

  this.getSetting = async (settingName, def=undefined) => {
    const value = await GM.getValue(settingName);
    if (typeof value !== 'undefined') {
      return JSON.parse(value)
    }
    return def
  }

  this.setSetting = async (settingName, value) => {
    return await GM.setValue(settingName, JSON.stringify(value));
  }

  const getLocalSettingName = (settingName) => {
    return `libc-${this.charinfo.id}-${settingName}`;
  }

  const getGlobalSettingName = (settingName) => {
    return `libc-global-${settingName}`;
  }

  this.getLocalSetting = async (settingName, def) => {
    if (!this.inGame || typeof this.charinfo.id === 'undefined') {
      this.error('getLocalSetting: not in game, no character ID');
      return undefined;
    }
    return await this.getSetting(getLocalSettingName(settingName), def);
  }

  this.getGlobalSetting = async (settingName, def) => {
    return await this.getSetting(getGlobalSettingName(settingName), def);
  }

  this.setLocalSetting = async (settingName, value) => {
    if (!this.inGame || typeof this.charinfo.id === 'undefined') {
      this.error('setLocalSetting: not in game, no character ID');
      return undefined;
    }
    return await this.setSetting(getLocalSettingName(settingName), value);
  }

  this.setGlobalSetting = async (settingName, value) => {
    return await this.setSetting(getGlobalSettingName(settingName), value);
  }
}

if (typeof libC === 'undefined') {
  this.libC = new LibCScaffolding();
}


function LibCSetting(settingType, id, name, description, extras) {
  if (['checkbox', 'select', 'textfield'].indexOf(settingType) === -1) {
    libC.error(`Error constructing LibCSetting ${id}: Unrecognised type ${settingType}`);
  }
  this.settingType = settingType;
  this.id = id;
  this.name = name;
  this.description = description;
  this.extras = extras;


  const getCheckbox = async (mod) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    if (await mod.getSetting(this.id) === true) { checkbox.checked = true; }
    else { checkbox.checked = false; }
    checkbox.title = this.description;
    checkbox.id = `${mod.id}-${this.id}`;
    checkbox.addEventListener('click', mod.getCheckboxListener(this.id), false);
    return checkbox;
  }

  const getSelect = async (mod) => {
    const select = document.createElement('select');
    select.title = this.description;
    select.id = `${mod.id}-${this.id}`;
    const setting = await mod.getSetting(this.id);
    let sidx = 0, i = 0;
    for (const opt of this.extras) {
      if (opt.value === setting) {
        // set initial index of select to stored option
        sidx = i;
      }
      i++;
      let option = document.createElement('option');
      option.value = opt.value;
      option.text = opt.text;
      select.add(option);
    }
    select.selectedIndex = sidx;
    select.addEventListener('change', mod.getSelectListener(this.id), false);
    return select;
  }

  const getTextfield = async (mod) => {
    const textfield = document.createElement('input');
    textfield.type = 'text';
    textfield.setAttribute('maxlength', 10);
    textfield.setAttribute('size', 10);
    const initValue = await mod.getSetting(this.id);
    if (initValue !== undefined) {
      textfield.value = initValue;
    }
    textfield.title = this.description;
    textfield.id = `${mod.id}-${this.id}`;
    textfield.addEventListener('input', mod.getTextfieldListener(this.id), false);
    return textfield;
  }

  this.getSettingsRowElement = async (mod) => {
    const tempspan = document.createElement('span');
    tempspan.className = 'libc-settingspan';
    tempspan.appendChild(document.createTextNode(this.name));
    const elemFuncs = {
      'checkbox': getCheckbox,
      'select': getSelect,
      'textfield': getTextfield,
    };
    if (!elemFuncs.hasOwnProperty(this.settingType)) {
      mod.error(`getSettingsRowElement failed with unknown type ${this.settingType}`);
      return null
    }
    tempspan.appendChild(await elemFuncs[this.settingType](mod));
    return tempspan;
  }
}


function LibCModule(id, name, localType, description) {
  if (['global', 'local'].indexOf(localType) === -1) {
    libC.error(`Error constructing LibCModule ${id}: Unrecognised type ${localType}`);
    return
  }
  this.id = id;
  this.name = name;
  this.description = description;
  this.localType = localType
  this.settings = [];
  this.syncMethods = [];
  this.asyncMethods = [];

  this.log = async (message) => { await libC.log(`[${this.id}] ${message}`); }
  this.debug = async (message) => { await libC.debug(`[${this.id}] ${message}`); }
  this.error = async (message) => { await libC.error(`[${this.id}] ${message}`); }


  this.getSetting = async (key, def) => {
    key = `${this.id}-${key}`;
    if (this.localType === 'global') {
      return await libC.getGlobalSetting(key, def);
    }
    return await libC.getLocalSetting(key, def);
  }


  this.setSetting = async (key, value) => {
    key = `${this.id}-${key}`;
    if (this.localType === 'global') {
      return await libC.setGlobalSetting(key, value);
    }
    return await libC.setLocalSetting(key, value);
  }


  this.getCheckboxListener = (id) => {
    return async (e) => {
      this.log(`Toggled ${this.id}-${id} to ${e.target.checked}`);
      await this.setSetting(id, e.target.checked);
    }
  }

  
  this.getTextfieldListener = (id) => {
    return async (e) => {
      this.log(`Set ${this.id}-${id} to ${e.target.value}`);
      await this.setSetting(id, e.target.value);
    }
  }


  this.getSelectListener = (id) => {
    return async (e) => {
      this.log(`set ${e.target.id} to ${e.target.options[e.target.selectedIndex].value}`);
      await this.setSetting(e.target.id, e.target.options[e.target.selectedIndex].value);
    }
  }


  this.registerSetting = async (type, id, name, desc, extra) => {
    const setting = new LibCSetting(type, id, name, desc, extra);
    this.settings.push(setting);
    return setting
  }

  this.getSettingElements = async () => {
    const elementPromises = this.settings.map( async (libCSet) => {
      return await libCSet.getSettingsRowElement(this);
    });
    const resultElements = [];
    for (const elementPromise of elementPromises) {
      resultElements.push(await elementPromise);
    }
    return resultElements
  }

  this.registerMethod = async (type, method) => {
    if (type === 'sync') {
      this.syncMethods.push(method);
    } else if (type === 'async') {
      this.asyncMethods.push(method);
    } else {
      this.error(`Unrecognised type ${type} during registerMethod`);
    }
    return this
  }

  this.getModuleEnableElement = async () => {
    const moduleEnableSetting = new LibCSetting(
      'checkbox', 'module_enabled', this.name, this.description, null
    );
    return await moduleEnableSetting.getSettingsRowElement(this);
  }

  this.isEnabled = async () => {
    if (this.localType === 'local' && !libC.inGame) {
      return false;
    }
    return await this.getSetting('module_enabled');
  }

  this.runSync = () => {
    try {
      for (const method of this.syncMethods) {
        method(this);
      }
    } catch (err) {
      this.error(`runSync error: ${err.message}`);
    }
  }

  this.runAsync = async () => {
    try {
      const runPromises = this.asyncMethods.map((method) => { method(this); });
      Promise.all(runPromises);
    } catch (err) {
      this.error(`runAsync error: ${err.message}`);
    }
  }
}

// EXAMPLE CODE:
/*
// must be an async function to use await
(async () => {
  libC.log('Running Example Code');
  libC.verbose = true;
  
  // At the start of our script we register a promise to prevent other scripts
  // from running libC Framework before we have finished registering our modules.
  const myPromise = libC.registerPromise();
  
  // .registerModule returns a promise, use await to resolve the promise to the LibCModule
  const mod = await libC.registerModule('testmodule', 'Test Module', 'global', 'testing purposes');

  // mod.registerMethod(type, method)
  // type can be 'sync' or 'async'; sync methods run before anything else and
  // block execution while running. async methods run after all sync methods are finished, and
  // async methods are all run simultaneously.
  await mod.registerMethod('sync', (mod) => { mod.log('inside testmodule sync method'); });
  // mod.registerSetting(type, identifier, display name, description, extra)
  // type can be 'textfield', 'select', 'checkbox'
  // extra must be set to null unless type is 'textfield'
  // if type is textfield, extra must be list of objects with properties 'value' and 'text'
  await mod.registerSetting('textfield', 'testVal1', 'Test Value 1', 'has a test desc', null);
  await mod.registerMethod('async', async (mod) => {
    mod.log(`async method results with: ${await mod.getSetting('testVal1', 'failed')}`);
  });
  myPromise.resolve();
  await libC.runLibC();
})();
*/
