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
// @resource    scaffoldingCSS css/scaffolding.css
// @resource    libCCSS css/conglomerate.css
// ==/UserScript==

const myPromise = libC.registerPromise(); // script-file promise
const promiseList = []; // individual module promises
libC.version = `${GM.info.script.version}`;

// uncomment below to enable verbose logging, useful if you're debugging or developing
// libC.verbose = true;


//#############################################################################
// Generic functions

// returns number of char c in x
function timesCharExist(x, c){
  return (x.match(new RegExp(c,'g')) || []).length;
}


// sets first letter of a whole word to be uppercase
function ucfirstletter(str){
  return str.replace(
    /\b[A-Za-z]/,
    ($0) => { return $0.toUpperCase(); }
    );
  }


// checks if a string represents an integer
function isNormalInteger(str) {
  let n = ~~Number(str);
  return String(n) === String(str) && n >= 0;
}


// forces ints to be a two character string and a minimum
function fluffDigit(x) {
  if (x < 10 && x >= 0) {
    return `0${x}`;
  }
}


// sorts a list by the specified property of an object
// if reverse is false, the minimum is first (ascending order)
function getSortByProperty(property, reverse=false) {
  const getProperty = (obj) => obj[property];
  return (a, b) => {
    const aProp = getProperty(a);
    const bProp = getProperty(b);
    return ( (aProp < bProp) ? -1 : ((aProp > bProp) ? 1 : 0) ) * [1,-1][+!!reverse];
  }
}


// Deletes $removeCount <BR> elements if they are the next elements to the node
// This deletes *up to* removeCount, but if the next element after deleting several breaks
//  is a non <br> tag, it returns
// The return value is the number of elements deleted
function removeNextBreaks(element, removeCount=1) {
  if (!element) { return; }
  if (element.nextElementSibling && element.nextElementSibling.tagName.toLowerCase === 'br') {
    element.nextElementSibling.remove();
    if (removeCount > 1) {
      return 1 + removeNextBreaks(element, removeCount - 1);
    }
    return 1;
  } else {
    return 0;
  }
}


async function ensureIntegerSetting(mod, key, def) {
  const originalSetting = await mod.getSetting(key, null);
  if (isNormalInteger(originalSetting)) {
    const parsedSetting = parseInt(originalSetting);
    if (originalSetting !== parsedSetting) {
      await mod.setSetting(key, parsedSetting);
    }
    return parsedSetting;
  } else {
    await mod.setSetting(key, def);
    return def;
  }
}


//#############################################################################
promiseList.push((async () => {
  if (!libC.inGame) { return; }
  const mod = await libC.registerModule(
    'hilights',
    'Description Hilights',
    'local',
    'Highlights shadows moving in windows, the building light status, and targets on the ground.',
    );

  await mod.registerSetting(
    'checkbox',
    'lights',
    'Hilight Lights',
    'Highlights the power status of the tile.',
    );
  await mod.registerSetting(
    'checkbox',
    'shadows',
    'Hilight Shadows',
    'Highlights shadows moving in windows.',
    );
  await mod.registerSetting(
    'checkbox',
    'targets',
    'Display Pick-Up Item Count',
    'Adds a count of items that can be picked up to the end of the tile description. Dodgerblue colour text if there are any, and no text if there are none.',
    );

  const lightsEnabled = await mod.getSetting('lights', false);
  const shadowsEnabled = await mod.getSetting('shadows', false);
  const targetsEnabled = await mod.getSetting('targets', false);

  const desctextmatches = async (descdiv, descPieces) => {
    if (descPieces.firsttext) {
        descdiv.appendChild(document.createTextNode(descPieces.firsttext));
    }

    // if lights enabled, set span's light class to on/off; else just make it text
    if (descPieces.lightstatus) {
      const lights = document.createElement('span');
      if (lightsEnabled) {
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
      if (shadowsEnabled === true) {
        shadows.className = 'libShadows';
      }
      shadows.appendChild(document.createTextNode(descPieces.shadowstatus));
      descdiv.appendChild(shadows);
    }

    if (descPieces.lasttext) {
      descdiv.appendChild(document.createTextNode(descPieces.lasttext));
    }
  }


  const showhilights = async (mod) => {
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
        await desctextmatches(
          descdiv,
          descPieces,
          );
    } else {
        // if no match, just put the full description into the new div
        descdiv.appendChild(document.createTextNode(descString));
    }

    // targets/items set up in location
    if (targetsEnabled === true) {
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
    desc.remove(); // we copied things, remove (redundant) original
    removeNextBreaks(descdiv, 1);
    }
  }

  await mod.registerMethod('sync', showhilights);
})());


