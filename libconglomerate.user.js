// ==UserScript==
// @name           LibC
// @description    Lib's Conglomerated Scripts
// @include        http://nexusclash.com/modules.php?name=Game*
// @include        http://www.nexusclash.com/modules.php?name=Game*
// @exclude        http://nexusclash.com/modules.php?name=Game&op=disconnect
// @exclude        http://www.nexusclash.com/modules.php?name=Game&op=disconnect
// @grant          GM_getValue
// @grant          GM_setValue
// @version     3.0
// ==/UserScript==

(function () {
versionStr = '3.0'; // version updates go here too!

libCLogging = true;         // logs to console; can disable if you want
libCLoggingVerbose = true; // enable for dev-work


//#############################################################################
// boilerplate functions:

// takes list of css to inject into the global style sheet
// uses list to batch the operation, instead of multiple read/write operations to DOM
function addGlobalStyle(list) {
    var head, style, i, len, css= '';
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    len = list.length;
    for (i = 0; i < len; i++) { css += list[i]; }
    style.innerHTML = css;
    head.appendChild(style);
}

// generic functions
function timesCharExist(x, c){ var t=0,l=0;c=c+''; while(l=x.indexOf(c,l)+1)++t; return t; }
function ucfirstletter(str){ return str.replace(/\b[A-Za-z]/,function($0) { return $0.toUpperCase(); }); }
function isNormalInteger(str) { var n = ~~Number(str); return String(n) === str && n >= 0; }

// forces ints to be two digits long for displaying as string
function fluffDigit(x) { if (x<10) { x = '0'+x; } return x; }

// platform support: GM is provided by greasemonkey, if not assume chrome and use localStorage
try {
    if (!this.GM_getValue || (this.GM_getValue.toString && this.GM_getValue.toString().indexOf('not supported') > -1)) {
        this.GM_getValue = function (key, def) { return localStorage[key] || def; };
        this.GM_setValue = function (key, value) { localStorage[key] = value; return true; };
        this.GM_deleteValue = function (key) { return delete localStorage[key]; };
    }
} catch (e) { logLibC('LibC: GM_set/get error:\n' + e.message); }

// global info: used to determine if script can safely run without errors (and also character info)
var charinfodiv = null, levelclass = null, levelclassname = '', charinfoid = null;
if (document.getElementById('CharacterInfo')) { //get general data from the page
    charinfodiv = document.getElementById('CharacterInfo');
    levelclass = charinfodiv.getElementsByTagName('td')[1];
    levelclassname = /Level [0-9]+ (.+)/.exec(levelclass.innerHTML)[1];
    charinfoid = charinfodiv.getElementsByTagName('a')[0].href.match(/id=(\d+)$/)[1];
}

// custom CSS for script; injected into page
var injectedcss = [
    'span.hptext { font-size: xx-small; color: #ff0099; }',
    'span.hptext2 { font-size: xx-small; color: black; }',
    'tr.petstatus-aplow { background-color: #999999; }',
    'tr.petstatus-apcritical { background-color: #999933; }',
    'tr.petstatus-mpsurplus { background-color: #cc6677; color:black; }',
    'tr.petstatus-nextpet td { border-top: 2px solid black; border-bottom: 2px solid black; }',
    'tr.petstatus-nextpet2 td { border-top: 1px solid black; border-bottom: 1px solid black; }',
    'tr.recipe-complete { background-color: #dddddd; }',
    'tr.recipe-partial { background-color: #bbbbbb; }',
    'tr.recipe-empty { background-color: #999999; color: #444444; }',
    'span.component-rare { color: #882255; }',
    'span.component-uncommon { color: #117733; }',
    'span.component-common { }',
    'td.component-rare { color: #882255; font-weight: bold; }',
    'td.component-uncommon { color: #117733; font-weight: bold; }',
    'td.component-common { font-weight: bold; }',
    'span.component-undefined { font-style: italic; }',
    'span.component-fixed { font-style: italic; }',
    'span.immutable { font-weight: bold; }',
    'span.match-safe { background-color: #ddcc77; }',
    'span.match-inventory { background-color: #88ccee; }',
    'span.safeEmpty { color: #000000; font-weight: bold; }',
    'span.safeLow { background-color: #cc6677; }',
    'span.safeMid { background-color: #ddcc77; }',
    'span.safeHigh { background-color: #88ccee; }',
    'input.retrieveSafe { background: none; border: none; color: blue; text-decoration: underline; cursor: pointer; margin: 0; padding: 0; display: inline; }',
    'tr.recipe-complete.completionlevel-inventory { background-color: #44aa99; }',
    'tr.recipe-complete.completionlevel-safe { background-color: #999933; }',
    'option.safeitem-rare { background-color: #882255; color: #ffffff; }',
    'option.safeitem-uncommon { background-color: #117733; color: #ffffff; }',
    'option.safeitem-common { background-color: #999999; color: #ffffff; }',
    'tr.recipe-partial form { display: none; }',
    'td.recipename { width: 99px; }',
    'td.recipelist { width: 170px; }',
    'td.summarycell { width: 26px; }',
    'td.summarycell.summary-empty { background-color: #777777; }',
    'td.match-safe { background-color: #ddcc77; }',
    'td.match-inventory { background-color: #88ccee; }',
    'td.MageHealthBar { background-repeat: no-repeat; background-position: left bottom; margin-bottom: 0px; position: relative; top: -10px; background-image: url(data:image/gif;base64,R0lGODlhAQAFAIABAACZAP%2F%2F%2FywAAAAAAQAFAAACAoRdADs%3D); }',
    'td.MageHealthBar2 { background-repeat: no-repeat; background-position: left bottom; margin-bottom:0px; background-image: url(data:image/gif;base64,R0lGODdhAQAFAIACAAAAAP8AACwAAAAAAQAFAEACAoxdADs=); }',
    '.bar{ line-height=: 1px; height: 5px; display: inline-block; margin: 0 0 0 0; padding: 0 0 0 0; position: absolute; top: 20px; #bottom: 1px; background-color: #ff0000; left: 0px; }',
    '.bar2{ line-height=: 1px; height: 5px; display: inline-block; margin: 0 0 0 0; padding: 0 0 0 0; position: absolute; top: 20px; #bottom: 1px; background-color: #00ff00; left: 0px; }',
    '.numberdiv{ display: inline-block; padding: 0 0 0 0; margin: 0 0 0 0; width: 20px; position: relative; }',
    'td.MageNoWrap { white-space: nowrap ! important; }',
    'a.MageHide { display: none ! important; }',
    'img.MageBarBck { position: absolute; left: 1; top: 18; display: inline; z-index: 0 }',
    'img.MageBar { position: absolute; left: 1; top: 18; display: inline; z-index: 1 }',
    'div.MagePetHit { font-size: smaller; color: lightcoral ! important; padding-left: 4em; }',
    'div.MagePetHitMe { font-size: smaller; color: red ! important; padding-left: 4em; }',
    'div.MagePetKill { font-size: smaller; color: crimson; padding-left: 4em; }',
    'div.MagePetMiss { font-size: smaller; color: #CAA083; padding-left: 4em; }',
    'div.MagePetHealOthers { font-size: smaller; color: #5050aa; padding-left: 4em; }',
    'div.MagePetHealMe { font-size: smaller; color: #0808aa; padding-left: 4em; }',
    'div.MagePetRejuv { font-size: smaller; color: #aa50aa; padding-left: 4em; }',
    'div.MagePetDespawn { font-size: smaller; color: #ff8000; padding-left: 4em;}',
    'div.MageAttackHit { color: red ! important; }',
    'div.MageAttackMiss { color: deeppink; }',
    'div.MageAttacked { color: red; font-weight: 600; }',
    'div.MageAttackedbyEnvironment { color: red; font-weight: 100; }',
    'div.MageHealed { color: #0808aa; }',
    'div.MageAchievement { font-size: smaller; padding-left: 4em; }',
    'span.MageAchievementColour { color: #aa0000; }',
    'div.MageSpeech { color: dodgerblue; }',
    'div.MageAction { color: #aaaaff; }',
    'div.MageWhisper{ color: MediumOrchid; }',
    'span.MageMe{ color: darkblue; }',
    'div.MageReceivedSomething{ color: #ff8040; }',
    'div.MageCraft{ color: #8d4f9d; }',
    'div.MageSearchNothing{ color: #8c8c55; }',
    'div.MageSearchYay{ color: #8c8c00; }',
    'span.libshadows{ color: #dd0101; font-weight: bold; }',
    'span.liblights{ color: dodgerblue; }',
    'span.liblightsoff{ color: #bf4020; }',
    'div.libfaded { color: red; }',
    'div.libkill { color: red; font-weight: 600; }',
    'div.libgave { color: #bf4020; }',
    'div.libsummon { color: red; ! important; }',
    'div.libfort { color: #9900ff; font-size: smaller; }',
    'span.libgood { color: #11dd11; }',
    'span.libbad { color: #dd1111; }',
    'table.libc-settingtable { width: 100%; }',
    'tr.libc-settingrow { background-color: #dddddd; }',
    'td.libc-settingname { width: 20px; }',
    'td.libc-settinglist { width: 90px; }',
    'span.libc-settingspan { background-color: #bbbbbb; border: 1px dotted black; }',
    'input.liblink { background: none; border: none; color: white; text-decoration: underline; cursor: pointer; margin: 0; padding: 0; display: inline; }',
    'span.char { white-space: nowrap; }'
    ];
// now inject CSS
addGlobalStyle(injectedcss);


//#############################################################################
// tweak 0: highlight shadows from outside buildings
function showhilights() {
    var locSnapShot, desc, descString, descdiv, descMatch, puforms, targetdesc, pucount;
    locSnapShot = document.evaluate("//td[@valign='top']/b/u", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    if (locSnapShot.snapshotLength === 0) { return; } // sentinel exit condition; no location description to find

    desc = locSnapShot.snapshotItem(0).parentElement.nextElementSibling.nextElementSibling.nextSibling; //please don't cringe

    // lights and shadows
    descString = desc.textContent;
    descdiv = document.createElement('div');
    descdiv.id = 'libdesc';
    descMatch = descString.match(/(([\s\S]+)?(The lights are on inside the building|The building lights illuminate the area|The building windows are dark|The building lights are off|The lights inside the building appear to be off|The lights seem to be off throughout the neighorhood|The building is dark\. In fact, the lights seem to be off all throughout the neighorhood|The lights seem to be off throughout the neighorhood))?(([\s\S]+)?(There are several shadows moving in the windows|The occasional shadow can be glimpsed moving in the windows))?([\s\S]+)/);
    if (descMatch) { desctextmatches(descdiv, descMatch); }
    else { descdiv.appendChild(document.createTextNode(descString)); } // if no match, just put the string back where it was
    
    // targets/items set up in location
    if (getSetting('hilights-extra-targets') == 'true') { //try to add number of targets
        puforms = document.evaluate("//form[@name='pickup']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        targetdesc = document.createElement('span');
        if (puforms.snapshotLength == 1) {
            pucount = puforms.snapshotItem(0).getElementsByTagName('select')[0].length;
            targetdesc.className = 'liblights'; //reusing dodgerblue css
            if (pucount == 1) { targetdesc.appendChild(document.createTextNode(' There is an item on the floor.'));
            } else { targetdesc.appendChild(document.createTextNode(' There are '+pucount+' items on the floor.')); }
        }
    descdiv.appendChild(targetdesc);
    desc.parentNode.insertBefore(descdiv, desc);
    desc.remove(); // we copied things, remove (redundant) original
    }
}

function desctextmatches(descdiv, descMatch) {
    // boilerplate code for lights/shadows
    var lights, shadows;

    //descMatch group elements:
        //2: firsttext 3: lightstatus 4:(toss) 5: middletext 6: shadowstatus 7: lasttext

    descdiv.appendChild(document.createTextNode(descMatch[2])); // first text as node

    // lights
    if (descMatch[3]) {
        lights = document.createElement('span');
        // create span: if lights enabled, set light class to on/off; else just make it text
        if (getSetting('hilights-extra-lights') == 'true') {
            if (descMatch[3].match(/(The lights are on inside the building|The building lights illuminate the area)/)) {
                lights.className = 'liblights';
            }
            else if (descMatch[3].match(/(The building windows are dark|The building lights are off|The lights inside the building appear to be off|The lights seem to be off throughout the neighorhood|The building is dark\. In fact, the lights seem to be off all throughout the neighorhood|The lights seem to be off throughout the neighorhood)/)) {
                lights.className = 'liblightsoff';
            }
        }
        lights.appendChild(document.createTextNode(descMatch[3]));
        descdiv.appendChild(lights);
    }

    if (descMatch[5]) { descdiv.appendChild(document.createTextNode(descMatch[5])); } // middle text

    // shadows
    if (descMatch[6]) {
        shadows = document.createElement('span');
        if (getSetting('hilights-extra-shadow') == 'true') { shadows.className = 'libshadows'; }
        shadows.appendChild(document.createTextNode(descMatch[6]));
        descdiv.appendChild(shadows);
    }

    descdiv.appendChild(document.createTextNode(descMatch[7]));
}


//#############################################################################
// tweak 1: sort people by alliances and health, print health
function sortpeople() {
    var peoplematch = /There (is|are) (\d+) other (person|people) here, (.*?>)\./.exec(document.documentElement.getElementsByTagName('body')[0].innerHTML);
    var ppl, person, i, len, count, h;
    var sorts = getSortTypes();
    var sort1 = sorts[0], sort2 = sorts[1];
    var sortRev1 = (getSetting('sortpeople-extra-reverse1') == 'true');
    var sortRev2 = (getSetting('sortpeople-extra-reverse2') == 'true');
    var showhp = (getSetting('sortpeople-extra-showhp') == 'true');
    var allyneutral = (getSetting('sortpeople-extra-neutrals') == 'true');
    var showpetmaster = (getSetting('sortpeople-extra-petmaster') == 'true');
    var sortfield = {'total':'hp', 'percent':'hp_percent', 'downtotal':'hp_down', 'level':'level'};
    var people = [[],[]];
    logLibC('sortpeople runtime: '+peoplematch[2], verbose=true);
    if (!peoplematch) { return; }
    if (peoplematch[2] !== 0) {
        ppl = peoplematch[4].substring(1, peoplematch[4].length - 1).split('>, <');
        len = ppl.length;
        if (len != parseInt(peoplematch[2])) { logLibC('LibC: Count fails to match peoplematch count'); return; }
        for (i = 0; i < len; i++) {
            person = createSortPerson(ppl[i], allyneutral);
            if (person['sorttype'] === 0) { people[0].push(person); }
            else { people[1].push(person); }
        }
    
        // sort people here
        if ( sortfield.hasOwnProperty(sort1) ) {
            people[0].sort( sort_by( sortfield[sort1], sortRev1) );
        }
        // implicit else: don't sort, already in alphabetical order
        if ( sortfield.hasOwnProperty(sort2) ) {
            people[1].sort( sort_by( sortfield[sort2], sortRev2) );
        } // again implied else --> don't sort
    
        // now format for display
        count = (people[0].length + people[1].length);
        if (count != parseInt(peoplematch[2])) { logLibC('LibC: Count fails to match peoplematch count'); return; } // just in case
        if (count == 1) {
            h = '<p id="chars_desc">There is 1 other person here.</p>\n';
        } else {
            h = '<p id="chars_desc">There are ' + count + ' other people here.</p>\n';
        }
    
        h += createSortedPeopleHTML(people[0], 'victims', showhp);
        h += createSortedPeopleHTML(people[1], 'friends', showhp);
    
        h = '<div id="other_chars">' + h + '</div>';
        document.documentElement.innerHTML = document.documentElement.innerHTML.replace(peoplematch[0], h);
    }

    // Optional showpetmaster trigger
    if (showpetmaster) { petmaster(); }
}

function createSortedPeopleHTML(people, id, showhp) {
    var retHTML = '<p id="'+id+'">';
    var len = people.length, i;
    if (len === 0) { return ''; } // catch for no people
    for (i = 0; i < len; i++) {
        retHTML += createSortedPersonHTML(people[i],showhp);
    }
    return retHTML.substring(0, retHTML.length - 2) + '.</p>'; // remove the trailing joiner and replace with close of par
}

function createSortedPersonHTML(person, showhp) {
    var hptext = '';
    if (showhp && person['hp_visible']) {
        hptext = (person['hp_down'] === 0) ? '<span class=hptext2>' : '<span class=hptext>';
        hptext += '+' + person['hp'];
        if (person['hp_down'] > 0) { hptext += '-' + person['hp_down']; }
    }
    return '<span class="char" id="char_' + person['id'] + '"><' + person['html'] + '>' + hptext + '</span></span>, ';
}

function getSortTypes() {
    var sort1 = getSortSingle( getSetting('sortpeople-extra-sort1') ),
        sort2 = getSortSingle( getSetting('sortpeople-extra-sort2') );
    setSetting('sortpeople-extra-sort1', sort1);
    setSetting('sortpeople-extra-sort2', sort2);
    return [sort1,sort2];
}

function getSortSingle(sortStr) {
    var sorts = ['normal', 'percent', 'total', 'downtotal', 'level']; // valid types of sorts; normal is alphabetical
    if (sorts.indexOf(sortStr) == -1) { return 'normal'; }
    return sortStr
}

function createSortPerson(ppl, allyneutral) {
    // creates an object of the character from the html
    var retPerson = { 'hp':0,'hp_down':0 }; // defaults
    var p = /a class="(faction|ally|friendly|neutral|enemy|hostile)" href="javascript:SelectItem\('target_id','(\d+)'\)">(.+)<\/a> \(<a href="modules.php\?name=Game&amp;op=character&amp;id=\d+">(\d*)<\/a>\)(<img title="Hidden" (?:height="12" width="12" src="images\/g\/status\/Hiding.^ png"|src="images\/g\/status\/Hiding.png" height="12" width="12")>)?<img( title="(\d+)\/(\d+) hit points")?.+?src="images\/g\/HealthBar_([1-4]).gif"/.exec(ppl);
    // ^ this is the magic to match a person ^

    if (p[1] == 'enemy' || p[1] == 'hostile') {
        retPerson['sorttype'] = 0;
    }
    else if (p[1] == 'neutral' && allyneutral === false) {
        retPerson['sorttype'] = 0;
    }
    else {
        retPerson['sorttype'] = 1;
    }
    retPerson['politics'] = p[1]; // specific info for later scripting expansion
    retPerson['html'] = ppl;
    retPerson['id'] = p[2];
    retPerson['level'] = p[4];
    
    if (p[6]) {
        // if char has first aid and can see hp vals
        retPerson['hp_visible'] = true;
        retPerson['hp'] = parseInt(p[7]);
        retPerson['hp_down'] = (parseInt(p[8])-parseInt(p[7]));
        retPerson['hp_percent'] = (parseInt(p[7])/parseInt(p[8])) * 100;
    } else {
        // char doesn't have first aid; only sees 10,11-50,51-99,100% hp totals
        retPerson['hp_visible'] = false;
        switch (parseInt(p[9])) {
            case 1:
                retPerson['hp_percent'] = 100; break;
            case 2:
                retPerson['hp_percent'] = 99; break;
            case 3:
                retPerson['hp_percent'] = 50; break;
            case 4:
                retPerson['hp_percent'] = 10; break;
        }
    }
    return retPerson;
}

var sort_by = function(field, reverse=false) {
    var key = function (obj) { return obj[field] };
    return function(a, b) {
        var A = key(a), B = key(b);
        return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [1,-1][+!!reverse];
    }
}

function petmaster() {
    var characters = document.evaluate("//span[@class='char']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (characters.snapshotLength === 0) { return; }
    var eachchar, i, len;
    len = characters.snapshotLength;
    for (i = 0; i < len; i++) {
        eachchar = characters.snapshotItem(i).firstElementChild;
        eachchar.addEventListener('mouseover', ehighlightpet);
        eachchar.addEventListener('mouseout', eunhighlightpet);
    }
}

function ehighlightpet(e) {
    var charname = e.target.textContent.replace(/\s$/g, ''); //rtrim
    var searchstring = "Master: " + charname;
    searchstring = "//a[@title='" + searchstring + "']";
    var theirpets = document.evaluate(searchstring, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var i, len;
    len = theirpets.snapshotLength;
    if (len >= 1) { e.target.title = String(len) + " Pets"; }
    for (i = 0; i < len; i++) { theirpets.snapshotItem(i).style.color = 'blue'; }
}

function eunhighlightpet(e) {
    var charname = e.target.textContent.replace(/\s$/g, '');
    var searchstring = "Master: " + charname;
    searchstring = "//a[@title='" + searchstring + "']";
    var theirpets = document.evaluate(searchstring, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var i, len;
    len = theirpets.snapshotLength;
    for (i = 0; i < len; i++) { theirpets.snapshotItem(i).style.color = ''; }
}


//#############################################################################
// tweak 2: Button Safeties
function hiddentoggle(e) {
    var targetbutton = e.target.nextElementSibling;
    if (e.target.checked) { targetbutton.style.visibility = 'visible'; }
    else { targetbutton.style.visibility = 'hidden'; }
}

function disabletoggle(e) {
    var targetbutton = e.target.nextElementSibling;
    if (e.target.checked) { targetbutton.disabled = false; }
    else { targetbutton.disabled = true; }
}

function createDisableButton(btn) {
    if (!btn.hasAttribute('confirmflag')) {
        btn.setAttribute('confirmflag', 1);
        var box = document.createElement('input');
        box.type = 'checkbox'; box.checked = false;
        box.addEventListener('click', disabletoggle, false);
        var acell = btn.parentNode;
        acell.insertBefore(box,btn);
        btn.disabled = true;
    }
}

function createHiddenButton(btn) {
    if (!btn.hasAttribute('confirmflag')) {
        btn.setAttribute('confirmflag', 1);
        var box = document.createElement('input');
        box.type = 'checkbox'; box.checked = false;
        box.addEventListener('click', hiddentoggle, false);
        btn.textContent = btn.textContent.charAt(0);
        var acell = btn.parentNode;
        acell.className = 'MageNoWrap'; acell.align = 'left';
        acell.insertBefore(box,btn);
        btn.style.visibility = 'hidden';
    }
}

function safebuttons() {
    var loc = location + '';
    if (!charinfoid && getGlobalSetting('safebuttons') == 'true') {
        if (loc.match(/buyskills|executepurchase|faction&do=view|character/)) { safetyButtons("//input[@type='submit']", 'disable'); }
    }
    if (charinfoid) {
        if (getSetting('safety-extra-drop') == 'true') { safetyButtons("//a[@class='item_drop']", 'hide'); }
        if (getSetting('safety-extra-learn') == 'true') { safetyButtons("//a[@class='item_use' and starts-with(text(), 'Learn')]", 'hide'); }
        if (getSetting('safety-extra-craft') == 'true') { safetyButtons("//form[@name='craft']/input[@type='submit' and @value='Craft']", 'disable'); safetyButtons("//form[@name='skill_craft']/input[@type='submit']", 'disable'); }
        if (getSetting('safety-extra-repair') == 'true') { safetyButtons("//form[@name='repair']/input[@type='submit' and @value='Repair']", 'disable'); }
        if (getSetting('safety-extra-revoke') == 'true') { safetyButtons("//form[@name='stronghold']/input[@name='action' and @value='revoke']/../input[@type='submit']", 'disable'); }
        if (getSetting('safety-extra-speech') == 'true') { safebuttons_speech(); }
    }
}

function safetyButtons(xPathStr, operation) {
    var buttons, elementButton, len, i;
    buttons = document.evaluate(xPathStr, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (buttons.snapshotLength === 0) { return; }
    len = buttons.snapshotLength;
    for (i = 0; i < len; i++) {
        elementButton = buttons.snapshotItem(i);
        if (operation == 'disable') { createDisableButton(elementButton); }
        else if (operation == 'hide') { createHiddenButton(elementButton); }
    }
}

function enableSpeechForm(e) {
    var button = e.target.previousElementSibling;
    if (e.target.value !== '') { button.disabled = false; }
    else { button.disabled = true; }
}

function safebuttons_speech() {
    var form, temp, len, i;
    form = document.evaluate("//form[@name='speak' or @name='bullhorn']/input[@type='submit']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = form.snapshotLength;
    if (len === 0) { return; }
    for (i = 0; i < len; i++) {
        temp = form.snapshotItem(i);
        temp.disabled = true;
        temp = document.evaluate("input[@type='text']", temp.parentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        temp.snapshotItem(0).addEventListener('input', enableSpeechForm, false);
    }
}


//#############################################################################
// tweak 3: Thin Bars for Full Health and Mana
function tweakbars() {
    var i, len, healthbarimages, manabarimages;
    healthbarimages = document.evaluate("//img[@src='images/g/HealthBar_1.gif']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = healthbarimages.snapshotLength;
    for (i = 0; i < len; i++) { healthbarimages.snapshotItem(i).width = '2'; }
    manabarimages = document.evaluate("//img[@src='images/g/MagicBar_1.gif']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = manabarimages.snapshotLength;
    for (i = 0; i < len; i++) { manabarimages.snapshotItem(i).width = '2'; }
}


//#############################################################################
// tweak 4: Color Message History (and make message box bigger and resizable)
function messagehistory() {
    var messages = document.getElementById('Messages');
    if (!messages) { return; }
    var loc = location + '', i, len, mm, j, lenm, ret_val;
    var mhistory = messages.previousElementSibling;
    if (mhistory && !(mhistory.innerHTML.match(/This Week/))) {
        if ((loc.match(/name=Game(&op=connect)?$/)) && (timesCharExist(messages.innerHTML, '\n') > 13)) { messages.style.height = '250px'; }
        messages.style.resize = 'vertical';
    }
    var alonglist = messages.innerHTML.split('\n');
    mm = messagematchers();
    len = alonglist.length;
    for (i = 0; i < len; i++) {
        alonglist[i] = alonglist[i].replace(/( a)(\(?(n)\)?( [AEIOUaeiou])|\(?n\)?( [^AEIOUaeiou]))/g,'$1$3$4$5');
        lenm = mm.length;
        for (j = 0; j < lenm; j++) {
            ret_val =  messagereplacer(alonglist[i], mm[j].m, mm[j].o, mm[j].e);
            if (ret_val) { alonglist[i] = ret_val; break; }
        }
        alonglist[i] = alonglist[i].replace(/(Your weapon was damaged during the attack\. It is now less effective!)/, "<b><u>$1</u></b>"); //yes this is a hack to always emphasise even when another matcher catches the line
        alonglist[i] = alonglist[i].replace(/(\'\')/g, "'");//replace '' with '
    }
messages.innerHTML = alonglist.join('');
}

function messagematchers() {
    // generates a list of message matchers and returns it
    // list of objects of trace {m:MATCH EXPRESSION, o:OPERATION, e:EXTRA(padding/other)}
    var mm = [
        {m:/(- (\(\d+ times\) )?You attack .* with your .* and hit for .* damage\..*)<br>/, o:'p', e:'MageAttackHit'},
        {m:/(- (\(\d+ times\) )?You attack the (door|ward|fortifications) with .+)<br>/, o:'p', e:'libfort'},
        {m:/(- (\(\d+ times\) )?You attack .* with your .* and miss\..*)<br>/, o:'p', e:'MageAttackMiss'},
        {m:/(- (\(\d+ times\) )?You summon (dark forces and attempt to steal magic points from (.+)\.  You meet with success and drain|the Curse of Blood and touch (.+), inflicting the curse|your inner hatred to inflict the Agony Curse and touch (.+), inflicting the curse).+)<br>/, o:'p', e:'MageAttackHit'},
        {m:/-( (\(\d+ times\) )?.* attacked you with .*)<br>/, o:'p', e:'MageAttacked'},
        {m:/-( (\(\d+ times\) )?.*( Your action causes you to| You| you|The Agony Curse causes you to) take( an additional)? \d+ (point(s)? of( \b[a-z]+\b)? damage|damage)(.|!)?.*)<br>/, o:'p', e:'MageAttackedbyEnvironment'},
        {m:/(- (\(\d+ times\) )?Your pet, .* has been rejuvenated.  You spent \d+ Magic Point.*)<br>/, o:'p', e:'MagePetRejuv'},
        {m:/(- (\(\d+ times\) )?.* belonging to .*, (healed you|has funneled life energy).*)<br>/, o:'p', e:'MagePetHealMe'},
        {m:/(- (\(\d+ times\) )?.*, belonging to .*, healed .* for \d+ hit point.*)<br>/, o:'p', e:'MagePetHealOthers'},
        {m:/(- (\(\d+ times\) )?Your pet .* and hit for .*)<br>/, o:'p', e:'MagePetHit'},
        {m:/(- (\(\d+ times\) )?((Shambling|Infectious|Rotting) Zombie|.*, belonging to .*,) attacked you and hit for .*)<br>/, o:'p', e:'MagePetHitMe'},
        {m:/(- (\(\d+ times\) )?(Your pet |[^,].*, belonging to).*, killing them!.*)<br>/, o:'p', e:'MagePetKill'},
        {m:/(- (\(\d+ times\) )?(Your pet |[^,].*, belonging to|(Shambling|Infectious|Rotting) Zombie).* and missed.*)<br>/, o:'p', e:'MagePetMiss'},
        {m:/-( (\(\d+ times\) )?.* attacked your pet,.*and hit for .*)<br>/, o:'p', e:'MagePetHit'},
        {m:/(- (\(\d+ times\) )?.* attacked your pet,.* killing it!.*)<br>/, o:'p', e:'MagePetKill'},
        {m:/(- (\(\d+ times\) )?.* attacked .* killing it!.*)<br>/, o:'p', e:'MagePetKill'},
        {m:/(- (\(\d+ times\) )?.* attacked your pet.* and missed.*)<br>/, o:'p', e:'MagePetMiss'},
        {m:/(- (\(\d+ times\) )?.*, belonging to .*, was killed by a defensive aura projected by .*)<br>/, o:'p', e:'MagePetKill'},
        {m:/(- (\(\d+ times\) )?(Your pet .*|.*, belonging to .*,|.*, a .*|\b\w+\b|Will-O-Wisp) has despawned.*)<br>/, o:'p', e:'MagePetDespawn'},
        {m:/((- (\(\d+ times\) )?)<font color="#DD0000">(<b>.*<\/b>)<\/font>(.*))<br>/, o:'r', e:'<div class="MageAchievement">$2<span class="MageAchievementColour">$4</span>$5</div>'},
        {m:/(- (\(\d+ times\) )?)([^,].*) (whispered to you, saying).(\".*)<br>/, o:'r', e:"<div class='MageSpeech'>$1 $3<span class='MageMe'> $4, </span>$5</div>"},
        {m:/(- (\(\d+ times\) )?).*(Someone used a bullhorn to say: )(\'.*\')(.*)<br>/, o:'p', e:'MageMe'},
        {m:/(- (\(\d+ times\) )?)(You say, )(\".*)<br>/, o:'r', e:"<div class='MageSpeech'>$1<span class='MageMe'>$3</span>$4</div>"},
        {m:/(- (\(\d+ times\) )?)(You whisper, )(\".*)<br>/, o:'r', e:"<div class='MageSpeech'>$1<span class='MageMe'>$3</span>$4</div>"},
        {m:/(- (\(\d+ times\) )?[^,].* (said|say), \".*)<br>/, o:'p', e:'MageSpeech'},
        {m:/(- (\(\d+ times\) )?[^,].* (whispered to you|whisper), saying \".*)<br>/, o:'p', e:'MageSpeech'},
        {m:/(- (\(\d+ times\) )?.+ attacked .+ with .+, killing (him|her).*)<br>/, o:'p', e:'libkill'},
        {m:/-( (\(\d+ times\) )?[^,].* gave you a.*)<br>/, o:'p', e:'MageReceivedSomething'},
        {m:/-( (\(\d+ times\) )?You give your .*)<br>/, o:'p', e:'libgave'},
        {m:/(- (\(\d+ times\) )?You call upon your crafting skills.*)<br>/, o:'p', e:'MageCraft'},
        {m:/(- (\(\d+ times\) )?You search and find nothing.*)<br>/, o:'p', e:'MageSearchNothing'},
        {m:/(- (\(\d+ times\) )?You search and find a.*)<br>/, o:'p', e:'MageSearchYay'},
        {m:/(- (\(\d+ times\) )?You step (inside |outside of ).*)<br>/, o:'p', e:'libgave'},
        {m:/(- (\(\d+ times\) )?.*(You heal yourself and|healed you. You) gain \d+ hit point(s)?.*)<br>/, o:'p', e:'MageHealed'},
        {m:/(- (\(\d+ times\) )?.*(heal|healed) you for \d+ point(s)? of damage.*)<br>/, o:'p', e:'MageHealed'},
        {m:/(- (\(\d+ times\) )?.*(You|You use the .* to) heal .* for \d+ point(s)? of damage.*)<br>/, o:'p', e:'MageHealed'},
        {m:/(- (\(\d+ times\) )?.*You use your surgeon skills to tend to .* and heal them for \d+ point(s)? of damage.*)<br>/, o:'p', e:'MageHealed'},
        {m:/(- (\(\d+ times\) )?.*You place a Stygian Bone Leech on the skin of .* \d+ point(s)? of damage.*)<br>/, o:'p', e:'MageHealed'},
        {m:/(- (\(\d+ times\) )?.*You feel the effects of .+ fade.*)<br>/, o:'p', e:'libfaded'},
        {m:/(- (\(\d+ times\) )?.* summoned a .*)<br>/, o:'p', e:'libsummon'},
        {m:/(- (\(\d+ times\) )?.* (suddenly appeared out of thin air\.|disappeared from view\.).*)<br>/, o:'p', e:'libsummon'},
        {m:/(- (\(\d+ times\) )?.* spoke words of mystic power and traced eldritch shapes into the air. A burst of warmth rushed through the area as they finished the incantation.*)<br>/, o:'p', e:'libsummon'},
        {m:/(- (\(\d+ times\) )?)([^<>]*?)( \u201C.+\u201D)(.*)<br>/, o:'r', e:"<div class='MageSpeech'>$1<span class='MageMe'>$3</span>$4<span class='MageMe'>$5</span></div>"},
        {m:/(- (\(\d+ times\) )?)(.*?)( \u0022.+\u0022)(.*)<br>/, o:'r', e:"<div class='MageSpeech'>$1<span class='MageMe'>$3</span>$4<span class='MageMe'>$5</span></div>"},
        {m:/(- (\(\d+ times\) )?)([^<>]*?)( \u2018.+\u2019)(.*)<br>/, o:'r', e:"<div class='MageSpeech'>$1<span class='MageMe'>$3</span>$4<span class='MageMe'>$5</span></div>"}
        ];
        return mm;
}

function messagereplacer(liststring, match, operation, extra) {
    if (liststring.match(match)) { //operation 'p' for 'padding' the message with a div of class $extra, operation 'r' for 'replacing' a string with $extra
        if (operation == 'p') { liststring = "<div class='"+extra+"'>"+liststring+"</div>"; }
        else if (operation == 'r') { liststring = liststring.replace(match, extra); }
        return liststring;
    }
    return false;
}


//#############################################################################
// tweak 5: Tweak the weapon selection to print Raw DPA and shorten details

// display damage per action
function wpSDPA (option) {
    var test = option.innerHTML.match(/(\d+) dmg[^0-9]*(-?\d+)% to hit$/);
    if (test) { option.innerHTML += '(dpa:'+test[1]*Math.min(Math.max(test[2],1),99)/100+')'; }
}

// display shorter damage/to-hit chance
function wpSDMG (option) {
    if (option.innerHTML.match(/ - (\d+) dmg.?, (\d+)% to hit/)) { option.innerHTML = option.innerHTML.replace(/ - (\d+) dmg.?, (\d+)% to hit/, '-$1/$2%'); }
}

// display shortened shot amounts
function wpSSHOTS (option) {
    if (option.innerHTML.match(/\((\d+) shots\)/)) { option.innerHTML = option.innerHTML.replace(/\((\d+) shots\)/, '\($1s\)'); }
}

// display shortened spellgem names (and special touch attacks?)
function wpSGEM (option) {
    if (option.innerHTML.match(/^Spellgem/)) { option.innerHTML = option.innerHTML.replace(/^Spellgem/, 'Gem'); }
    if (option.innerHTML.match(/(-( 0 dmg| ), -?(\d+)% to hit$)/)) { option.innerHTML = option.innerHTML.replace(/(-( [0-5] dmg| ), -?(\d+)% to hit$)/, ''); }
    if (option.innerHTML.match(/(Glyph of )/)) { option.innerHTML = option.innerHTML.replace(/(Glyph of )/, ''); }
}

// display shortened weapon quality
function wpSQUAL (option) {
    var qualityLevel = {'pristine':'+Q5+', 'good':'+Q4+', 'average':'=Q3=', 'worn':'-Q2-', 'broken':'-Q1-', 'destroyed':'-Q0-'};
    var test = option.innerHTML.match(/ \((pristine|good|average|worn|broken|destroyed)\) /);
    if (test) { option.innerHTML = option.innerHTML.replace(/ \((pristine|good|average|worn|broken|destroyed)\) /, qualityLevel[test[1]]); }
}

// display shortened enchant/magical status
function wpSMAG (option) {
    if (option.innerHTML.match(/\((magical|enchanted)\)/)) { option.innerHTML = option.innerHTML.replace(/\((magical|enchanted)\)/, '(mag)'); }
}

function weaponpane() {
    var weaponboxes = document.evaluate("//select[@name='attacking_with_item_id']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (weaponboxes.snapshotLength < 1) { return; }
    var item, weaponboxoptions, i, j, jlen, ilen;
    var sDPA = (getSetting('weaponpane-extra-dpa') == 'true');
    var sDMG = (getSetting('weaponpane-extra-dmg') == 'true');
    var sSHOTS = (getSetting('weaponpane-extra-shots') == 'true');
    var sGEM = (getSetting('weaponpane-extra-gem') == 'true');
    var sQUAL = (getSetting('weaponpane-extra-quality') == 'true');
    var sMAG = (getSetting('weaponpane-extra-magic') == 'true');
    jlen = weaponboxes.snapshotLength;
    for (j = 0 ; j < jlen; j++) {
        item = weaponboxes.snapshotItem(j);
        weaponboxoptions = item.getElementsByTagName('option');
        ilen = weaponboxoptions.length;
        for (i = 0; i < ilen; i++ ) {
            if (sDPA) { wpSDPA(weaponboxoptions[i]); }
            if (sDMG) { wpSDMG(weaponboxoptions[i]); }
            if (sSHOTS) { wpSSHOTS(weaponboxoptions[i]); }
            if (sGEM) { wpSGEM(weaponboxoptions[i]); }
            if (sQUAL) { wpSQUAL(weaponboxoptions[i]); }
            if (sMAG) { wpSMAG(weaponboxoptions[i]); }
        }
    }
}


//#############################################################################
// tweak 6: Default Item Pickup to Weapons
function pickupdefaults() {
    var i, len, temp, puforms, puform, pubox, puboxopt, pnum, indexArray = [], matchers = ['drink','food','rock','knife','hatchet','misc','null'], priorities = [];
    var drinkmatch = /(.+, a(n)? )?(Bottle of .+|Absinthe|Vial of .+)/;
    var foodmatch = /(.+, a(n)? )?(Can of .+|Cup of .+|Apple)/;
    var rockmatch = /(.+, a(n)? )?Rock/;
    var knifematch = /(.+, a(n)? )?Throwing Knife/;
    var hatchetmatch = /(.+, a(n)? )?Hatchet/;
    puforms = document.evaluate("//form[@name='pickup']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (puforms.snapshotLength != 1) { return; }
    for (i = 0; i < 6; i++) { //currently checks six priorities
        temp = getSetting('pickup-extra-priority'+i);
        if (matchers.indexOf(temp) == -1) { temp = 'null'; }
        setSetting('pickup-extra-priority'+i, temp);
        priorities.push(temp);
        indexArray.push(-1);
    }
    puform = puforms.snapshotItem(0);
    pubox = puform.lastElementChild;
    puboxopt = pubox.getElementsByTagName('option');
    len = puboxopt.length;
    for (i = 0; i < len; i++) {
        temp = puboxopt[i].textContent;
        if (temp.match(drinkmatch)) { pnum = priorities.indexOf('drink'); }
        else if (temp.match(foodmatch)) { pnum = priorities.indexOf('food'); }
        else if (temp.match(rockmatch)) { pnum = priorities.indexOf('rock'); }
        else if (temp.match(knifematch)) { pnum = priorities.indexOf('knife'); }
        else if (temp.match(hatchetmatch)) { pnum = priorities.indexOf('hatchet'); }
        else { pnum = priorities.indexOf('misc'); } //catches all non-matches as misc!
        if (pnum != -1 && indexArray[pnum] == -1) {
            indexArray[pnum] = i; //set the priority option index to the current setting
        }
    }
    len = indexArray.length;
    for (i = 0; i < len; i++) { //now set the selected option to the first index we find
        if (indexArray[i] != -1) {
            pubox.selectedIndex = indexArray[i];
            break;
        }
    }
}


//#############################################################################
// tweak 7: Warning Headers
function warningheaders() {
    if (!charinfodiv) { return; } // need char info, else quit
    var firstfont = charinfodiv.getElementsByTagName('font')[0], secondfont = charinfodiv.getElementsByTagName('font')[1], thirdfont = charinfodiv.getElementsByTagName('font')[2], panetitles = document.getElementsByClassName('panetitle');
    var headercolor = '', headertitle = '';
    var i, len, temp, moves, lowAP, lowHP;
    lowAP = 13; //defaults
    if (isNormalInteger(getSetting('warnheaders-extra-ap'))) { lowAP = parseInt(getSetting('warnheaders-extra-ap')); }
    setSetting('warnheaders-extra-ap', lowAP);
    lowHP = 30; //defaults
    if (isNormalInteger(getSetting('warnheaders-extra-hp'))) { lowHP = parseInt(getSetting('warnheaders-extra-hp')); }
    setSetting('warnheaders-extra-hp', lowHP);

    // character/login pane: charinfodiv
    if (Number(secondfont.innerHTML.match(/\d+/)) < lowHP) {
        secondfont.parentNode.style.border = '3px solid crimson';
        secondfont.parentNode.parentNode.parentNode.parentNode.style.border = '2px solid crimson';
        secondfont.parentNode.parentNode.title = 'LOW HEALTH';
        headercolor = 'crimson'; headertitle = 'LOW HP';
    } else if (Number(firstfont.innerHTML.match(/\d+/)) < lowAP) {
        firstfont.parentNode.parentNode.style.border = '1px solid #fa8000';
        firstfont.parentNode.parentNode.style.borderTop = '3px solid #fa8000';
        firstfont.parentNode.parentNode.style.borderBottom = '3px solid #fa8000';
        firstfont.parentNode.parentNode.title = 'LOW AP';
        headercolor = 'gold'; headertitle = 'LOW AP';
    }

    // the headers/spacers between different game sections
    len = panetitles.length;
    for (i = 0; i < len; i++) {
        temp = panetitles[i];
        temp.style.color = headercolor; temp.title = headertitle;
    }

    // move buttons
    if (headertitle && getSetting('warnheaders-extra-move') == 'true') {
        moves = document.getElementsByName('move');
        len = moves.length;
        for (i = 0; i < len; i++) {
            moves[i].children[1].style.borderColor = 'black';
            moves[i].children[1].style.borderStyle = 'dotted';
        }
    }
}


//#############################################################################
// tweak 8: Save Forms
function safestore(name, path) {
    var selects = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null), select;
    if (selects.snapshotLength === 0) { return; }
    select = selects.snapshotItem(0);
    var value = select.options[select.selectedIndex].value;
    if (value) { setSetting('store-'+name, value); }
}

function rememberForm(name, path, selname) {
    var select = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var len = select.snapshotLength;
    var value, i, sel, button, j, jlen, options;
    value = getSetting('store-'+name);
    for (i = 0; i < len; i++) {
        sel = select.snapshotItem(i);
        button = document.evaluate("input[@type='submit']", sel.parentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
        button.addEventListener('click', function(e) { var sele = e.target.parentNode[selname]; setSetting('store-'+name, sele.options[sele.selectedIndex].value); }, true);
        if (value === null) { continue; } // fall through: no vals defined
        options = sel.options;
        jlen = options.length;
        for (j = 0; j < jlen; j++) { //only if we have a value to search for
            if (options[j].value === value) { sel.selectedIndex = j; break; }
        }
    }
}

function saveForms() {
    var refresh = document.evaluate("//li[@class='topmenu']/a[text()='Game Map']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var i, len, name, path;
    var forms = [ //internal storage name, xpath string, select tag name
        ['c1', "//select[@name='powerup']", 'powerup'],
        ['c2', "//select[@name='powerup2']", 'powerup2'],
        ['precision', "//select[@name='clockwork_precision']", 'clockwork_precision'],
        ['prayer', "//select[@name='prayertype']", 'prayertype'],
        ['repair', "//form[@name='repair']/select[@name='item']", 'item']
    ];
    len = forms.length;
    for (i = 0; i < len; i++) {
        if (getSetting('saveform-extra-'+forms[i][0]) != 'true') { continue; } // skip if disabled
        name = forms[i][0]; path = forms[i][1];
        rememberForm(name, path, forms[i][2]);
        if (refresh.snapshotLength !== 0) {
            refresh.snapshotItem(0).addEventListener('click', function(n,p) { return function() { safestore(n, p); }; }(name,path), true);
        }
    }
}


//#############################################################################
// tweak 9: Pet Interface Overhaul
function processPetTable() {
    var tick = getTick(),  minPet = null, minPet2 = null, len,
        petRows = document.evaluate("//tr[td[@title='Rename Pet']]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null),
        retPets; //defaults

    // GLOBALS
    petCountSurplus = (getSetting('pettweak-extra-surplus') == 'true'), petAPLow = 8, petAPMid = 20;

    // hack to set default if unset
    if (isNormalInteger(getSetting('pettweak-extra-ap-low'))) { petAPLow = parseInt(getSetting('pettweak-extra-ap-low')); }
    setSetting('pettweak-extra-ap-low', petAPLow);
    if (isNormalInteger(getSetting('pettweak-extra-ap-mid'))) { petAPMid = parseInt(getSetting('pettweak-extra-ap-mid')); }
    setSetting('pettweak-extra-ap-mid', petAPMid);
    if (petRows.snapshotLength === 0) { return; }

    len = petRows.snapshotLength;
    for (var i = 0; i < len; i++) {
        var row = petRows.snapshotItem(i);
        if (i === 0) { modifyTable(row); }
        retPets = processRow(row, tick, minPet, minPet2, petCountSurplus);
        minPet = retPets[0]; minPet2 = retPets[1];
    }
    minPet.Row.setAttribute('class', minPet.Row.getAttribute('class') + ' petstatus-nextpet');
    if (minPet2 !== null) { minPet2.Row.setAttribute('class', minPet2.Row.getAttribute('class') + ' petstatus-nextpet2'); }
}

function processRow(row, tick, minPet, minPet2) {
    var ap = parseInt(row.cells[2].innerHTML), mp = parseInt(row.cells[3].innerHTML), hp = parseInt(row.cells[4].innerHTML);
    if (minPet === null || ap < minPet.AP || (ap == minPet.AP && mp < minPet.MP) || (ap == minPet.AP && mp == minPet.MP && hp < minPet.HP)) { minPet2 = minPet; minPet = { AP:ap, MP:mp, HP:hp, Row:row }; } //stomp through, finding pet with lowest ap, with tie breakers mp and finally hp
    else if (minPet2 === null || ap < minPet2.AP || (ap == minPet2.AP && mp < minPet2.MP) || (ap == minPet2.AP && mp == minPet2.MP && hp < minPet2.HP)) { minPet2 = { AP:ap, MP:mp, HP:hp, Row:row }; }
    displayDecayTime(row, ap, mp, tick);
    setRowClass(row, ap, mp);
    modifyStanceForm(row);
    return [minPet, minPet2];
}

function displayDecayTime(row, ap, mp, tick) {
    var timeEmpty = new Date(tick), temp = ap;
    if (petCountSurplus && ap > mp) { temp = (ap - mp); }
    timeEmpty.setMinutes(tick.getMinutes() + (temp * 15));
    row.insertCell(7);
    row.cells[7].innerHTML = String(temp / 4)+'h';
    row.cells[7].title = 'Local: ' + timeEmpty.toTimeString().substring(0,5);
}

function modifyTable(row) {
    var table = row.parentNode.parentNode;
    table.style.width = table.offsetWidth - 4;
    table.rows[1].insertCell(7);
    table.rows[1].cells[7].innerHTML = 'Decay';
}

function setRowClass(row, ap, mp) {
    var rowClass = '', temp = ap;
    if (petCountSurplus) { temp = (ap - mp); }
    if (ap < mp) { rowClass += ' petstatus-mpsurplus'; }
    else if (temp <= petAPLow) { rowClass += ' petstatus-apcritical'; }
    else if (temp <= petAPMid) { rowClass += ' petstatus-aplow'; }
    row.setAttribute('class', rowClass);
}

function modifyStanceForm(row) {
    var stanceSubmit = document.evaluate(".//input[@type='submit']", row.cells[5], null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
    stanceSubmit.style.display = 'none';
    var stanceSelect = document.evaluate('.//select',row.cells[5],null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
    stanceSelect.onchange = function() { this.form.submit(); };
}

function getTick() {
    var tick = new Date();
    tick.setMinutes(tick.getMinutes() - (tick.getMinutes() % 15));
    tick.setSeconds(0);
    return tick;
}


//#############################################################################
// tweak 10: Alchemy Interface Overhaul
function alchemytweak() {
    character = parseCharacterInfo();
    if (character) {
        var panes = document.evaluate("//tbody[tr/td/div[@class='panetitle']='Recipe Tracker']/tr[last()]/td",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);
        components = getComponentDictionary();
        if (getSetting('alchemytweak-extra-alwayshilight') == 'true' || panes.snapshotLength == 1) { tempSI = parseSafeItems(); inventoryItems = parseInventoryItems(); }
        if (panes.snapshotLength != 1) { return; }
        alchemyShowCount = (getSetting('alchemytweak-extra-count-show') == 'true');
        alchemySafeButton = (getSetting('alchemytweak-extra-safebutton') == 'true');
        alchemyLowCount = 6;
        if (isNormalInteger(getSetting('alchemytweak-extra-count-low'))) { alchemyLowCount = parseInt(getSetting('alchemytweak-extra-count-low')); }
        setSetting('alchemytweak-extra-count-low', alchemyLowCount); //hack to set default if unset
        alchemyMidCount = 12;
        if (isNormalInteger(getSetting('alchemytweak-extra-count-mid'))) { alchemyMidCount = parseInt(getSetting('alchemytweak-extra-count-mid')); }
        setSetting('alchemytweak-extra-count-mid', alchemyMidCount);
        alchemySuppressHilight = (getSetting('alchemytweak-extra-suppress') == 'true');
        alchemySuppressLW = (getSetting('alchemytweak-extra-suppresslw') == 'true');
        var panetitle = document.evaluate("//tbody[tr/td/div[@class='panetitle']='Recipe Tracker']/tr/td/div[@class='panetitle']",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
        recipePane = panes.snapshotItem(0);
        shortNames = getShortNames();
        fixedComponents = getFixedComponents();
        //tempSI = parseSafeItems(); //moved to start
        safeItems = tempSI[0]; safeStatus = tempSI[1];
        //inventoryItems = parseInventoryItems();
        parseRecipes(character, recipePane);
        setToggleAll(panetitle);
        setToggleListeners();
    }
}

function parseRecipes(character, recipePane) {
    var complete = [], partial = [], empty = [], i, htmltable;
    var recipes = recipePane.innerHTML.split('<br>');
    for (i = 0; i < recipes.length; i++) {
        if (recipes[i] === '') { continue; }
        if (recipes[i].match(/,/)) {
            if (recipes[i].match(/incomplete$/)) { partial.push(formatRecipe(recipes[i], 'recipe-partial')); }
            else { complete.push(formatRecipe(recipes[i], 'recipe-complete')); }
        }
        else { empty.push(formatRecipe(recipes[i], 'recipe-empty')); }
    }
    htmltable = '<table>';
    for (i = 0; i < complete.length; i++) { htmltable += complete[i]; }
    for (i = 0; i < partial.length; i++) { htmltable += partial[i]; }
    for (i = 0; i < empty.length; i++) { htmltable += empty[i]; }
    htmltable += createComponentHelper();
    htmltable += createHelpRow('assistant', 'Alchemy Assistant', '- Reformats recipes into collapsable/expandable tabs, and sorts by completion<br>- Hilights available components: brown for safe/footlocker, blue for inventory<br>- Uses friendly colours for colour-blind individuals<br>- Hilights entire recipes if all components are available; brown for safe/footlocker, blue for inventory. Does not handle multiples of components in inventory<br>- Adds a brew button next to recipe name if able to brew, and warns if there is a stygian bone-leech in inventory<br>- Colours components according to rarity:<br>-- Common - Black<br>-- Uncommon - Green<br>-- Rare - Red<br>- Bolds non-transmutable components (soul and blood ice)<br>- Adds colours to safe and footlocker according to component rarity, if recipe pane is open<br>- Indicates which component (if any) is preserved, or what factor is preventing it<br>- Displays quantity of potions in safe, colour coded depending on amounts<br>- Adds an "s" after an available component to retrieve from safe, and "f" to retrieve from footlocker<br>- Adds buttons underneath a full recipe name to place or retrieve that potion to or from the faction safe.');
    htmltable += createHelpRow('saved', 'Saved Components','- The item that is preserved will be the last one listed alphabetically for that recipe<br>- The recipe cannot require more than one of any specific component. No component in the recipe can be (x2) or (x3)<br>- A Stygian Bone Leech cannot be in the player\'s inventory, unless that it is the component that would be preserved<br>-Code of Efficiency never preserves an already saved component. Code of Efficiency also does not trigger as often on saving recipes.<br>-Please note that these rules are based on experimentation and are not wholly accurate. Sometimes recipes with Bone Leeches save components, sometimes they do not.');
    htmltable += createHelpRow('quality', 'Research and Recipe Quality', "- Never research into 'Any' recipe for fear of sudden death. Always research into a specific potion recipe.<br>- Do not research a recipe with a component that you already know is in it for fear of sudden death.<br>-- In example: If research reveals a chunk of steel is required in a recipe, do not use chunks of steel to research that same recipe. Doing so often results in explosive failure.<br>- Recipes that include Soul or Blood Ice that are not Cold or Unholy respectively should be reset as soon as possible, as a general rule. Demonic alchemists may reconsider this.<br>- Any recipe that does not save a rare (or rarest possible component) can be reset at the alchemist's leisure.<br>- Sprigs of Nightshade are the most easily saved rare component.");
    htmltable += createHelpRow('fixed', 'Fixed Components', "- <a href='http://nexusclash.windrunner.mx/wiki/index.php/Scraps_of_paper'>Complete List of Fixed Components</a><br>- Fundamentally Inferior Recipes:<br>- Blood Ice, Unholy<br>- Soul Ice, Cold<br>- Stygian Bone Leech, Regeneration<br>- If a recipe otherwise has Blood or Soul Ice, or a Bone Leech, it is best to reset it<br>- Blood Ice never saved. Best saves for Cold and Regen are Soul and Leech respectively");
    htmltable += '</table>';
    recipePane.innerHTML = htmltable;
}

function createHelpRow(name, title, helpString) {
    var rowClass, helpRow, fullDisplay = 'none', summaryDisplay = 'table-row';
    if (getSetting('alchemy-toggle-' + name + 'help') == 'full') { fullDisplay = 'table-row'; summaryDisplay = 'none'; }
    rowClass = 'recipe-partial completionlevel-short';
    helpRow = "<tr id='recipe-"+name+"help-full' class='" + rowClass + "' style='display:" + fullDisplay + "'><td valign='top' class='recipename'><a class='toggleLink' id='toggle-"+name+"help-full'><img src='/images/g/inf/close.gif'/></a>Help: "+title+"</td><td colspan='6' class='recipelist'>" + helpString + "</td>";
    helpRow += "<tr id='recipe-"+name+"help-summary' class='" + rowClass + "' style='display:" + summaryDisplay + "'><td valign='top' class='recipename'><a class='toggleLink' id='toggle-"+name+"help-summary'><img src='http://nexusclash.com/images/g/inf/open.gif'/></a>H:"+title+"</td></tr>";
    return helpRow;
}

function createComponentHelper() {
    var cRow, rowClass, fullDisplay = 'none', summaryDisplay = 'table-row', comp, cString, cssClass, safeRetrieve, count;
    if (getSetting('alchemy-toggle-componentshelp') == 'full') { fullDisplay = 'table-row'; summaryDisplay = 'none'; }
    rowClass = 'recipe-partial completionlevel-short'; cString = '';
    for (comp in components[character.Class]) {
        if (!components[character.Class].hasOwnProperty(comp)) { continue; }
        safeRetrieve = null, count = '';
        cssClass = 'component-' + components[character.Class][comp];
        if (safeItems[comp]) {
            cssClass += ' match-safe';
            safeRetrieve = getSafeItem(comp);
            count = safeItems[comp].count;
            cString += "<form name='footlockergrab' action='modules.php?name=Game&amp;op=" + safeRetrieve[1] + "' method='POST' style='display:block'><input type='hidden' name='action' value='retrieve'><input type='hidden' name='item' value='" + safeRetrieve[0] + "'><span class='" + cssClass + "'>" + comp + "</span> (" + count + ") <input type='submit' class='retrieveSafe' title='From "+safeRetrieve[1]+"' value='" + safeRetrieve[1].charAt(0) + "'></form>";
        } else { cString += "<span class='" + cssClass + "'>" + comp + '</span><br/>'; }
    }
    cRow = "<tr id='recipe-componentshelp-full' class='" + rowClass + "' style='display:" + fullDisplay + "'><td valign='top' class='recipename'><a class='toggleLink' id='toggle-componentshelp-full'><img src='/images/g/inf/close.gif'/></a>Component Dictionary</td><td colspan='6' class='recipelist'>" + cString + "</td>";
    cRow += "<tr id='recipe-componentshelp-summary' class='" + rowClass + "' style='display:" + summaryDisplay + "'><td valign='top' class='recipename'><a class='toggleLink' id='toggle-componentshelp-summary'><img src='http://nexusclash.com/images/g/inf/open.gif'/></a>Comp Dict</td></tr>";
    return cRow;
}

function formatRecipe(recipe, rowClass) {
    var i, len, completionLevel = 'inventory', componentString = '', buttonHtml = '', potionName = '', componentList, recipeComponents, componentCount = 0, inventoryCount = 0, safeCount = 0, preserved = 'saved', safeRetrieve = '', safeRetrieveType = '', safeRetrieveForm = '', safePotionCountSpan = '', safePotionCountShort = '', safePotionCount, retform = '<br>', placeform = '', fullDisplay = 'table-row', summaryDisplay = 'none', shortName, cssClass, component, count, potRetVal, potRetType;
    var empty = (rowClass == 'recipe-empty'), partial = (rowClass == 'recipe-partial');
    recipe = recipe.replace(/,? *(in)?complete$/, '');
    var recipeMatch = recipe.match(/^.*<b>(Potion of .+)<\/b> *(.*)$/);
    if (!recipeMatch) { return; }
    potionName = recipeMatch[1]; componentList = recipeMatch[2];
    recipeComponents = componentList.split(', ');
    if (!componentList) { recipeComponents = ''; }
    len = recipeComponents.length;
    for (i = 0; i < len; i++) {
        safeRetrieve = '', safeRetrieveForm = '', safeRetrieveType = '';
        count = parseInt(recipeComponents[i].match(/\(x(\d+)\)/)[1]);
        if (count > 1) { preserved = '-count'; }
        component = recipeComponents[i].replace(/ \(x\d+\)$/, '');
        cssClass = 'component-' + components[character.Class][component];
        componentCount += count;
        if (inventoryItems[component]) {
            inventoryCount += count;
            if (!alchemySuppressHilight) { cssClass += ' match-inventory'; } //if suppress is false, then add the css class for matching
        } else if (safeItems[component] && safeItems[component].count >= count) {
            if (!alchemySuppressHilight) {cssClass += ' match-safe'; } //likewise
            safeCount += count; safeRetrieve = getSafeItem(component);
            if (completionLevel == 'inventory') { completionLevel = 'safe'; }
        } else {
            if (safeItems[component]) { safeCount += safeItems[component].count; }
            safeRetrieve = getSafeItem(component); completionLevel = 'short';
        }
        safeRetrieveType = safeRetrieve[1]; safeRetrieve = safeRetrieve[0];
        recipeComponents[i] = recipeComponents[i].replace(/ \(x1\)$/, '');
        recipeComponents[i] = recipeComponents[i].replace(/ /g, '&nbsp;');
        if ( (recipeComponents[i] == 'Stygian Bone Leech') && (i != recipeComponents.length - 1) ) { preserved = '-leech'; }
        if (i == (recipeComponents.length - 1)) { recipeComponents[i] += '('+preserved+')'; }
        if (safeRetrieve && !partial && !empty) {
            componentString += "<form name='footlockergrab' action='modules.php?name=Game&amp;op=" + safeRetrieveType + "' method='POST'><input type='hidden' name='action' value='retrieve'><input type='hidden' name='item' value='" + safeRetrieve + "'><span class='" + cssClass + "'>" + recipeComponents[i] + "</span> <input type='submit' class='retrieveSafe' title='From "+safeRetrieveType+"' value='"+safeRetrieveType.charAt(0)+"'></form>";
        } else {
            componentString += "<span class='" + cssClass + "'>" + recipeComponents[i] + '</span><br/>';
        }
    }
    if (recipeComponents && completionLevel == 'inventory' && preserved == 'saved' && getInvItem('Stygian Bone Leech') && !alchemySuppressLW) { buttonHtml = '<form name="alchemyknown" action="modules.php?name=Game&amp;op=alchemy" method="POST"><input type="hidden" name="potion" value="' + potionName + '"/><input type="submit" title="Leech Warning - Brew Batch" value="w!B!w"/></form>'; }
    else if (recipeComponents &&  completionLevel == 'inventory') { buttonHtml = '<form name="alchemyknown" action="modules.php?name=Game&amp;op=alchemy" method="POST"><input type="hidden" name="potion" value="' + potionName + '"/><input type="submit" title="Brew Batch" value="-B-"/></form>'; }
    //show safe-stock
    if (alchemyShowCount && safeStatus > 0) {
        if (safeItems[potionName]) { safePotionCount = safeItems[potionName].count; }
        else { safePotionCount = 0; }
        if (safePotionCount === 0) { safePotionCountSpan = "<span class='safeEmpty'>"; }
        else if (safePotionCount < alchemyLowCount) { safePotionCountSpan = "<span class='safeLow'>"; }
        else if (safePotionCount < alchemyMidCount) { safePotionCountSpan = "<span class='safeMid'>"; }
        else { safePotionCountSpan = "<span class='safeHigh'>"; }
        safePotionCountShort = '-' + safePotionCountSpan + safePotionCount + '</span>';
        safePotionCount = '<br>'+ safePotionCountSpan + 'Safe: ' + safePotionCount + '</span>';
    } else { safePotionCountShort = ''; safePotionCount = ''; }
    //add quick place/retrieve buttons
    if (alchemySafeButton && safeStatus > 0) {
        potRetrieve = getSafeItem(potionName);
        invPlace = getInvItem(potionName);
        if (potRetrieve[1] !== '') {
            potRetVal = potRetrieve[0]; potRetType = potRetrieve[1];
            retform = "<form name='footlockergrab' action='modules.php?name=Game&amp;op="+potRetType+"' method='POST' style='display:block'><input type='hidden' name='action' value='retrieve'><input type='hidden' name='item' value='"+potRetVal+"'><input type='submit' class='retrieveSafe' value='Retrieve "+potRetType+"'></form>";
        }
        if (invPlace) { placeform = "<form name='footlockergrab' action='modules.php?name=Game&amp;op=safe' method='POST' style='display:block'><input type='hidden' name='action' value='deposit'><input type='hidden' name='item' value='"+invPlace+"'><input type='submit' class='retrieveSafe' value='Place safe'></form>"; }
    }
    potionName = potionName.replace(/^Potion of (.+)$/, '$1');
    if (getSetting('alchemy-toggle-' + potionName) == 'summary') { fullDisplay = 'none'; summaryDisplay = 'table-row'; }
    shortName = potionName;
    if (shortNames[potionName]) { shortName = shortNames[potionName]; }
    if (empty) {
        componentString = "[<span class='component-fixed'>" + fixedComponents[potionName] + "</span>]";
    }
    if (partial && !componentString.match(fixedComponents[potionName].replace(/ /g, '&nbsp;'))) {
        cssClass = 'component-' + components[character.Class][fixedComponents[potionName]];
        componentString = "[<span class='" + cssClass + " component-fixed'>" + fixedComponents[potionName] + "</span>]<br/>" + componentString;
    }
    rowClass += ' completionlevel-' + completionLevel;
    recipe = recipe.replace(/^.*<b>Potion of (.+)<\/b>.*$/, "<tr id='recipe-$1-full' class='" + rowClass + "' style='display:" + fullDisplay + "'><td valign='top' class='recipename'><a class='toggleLink' id='toggle-" + potionName + "-full'><img src='/images/g/inf/close.gif'/></a> $1" + safePotionCount + "<br>" + buttonHtml + retform + placeform + "</td><td colspan='6' class='recipelist'>" + componentString + "</td></tr>");
    recipe += "<tr id='recipe-" + potionName + "-summary' class='" + rowClass + "' style='display:" + summaryDisplay + "'>";
    recipe += "<td valign='top' class='recipename'><a class='toggleLink' id='toggle-" + potionName + "-summary'><img src='http://nexusclash.com/images/g/inf/open.gif'/></a> " + shortName + safePotionCountShort + "</td>";
    if (partial) {
        for (i = 0; i < componentCount; i++) { recipe += "<td class='summarycell'></td>"; }
        for (i = 0; i < 6 - componentCount; i++) { recipe += "<td class='summarycell summary-empty'></td>"; }
    } else if (empty) { recipe += "<td colspan='6' class='recipelist'></td>"; }
    else {
        for (i = 0; i < inventoryCount; i++) { recipe += "<td class='summarycell match-inventory'></td>"; }
        for (i = 0; i < safeCount; i++) { recipe += "<td class='summarycell match-safe'></td>"; }
        for (i = 0; i < 6 - inventoryCount - safeCount; i++) { recipe += "<td class='summarycell'></td>"; }
    }
    recipe += '</tr>';
    return recipe;
}

function getSafeItem(item) {
    var ret_id = '',  ret_type = '';
    if (safeItems[item]) {
        if (safeItems[item].safe) { ret_id = safeItems[item].safe; ret_type = 'safe'; }
        else if (safeItems[item].footlocker) { ret_id = safeItems[item].footlocker; ret_type = 'footlocker'; }
    }
    return [ret_id, ret_type];
}

function getInvItem(item) {
    if (inventoryItems[item]) { return inventoryItems[item].value; }
    else { return ''; }
}

function parseSafeItems() {
    var items = [], len, i, j, safestatus, safeType, safeOptions, componentMatch, componentId, component, count, alchemyItems;
    var safe = document.evaluate("//form[@name='footlockergrab']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    safestatus = safe.snapshotLength;
    for (j = 0; j < safestatus; j++) {
        safeType = safe.snapshotItem(j).getAttribute('action').match(/op=([^"]*)/)[1];
        safeOptions = document.evaluate('.//option', safe.snapshotItem(j), null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        len = safeOptions.snapshotLength;
        for (i = 0; i < len; i++) {
            //match components
            componentMatch = safeOptions.snapshotItem(i).innerHTML.match(/(.+) \((\d+)\)$/);
            componentId = safeOptions.snapshotItem(i).value;
            component = componentMatch[1]; count = componentMatch[2];
            if (components[character.Class][component]) {
                safeOptions.snapshotItem(i).className = 'safeitem-' + components[character.Class][component];
            }
            if (!items[component]) { items[component] = {}; }
            if (!items[component].count) { items[component].count = parseInt(count); }
            items[component][safeType] = componentId;
        }
    }
    alchemyItems = document.evaluate("//form[@name='alchemyresearch' or @name='alchemytransmute']/select[@name='itemid']/option", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
    len = alchemyItems.snapshotLength;
    for (i = 0; i < len; i++) {
        if (components[character.Class][alchemyItems.snapshotItem(i).innerHTML]) { alchemyItems.snapshotItem(i).className = 'safeitem-' + components[character.Class][alchemyItems.snapshotItem(i).innerHTML]; }
    }
    return [items, safestatus];
}

function parseInventoryItems() {
    var items = [], len, i, component, value;
    var safeOptions = document.evaluate("//form[@name='safestock' or @name='alchemyresearch']/select[@name='item' or @name='itemid']/option",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);
    len = safeOptions.snapshotLength;
    for (i = 0; i < len; i++) {
        component = safeOptions.snapshotItem(i).innerHTML;
        value = safeOptions.snapshotItem(i).value;
        if (components[character.Class][component]) { safeOptions.snapshotItem(i).className = 'safeitem-' + components[character.Class][component]; }
        if (!items[component]) { items[component] = {}; }
        items[component].count = 1; items[component].value = value;
    }
    return items;
}

function parseCharacterInfo() {
    var character = {};
    character.Class = 'Sorcerer'; // = levelclassname; //bugged so that all classes have same corpus
    character.Id = charinfoid;
    return character;
}

function setToggle(characterId, recipe, toggleState) {
    setSetting('alchemy-toggle-' + recipe, toggleState);
    var summary = document.getElementById('recipe-' + recipe + '-summary');
    var full = document.getElementById('recipe-' + recipe + '-full');
    if (toggleState == 'summary') { full.style.display = 'none'; summary.style.display = 'table-row'; }
    else { full.style.display = 'table-row'; summary.style.display = 'none'; }
}

function setToggleListeners() {
    var len, i, link;
    var toggleLinks = document.evaluate("//a[@class='toggleLink']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = toggleLinks.snapshotLength;
    for (i = 0; i < len; i++) {
        link = toggleLinks.snapshotItem(i);
        setToggleListener(link);
    }
}

function setToggleListener(link) {
    var linkMatch = link.id.match(/toggle-(.+)-(full|summary)/);
    var potion = linkMatch[1];
    var toggleType = linkMatch[2];
    link.addEventListener('click', function() { setToggle(character.Id, potion, (toggleType == 'full') ? 'summary' : 'full'); }, false);
}

function toggleAll(toggleState) {
    var len, i, link, linkMatch, potion;
    var toggleLinks = document.evaluate("//a[@class='toggleLink']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = toggleLinks.snapshotLength;
    for (i = 0; i < len; i++) {
        link = toggleLinks.snapshotItem(i);
        linkMatch = link.id.match(/toggle-(.+)-(full|summary)/);
        potion = linkMatch[1];
        setToggle(character.Id, potion, toggleState);
    }
}

function setToggleAll(panetitle) {
    var open, close;
    open = document.createElement('input');
    open.type = 'submit'; open.value = '(Open All)'; open.className = 'liblink';
    close = document.createElement('input');
    close.type = 'submit'; close.value = '(Close All)'; close.className = 'liblink';
    open.addEventListener('click', function() { toggleAll('full'); }, false);
    close.addEventListener('click', function() { toggleAll('summary'); }, false);
    panetitle.appendChild(open);
    panetitle.appendChild(close);
}

function getComponentDictionary() {
    var components = {};
    components.Sorcerer = {}; //only sorceror components used in breath3
    components.Sorcerer['Bag of Industrial Plastic'] = 'rare';
    components.Sorcerer['Batch of Leather'] = 'rare';
    components.Sorcerer['Batch of Mushrooms'] = 'uncommon';
    components.Sorcerer['Blood Ice'] = 'uncommon immutable';
    components.Sorcerer['Bottle of Holy Water'] = 'common';
    components.Sorcerer['Bottle of Paradise Water'] = 'common';
    components.Sorcerer['Bunch of Daisies'] = 'uncommon';
    components.Sorcerer['Bunch of Lilies'] = 'rare';
    components.Sorcerer['Bunch of Paradise Lilies'] = 'uncommon';
    components.Sorcerer['Chunk of Brass'] = 'uncommon';
    components.Sorcerer['Chunk of Iron'] = 'rare';
    components.Sorcerer['Chunk of Ivory'] = 'uncommon';
    components.Sorcerer['Chunk of Onyx'] = 'rare';
    components.Sorcerer['Chunk of Steel'] = 'common';
    components.Sorcerer['Chunk of Stygian Iron'] = 'common';
    components.Sorcerer['Femur'] = 'common';
    components.Sorcerer['Gold Ingot'] = 'uncommon'; //not rare, in practice
    components.Sorcerer['Handful of Grave Dirt'] = 'common';
    components.Sorcerer['Healing Herb'] = 'uncommon';
    components.Sorcerer['Humerus'] = 'common';
    components.Sorcerer['Lead Brick'] = 'uncommon';
    components.Sorcerer['Patch of Lichen'] = 'uncommon';
    components.Sorcerer['Patch of Moss'] = 'uncommon';
    components.Sorcerer['Piece of Stygian Coal'] = 'common';
    components.Sorcerer['Piece of Wood'] = 'common';
    components.Sorcerer['Rose'] = 'common';
    components.Sorcerer['Silver Ingot'] = 'uncommon';
    components.Sorcerer['Skull'] = 'common';
    components.Sorcerer['Small Bottle of Gunpowder'] = 'rare';
    components.Sorcerer['Soul Ice'] = 'uncommon immutable';
    components.Sorcerer['Spool of Copper Wire'] = 'rare';
    components.Sorcerer['Sprig of Nightshade'] = 'rare';
    components.Sorcerer['Stygian Bone Leech'] = 'common';
    return components;
}

function getShortNames() {
    var shortNames = {};
    shortNames['Acid Affinity'] = 'Acid';
    shortNames['Cold Affinity'] = 'Cold';
    shortNames['Combat Clarity'] = 'CC';
    shortNames['Death Affinity'] = 'Death';
    shortNames['Electricity Affinity'] = 'Electric';
    shortNames['Fire Affinity'] = 'Fire';
    shortNames['Extended Invisibility'] = 'XI';
    shortNames['Greater Invulnerability'] = 'GI';
    shortNames['Holy Affinity'] = 'Holy';
    shortNames['Invulnerability'] = 'I';
    shortNames['Lesser Invulnerability'] = 'LI';
    shortNames['Magic Recovery'] = 'MR';
    shortNames['Planar Protection'] = 'PP';
    shortNames['Regeneration'] = 'Regen';
    shortNames['Unholy Affinity'] = 'Unholy';
    shortNames['Water-Breathing'] = 'Wtr Brth';
    return shortNames;
}

function getFixedComponents() {
    var fixedComponents = {};
    fixedComponents['Extended Invisibility'] = 'Small Bottle of Gunpowder';
    fixedComponents['Magic Recovery'] = 'Chunk of Onyx';
    fixedComponents['Greater Invulnerability'] = 'Chunk of Iron';
    fixedComponents['Combat Clarity'] = 'Gold Ingot';
    fixedComponents['Death Affinity'] = 'Sprig of Nightshade';
    fixedComponents['Strength'] = 'Bag of Industrial Plastic';
    fixedComponents['Electricity Affinity'] = 'Spool of Copper Wire';
    fixedComponents['Flying'] = 'Silver Ingot';
    fixedComponents['Regeneration'] = 'Stygian Bone Leech';
    fixedComponents['Lesser Invulnerability'] = 'Batch of Leather';
    fixedComponents['Water-Breathing'] = 'Bunch of Lilies';
    fixedComponents['Acid Affinity'] = 'Patch of Lichen';
    fixedComponents['Holy Affinity'] = 'Bunch of Paradise Lilies';
    fixedComponents['Invisibility'] = 'Batch of Mushrooms';
    fixedComponents['Unholy Affinity'] = 'Blood Ice';
    fixedComponents['Invulnerability'] = 'Lead Brick';
    fixedComponents['Cold Affinity'] = 'Soul Ice';
    fixedComponents['Healing'] = 'Skull';
    fixedComponents['Planar Protection'] = 'Handful of Grave Dirt';
    fixedComponents['Fire Affinity'] = 'Chunk of Brass';
    return fixedComponents;
}


//#############################################################################
// tweak 11: Access Keys
function addAccessKey(extra, evalstr) {
    var form = document.evaluate(evalstr, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var keys = ['null','B','C','E','F','G','J','K','L','N','O','Q','R','T','U','V','W','X','Y','Z','!','"','£','@','#','$','%','^','&','*','(',')'];
    var aKey = getSetting('accesskeys-extra-'+extra);
    if (keys.indexOf(aKey) == -1) { aKey = 'null'; }
    setSetting('accesskeys-extra-'+extra, aKey);
    if (form.snapshotLength > 0) { form.snapshotItem(0).accessKey = aKey; }
}

function accesskeys() {
    if (getSetting('accesskeys-extra-heal') != 'null') { addAccessKey('heal', "//form/input[@name='heal_type']/../input[@type='submit']"); }
    if (getSetting('accesskeys-extra-fort') != 'null') { addAccessKey('fort', "//form[@name='fortificationattack']/input[@type='submit']"); }
    if (getSetting('accesskeys-extra-pickup') != 'null') { addAccessKey('pickup', "//form[@name='pickup']/input[@type='submit']"); }
    if (getSetting('accesskeys-extra-door') != 'null') { addAccessKey('door', "//form[@name='doorenter']/input[@type='submit']"); }
    if (getSetting('accesskeys-extra-recap') != 'null') { addAccessKey('recap', "//form[@name='flag_retrieval']/input[@type='submit']"); }
}


//#############################################################################
// tweak 12: Pet Targetting
function pettarget() {
    var len, i, local, idnum;
    var petlinks = document.evaluate("//a[starts-with(@href,'modules.php?name=Game&op=view_pet&id=')]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = petlinks.snapshotLength;
    for (i = 0; i < len; i++) {
        local = petlinks.snapshotItem(i);
        idnum = local.href.match('.+id=([0-9]+)')[1];
        local.href = "javascript:SelectItem('target_id'," + idnum + ")";
    }
}


//#############################################################################
// tweak 13: Remove Gem Colours
function removecolours() {
    var factionsafe = document.evaluate("//form[@name='footlockergrab']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (factionsafe.snapshotLength === 0) { return; }
    var selElem = factionsafe.snapshotItem(0).lastElementChild,
        tmpAry = [], len = selElem.options.length, i;
    for (i = 0; i < len; i++) {
        tmpAry[i] = [];
        tmpAry[i][0] = selElem.options[i].text.replace(/Small [A-Za-z]+ Gem -/,'Spellgem -');
        tmpAry[i][1] = selElem.options[i].value;
        tmpAry[i][2] = selElem.options[i].selected;
        tmpAry[i][3] = selElem.options[i].className;
    }
    tmpAry.sort(function (a,b) {//this needed to ignore case and leading numbers
            var a=a[0].match(/([A-Za-z-,0-9 ]+)/)[1];
            var b=b[0].match(/([A-Za-z-,0-9 ]+)/)[1];
            return a<b?-1:b<a?1:0;
        });
    len = tmpAry.length;
    for (i = 0; i < len; i++) {
        selElem.options[i].text = tmpAry[i][0];
        selElem.options[i].value = tmpAry[i][1];
        selElem.options[i].selected = tmpAry[i][2];
        selElem.options[i].className = tmpAry[i][3];
    }
}


//#############################################################################
// tweak 14: Faction Census
function factioncensus() {
    var loc = location + '';
    var ranks, census, ranksrow, rcell, rdiv;
    if (!loc.match(/faction&do=roster/)) { return; }
    ranks = document.evaluate("//table/tbody/tr[th='Character']/..", document, null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (ranks.snapshotLength != 1) { logLibC('lib: census failed to find ranks'); return; }
    census = (ranks.snapshotItem(0).childElementCount - 1);
    if (census === 0) { return; }
    ranksrow = document.evaluate("//div/table/tbody/tr[td='Renown']", document, null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    rcell = ranksrow.snapshotItem(0).children[1];
    rdiv = document.createElement('div');
    rdiv.appendChild(document.createTextNode(census + ' Persons'));
    rcell.appendChild(rdiv);
}


//#############################################################################
// tweak 15: Inventory Tweaks
function invFastReload(invTBody) {
    var invReload, len, i, item;
    invReload = document.evaluate("//tr[td/a/text()='Reload' or td/a[starts-with(.,'Charge')]]", invTBody, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = invReload.snapshotLength;
    for (i = 0; i < len; i++) {
        item = invReload.snapshotItem(i);
        invTBody.insertBefore(item, invTBody.firstElementChild.nextElementSibling.nextElementSibling.nextElementSibling);
    }
}

function invHideItems(invTBody) {
    var invHead, hidestate='table-row', len, i, hidebutton;
    invHead = document.evaluate("//th[starts-with(.,'Item')]", invTBody, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (invHead.snapshotLength === 0) { return; }
    if (getSetting('inventory-toggle-hide') != 'table-row') { hidestate = 'none'; }
    setSetting('inventory-toggle-hide', hidestate);
    hidebutton = document.createElement('a');
    hidebutton.className = 'item_use';
    if (hidestate == 'none') { hidebutton.textContent = 'Show'; }
    else { hidebutton.textContent = 'Hide'; }
    hidebutton.addEventListener('click', function(e) { inventory_toggle(e); }, false);
    invHead.snapshotItem(0).nextElementSibling.appendChild(hidebutton);
    len = invTBody.children.length;
    for (i = 0; i < len; i++) {
        if (invTBody.children[i].children[3] && invTBody.children[i].children[3].textContent == '0' && document.evaluate("a[text()='Manabite']", invTBody.children[i].children[1], null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength === 0) {
            invTBody.children[i].className = 'libhideclothes';
            invTBody.children[i].style.display = hidestate;
        }
    }
}

function invShortItems(invTBody) {
    var invHead, len, i, temp, test;
    var qualityLevel = {'pristine':'+Q5', 'good':'+Q4', 'average':'=Q3', 'worn':'-Q2', 'broken':'-Q1', 'destroyed':'-Q0'};
    invHead = document.evaluate("//tr[@bgcolor='#eeeeee' or @bgcolor='#ffffff']", invTBody, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = invHead.snapshotLength;
    if (len === 0) { return; }
    for (i = 0; i < len; i++) {
        temp = invHead.snapshotItem(i).children[0];
        // shorter item names for classifications
        if (temp.innerHTML.match(/^(Bottle of|Bunch of|Can of|Chunk of|Dose of|Pair of|Piece of|Potion of|Set of|Slice of|Suit of) /)) { temp.innerHTML = temp.innerHTML.replace(/^(Bottle of|Bunch of|Can of|Chunk of|Dose of|Pair of|Piece of|Potion of|Set of|Slice of|Suit of) /, ''); }

        // enchanted/magical shortening
        if (temp.innerHTML.match(/\((enchanted|magical)\)/)) { temp.innerHTML = temp.innerHTML.replace(/\((enchanted|magical)\)/, '(mag)'); }

        // shorten spellgems
        if (temp.innerHTML.match(/( Spellgem,)/)) { temp.innerHTML = temp.innerHTML.replace(/( Spellgem,)/, ','); }

        // remove glyph extra start
        if (temp.innerHTML.match(/(Glyph of )/)) { temp.innerHTML = temp.innerHTML.replace(/(Glyph of )/, ''); }

        // Q5 system and (#s) for shots
        if (getSetting('inventory-extra-shorter') == 'true') {
            if (temp.innerHTML.match(/\((\d+) (shots|charges)\)/)) { temp.innerHTML = temp.innerHTML.replace(/\((\d+) (shots|charges)\)/, '\($1s\)'); }

            test = temp.innerHTML.match(/\((pristine|good|average|worn|broken|destroyed)\)/);
            if (test) { temp.innerHTML = temp.innerHTML.replace(/\((pristine|good|average|worn|broken|destroyed)\)/, '('+qualityLevel[test[1]]+')'); }
        }
    }
}

function invContextBtns(invTBody) {
    var invHead, invRows, len, i, temp, iid, contextbtn, option, setting, sidx = 0;
    var contextopts = [['give','Give'],['safe','Safe'],['foot','Locker'],['null','None']];
    setting = getSetting('inventory-extra-contextselect');
    invRows = document.evaluate("//tr[@bgcolor='#eeeeee' or @bgcolor='#ffffff']", invTBody, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    invHead = document.evaluate("//th[starts-with(.,'Item')]", invTBody, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = invRows.snapshotLength;
    if (len === 0 || invHead.snapshotLength === 0) { return; }
    for (i = 0; i < len; i++) {
        temp = invRows.snapshotItem(i);
        if (!temp.children[4].innerHTML.match('.+item=([0-9]+)')) { continue; }
        iid = temp.children[4].innerHTML.match('.+item=([0-9]+)')[1];
        contextbtn = document.createElement('a'); contextbtn.className = 'liblink';
        contextbtn.textContent = '(-) '; contextbtn.id = 'context-'+iid;
        contextbtn.title = 'Context Use Button';
        if (setting == 'safe' || setting == 'give' || setting == 'foot') {
            contextbtn.style.display = 'inline';
        } else { contextbtn.style.display = 'none'; }
        temp.children[0].insertBefore(contextbtn, temp.children[0].childNodes[0]);
        contextbtn.addEventListener('click', function(e) { inventory_context_use(e); }, false);
    }
    invHead = invHead.snapshotItem(0);
    temp = document.createElement('select');
    temp.id = 'context-select'; temp.title = 'Select Context Button Action';
    len = contextopts.length;
    for (i = 0; i < len; i++) {
        if (contextopts[i][0] == setting) { sidx = i; }
        option = document.createElement('option');
        option.value = contextopts[i][0]; option.text = contextopts[i][1];
        temp.add(option);
    }
    temp.selectedIndex = sidx;
    temp.addEventListener('change', function(e) { inventory_context_setting(e); }, false);
    invHead.appendChild(document.createTextNode('-Context: '));
    invHead.appendChild(temp);
}

function inventory_context_setting(e) {
    var len, i, setting;
    setting = e.target.options[e.target.selectedIndex].value;
    setSetting('inventory-extra-contextselect', setting);
    var contextbtns = document.evaluate("//a[starts-with(@id,'context-')]", e.target.parentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = contextbtns.snapshotLength; if (len === 0) { return; }
    for (i = 0; i < len; i++) {
        if (setting == 'safe' || setting == 'give' || setting == 'foot') {
            contextbtns.snapshotItem(i).style.display = 'inline';
        } else { contextbtns.snapshotItem(i).style.display = 'none'; }
    }
}

function inventory_context_use(e) {
    var iid = e.target.id.match(/[0-9]+/)[0];
    var setting = getSetting('inventory-extra-contextselect');
    var form, temp, i, len, flag=false;
    if (setting == 'give') {
        temp = document.evaluate("//form[@name='give']/select[@name='give_item_id']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    } else if (setting == 'safe') {
        temp = document.evaluate("//form[@name='safestock' and contains(@action, 'op=safe')]/select[@name='item']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    } else if (setting == 'foot') {
        temp = document.evaluate("//form[@name='safestock' and contains(@action, 'op=footlocker')]/select[@name='item']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    } else if (setting == 'null') { return; }
    else { logLibC('LibC: skipping invalid inventory context select'); return; }
    if (temp.snapshotLength === 0) { return; }
    temp = temp.snapshotItem(0);
    form = document.evaluate("input[@type='submit']", temp.parentNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
    len = temp.options.length;
    for (i = 0; i < len; i++) {
        if (temp.options[i].value == iid) { temp.selectedIndex = i; flag = true; break; }
    }
    if (flag) { form.click(); } //with all luck this should fake a click with properly selected item
}

function invColourComponents(invTBody) {
    var invHead, len, i, temp;
    var cdict = getComponentDictionary();
    invHead = document.evaluate("//tr[@bgcolor='#eeeeee' or @bgcolor='#ffffff']", invTBody, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    len = invHead.snapshotLength;
    if (len === 0) { return; }
    for (i = 0; i < len; i++) {
        temp = invHead.snapshotItem(i).children[0];
        if (cdict['Sorcerer'][temp.textContent]) { temp.className = 'component-'+cdict['Sorcerer'][temp.textContent]; }
    }
}

function inventory() {
    var invTBody = document.evaluate("//b[starts-with(.,'INVENTORY')]/../../../..", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (invTBody.snapshotLength === 0) { return; }
    invTBody = invTBody.snapshotItem(0);
    if (getSetting('inventory-extra-colourcomponents') == 'true') { invColourComponents(invTBody); } //this must be before shorten
    if (getSetting('inventory-extra-reload') == 'true') { invFastReload(invTBody); }
    if (getSetting('inventory-extra-hide') == 'true') { invHideItems(invTBody); }
    if (getSetting('inventory-extra-short') == 'true') { invShortItems(invTBody); }
    if (getSetting('inventory-extra-context') == 'true') { invContextBtns(invTBody); }
}

function inventory_toggle(e) {
    var button, elements, action, len, i;
    button = e.target;
    elements = document.getElementsByClassName('libhideclothes');
    if (button.textContent == 'Show') {
        button.textContent = 'Hide';
        action = 'table-row';
    } else if (button.textContent == 'Hide') {
        button.textContent = 'Show';
        action = 'none';
    }
    setSetting('inventory-toggle-hide', action);
    len = elements.length;
    for (i = 0; i < len; i++) { elements[i].style.display = action; }
}


//#############################################################################
// tweak 16: Default Select Options
function selectlastopt(evalstr) {
    var setselect, len;
    setselect = document.evaluate(evalstr, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (setselect.snapshotLength != 1) { return; }
    setselect = setselect.snapshotItem(0);
    len = setselect.length;
    setselect.selectedIndex = len - 1;
}

function targetsetupdefaults() { selectlastopt("//form[@name='targetsetup']/select[@name='item']"); }

function recapdefaults() { selectlastopt("//form[@name='flag_retrieval']/select[@name='standard_id']"); }

function speakdefaults() {
    var setselect = document.evaluate("//form[@name='speak']/select[@id='speech_target_id']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (setselect.snapshotLength != 1) { return; }
    setselect = setselect.snapshotItem(0).selectedIndex = 0;
}



//#############################################################################
// Settings, configuration, and variables
function logLibC(message, verbose=false) {
    if (!libCLogging) { return; } // logging disabled in userscript (top of the file)
    if (verbose && !libCLoggingVerbose) { return; } // verbose logging not enabled
    console.log(message);
}

function getSetting(settingname) {
    if (charinfoid) { settingname = 'libc-' + charinfoid + '-' + settingname; }
    else { logLibC('Error getSetting for '+settingname); return null; }
    return String(GM_getValue(settingname, null));
}

function setSetting(settingname, val) {
    if (charinfoid) { settingname = 'libc-' + charinfoid + '-' + settingname; }
    else { logLibC('Error setSetting for '+settingname+' to val: '+val); return null; }
    return GM_setValue(settingname, String(val));
}

function getGlobalSetting(settingname) { return String(GM_getValue('libc-global'+settingname, null)); }

function setGlobalSetting(settingname, val) { return GM_setValue('libc-global'+settingname, String(val)); }

function togglecheckbox(e) { logLibC('LibC: toggled '+e.target.id); setSetting(e.target.id, e.target.checked); }

function libCreateCheckbox(name, hovertext) {
    var checkbox;
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    if (getSetting(name) == 'true') { checkbox.checked = true; }
    else { checkbox.checked = false; }
    checkbox.title = hovertext;
    checkbox.id = name;
    checkbox.addEventListener('click', togglecheckbox, false);
    return checkbox;
}

function updatetextfield(e) { logLibC('LibC: set '+e.target.id+' to '+e.target.value); setSetting(e.target.id, e.target.value); }

function libCreateTextfield(name, hovertext) {
    var textfield;
    textfield = document.createElement('input');
    textfield.type = 'text';
    textfield.setAttribute('maxlength', 3);
    textfield.setAttribute('size', 3);
    if (getSetting(name)) { textfield.value = getSetting(name); }
    textfield.title = hovertext;
    textfield.id = name;
    textfield.addEventListener('input', updatetextfield, false);
    return textfield;
}

function updateselect(e) { logLibC('LibC: set '+e.target.id+' to '+e.target.options[e.target.selectedIndex].value); setSetting(e.target.id, e.target.options[e.target.selectedIndex].value); }

function libCreateSelect(name, hovertext, values) {
    var select, setting, sidx, len, i, temp, option;
    select = document.createElement('select');
    select.title = hovertext; select.id = name;
    setting = getSetting(name);
    sidx = 0; len = values.length;
    for (i = 0; i < len; i++) {
        temp = values[i];
        if (temp[0] == setting) { sidx = i; }
        option = document.createElement('option');
        option.value = temp[0]; option.text = temp[1];
        select.add(option);
    }
    select.selectedIndex = sidx;
    select.addEventListener('change', updateselect, false);
    return select;
}

function libSettings() {
    var scratchpad, table, temptable, temptablerow, link, verspan, i, len, s, t;
    
        // modules: tied to general tweaks. [<functionmap>,"display name","helptext/hovertext"]
    var settingrows = [
        ['hilights', 'Description Hilights', 'Highlights shadows moving in windows and the building lights.'],
        ['sortpeople', 'Sort Characters', 'Sorts characters in a location based on allegiance, and allows further sorting styles and display of informaiton.'],
        ['safety', 'Safety Buttons', 'Adds many options as to what buttons to add safeties to, preventing misclicks.'],
        ['thinbar', 'Thin Character Bars', 'Full MP or HP bars are made thinner, to take less space and to stand out.'],
        ['weaponpane', 'Weaponpane Tweak', 'Offers many quick tweaks to the weapon pane, including minimising lengthy options and displaying the DPA directly in the drop-down.'],
        ['pickup', 'Default Pick-Up', 'Defaults hatchets, throwing knives, then rocks to pick up in the target-shooting pane.'],
        ['warnheaders', 'Warning Headers', 'Colours headers orange or red when you have low AP or low HP.'],
        ['saveform', 'Save Forms', 'Saves the charged attack(s) or any other drop-downs that you use, so that you don\'t have to reselect them each time. Click the "Game Map" button to store your settings safely.'],
        ['pettweak', 'Pet Interface', 'Vastly improves upon the pet interface with colours, countdowns, hover information, and indicators for the lowest pets.'],
        ['alchemytweak', 'Alchemy Interface', 'Vastly improves upon the alchemy interface with colours, tabs, many easy-access buttons, and notes.'],
        ['accesskeys', 'Access Keys', 'Adds access keys to heal or to bash forts or to pickup items.'],
        ['pettarget', 'Pet Target Bug-Fix', 'Fixes it so that clicking on a pet\'s name will target that pet. Does not affect the pet target resetting after an attack.'],
        ['removecolour', 'Remove Gem Colour', 'Removes the colour of a gem and sorts them, in the faction safe. Only applies to spellcraft characters viewing a faction safe.'],
        ['inventory', 'Inventory Tweaks', 'For fast inventory management.'],
        ['targetsetup', 'Target Set-Up Default', 'Changes the default to the last option for setting up targets (usually bottles) and avoiding putting up precious potions.'],
        ['recapdefaults', 'Recapture Standard Default', 'Changes the default to the last option for reclaiming standards. (For ease of recapture)'],
        ['speakdefaults', 'Speech Defaults to Everyone', 'Changes the default speech target to be "everyone" to prevent accidentally whispering /me.'],
        ['global', 'GLOBAL SETTINGS', 'These settings are stored independent of your characters, due to technical limitations.']
    ];

        // settings to display under modules
            // b = checkbox, s = select(dropdown), f = textfield, g = global
    var settings = [
        ['hilights', 'b', 'Hilight Shadows', 'shadow', 'Highlights shadows moving in windows.'],
        ['hilights', 'b', 'Hilight Lights', 'lights', 'Highlights the power status of the tile.'],
        ['hilights', 'b', 'Display Pick-Up Item Count', 'targets', 'Adds a count of items that can be picked up to the end of the tile description. Dodgerblue if there are any, and no text if there are none.'],
        ['sortpeople', 's', 'Enemy Sort', 'sort1', 'What style of sorting is utilised: alphabetical(default), percentage HP, total HP.', [['normal','Alphabetical'],['percent', 'HP Percentage'], ['total', 'HP Total'], ['downtotal', 'HP Total Missing'], ['level', 'Level']]],
        ['sortpeople', 'b', 'Reverse Enemy Sort', 'reverse1', 'Reverses the order of characters.'],
        ['sortpeople', 's', 'Ally Sort', 'sort2', 'What style of sorting is utilised: alphabetical(default), percentage HP, total HP.', [['normal','Alphabetical'],['percent', 'HP Percentage'], ['total', 'HP Total'], ['downtotal', 'HP Total Missing'], ['level', 'Level']]],
        ['sortpeople', 'b', 'Reverse Ally Sort', 'reverse2', 'Reverses the order of characters.'],
        ['sortpeople', 'b', 'Sort Neutrals as Allies', 'neutrals', 'Treat unfactioned and neutral factioned characters as allies in the sorted list.'],
        ['sortpeople', 'b', 'Display HP', 'showhp', 'Prints the HP values after the character\'s name. Requires first-aid.'],
        ['sortpeople', 'b', 'Hilight Master\'s Pets', 'petmaster', 'Will hilight all the pets belonging to a master when hovering over their name. Adds a count of pets when you hover over their name.'],
        ['safety', 'b', 'Safe Drop Buttons', 'drop', 'Adds safeties to Drop Item buttons.'],
        ['safety', 'b', 'Safe Craft Button', 'craft', 'Adds a safety to the Craft Item button.'],
        ['safety', 'b', 'Safe Repair Button', 'repair', 'Adds a safety to the Repair Item button.'],
        ['safety', 'b', 'Safe Learn Buttons', 'learn', 'Adds safeties to Learn Spell buttons.'],
        ['safety', 'b', 'Safe Revoke Button', 'revoke', 'Adds a safety to the Revoke Stronghold button.'],
        ['safety', 'b', 'Safe Speech Buttons', 'speech', 'Adds a safety to Speech/Bullhorn buttons, so that you must enter something before sending.'],
        ['weaponpane', 'b', 'Print DPA', 'dpa', 'Prints the raw DPA for each attack in drop-downs.'],
        ['weaponpane', 'b', 'Shorten Damage', 'dmg', 'Shortens the damage and accuracy counts in drop-downs.'],
        ['weaponpane', 'b', 'Shorten Shots', 'shots', 'Shortens the shots remaining in drop-downs.'],
        ['weaponpane', 'b', 'Shorten Gems/Touch Attacks', 'gem', 'Shortens spellgems and non-damaging attacks in drop-downs.'],
        ['weaponpane', 'b', 'Shorten Quality', 'quality', 'Shortens quality levels in drop-downs.'],
        ['weaponpane', 'b', 'Shorten Enchant', 'magic', 'Shortens enchanted and magical items in the drop-downs.'],
        ['pickup', 's', 'Highest Priority', 'priority0', 'Always selects these items for pickup. Suggested either Hatchet or Misc.', [['null', 'None'],['hatchet', 'Hatchet'],['misc','Unknown/Misc.'],['drink', 'Bottle/Potion'],['food', 'Cans/Food'],['knife','Throwing Knife'],['rock','Rock']]],
        ['pickup', 's', 'High Priority', 'priority1', 'Selects these items for pickup if there are no higher priorities.', [['null', 'None'],['hatchet', 'Hatchet'],['misc','Unknown/Misc.'],['drink', 'Bottle/Potion'],['food', 'Cans/Food'],['knife','Throwing Knife'],['rock','Rock']]],
        ['pickup', 's', 'Normal Priority', 'priority2', 'Selects these items for pickup if there are no higher priorities.', [['null', 'None'],['hatchet', 'Hatchet'],['misc','Unknown/Misc.'],['drink', 'Bottle/Potion'],['food', 'Cans/Food'],['knife','Throwing Knife'],['rock','Rock']]],
        ['pickup', 's', 'Low Priority', 'priority3', 'Selects these items for pickup if there are no higher priorities.', [['null', 'None'],['hatchet', 'Hatchet'],['misc','Unknown/Misc.'],['drink', 'Bottle/Potion'],['food', 'Cans/Food'],['knife','Throwing Knife'],['rock','Rock']]],
        ['pickup', 's', 'Lower Priority', 'priority4', 'Selects these items for pickup if there are no higher priorities.', [['null', 'None'],['hatchet', 'Hatchet'],['misc','Unknown/Misc.'],['drink', 'Bottle/Potion'],['food', 'Cans/Food'],['knife','Throwing Knife'],['rock','Rock']]],
        ['pickup', 's', 'Lowest Priority', 'priority5', 'Selects these items for pickup if there are no higher priorities.', [['null', 'None'],['hatchet', 'Hatchet'],['misc','Unknown/Misc.'],['drink', 'Bottle/Potion'],['food', 'Cans/Food'],['knife','Throwing Knife'],['rock','Rock']]],
        ['warnheaders', 'f', 'Low AP', 'ap', 'Displays warning headers when AP is less than this.'],
        ['warnheaders', 'f', 'Low HP', 'hp', 'Displays warning headers when HP is less than this.'],
        ['warnheaders', 'b', 'Warning Move Buttons', 'move', 'Changes the border of move buttons when you are at risk.'],
        ['saveform', 'b', 'Charge-Type 1', 'c1', 'Remembers charged attacks of the first kind. (such as arcane shot and most charged attacks)'],
        ['saveform', 'b', 'Charge-Type 2', 'c2', 'Remembers charged attacks of the second kind. (such as mystic seeker)'],
        ['saveform', 'b', 'Clockwork Precision', 'precision', 'Remembers the amount for Seraphim\'s Eye of Clockwork Precision.'],
        ['saveform', 'b', 'Prayer', 'prayer', 'Remembers the last prayer type and maintains it.'],
        ['saveform', 'b', 'Repair Item', 'repair', 'Remembers the last item repaired and maintains it.'],
        ['pettweak', 'b', 'Count to MP Surplus', 'surplus', 'If checked, will display decay times and hilight based on time until AP equals MP, rather than just AP counts.'],
        ['pettweak', 'f', 'AP Critical', 'ap-low', 'Hilights the pet row when their AP (or AP surplus) is low.'],
        ['pettweak', 'f', 'AP Low', 'ap-mid', 'Hilights the pet row when their AP (or AP surplus) is nearing low.'],
        ['alchemytweak', 'b', 'Quick Inventory Potions', 'safebutton', 'Adds buttons for placing and retrieving a potion to/from the safe.'],
        ['alchemytweak', 'b', 'Display Potion Counts', 'count-show', 'Displays a coloured number of potions stocked in the safe.'],
        ['alchemytweak', 'f', 'Potions Critical', 'count-low', 'Everything under this amount is considered to be critically low.'],
        ['alchemytweak', 'f', 'Potions Low', 'count-mid', 'Everything between this amount and the critical amount is considered to be slightly low.'],
        ['alchemytweak', 'b', 'Always Hilight Safe', 'alwayshilight', 'Colours the inventory and safe drop-downs according to component rarity.'],
        ['alchemytweak', 'b', 'Suppress Component Hilighting', 'suppress', 'NOT RECOMMENDED BY DEFAULT: Removes the hilighting from components for when they are in the safe or your inventory.'],
        ['alchemytweak', 'b', 'Suppress Leech Warning', 'suppresslw', 'NOT RECOMMENDED BY DEFAULT: To disable the alternate button when leeches are in your inventory.'],
        ['accesskeys', 's', 'Fort-bash Key', 'fort', 'Adds an accesskey for fort-bashing. Suggested default F.', [['null', 'Disable'],['B','B'],['C','C'],['E','E'],['F','(F)'],['G','G'],['J','J'],['K','K'],['L','L'],['N','N'],['O','O'],['Q','Q'],['R','R'],['T','T'],['U','U'],['V','V'],['W','W'],['X','X'],['Y','Y'],['Z','Z'],['!','!'],['"','"'],['£','£'],['@','@'],['#','#'],['$','$'],['%','%'],['^','^'],['&','&'],['*','*'],['(','('],[')',')']]],
        ['accesskeys', 's', 'Heal Key', 'heal', 'Adds an accesskey for healing. Default order is FAKs, Bone Leeches, Herbs, then Surgery, depending on what is available. Suggested default X.', [['null', 'Disable'],['B','B'],['C','C'],['E','E'],['F','F'],['G','G'],['J','J'],['K','K'],['L','L'],['N','N'],['O','O'],['Q','Q'],['R','R'],['T','T'],['U','U'],['V','V'],['W','W'],['X','(X)'],['Y','Y'],['Z','Z'],['!','!'],['"','"'],['£','£'],['@','@'],['#','#'],['$','$'],['%','%'],['^','^'],['&','&'],['*','*'],['(','('],[')',')']]],
        ['accesskeys', 's', 'Retrieve Item Key', 'pickup', 'Adds an accesskey for picking up targets and throwing weapons. Suggested default E.', [['null', 'Disable'],['B','B'],['C','C'],['E','(E)'],['F','F'],['G','G'],['J','J'],['K','K'],['L','L'],['N','N'],['O','O'],['Q','Q'],['R','R'],['T','T'],['U','U'],['V','V'],['W','W'],['X','X'],['Y','Y'],['Z','Z'],['!','!'],['"','"'],['£','£'],['@','@'],['#','#'],['$','$'],['%','%'],['^','^'],['&','&'],['*','*'],['(','('],[')',')']]],
        ['accesskeys', 's', 'Enter/Exit Key', 'door', 'Adds an accesskey for entering and exiting a tile. Suggested default B.', [['null', 'Disable'],['B','(B)'],['C','C'],['E','E'],['F','F'],['G','G'],['J','J'],['K','K'],['L','L'],['N','N'],['O','O'],['Q','Q'],['R','R'],['T','T'],['U','U'],['V','V'],['W','W'],['X','X'],['Y','Y'],['Z','Z'],['!','!'],['"','"'],['£','£'],['@','@'],['#','#'],['$','$'],['%','%'],['^','^'],['&','&'],['*','*'],['(','('],[')',')']]],
        ['accesskeys', 's', 'Recapture Key', 'recap', 'Adds an accesskey for recapturing a standard. Suggested default L.', [['null', 'Disable'],['B','B'],['C','C'],['E','E'],['F','F'],['G','G'],['J','J'],['K','K'],['L','(L)'],['N','N'],['O','O'],['Q','Q'],['R','R'],['T','T'],['U','U'],['V','V'],['W','W'],['X','X'],['Y','Y'],['Z','Z'],['!','!'],['"','"'],['£','£'],['@','@'],['#','#'],['$','$'],['%','%'],['^','^'],['&','&'],['*','*'],['(','('],[')',')']]],
        ['inventory', 'b', 'Fast Charge/Reload', 'reload', 'Places gems able to be recharged and weapons able to be reloaded at the top of the list.'],
        ['inventory', 'b', 'Hide Weightless Items', 'hide', 'Hides weightless items in inventory, with a toggle to display them.'],
        ['inventory', 'b', 'Short Item Names', 'short', 'Shortens item names in the inventory to conserve space.'],
        ['inventory', 'b', 'Short Item Extras', 'shorter', 'Shortens item names further and changes quality levels to Q-levels.'],
        ['inventory', 'b', 'Context Buttons', 'context', 'Adds buttons before item names in the inventory to give, place in safe, or place in footlocker.'],
        ['inventory', 'b', 'Colour Components', 'colourcomponents', 'Colours alchemy components with rarity, and emboldens them.'],
        // ['craftcheck', 'b', 'Hilight Partial Options', 'hilight-partial', 'Much like alchemy pane, colours items you have some but not all ingredients to craft.'],
        ['global', 'g', 'Colour Message History', 'messagehistory', 'Adds CSS styling to the message history to improve ease of reading. Includes combat actions, searches, speech, and more.'],
        ['global', 'g', 'Safe Faction/Char Buttons', 'safebuttons', 'Adds safety buttons to character pages and faction pages and skill selection pages.'],
        ['global', 'g', 'Faction Census', 'factioncensus', 'Adds a census feature to the faction roster page.']
    ];
    scratchpad = document.evaluate("//td/form/textarea[@name='Scratchpad']/../../../..", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (scratchpad.snapshotLength != 1) { return; }
    table = scratchpad.snapshotItem(0).parentElement;
    table.appendChild(document.createElement('tr'));
    table.lastElementChild.appendChild(document.createElement('td'));
    temptable = document.createElement('table');
    temptable.id = 'libc-settingtable';
    temptable.className = 'libc-settingtable';
    temptable.appendChild(document.createElement('tbody'));
    link = document.createElement('a');
    link.href = '/modules.php?name=Forums&file=viewtopic&t=7291'; link.textContent = 'libConglomerate';
    verspan = document.createElement('span');
    verspan.appendChild(document.createTextNode('Version '+versionStr));
    temptablerow = document.createElement('tr');
    temptablerow.className = 'libc-settingrow';
    temptablerow.appendChild(document.createElement('td'));
    temptablerow.lastElementChild.className = 'libc-settingname';
    temptablerow.lastElementChild.appendChild(link);
    temptablerow.appendChild(document.createElement('td'));
    temptablerow.lastElementChild.className = 'libc-settinglist';
    temptablerow.lastElementChild.appendChild(verspan);
    temptable.lastElementChild.appendChild(temptablerow);
    table.lastElementChild.lastElementChild.appendChild(temptable);
    len = settingrows.length;
    for (i = 0; i < len; i++) { s = settingrows[i]; createSettingsRow(s[0], s[1], s[2]); }
    len = settings.length;
    for (i = 0; i < len; i++) {
        s = settings[i]; //setting
        t = s[1]; //types: (b)ox (f)ield (s)elect (g)lobal
        if (t == 'b') { addSettingBox(s[0], s[2], s[3], s[4]); }
        if (t == 'f') { addSettingField(s[0], s[2], s[3], s[4]); }
        if (t == 's') { addSettingSelect(s[0], s[2], s[3], s[4], s[5]); }
        if (t == 'g') { addGlobalSetting(s[0], s[2], s[3], s[4]); }
    }
}

function createSettingsRow(name, title, srdesc) {
    var table, settingsRow, settingTitle, settingList;
    table = document.getElementById('libc-settingtable').firstElementChild; //gets TBODY
    if (!table) { logLibC('LibC: failed to find settingtable'); return; }
    settingsRow = document.createElement('tr');
    settingsRow.className = 'libc-settingrow';
    settingTitle = document.createElement('td');
    settingTitle.className = 'libc-settingname';
    settingTitle.appendChild(document.createElement('span'));
    settingTitle.lastElementChild.appendChild(document.createTextNode(title));
    settingTitle.appendChild(libCreateCheckbox('run-'+name, srdesc));
    settingList = document.createElement('td');
    settingList.className = 'libc-settinglist';
    settingList.id = 'libc-setting-' + name;
    settingsRow.appendChild(settingTitle);
    settingsRow.appendChild(settingList);
    table.appendChild(settingsRow);
}

function addToRow(tdid, title, button) {
    var td, tempspan;
    td = document.getElementById('libc-setting-'+tdid);
    if (!td) { logLibC('LibC: failed to find libc-setting-'+tdid); return; }
    tempspan = document.createElement('span');
    tempspan.className = 'libc-settingspan';
    tempspan.appendChild(document.createTextNode(title));
    tempspan.appendChild(button);
    td.appendChild(tempspan);
    td.appendChild(document.createElement('br'));
}

function addSettingBox(tdid, title, setting, hover) {
    var box = libCreateCheckbox(tdid+'-extra-'+setting, hover);
    addToRow(tdid, title, box);
}

function addSettingField(tdid, title, setting, hover) {
    var field = libCreateTextfield(tdid+'-extra-'+setting, hover);
    addToRow(tdid, title, field);
}

function addSettingSelect(tdid, title, setting, hover, vals) {
    var select = libCreateSelect(tdid+'-extra-'+setting, hover, vals);
    addToRow(tdid, title, select);
}

function toggleglobal(e) { logLibC('LibC: toggled '+e.target.id); setGlobalSetting(e.target.name, e.target.checked); }

function addGlobalSetting(tdid, title, setting, hover) {
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    if (getGlobalSetting(setting) == 'true') { checkbox.checked = true; }
    else { checkbox.checked = false; }
    checkbox.title = hover; checkbox.id = 'global-'+setting;
    checkbox.name = setting;
    checkbox.addEventListener('click', toggleglobal, false);
    addToRow(tdid, title, checkbox);
}



function runLibC() {
    var libCalls, i, len;
    if (getSetting('run-sortpeople') == 'true') { sortpeople(); } //this breaks if not running first. innerHTML editing deletes dom elements
    libGlobalCalls = [
        ['factioncensus', factioncensus],
        ['safebuttons', safebuttons],
        ['messagehistory', messagehistory]
    ];
    len = libGlobalCalls.length;
    for (i = 0; i < len; i++) {
        if (getGlobalSetting(libGlobalCalls[i][0]) == 'true') { libGlobalCalls[i][1](); }
    }
    libSettings();
    if (charinfoid) { //these run using settings checks
        libCalls = [
            ['removecolour', removecolours],
            ['safety', safebuttons],
            ['hilights', showhilights],
            ['thinbar', tweakbars],
            ['weaponpane', weaponpane],
            ['pickup', pickupdefaults],
            ['warnheaders', warningheaders],
            ['saveform', saveForms],
            ['pettweak', processPetTable],
            ['alchemytweak', alchemytweak],
            ['accesskeys', accesskeys],
            ['pettarget', pettarget],
            ['inventory', inventory],
            ['targetsetup', targetsetupdefaults],
            ['recapdefaults', recapdefaults],
            ['speakdefaults', speakdefaults]
        ];
        len = libCalls.length;
        for (i = 0; i < len; i++) {
            if (getSetting('run-'+libCalls[i][0]) == 'true') {
                try {
                    libCalls[i][1](); // safely try to call a function; catch if it throws exception
                } catch(err) {
                    logLibC('Error running '+libCalls[i][0]+' with message ' + err.message );
                }
            }
        }
    }
}
runLibC();
})();
