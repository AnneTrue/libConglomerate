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
  return String(n) === str && n >= 0;
}


// forces ints to be a two character string and a minimum
function fluffDigit(x) {
  if (x < 10 && x >= 0) {
    return `0${x}`;
  }
}


// sorts a list by the
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


//#############################################################################
promiseList.push((async () => {
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
  const ensureSortSetting = async (name) => {
    const sort = getSortSingle(await mod.getSetting(name));
    await mod.setSetting(name, sort);
    return sort;
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
    const victimText = createCharsHTML(charLists.victims, 'victims');
    const friendText = createCharsHTML(charLists.friends, 'friends');
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


(async () => {
  libC.addGlobalStyle(await GM.getResourceUrl('libCCSS'));
  await Promise.all(promiseList);
  myPromise.resolve();
  libC.runLibC();
})();
