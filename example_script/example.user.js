// ==UserScript==
// @name        LibC Example
// @version     0.1
// @description An example of how to interface with libConglomerate
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
// @require     https://github.com/AnneTrue/libConglomerate/raw/master/scaffolding.user.js
// @resource    scaffoldingCSS https://github.com/AnneTrue/libConglomerate/raw/master/css/scaffolding.css
// @resource    scaffoldTestCss myCss.css
// ==/UserScript==

// the @require and any @resource can be a path relative to the download location
// note that the scaffoldingCSS resource is required in the top-level script, or else it cannot reach it 
// all the grant values must be present for the script to work

async function myComplexMethod(libCModule) {
  // this is a method in regular function notation that interacts with the libCModule object
  if (await libCModule.getSetting('my_nonexistant_setting', 'default_return_value') === 'default_return_value') {
    libCModule.log('my nonexist setting is undefined!');
    await libCModule.setSetting('my_existing_setting', {'myText':'settings can be javascript objects, thanks to JSON')); 
  }
  const mes = await libCModule.getSetting('my_existing_setting');
  if (mes) {
    // note: libCModule.log is async, but there is no need to block using await for logging messages
    libCmodule.log(mes.myText);
  }
}

// EXAMPLE CODE:
// must be an async function to use await
(async () => {
  libC.log('Running Example Code');
  libC.verbose = true;

  // At the start of our script we register a promise to prevent other scripts
  // from running libC Framework before we have finished registering our modules.
  const myPromise = libC.registerPromise();

  // Inject any script-specific style resources into the page
  libC.addGlobalStyle(GM.getResourceUrl('scaffoldTestCss'));

  // .registerModule returns a Promise object, use await to resolve the promise to the returned value (the LibCModule object)
  // .registerModule(id, name, type, description)
  // id is a unique shorthand for the module: recommended format is no spaces, no special characters e.g. 'mymodule' or 'sortpeople'
  // name is human readable display name: e.g. 'My Module' or 'Sort Characters'
  // type is either 'local' or 'global': local modules run per character, while global modules run on all NC pages and for all characters
  // description is an explanation of the module, and is set as the hovertext for the module enable/disable checkbox in the libC configuration pane
  const mod = await libC.registerModule('testmodule', 'Test Module', 'global', 'testing purposes');

  // .registerMethod(type, method)
  // type can be 'sync' or 'async'; sync methods run before anything else and
  // block execution while running. async methods run after all sync methods are finished, and
  // async methods are all run simultaneously.
  // the method will be called with one argument, the module object itself; this gives access to the primary
  // methods of the module, namely [get/set]Setting, and log/debug/error
  await mod.registerMethod('sync', (mod) => { mod.log('inside testmodule sync method'); });

  // .registerSetting(type, identifier, display name, description, extra)
  // type can be 'textfield', 'select', 'checkbox' corresponding to those elements
  // identifier is a module-unique ID for the setting, e.g. mySetting1 or showhp
  // display name is the human readable value shown in the libC configuration pane
  // description is a brief explanation of the setting, and is set as the hovertext for the setting element
  // extra defaults to null
  // if type is textfield, extra must be list of objects with properties 'value' and 'text'
    // the option value=value, and the option display text=text
  await mod.registerSetting('textfield', 'testVal1', 'Test Value 1', 'has a test desc', null);

  // Async methods should be used for anything that manipulates the DOM in a safe manner
  // Unsafe manipulations should be sync methods, to prevent garbled results
    // an example of unsafe manipulations is dynamically adding elements to the DOM one at a time:
    // because it does not handle sudden external changes to the element tree it is working with, it
    // may be safer to run it as a sync method to prevent the risk of failure
    // If you are unsure of whether a method is safe, it's better safe than sorry: run it as a sync method
  await mod.registerMethod('async', myComplexMethod);

  // we resolve the promise to signal that our script has finished setting up modules and is ready to run
  myPromise.resolve();

  // multiple calls to libC.runLibC will only execute the function once; thus all scripts should end by calling it
  libC.runLibC();
})();
