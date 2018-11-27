// ==UserScript==
// @name        LibC
// @version     4.0.0
// @description Lib's Conglomerated Scripts
// @namespace   https://github.com/AnneTrue/
// @author      Anne True
// @source      https://github.com/AnneTrue/libConglomerate
// @match       *://nexusclash.com/modules.php?name=Game*
// @match       *://www.nexusclash.com/modules.php?name=Game*
// @exclude     *://nexusclash.com/modules.php?name=Game&op=disconnect
// @exclude     *://www.nexusclash.com/modules.php?name=Game&op=disconnect
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceURL
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.deleteValue
// @grant       GM.getResourceUrl
// @require     scaffolding.user.js
// @resource    libCCSS css/conglomerate.css
// ==/UserScript==

const myPromise;

(async () => {
  myPromise = libC.registerPromise();
  libC.version = `${GM.info.script.version}`;

  // uncomment below to enable verbose logging, useful if you're debugging or developing
  // libC.verbose = true;
})();


//#############################################################################
// Tweak: highlight shadows from outside buildings, lights status, and targets in a tile
(async () => {
  const desctextmatches = (descdiv, descPieces, hilightLights, hilightShadows) => {
    if (descPieces.firsttext) {
        descdiv.appendChild(document.createTextNode(descPieces.firsttext));
    }

    // if lights enabled, set span's light class to on/off; else just make it text
    if (descPieces.lightstatus) {
      const lights = document.createElement('span');
      if (hilightLights) {
        if (descPieces.lightstatus.match(/(The lights are on inside the building|The building lights illuminate the area)/)) {
          lights.className = 'libLights';
        }
        else if (descPieces.lightstatus.match(/(The building windows are dark|The building lights are off|The lights inside the building appear to be off|The lights seem to be off throughout the neighorhood|The building is dark\. In fact, the lights seem to be off all throughout the neighorhood|The lights seem to be off throughout the neighorhood)/)) {
          lights.className = 'libLightsOff';
        }
      }
      lights.appendChild(document.createTextNode(descPieces.lightstatus));
      descdiv.appendChild(lights);
    }

    if (descPieces.middletext) {
      descdiv.appendChild(document.createTextNode(descPieces.middletext));
    }

    if (descPieces.shadowstatus) {
      const shadows = document.createElement('span');
      if (hilightShadows === true) {
        shadows.className = 'libShadows';
      }
      shadows.appendChild(document.createTextNode(descPieces.shadowstatus));
      descdiv.appendChild(shadows);
    }

    if (descPieces.lasttext) {
      descdiv.appendChild(document.createTextNode(descPieces.lasttext));
    }
  }


  const showhilights = (mod) => {
    const locSnapShot = document.evaluate("//td[@valign='top']/div[@class='tile_description']/img", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (locSnapShot.snapshotLength === 0) { return; }

    const desc = locSnapShot.snapshotItem(0).nextSibling;

    // lights and shadows
    const descString = desc.textContent;
    const descdiv = document.createElement('div');
    descdiv.id = 'libdesc';
    const descMatch = descString.match(/(?:([\s\S]+)?(The lights are on inside the building|The building lights illuminate the area|The building windows are dark|The building lights are off|The lights inside the building appear to be off|The lights seem to be off throughout the neighorhood|The building is dark\. In fact, the lights seem to be off all throughout the neighorhood|The lights seem to be off throughout the neighorhood))?(?:([\s\S]+)?(There are several shadows moving in the windows|The occasional shadow can be glimpsed moving in the windows))?([\s\S]+)/);
    // Groups (1: firsttext) (2: lightstatus) (3: middletext) (4: shadowstatus) (5: lasttext)
    if (descMatch) {
        const descPieces = {
            'firsttext': descMatch[1],
            'lightstatus': descMatch[2],
            'middletext': descMatch[3],
            'shadowstatus': descMatch[4],
            'lasttext': descMatch[5],
        };
        desctextmatches(
          descdiv,
          descPieces,
          await mod.getSetting('lights'),
          await mod.getSetting('shadows'),
          );
    } else {
        // if no match, just put the full description into the new div
        descdiv.appendChild(document.createTextNode(descString));
    }

    // targets/items set up in location
    if (await mod.getSetting('targets') === true) {
      const puforms = document.evaluate(
        "//form[@name='pickup']",
        document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
        );
      const targetdesc = document.createElement('span');
      if (puforms.snapshotLength === 1) {
        const pucount = puforms.snapshotItem(0).getElementsByTagName('select')[0].length;
        targetdesc.className = 'libLights'; // reuses light css
        if (pucount === 1) {
          targetdesc.appendChild(document.createTextNode(
            ' There is an item on the floor.'
            ));
        } else {
          targetdesc.appendChild(document.createTextNode(
            `There are ${pucount} items on the floor.`
            ));
        }
      }
    descdiv.appendChild(targetdesc);
    desc.parentNode.insertBefore(descdiv, desc);
    if (desc.nextElementSibling && desc.nextElementSibling.tagName.toLowerCase() == 'br') {
      // remove extra <br> line break
      desc.nextElementSibling.remove()
    }
    desc.remove(); // we copied things, remove (redundant) original
    }
  }


  mod = await libC.registerModule(
    'hilights',
    'Description Hilights',
    'local',
    'Highlights shadows moving in windows and the building lights.',
    );
  
  mod.registerSetting(
    'checkbox',
    'lights',
    'Hilight Lights',
    'Highlights the power status of the tile.',
    );
  mod.registerSetting(
    'checkbox',
    'shadows',
    'Hilight Shadows',
    'Highlights shadows moving in windows.',
    );
  mod.registerSetting(
    'checkbox',
    'targets',
    'Display Pick-Up Item Count',
    'Adds a count of items that can be picked up to the end of the tile description. Dodgerblue if there are any, and no text if there are none.',
    );
    
  mod.registerMethod('sync', showhilights);

})();