//#############################################################################
promiseList.push((async () => {
  if (!libC.inGame) { return; }
  const mod = await libC.registerModule(
    'sortchars',
    'Sort Characters',
    'local',
    'Sorts characters in a location based on allegiance, and allows further sorting styles and display of information.',
  );

  const sortOptions = [
    {'value':'normal', 'text':'Alphabetical'},
    {'value':'percent', 'text':'HP Percentage'},
    {'value':'total', 'text':'HP Total'},
    {'value':'downtotal', 'text':'Total HP Missing'},
    {'value':'level', 'text':'Level'},
    {'value':'mp_down', 'text':'Magic Points Missing'},
    {'value':'mp_percent', 'text':'Magic Point Percentage'},
  ];
  await mod.registerSetting(
    'select',
    'sortVictim',
    'Enemy Sort',
    'What style of sorting is utilised: alphabetical(default), percentage HP, total HP, level, percentage MP, missing MP.',
    sortOptions,
  );
  await mod.registerSetting(
    'checkbox',
    'reverseVictim',
    'Reverse Enemy Sort',
    'Reverses the order of characters when sorted.',
  );
  await mod.registerSetting(
    'select',
    'sortFriend',
    'Ally Sort',
    'What style of sorting is utilised: alphabetical(default), percentage HP, total HP, level, percentage MP, missing MP.',
    sortOptions,
  );
  await mod.registerSetting(
    'checkbox',
    'reverseFriend',
    'Reverse Ally Sort',
    'Reverses the order of characters when sorted.',
  );
  await mod.registerSetting(
    'checkbox',
    'neutrals',
    'Sort Neutrals as Allies',
    'Treat unfactioned and neutral factioned characters as allies in the sorted list',
  );
  await mod.registerSetting(
    'checkbox',
    'showhp',
    'Display HP',
    'Prints the HP values after the character\'s name. Requires first-aid.',
  );
  await mod.registerSetting(
    'checkbox',
    'showmp',
    'Display Magic Points',
    'Prints how much MP a character is missing. Requires Sense Magic.',
  );
  await mod.registerSetting(
    'checkbox',
    'petmaster',
    'Hilight Master\'s Pets',
    'Will hilight all the pets belonging to a master when hovering over their name. Adds a count of pets when you hover over their name.',
  );

  const createSortChar = async (char, neutralsAlly) => {
    // creates an object of the character's stats from an html string
    const retChar = {
      'politics': null,
      'id': null,
      'level': null,
      'hp': null,
      'hp_down': null,
      'hp_percent': null,
      'hp_visible': false,
      'mp': null,
      'mp_down': null,
      'mp_percent': null,
      'mp_visible': false,
      'html': char,
    };

    const politics = /a class="(faction|ally|friendly|neutral|enemy|hostile)"/.exec(char);
    if (politics) {
      if (politics[1] == 'enemy' || politics[1] == 'hostile') {
        retChar.politics = 'victims';
      } else if (politics[1] == 'neutral' && neutralsAlly !== true) {
        retChar.politics = 'victims';
      } else {
        retChar.politics = 'friends';
      }
    } else {
      mod.error(`Failed to parse char politics. Char HTML: ${char}`);
    }

    const charId = /href="javascript:SelectItem\('target_id','(\d+)'\)">/.exec(char)
    if (charId) {
      retChar.id = charId[1];
    } else {
      mod.error(`Failed to parse char ID. Char HTML: ${char}`);
    }

    // character link (level, and alternate ID)
    const charLink = /\(<a href="modules.php\?name=Game&amp;op=character&amp;id=(\d+)">(\d*)<\/a>\)/.exec(char)
    if (charLink) {
      retChar.level = charLink[2];
      if (!retChar.id && charLink[1] !== retChar.id) {
        mod.error(`createSortChar found two different IDs: '${charLink[1]}' vs '${retChar.id}'. Char HTML: ${char}`)
        retChar.id = charLink[1];
      }
    } else {
      mod.error(`Failed to parse char link. Char HTML: ${char}`);
    }

    const health = /<img(?: title="(\d+)\/(\d+)\s+hit points").+?src="images\/g\/HealthBar_[1-4].gif"/.exec(char)
    if (health) {
      if(health[1]) {
        // char has first aid and can see hp vals
        retChar.hp_visible = true;
        retChar.hp = parseInt(health[1]);
        retChar.hp_down = (parseInt(health[2])-retChar.hp);
        retChar.hp_percent = (retChar.hp/parseInt(health[2])) * 100;
      } else {
        // char doesn't have first aid; only sees 10,11-50,51-99,100% hp totals
        retChar.hp_visible = false;
        switch (parseInt(health[3])) {
          case 1:
              retChar.hp_percent = 100; break;
          case 2:
              retChar.hp_percent = 99; break;
          case 3:
              retChar.hp_percent = 50; break;
          case 4:
              retChar.hp_percent = 10; break;
        }
      }
    } else {
      mod.error(`Failed to parse char HP. Char HTML: ${char}`);
    }

    const magic = /title="(\d+)\/(\d+)\s+magic points".+?src="images\/g\/MagicBar_([1-4]).gif"/.exec(char)
    if (magic) {
      retChar.mp_visible = true;
      retChar.mp = parseInt(magic[1]);
      retChar.mp_down = parseInt(magic[2])-retChar.mp;
      retChar.mp_percent = (retChar.mp/parseInt(magic[2])) * 100;
    } else {
      mod.error(`Failed to parse char magic points. Char HTML: ${char}`);
    }

    return retChar;
  }

  // helper for ensuring valid sort
  const getSortSingle = (sortStr) => {
    const sorts = [
      'normal', // alphabetical (no-op)
      'percent',
      'total',
      'downtotal',
      'level',
      'mp_down',
      'mp_percent',
    ];
    if (sorts.indexOf(sortStr) === -1) {
      mod.log(`Unrecognised sort type: ${sortStr}`);
      return 'normal';
    }
    return sortStr
  }

  // helper for ensuring defaults in settings
  const ensureSortSetting = async (key) => {
    const originalSort = await mod.getSetting(key);
    const validSort = getSortSingle(originalSort);
    if (originalSort !== validSort) {
      await mod.setSetting(key, validSort);
    }
    return validSort;
  }

  const sortVictim = await ensureSortSetting('sortVictim');
  const sortFriend = await ensureSortSetting('sortFriend');
  const reverseVictim = await mod.getSetting('reverseVictim');
  const reverseFriend = await mod.getSetting('reverseFriend');
  const showHp = await mod.getSetting('showhp');
  const showMp = await mod.getSetting('showmp');
  const neutralsAlly = await mod.getSetting('neutrals');
  const sortField = { // note that 'normal' is not defined--it is a no-op
    'total':'hp',
    'percent':'hp_percent',
    'downtotal':'hp_down',
    'level':'level',
    'mp_down':'mp_down',
    'mp_percent':'mp_percent'
  };

  // creats an html span from a character object
  const singleCharHTML = async (char) => {
    let hpText = '';
    let mpText = '';
    if (showHp && char.hp_visible === true) {
      const hpSpanClass = (char.hp_down === 0) ? 'hptext2' : 'hptext';
      const downText = (char.hp_down > 0) ? `-${char.hp_down}` : '';
      hpText = `<span class="${hpSpanClass}">+${char.hp}${downText}</span>`;
    }
    if (showMp && char.mp_visible && char.mp_down > 0) {
      mpText = `<span class=mptext>m${char.mp_down}</span>`;
    }
    return `<span class="char" id="char_${char.id}"><${char.html}>${hpText}${mpText}</span>`;
  }

  // creates html paragraph for a list of char objects
  const createCharsHTML = async (chars, id) => {
    if (chars.length === 0) { return ''; }
    const singlePromises = chars.map(async (char) => { return singleCharHTML(char); });
    const singleChars = [];
    for (const prom of singlePromises) {
      singleChars.push(await prom);
    }
    return `<p id="${id}">${singleChars.join(', ')}.</p>`;
  }

  const sortChars = async (mod) => {
    const tileDescList = document.getElementsByClassName('tile_description');
    if (tileDescList.length !== 1) { return; }
    const tileDescNode = tileDescList[0];
    const peopleMatch = /There (?:is|are) (\d+) other (?:person|people) here, (.*?>)\./.exec(tileDescNode.innerHTML);
    // Groups: (1: count persons) (2: text + HTML of char list)
    if (!peopleMatch) { return; }
    if (peopleMatch[1] === 0) { return; }

    const charLists = {
      'victims':[],
      'friends':[],
      };
    const charHTMLList = peopleMatch[2].substring(1, peopleMatch[2].length - 1).split('>, <');
    const len = charHTMLList.length;
    if (len !== parseInt(peopleMatch[1])) {
      mod.error(`Length of HTML list fails to match peopleMatch count, raw html: ${peopleMatch[0]}`);
    }
    const createCharsPromises = charHTMLList.map(
      async (charHTML) => {
        const charObj = await createSortChar(charHTML, neutralsAlly);
        charLists[charObj.politics].push(charObj);
      }
      );

    await Promise.all(createCharsPromises);

    // sort people here
    if ( sortField.hasOwnProperty(sortVictim) ) {
     charLists.victims.sort(getSortByProperty(sortField[sortVictim], reverseVictim));
    }
    // implicit else: don't sort, already in alphabetical order
    if ( sortField.hasOwnProperty(sortFriend) ) {
        charLists.friends.sort(getSortByProperty(sortField[sortFriend], reverseFriend));
    } // again implied else --> don't sort

    // format new text content
    const displayCount = charLists.victims.length + charLists.friends.length;
    let countText = `<p id="chars_desc">There are ${displayCount} other people here.</p>`;
    if (displayCount === 1) {
      countText = '<p id="chars_desc">There is 1 other person here.</p>';
    }
    const victimText = await createCharsHTML(charLists.victims, 'victims');
    const friendText = await createCharsHTML(charLists.friends, 'friends');
    const divText = `<div id="other_chars">${countText}${victimText}${friendText}</div>`;
    tileDescNode.innerHTML = tileDescNode.innerHTML.replace(peopleMatch[0], divText);

    // remove extra whitespace:
    removeNextBreaks(document.getElementById('other_chars'), 2);
  }

  await mod.registerMethod('sync', sortChars);


  const showPetmaster = await mod.getSetting('petmaster');

  const getHilightEvent= (stateColour) => {
    const highlightpet = async (e) => {
      const masterName = e.target.textContent.trimEnd();
      const ownedPets = document.evaluate(
        `//div[@class='tile_description']//a[@title='Master: ${masterName}']`,
        document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
      );
      if (ownedPets.snapshotLength >= 1) {
        e.target.title = `${ownedPets.snapshotLength} Pets`;
      }
      for (const pet of ownedPets) {
        pet.style.color = stateColour;
      }
    }
  }

  const petmaster = async () => {
    if (showPetmaster !== true) { return; }
    // selects the character name element
    const chars = document.evaluate(
      "//div[@class='tile_description']//a[starts-with(@href," +
      "'modules.php?name=Game&op=character&id=')]/preceding-sibling::a[1]",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    const len = chars.snapshotLength;
    for (let i=0; i < len; i++) {
      const oneChar = chars.snapshotItem(i);
      oneChar.addEventListener('mouseover', getHilightEvent('blue'));
      oneChar.addEventListener('mouseover', getHilightEvent(''));
    }
  }

  await mod.registerMethod('sync', petmaster);
})());


//#############################################################################
promiseList.push((async () => {
  if (!libC.inGame) { return; }
  const mod = await libC.registerModule(
    'safety',
    'Safety Buttons',
    'local',
    'Prevents misclicks by adding safeties to many buttons.',
    );

  await mod.registerSetting(
    'checkbox',
    'speech',
    'Speech and Bullhorn',
    'Adds safeties to the Speech/Bullhorn buttons so that you must enter something before it unlocks.',
  );
  await mod.registerSetting(
    'checkbox',
    'drop',
    'Drop Item',
    'Adds safeties to Drop Item buttons.',
  );
  await mod.registerSetting(
    'checkbox',
    'craft',
    'Craft Item',
    'Adds safeties to the Craft Item button.',
  );
  await mod.registerSetting(
    'checkbox',
    'repair',
    'Repair Item',
    'Adds safeties to the Repair Item button.',
  );
  await mod.registerSetting(
    'checkbox',
    'learn',
    'Learn Spell',
    'Adds safeties to Learn Spell buttons.',
  );
  await mod.registerSetting(
    'checkbox',
    'healself',
    'Heal Self',
    'Adds a safety to Heal Self on Sorcerors.',
  );
  await mod.registerSetting(
    'checkbox',
    'blessing',
    'Advocate Blessing',
    'Adds safeties to the Advocate\'s Blessing of Inspiration button.',
  );
  await mod.registerSetting(
    'checkbox',
    'loadwand',
    'Load Spellwand',
    'Adds double-click safeties to (re)load spellwand buttons for Wizards.',
  );
  await mod.registerSetting(
    'checkbox',
    'wisp',
    'Deactivate Wisp Form',
    'Adds a safety to deactivating Wisp Form on Conduit.',
  );
  await mod.registerSetting(
    'checkbox',
    'well',
    'Arcane Well',
    'Adds a safety to opening an Arcane Well on Conduit.',
  );
  await mod.registerSetting(
    'checkbox',
    'mark',
    'Nexal Mark',
    'Adds a safety to creating a Nexal Mark on Conduit.',
  );

  // checkbox toggles hidden/shown button
  const hiddentoggle = (e) => {
    const targetbutton = e.target.nextElementSibling;
    if (e.target.checked) {
      targetbutton.style.visibility = 'visible';
    } else {
      targetbutton.style.visibility = 'hidden';
    }
  }

  const setHiddenButton = (path, regex=null, replaceVal=null) => {
    return async (mod) => {
      const buttons = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const len = buttons.snapshotLength;
      for (let i = 0; i < len; i++) {
        const btn = buttons.snapshotItem(i);
        if (btn.hasAttribute('confirmflag')) { continue; }
        btn.setAttribute('confirmflag', 1);
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.checked = false;
        box.addEventListener('click', hiddentoggle, false);
        if (regex && replaceVal !== null) {
          btn.textContent = btn.textContent.replace(regex, replaceVal);
        }
        const acell = btn.parentNode;
        acell.className = 'libNoWrap';
        acell.align = 'left';
        acell.insertBefore(box,btn);
        btn.style.visibility = 'hidden';
      }
    }
  }

  // checkbox toggles enabled/disabled button
  const disabletoggle = (e) => {
    const targetbutton = e.target.nextElementSibling;
    if (e.target.checked) {
      targetbutton.disabled = false;
    } else {
      targetbutton.disabled = true;
    }
  }

  const setDisableButton = (path, regex=null, replaceVal=null) => {
    return async (mod) => {
      const buttons = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const len = buttons.snapshotLength;
      for (let i = 0; i < len; i++) {
        const btn = buttons.snapshotItem(i);
        if (btn.hasAttribute('confirmflag')) { continue; }
        btn.setAttribute('confirmflag', 1);
        if (regex && replaceVal !== null) {
          btn.textContent = btn.textContent.replace(regex, replaceVal);
        }
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.checked = false;
        box.addEventListener('click', disabletoggle, false);
        const acell = btn.parentNode;
        acell.insertBefore(box,btn);
        btn.disabled = true;
      }
    }
  }

  // button that must be clicked twice to submit
  const doubleclick = (e) => {
    mod.debug(`Double click on ${e.target.nextElementSibling}`);
    e.target.nextElementSibling.click();
  }

  const setDoubleClickButton = (path, regex=null, replaceVal=null) => {
    return async (mod) => {
      const buttons = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const len = buttons.snapshotLength;
      for (let i = 0; i < len; i++) {
        const btn = buttons.snapshotItem(i);
        const newButton = document.createElement(btn.tagName)
        newButton.addEventListener('dblclick', doubleclick, false);
        if (regex && replaceVal !== null) {
          newButton.textContent = `${btn.textContent.replace(regex, replaceVal)}?`;
        } else {
          newButton.textContent = `${btn.textContent}?`;
        }
        newButton.className = btn.className;
        btn.parentNode.insertBefore(newButton, btn);
        btn.style.visibility = 'hidden';
      }
    }
  }

  // text field with an adjacent sibling button to disable
  const getToggleTextfieldSibling = (previousSibling=true) => {
    return (e) => {
      let button;
      if (previousSibling) {
        button = e.target.previousElementSibling;
      } else {
        button = e.target.nextElementSibling;
      }
      if (e.target.value !== '') {
        button.disabled = false;
      } else {
        button.disabled = true;
      }
    }
  }

  const safeTextfield = (path, previousSibling=true) => {
    return async (mod) => {
      const fields = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const len = fields.snapshotLength;
      for (let i = 0; i < len; i++) {
        const field = fields.snapshotItem(i);
        field.addEventListener('input', getToggleTextfieldSibling(previousSibling), false);
        if (previousSibling) {
          field.previousElementSibling.disabled = true;
        } else {
          field.nextElementSibling.disabled = true;
        }
      }
    }
  }

  if (await mod.getSetting('speech') === true) {
    await mod.registerMethod(
      'async',
      safeTextfield("//form[@name='speak' or @name='bullhorn']/input[@type='text']", true)
    );
  }
  if (await mod.getSetting('drop') === true) {
    await mod.registerMethod(
      'async',
      setHiddenButton(
        "//a[@class='item_drop' and contains(@href, 'op=drop')]",
        /^(\w).+/,
        '$1'
      )
    );
  }
  if (await mod.getSetting('craft') === true) {
    await mod.registerMethod(
      'async',
      setDisableButton("//form[@name='craft']/input[@type='submit' and starts-with(@value, 'Craft')]")
    );
    await mod.registerMethod(
      'async',
      setDisableButton("//form[@name='skill_craft']/input[@type='submit']")
    );
  }
  if (await mod.getSetting('repair') === true) {
    await mod.registerMethod(
      'async',
      setDisableButton("//form[@name='repair']/input[@type='submit' and starts-with(@value, 'Repair')]")
    );
  }
  if (await mod.getSetting('learn') === true) {
    await mod.registerMethod(
      'async',
      setHiddenButton(
        "//a[@class='item_use' and starts-with(text(), 'Learn')]",
        /^(\w).+/,
        '$1',
      )
    );
  }
  if (await mod.getSetting('loadwand') === true) {
    await mod.registerMethod(
      'async',
      setDoubleClickButton(
        "//a[@class='item_use' and starts-with(text(), 'Load')]",
        /^Load Spellwand/,
        'Load'
      )
    );
  }
  if (await mod.getSetting('blessing') === true) {
    await mod.registerMethod(
      'async',
      setDisableButton("//form[@name='skilluse']/input[@type='submit' and contains(@value, 'Blessing of Inspiration')]")
    );
  }
  if (await mod.getSetting('wisp') === true) {
    await mod.registerMethod(
      'async',
      setDisableButton("//form[@name='skilluse']/input[@type='submit' and starts-with(@value, 'Deactivate Wisp Form')]")
    );
  }
  if (await mod.getSetting('well') === true) {
    await mod.registerMethod(
      'async',
      setDisableButton("//form[@name='skilluse']/input[@type='submit' and starts-with(@value, 'Open Arcane Well')]")
    );
  }
  if (await mod.getSetting('mark') === true) {
    await mod.registerMethod(
      'async',
      setDisableButton("//form[@name='skilluse']/input[@type='submit' and starts-with(@value, 'Create Nexal Mark')]")
    );
  }
  if (await mod.getSetting('healself') === true) {
    await mod.registerMethod(
      'async',
      setDisableButton("//form[@name='skilluse']/input[@type='submit' and starts-with(@value, 'Heal Self')]")
    );
  }
})());


//#############################################################################
promiseList.push((async () => {
  if (!libC.inGame) { return; }
  const mod = await libC.registerModule(
    'thinbars',
    'Thin Character Bars',
    'local',
    'Full MP or HP bars are made thinner, to take less space and to stand out.',
    );

  const thinbars = async (mod) => {
    const healthbarImages = document.evaluate(
      "//img[@src='images/g/HealthBar_1.gif']",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    const manabarImages = document.evaluate(
      "//img[@src='images/g/MagicBar_1.gif']",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    let len = healthbarImages.snapshotLength;
    for (let i = 0; i < len; i++) {
      healthbarImages.snapshotItem(i).width = '2';
    }
    len = manabarImages.snapshotLength;
    for (let i = 0; i < len; i++) {
      manabarImages.snapshotItem(i).width = '2';
    }
  }

  await mod.registerMethod(
    'async',
    thinbars
    );
})());


//#############################################################################
promiseList.push((async () => {
  const mod = await libC.registerModule(
    'messagestyle',
    'Colour Message History',
    'global',
    'Adds styling to the message history to improve ease of reading. Includes combat actions, searches, speech, and more. Runs in both in-game and the character profile\'s week log',
  );

  const pfx = '^- (?:\\(\\d+ times\\) )?'; // message prefix
  const globalMatches = [
    { // fix the a(n) text based on vowels
      msg: /( a)(\((n)\)( [AEIOUaeiou])|\(n\)( [^AEIOUaeiou]))/g,
      op:'replace', val:'$1$3$4$5'
    },
    {
      msg: /(Your weapon was damaged during the attack\. It is now less effective!)/,
      op:'replace', val:'<b><u>$1</u></b>'
    },
    { //replace '' with ' due to a bug in the game
      msg: /(\'\')/g, op:'replace', val:"'"
    },
  ]
  const messageMatches = [
    {
      msg: new RegExp(`${pfx}You attack .*? with your .*? and hit for .*? damage\\.`),
      op:'pad', val:'libAttackHit'
    },
    {
      msg: new RegExp(`${pfx}You attack the (door|ward|fortifications) with `),
      op:'pad', val:'libFort'
    },
    {
      msg: new RegExp(`${pfx}You attack .*? with your .*? and miss\\.`),
      op:'pad', val:'libAttackMiss'
    },
    {
      msg:/You summon (dark forces and attempt to steal.+? You meet with success and drain|the Curse of Blood and touch .+?, inflicting the curse|your inner hatred to inflict the Agony Curse and touch .+?, inflicting the curse)/,
      op:'pad', val:'libAttackHit'
    },
    {
      msg: new RegExp(`${pfx}.*? attacked you with `),
      op:'pad', val:'libAttacked'
    },
    {
      msg:/( Your action causes you to| You| you|The Agony Curse causes you to) take( an additional)? \d+ (point(s)? of( \b[a-z]+\b)? damage|damage)(\.|!)?/,
      op:'pad', val:'libAttackedbyEnvironment'
    },
    {
      msg:/Your pet, .*? has been rejuvenated.\s*You spent \d+ Magic Point/,
      op:'pad', val:'libPetRejuv'
    },
    {
      msg:/ belonging to .*?, (healed you|has funneled life energy)/,
      op:'pad', val:'libPetHealMe'
    },
    {
      msg:/ belonging to .*?, healed .*? for \d+ hit point/,
      op:'pad', val:'libPetHealOthers'
    },
    {
      msg:/Your pet .+? attacked .+? and hit for /,
      op:'pad', val:'libPetHit'
    },
    {
      msg:/((Shambling|Infectious|Rotting) Zombie|.*, belonging to .*,) attacked you and hit for/,
      op:'pad', val:'libPetHitMe'
    },
    {
      msg:/(Your pet |[^,].*, belonging to).*, killing them!/,
      op:'pad', val:'libPetKill'
    },
    {
      msg:/(Your pet |[^,].*, belonging to|(Shambling|Infectious|Rotting) Zombie).* and missed/,
      op:'pad', val:'libPetMiss'
    },
    {msg:/attacked your pet,.*?and hit for /, op:'pad', val:'libPetHit'},
    {msg:/attacked your pet,.* killing it!.*/, op:'pad', val:'libPetKill'},
    {msg:/attacked .*? killing it!/, op:'pad', val:'libPetKill'},
    {msg:/attacked your pet.*? and missed/, op:'pad', val:'libPetMiss'},
    {
      msg:/, belonging to .*?, was killed by a defensive aura projected by /,
      op:'pad', val:'libPetKill'
    },
    {
      msg:/(Your pet .*?|.*?, belonging to .*?,|.*?, a .*?) has despawned/,
      op:'pad', val:'libPetDespawn'
    },
    {
      msg:/(.+?)<font color="#DD0000">(<b>.*<\/b>)<\/font>(.+)/,
      op:'replace',
      val:'<div class="libAchievement">$1<span class="libAchievementColour">$2</span>$3</div>'
    },
    {
      msg:/attacked .+? with .+?, killing (him|her|them)/,
      op:'pad', val:'libKill'
    },
    {msg:new RegExp(`${pfx}<a .+?</a> gave you a`), op:'pad', val:'libReceiveItem'},
    {msg:new RegExp(`${pfx}You give your `), op:'pad', val:'libGave'},
    {msg:/You call upon your crafting skills.*/, op:'pad', val:'libCraft'},
    {msg:/You search and find nothing.*/, op:'pad', val:'libSearchNothing'},
    {msg:/You search and find a.*/, op:'pad', val:'libSearchSuccess'},
    {msg:/You step (inside |outside of )/, op:'pad', val:'libGave'},
    {
      msg:/(You heal yourself and|healed you. You) gain \d+ hit point(s)?.*/,
      op:'pad', val:'libHealed'
    },
    {
      msg:/(heal|healed) you for \d+ point(s)? of damage.*/,
      op:'pad', val:'libHealed'
    },
    {
      msg:/(You heal|You use the .*? to heal|your surgeon skills to tend to .*?|place a stygian bone leech) .*? for \d+ point(s)? of damage/,
      op:'pad', val:'libHealed'
    },
    {msg:/You feel the effects of .+? fade\./, op:'pad', val:'libFaded'},
    {
      msg: new RegExp(`${pfx}<a [^<>]+?>[^<>]+</a> summoned a`),
      op:'pad', val:'libSummon'
    },
    {
      msg:/(suddenly appeared out of thin air\.|disappeared from view\.)/,
      op:'pad', val:'libSummon'
    },
    {
      msg:/spoke words of mystic power and traced eldritch shapes into the air. A burst of warmth rushed through the area as they finished the incantation/,
      op:'pad', val:'libSummon'
    },
    {
      msg: new RegExp(`(${pfx}You (?:say|whisper|emote), )(".+)`),
      op: 'replace',
      val:'<div class="libSpeech"><span class="libEmote">$1</span>$2</div>'
    },
    {
      msg: new RegExp(`${pfx}((Someone used a|You use your) bullhorn to say: ')`),
      op:'pad', val:'libEmote'
    },
    { // broad catch-all emote
      msg: new RegExp(`(${pfx}<a [^<>]+>[^<>]+</a> [^<>]+?)(".+")(.+)`),
      op: 'replace',
      val:'<div class="libSpeech"><span class="libEmote">$1</span>$2<span class="libEmote">$3</span></div>'
    },
  ];

  const singleMatcher = (message, mmObj) => {
    if (!message.match(mmObj.msg)) { return null; }
    if (mmObj.op === 'pad') {
      return `<div class="${mmObj.val}">${message}</div>`;
    } else if (mmObj.op === 'replace') {
      return message.replace(mmObj.msg, mmObj.val);
    } else {
      mod.error(`Unrecognised message matcher object operation '${mmObj.op}'`);
    }
    return null;
  }

  const singleMessage = async (message) => {
    let finalStr = message;
    for (const mmObj of messageMatches) {
      const matcherResult = singleMatcher(finalStr, mmObj);
      if (matcherResult) {
        finalStr = matcherResult;
        break;
      }
    }
    for (const mmObj of globalMatches) {
      const matcherResult = singleMatcher(finalStr, mmObj);
      if (matcherResult) {
        finalStr = matcherResult;
      }
    }
    return finalStr;
  }

  const messagehistory = async (mod) => {
    const messageElement = document.getElementById('Messages');
    if (!messageElement) { return; }
    const histSib = messageElement.previousElementSibling;
    if (histSib && !histSib.innerHTML.match(/This Week/)) {
      // resize message history box
      const loc = location + '';
      if (loc.match(/name=Game(&op=connect)?$/) && timesCharExist(messageElement.innerHTML, '\n') > 13) {
        messageElement.style.height = '250px';
      }
      messageElement.style.resize = 'vertical';
    }
    const messages = messageElement.innerHTML.split('\n');
    const msgPromises = messages.map(singleMessage);
    await Promise.all(msgPromises);
    const finalMessages = [];
    for (const msgPromise of msgPromises) {
      finalMessages.push(await msgPromise);
    }
    messageElement.innerHTML = finalMessages.join('');
  }

  await mod.registerMethod(
    'async',
    messagehistory
  );
})());


//#############################################################################
promiseList.push((async () => {
  if (!libC.inGame) { return; }
  const mod = await libC.registerModule(
    'shortweapon',
    'Short Weapon Select',
    'local',
    'Offers many quick tweaks to the weapon pane, focused around shortening the lengthy attack details in the drop-down menu.',
  );

  await mod.registerSetting(
    'checkbox',
    'damage',
    'Shorten Damage',
    'Shortens the damage and accuracy counts in drop-downs.',
  );
  await mod.registerSetting(
    'checkbox',
    'shots',
    'Shorten Shots/Ammo',
    'Shortens the shots remaining (or charges) in drop-downs.',
  );
  await mod.registerSetting(
    'checkbox',
    'gems',
    'Shorten Gems/Touch Attacks',
    'Shortens spellgems and non-damaging attacks such as glyphs/dark heart/blood curse in drop-downs.',
  );
  await mod.registerSetting(
    'checkbox',
    'enchants',
    'Shorten Enchants',
    'Shortens enchanted and magical items in drop-downs.',
  );
  await mod.registerSetting(
    'checkbox',
    'quality',
    'Shorten Quality',
    'Shortens weapon quality levels to the Q5 system.',
  );

  // display shorter damage/to-hit chance
  const shortDamage = async (opt) => {
    opt.innerHTML = opt.innerHTML.replace(/ - (\d+) dmg.?, (\d+)% to hit/, '-$1/$2%');
  }

  // display shortened shot amounts
  const shortShots = async (opt) => {
    opt.innerHTML = opt.innerHTML.replace(/\((\d+) shots\)/, '\($1s\)');
  }

  // display shortened spellgem names (and special touch attacks)
  const shortGems = async (opt) => {
    opt.innerHTML = opt.innerHTML.replace(/^Spellgem/, 'Gem');
    opt.innerHTML = opt.innerHTML.replace(/(-( [0-5] dmg| ), -?(\d+)% to hit$)/, '');
    opt.innerHTML = opt.innerHTML.replace(/(Glyph of )/, '');
  }

  // display shortened enchant/magical status
  const shortEnchant = async (opt) => {
    opt.innerHTML = opt.innerHTML.replace(/\((magical|enchanted)\)/, '(mag)');
  }

  // display shortened weapon quality
  const shortQuality = async (opt) => {
    const qualityLevels = {
      'pristine':'+Q5+',
      'good':'+Q4+',
      'average':'=Q3=',
      'worn':'-Q2-',
      'broken':'-Q1-',
      'destroyed':'-Q0-',
    }
    const qualMatch = opt.innerHTML.match(/ \((pristine|good|average|worn|broken|destroyed)\) /);
    if (!qualMatch) { return; }
    opt.innerHTML.replace(/ \((pristine|good|average|worn|broken|destroyed)\) /, qualityLevels[qualMatch[1]]);
  }

  const damageEnabled = mod.getSetting('damage', false);
  const shotsEnabled = mod.getSetting('shots', false);
  const gemsEnabled = mod.getSetting('gems', false);
  const enchantsEnabled = mod.getSetting('enchants', false);
  const qualityEnabled = mod.getSetting('quality', false);

  const shortenOption = async (optionElement) => {
    if (damageEnabled) { await shortDamage(optionElement); }
    if (shotsEnabled) { await shortShots(optionElement); }
    if (gemsEnabled) { await shortGems(optionElement); }
    if (enchantsEnabled) { await shortEnchant(optionElement); }
    if (qualityEnabled) { await shortQuality(optionElement); }
  }

  const singleSelect = async (selectElement) => {
    const optElements = selectElement.getElementsByTagName('option');
    if (optElements.length === 0) { return; }
    const shortOptPromises = Array.prototype.map.call(optElements, shortenOption);
    await Promise.all(shortOptPromises)
  }

  const shortWeaponSelects = async (mod) => {
    const weaponSelects = document.evaluate(
      "//select[@name='attacking_with_item_id']",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    const len = weaponSelects.snapshotLength;
    if (len === 0) { return; }
    for (let i = 0; i < len; i++) {
      singleSelect(weaponSelects.snapshotItem(i));
    }
  }

  await mod.registerMethod(
    'async',
    shortWeaponSelects
  );
})());


//#############################################################################
promiseList.push((async () => {
  if (!libC.inGame) { return; }
  const mod = await libC.registerModule(
    'pickup',
    'Default Pick-Up Items',
    'local',
    'Defaults to items such as hatchets or bottles/potions for picking up items from the floor. Mandatory for mundane throwing classes.',
  );

  const pickUpOpts = [
    {value:'null', text:'None'},
    {value:'hatchet', text:'Hatchet'},
    {value:'misc', text:'Unknown/Misc.'},
    {value:'drink', text:'Bottle/Potion'},
    {value:'food', text:'Cans/Food'},
    {value:'knife', text:'Throwing Knife'},
    {value:'rock', text:'Rock'},
  ];
  await mod.registerSetting(
    'select',
    'priority1',
    'Highest Priority',
    'Always selects these items for pickup. Suggested either Hatchet or Misc.',
    pickUpOpts,
  );
  await mod.registerSetting(
    'select',
    'priority2',
    'High Priority',
    'Selects these items for pick-up if there are no higher priority items on the floor.',
    pickUpOpts,
  );
  await mod.registerSetting(
    'select',
    'priority3',
    'Normal Priority',
    'Selects these items for pick-up if there are no higher priority items on the floor.',
    pickUpOpts,
  );
  await mod.registerSetting(
    'select',
    'priority4',
    'Low Priority',
    'Selects these items for pick-up if there are no higher priority items on the floor.',
    pickUpOpts,
  );
  await mod.registerSetting(
    'select',
    'priority5',
    'Lower Priority',
    'Selects these items for pick-up if there are no higher priority items on the floor.',
    pickUpOpts,
  );
  await mod.registerSetting(
    'select',
    'priority6',
    'Lowest Priority',
    'Only selects these items for pick-up if there are no other items on the floor.',
    pickUpOpts,
  );

  const drinkMatch = /(.+, a(n)? )?(Bottle of .+|Absinthe|Vial of .+)/;
  const foodMatch = /(.+, a(n)? )?(Can of .+|Cup of .+|Apple)/;
  const rockMatch = /(.+, a(n)? )?Rock/;
  const knifeMatch = /(.+, a(n)? )?Throwing Knife/;
  const hatchetMatch = /(.+, a(n)? )?Hatchet/;
  const validMatchers = ['drink', 'food', 'rock', 'knife', 'hatchet', 'misc', null];
  const priorities = []; // list of objects {matchType:'misc', index:option index}

  // currently there are six priority levels
  for (let i = 1; i <= 6; i++) {
    // ensures valid settings, and construct list of highest to lowest priorities
    let tempVal = await mod.getSetting(`priority${i}`, null);
    if (validMatchers.indexOf(tempVal) === -1) {
      tempVal = null;
    }
    await mod.setSetting(`priority${i}`, tempVal);
    if (tempVal !== null) {
      priorities.push({matchType: tempVal, index:-1});
    }
  }

  const getOptionType = async (opt) => {
    const txt = opt.textContent;
    let type = 'misc';
    if (txt.match(drinkMatch)) { type = 'drink'; }
    else if (txt.match(foodMatch)) { type = 'food'; }
    else if (txt.match(rockMatch)) { type = 'rock'; }
    else if (txt.match(knifeMatch)) { type = 'knife'; }
    else if (txt.match(hatchetMatch)) { type = 'hatchet'; }
    return {matchType: type, index: opt.index};
  }

  const singleForm = async (form) => {
    const select = form.lastElementChild;
    const opts = select.getElementsByTagName('option');
    const optPromises = opts.map(getOptionType);
    await Promise.all(optPromises);
    for (const prom of optPromises) {
      const matchObj = await prom;
      for (const priorityObj of priorities) {
        if (priorityObj.index === -1 && matchObj.matchType === priorityObj.matchType) {
          priorityObj.index = matchObj.index
        }
      }
    }
    for (const priorityObj of priorities) {
      if (priorityObj.index !== -1) {
        select.selectedIndex = priorityObj.index;
        break;
      }
    }
  }

  const defaultPickups = async (mod) => {
    const puForms = document.evaluate(
      "//form[@name='pickup']",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    let len = puForms.snapshotLength;
    if (len === 0) { return; }
    for (let i = 0; i < len; i++) {
      singleForm(puForms.snapshotItem(i));
    }
  }

  await mod.registerMethod(
    'async',
    defaultPickups
  );
})());


//#############################################################################
promiseList.push((async () => {
  if (!libC.inGame) { return; }
  const mod = await libC.registerModule(
    'warnheaders',
    'Warning Headers',
    'local',
    'Changes the pane headers to warning colours when low AP or low HP',
  );

  await mod.registerSetting(
    'textfield',
    'ap',
    'Low AP Threshold',
    'Displays warning headers when AP is less than this.',
  );
  await mod.registerSetting(
    'textfield',
    'hp',
    'Low HP Threshold',
    'Displays warning headers when HP is less than this.',
  );
  await mod.registerSetting(
    'checkbox',
    'move',
    'Warning Move Buttons',
    'Changes the borders of move buttons to be black dashed warnings when your character is at risk.',
  );

  const warnheaders = async (mod) => {
    const lowHP = await ensureIntegerSetting(mod, 'hp', 30);
    const lowAP = await ensureIntegerSetting(mod, 'ap', 13);
    let headerColour = '';
    let headerTitle = '';
    if (libC.charinfo.hp < lowHP) {
      headerColour = 'crimson';
      headerTitle = 'LOW HP';
    } else if (libC.charinfo.ap < lowAP) {
      headerColour = 'gold';
      headerTitle = 'LOW AP';
    } else {
      return;
    }
    // headings between game sections (e.g. description pane, attack pane, etc.)
    const paneTitles = document.getElementsByClassName('panetitle');
    let len = paneTitles.length;
    for (let i = 0; i < len; i++) {
      paneTitles[i].style.color = headerColour;
      paneTitles[i].title = headerTitle;
    }
    // move buttons
    if (headerTitle && await mod.getSetting('move') === true) {
      const moves = document.getElementsByName('move');
      len = moves.length;
      for (let i = 0; i < len; i++) {
        moves[i].children[1].style.borderColor = 'black';
        moves[i].children[1].style.borderStyle = 'dotted';
      }
    }
  }

  await mod.registerMethod(
    'async',
    warnheaders
  );
})());


//#############################################################################
promiseList.push((async () => {
  if (!libC.inGame) { return; }
  const mod = await libC.registerModule(
    'saveforms',
    'Save Forms',
    'local',
    'Saves the charged attack(s) or any other drop-downs that you use, so that you don\'t have to reselect them each time. Click the "Game Map" button to store your settings safely, or use the form with your preferred saved options.',
  );

  await mod.registerSetting(
    'checkbox',
    'charge-type-1',
    'Charge Type 1',
    'Remembers charged attacks of the first kind, i.e. most charged attacks. (Such as arcane shot, sanctify/taint spell, focused attack/smite/most charged attacks)',
  );
  await mod.registerSetting(
    'checkbox',
    'charge-type-2',
    'Charge Type 2',
    'Remembers charged attacks of the second kind, i.e. rare types like mystic seeker',
  );
  await mod.registerSetting(
    'checkbox',
    'precision',
    'Clockwork Precision',
    'Remembers the amount for Seraphim\'s Eye of Clockwork Precision.',
  );
  await mod.registerSetting(
    'checkbox',
    'prayer',
    'Prayer',
    'Remembers the last prayer type and maintains it.',
  );
  await mod.registerSetting(
    'checkbox',
    'repair',
    'Repair Item',
    'Remembers the last item repaired and maintains it.',
  );

  const storeOption = async (key, selectElement) => {
    const val = selectElement.options[selectElement.selectedIndex].value;
    if (val) {
      await mod.setSetting(key, val);
    }
  }

  const getSafeStore = (key, path) => {
    // finds just the first element to store settings from
    return (e) => {
      const selects = document.evaluate(path, document, null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (selects.length === 0) {
        return;
      }
      storeOption(key, selects.snapshotItem(0));
    }
  }

  const getLiveStore = (key, selectName) => {
    return (e) => {
      const select = e.target.parentNode[selectName];
      storeOption(key, select);
    }
  }

  const rememberForm = async (key, path, selectName) => {
    const selectElements = document.evaluate(path, document, null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const len = selectElements.snapshotLength;
    const val = await mod.getSetting(key, null);
    for (let i = 0; i < len; i++) {
      const sel = selectElements.snapshotItem(i);
      const button = document.evaluate("input[@type='submit']", sel.parentNode,
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
      button.addEventListener('click', getLiveStore(key, selectName), true);
      if (val === null) {
        continue; // skip if no option to remember
      }
      const options = sel.options;
      const jlen = options.length;
      for (let j = 0; j < jlen; j++) {
        if (options[j].value === val) {
          sel.selectedIndex = j;
          break;
        }
      }
    }
  }

  const getSingleForm = (key, path, selectName) => {
    return async (mod) => {
      const rememberPromise = rememberForm(key, path, selectName);
      const refresh = document.evaluate("//li[@class='topmenu']/a[text()='Game Map']",
        document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (refresh.snapshotLength !== 0) {
        refresh.snapshotItem(0).addEventListener('click', getSafeStore(key, path), true);
      }
      await rememberPromise;
    }
  }

  if (await mod.getSetting('charge-type-1') === true) {
    await mod.registerMethod(
      'async',
      getSingleForm('store-charge-type-1', "//select[@name='powerup']", 'powerup')
    );
  }
  if (await mod.getSetting('charge-type-2') === true) {
    await mod.registerMethod(
      'async',
      getSingleForm('store-charge-type-2', "//select[@name='powerup2']", 'powerup2')
    );
  }
  if (await mod.getSetting('precision') === true) {
    await mod.registerMethod(
      'async',
      getSingleForm('store-precision', "//select[@name='clockwork_precision']", 'clockwork_precision')
    );
  }
  if (await mod.getSetting('prayer') === true) {
    await mod.registerMethod(
      'async',
      getSingleForm('store-prayer', "//select[@name='prayertype']", 'prayertype')
    );
  }
  if (await mod.getSetting('repair') === true) {
    await mod.registerMethod(
      'async',
      getSingleForm('store-repair', "//form[@name='repair']/select[@name='item']", 'item')
    );
  }
})());


//#############################################################################
promiseList.push((async () => {
  if (!libC.inGame) { return; }
  const mod = await libC.registerModule(
    'petinterface',
    'Pet Interface',
    'local',
    'Vastly improves upon the pet interface with colours, countdowns, hover information, and indicators for the lowest pets.',
  );

  await mod.registerSetting(
    'checkbox',
    'surplus',
    'Count to MP Surplus',
    'If checked, will display decay times and hilight based on time until AP equals MP, rather than just AP counts.',
  );
  await mod.registerSetting(
    'textfield',
    'ap-critical',
    'AP Critical',
    'Hilights the pet row when their AP (or AP surplus) is below this threshold.',
  );
  await mod.registerSetting(
    'textfield',
    'ap-low',
    'AP Low',
    'Hilights the pet row when their AP (or AP surplus) is nearing low.',
  );

  const getTick = () => {
    const tick = new Date();
    tick.setMinutes(tick.getMinutes() - (tick.getMinutes() % 15));
    tick.setSeconds(0);
    return tick;
  }

  const parsePetRow = async (row) => {
    const rowObj = {
      'row': row,
      'name': null,
      'petType': null,
      'rejuveCost': null,
      'ap': null,
      'mp': null,
      'hp': null,
      'stance': null,
      'stanceSelect': null,
      'stanceSubmit': null,
    }

    const rename = document.evaluate(
      'td[starts-with(@title, "Rename")]/form/input[@type="text" and @name="pet_name"]',
      row, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (rename.snapshotLength === 1) {
      const field = rename.snapshotItem(0);
      rowObj.name = field.value;
      const petTypeMatch = field.parentElement.innerText.match(/\((.+?)\)/)
      if (petTypeMatch) {
        rowObj.petType = petTypeMatch[1];
      } else {
        rowObj.petType = rowObj.name;
      }
    } else {
      mod.error(`Unable to parse pet name: "${rowObj.row.innerHTML}"`);
    }

    const rejuve = document.evaluate(
      'td[starts-with(@title, "Rejuvenate")]/form/input[@type="submit"]',
      row, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (rejuve.snapshotLength === 1) {
      rowObj.rejuveCost = parseInt(rejuve.snapshotItem(0).value);
    } else {
      mod.error(`Unable to parse pet rejuve: "${rowObj.row.innerHTML}"`);
    }

    try {
      rowObj.ap = parseInt(row.cells[2].innerHTML);
      rowObj.mp = parseInt(row.cells[3].innerHTML);
      rowObj.hp = parseInt(row.cells[4].innerHTML);
    } catch (err) {
      mod.error(`Error parsing pet stats in petrow: "${err.message}" with row "${row.innerHTML}"`);
    }

    const stanceSubmit = document.evaluate(
      'td/form[@name="pet_stance"]/input[@type="submit"]',
      row, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (stanceSubmit.snapshotLength === 1) {
      rowObj.stanceSubmit = stanceSubmit.snapshotItem(0);
    } else {
      mod.error(`Unable to find stance submit: "${rowObj.row.innerHTML}"`);
    }
    const stanceSelect = document.evaluate(
      'td/form[@name="pet_stance"]/select[@name="stance"]',
      row, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (stanceSelect.snapshotLength === 1) {
      rowObj.stanceSelect = stanceSelect.snapshotItem(0);
      rowObj.stance = rowObj.stanceSelect.options[rowObj.stanceSelect.selectedIndex].value;
    } else {
      mod.error(`Unable to find stance select: "${rowObj.row.innerHTML}"`);
    }
    return rowObj;
  }

  const setRowClass = async (rowObj, surplusEnabled, apCrit, apLow, minPetIdx) => {
    let rowClass = rowObj.row.getAttribute('class');
    if (!rowClass) {
      rowClass = '';
    }
    let relativeAP = rowObj.ap;
    if (surplusEnabled === true) {
      relativeAP = rowObj.ap - rowObj.mp;
    }
    if (rowObj.ap < rowObj.mp) {
      rowClass = `${rowClass} petstatus-mpsurplus`;
    } else if (relativeAP < apCrit) {
      rowClass = `${rowClass} petstatus-apcritical`;
    } else if (relativeAP < apLow) {
      rowClass = `${rowClass} petstatus-aplow`;
    }
    if (minPetIdx < 2 && minPetIdx >= 0) {
      rowClass = `${rowClass} petstatus-minpet${minPetIdx}`;
    }
    if (rowClass !== rowObj.row.getAttribute('class')) {
      rowObj.row.setAttribute('class', rowClass);
    }
  }

  const displayDecayTime = async (rowObj, tick, surplusEnabled) => {
    const timeEmpty = new Date(tick);
    let relativeAP = rowObj.ap
    if (surplusEnabled === true && rowObj.ap > rowObj.mp) {
      relativeAP = rowObj.ap - rowObj.mp;
    }
    timeEmpty.setMinutes(tick.getMinutes() + (relativeAP * 15));
    rowObj.row.insertCell(7);
    rowObj.row.cells[7].innerHTML = `${relativeAP / 4}h`;
    rowObj.row.cells[7].title = `Decay at ${timeEmpty.toTimeString()} on ${timeEmpty.toDateString()}`;
  }

  const setStanceForm = async (rowObj) => {
    if (rowObj.stanceSelect === null || rowObj.stanceSubmit === null) { return; }
    rowObj.stanceSubmit.style.display = 'none';
    rowObj.stanceSelect.onchange = function() { this.form.submit(); };
  }

  const modifyRow = async (rowObj, tick, surplusEnabled, apCrit, apLow, minPetIdx) => {
    const displayPromise = displayDecayTime(rowObj, tick, surplusEnabled);
    const rowClassPromise = setRowClass(rowObj, surplusEnabled, apCrit, apLow, minPetIdx);
    const stancePromise = setStanceForm(rowObj);
    await displayPromise;
    await rowClassPromise;
    await stancePromise;
  }

  const modifyPetTable = async (table) => {
    table.style.width = table.offsetWidth - 4;
    table.rows[1].insertCell(7);
    table.rows[1].cells[7].innerHTML = 'Decay';
  }

  const petInterface = async (mod) => {
    const apCritical = await ensureIntegerSetting(mod, 'ap-critical', 8);
    const apLow = await ensureIntegerSetting(mod, 'ap-critical', 20)
    const surplusEnabled = await mod.getSetting('surplus', false);
    const tick = getTick();
    const table = document.evaluate(
      "//table[tbody[tr[td[@title='Rename Pet']]]]",
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    if (table.snapshotLength === 0) {
      mod.debug('No pet table detected');
      return;
    }
    await modifyPetTable(table.snapshotItem(0));
    // parse rows
    const petRows = document.evaluate(
      "//tr[td[@title='Rename Pet']]",
      table.snapshotItem(0), null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    const parseRowPromises = [];
    const len = petRows.snapshotLength;
    for (let i = 0; i < len; i++) {
      parseRowPromises.push(parsePetRow(petRows.snapshotItem(i)));
    }
    const petRowObjs = [];
    for (const rowPromise of parseRowPromises) {
      petRowObjs.push(await rowPromise);
    }
    // sort and modify rows
    petRowObjs.sort(getSortByProperty('ap', false));
    const modRowFunc = async (rowObj) => {
      const minPetIdx = petRowObjs.indexOf(rowObj);
      await modifyRow(rowObj, tick, surplusEnabled, apCritical, apLow, minPetIdx);
    }
    const modifyRowPromises = petRowObjs.map(modRowFunc);
    await Promise.all(modifyRowPromises);
  }

  await mod.registerMethod(
    'async',
    petInterface
  );
})());


(async () => {
  libC.addGlobalStyle(await GM.getResourceUrl('libCCSS'));
  await Promise.all(promiseList);
  myPromise.resolve();
  libC.runLibC();
})();
