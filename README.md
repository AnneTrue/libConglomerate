# libConglomerate
Assorted userscripts for NexusClash, along with a per-character, per-browser setting framework.

## Version 3.1.0
### Complete Feature List:
* Toggled Settings 
  * Found in the 'Pad' panel in the multi-function pane, below the character's note pad. 
  * Each setting is stored on a per-character basis. You will have to log in to each character and select which options they want to run. 
  * Settings are stored in local cache. They will therefore be specific to the computer you run them from, and if you clear your cache will lose the stored settings. 
  * The left setting column is the module. Check it to have it run on page loads, uncheck to disable. 
  * The right setting column is the options for a module. If the module runs, then it uses defaults or the settings stored in the right column. Some modules have no options, and some modules do nothing unless an option is selected. 
  * Hovering over a checkbox, list, or field will show a caption explaining the feature. 
  * All changes to settings take effect upon a page load. (The script only acts on the page when it is initially loaded.) 

* Global - Colour Message History 
  * Stylises the message pane with CSS to improve readability. Not tested to be colour-blind friendly. 
  * Runs in both the in-game message pane and the week-long message log you can access from the character's page. 
  * As the styles are matched using regular expressions and not an API, sometimes messages may adopt the wrong style. This happens most often when other players emote, or intentionally send messages/names that appear like other messages. 
  * If you log in or reload the map and there are more than 10 messages in the pane, it will resize the message pane. 
  * If your weapon is damaged during an attack, it will emphasise that message. 
  * Double ticks ('') are turned into apostrophes (') due to a bug that occasionally appears in-game. 
  * Messages that are stylised: Attacking a player/pet; darkhearting/cursing a player; Attacking wards, forts, or doors; taking damage (agony curse/defiler poison, etc.); pet attacks, being attacked, rejuves, despawning, death by aura, being summoned; global achievement announces; whispers, speech, emotes featuring at least two quotes ("), bullhorns sometimes; characters attacking/killing others; giving/being given items; crafting; finding an item, or nothing; stepping inside/outside; healing or being healed; losing a status effect; characters becoming visible/invisible; characters casting a glyph. 

* Description Highlights 
  * Does nothing unless an option is selected. 
  * Hilight Shadows stylises the description to show when there are shadow moving in a building. Good for hunters. 
  * Hilight Lights stylises the description to show the current power state. Have you ever had a bad run of searches before noticing that someone had cut the power without you noticing? Good for searchers and engineers. 
  * Display Pick-Up Item Count adds a hilight to the end of the tile description if there are items that can be picked up. Lists how many there are. Does not display if there are none. 

* Sort Characters 
  * Sorts visible characters into two groups, 'Allies' and 'Enemies' depending on faction politics. 
  * Neutral characters default to 'Enemies.' 
  * Enemy Sort and Ally Sort can be by HP Percentage, Alphabetical (Nexus Clash default), HP Total, HP Total Missing, Levels, Magic Points Missing, Magic Points Percentage. HP Total (and Missing) requires the First Aid skill to work properly. HP Percentage does not require first aid, but benefits from it (gains accuracy). Magic Point sorts require the Sense Magic skill. 
  * Reverse Enemy/Ally Sort simply flips the order they appear in. If you use HP (Or MP) Total Missing, you probably want to enable this to list the most hurt first.
  * Display HP requires the First Aid skill. It prints the current HP and the amount of HP missing from the character next to their name. Full HP uses black text, missing HP uses pink. Format is +HP-missing 
  * Display Magic Points requires the Sense Magic skill. It prints the amount of MP missing from a character, next to their name. The colour is dark blue, and is formatted as -missing after the character's name.
  * Sort Neutrals as Allies places unfactioned characters (and neutral politics factioned characters) into the allies group. 
  * Hilight Master's Pets will turn all the pets a character owns blue when you hover over their name. It will also add a hovertext with the total tally of pets that a character has. 

* Safety Buttons 
  * Does nothing unless options are selected. Adds safety checkboxes to buttons to force confirmation (and reduce misclick accidents) 
  * Safe Drop Buttons adds safeties to drop items, and shortens the drop item button. 
  * Safe Craft Button adds a safety to crafting items. Includes skill crafting such as FAKs, Lockpicks, Toolboxes, Surgeon's Kits. 
  * Safe Repair Button adds a safety to repairing items. 
  * Safe Learn Buttons adds safeties to learn spellgems, and shortens the learn button. 
  * Safe Speech Buttons disables bullhorn and speech buttons until you enter text into the fields. Prevents you from accidentally sending empty emotes. 
  * Safe Load Spellwand is for wizards: creates a double-click button for loading spellwands. The button reads 'Load?' and once clicked will be enabled and read 'Load'. Clicking again loads your spellwand. 

* Thin Character Bars 
  * If a character has full HP, the HP bar is made thinner. 
  * If a character has full MP, the MP bar is made thinner. 

* Weaponpane Tweak 
  * Does nothing unless options are selected. Is designed to remove the clutter from attack drop-downs so that they are smaller and more concise. 
  * Print DPA adds a raw damage per action estimate to the attack. Not recommended to enable due to its inaccuracy. 
  * Shorten Damage changes the damage and accuracy to be concise. Format dmg/acc% 
  * Shorten Shots changes shots in ammo-consuming weapons and spellgems to be short. Format #s 
  * Shorten Spellgems shortens drop-down options to read 'Gem' and removes 'Glyph of' text. Also replaces broken damage/accuracy displays for attacks that do not have them. Recommended if you have dark heart/non-damaging attacks or any spells. 
  * Shorten Quality changes quality to the Q5 system. Format: +Q5+ is pristine. +Q4+ is good. =Q3= is average. -Q2- -Q1- -Q0- are below average to destroyed. 
  * Shorten Enchant replaces (magical) and (enchanted) text with the shorter (mag) tag. 

* Default Pick-Up 
  * Recommended for throwing weapon users. Use in conjunction with access keys to pick items up and attack quickly. 
  * Can also be used to quickly find useful items. 
  * Has six priorities for items to pick up, and should be able to parse credit renamed items. 
  * Unknown/Misc. will select rare items or anything not recognised. Example: Soft teddy bears. 
  * Hatchet will select hatchets. Example: Hatchets. 
(Rock and Knife do likewise.) 
  * Bottle/Potion will select any "Bottle of *" or "Vial of *" and Absinthe. Example: Potions and alcohol or angel tears. 
  * Food will select any "Can of *" and Apples. 

* Warning Headers 
  * Adds warnings to the black panetitle headers. Yellow-gold is low AP, Red is low HP. 
  * You can set the thresholds with the Low AP/Low HP text fields. 
  * Warning Move Buttons adds a dashed outline around move buttons when you are being warned, to keep you from running out of AP or dying. 

* Save Forms 
  * A must-have for many classes. Gunwizards and Seraphim in particular benefit the most. Requires selected options to run. 
  * To remember a charge, you can safe-store or hot-store. Safe storage is finding the first instance of the drop-down you want to store, selecting the option you want, then clicking the 'Game Map' to refresh. Confirm that the option you wanted is now automatically selected. 
  * To hot-store an option, merely perform the action with the chosen option. Such as attacking someone with the options you want remembered. Recommended to perform that on enemies, not friends. 
  * Charge-Type 1 remembers the charge of most types. Enervate, smite, focused attack, destructive blow, arcane shot, sanctify spell, eldritch blast, and many more fall into this type. 
  * Charge-Type 2 remembers the charge of rare types. I only know of mystic seeker using this form. 
  * Clockwork Precision remembers the amount of clockwork precision for Seraphim. 
  * Prayer remembers the last type of prayer you used. 
  * Repair Item remembers the last item repaired. 

* Pet Interface 
  * Overhauls the pet interface. Petmasters, rejoice! 
  * Adds a decay timer to the pet rows. Displays hours (in decimal, .25h is 15 minutes) until the pet hits their surplus or despawn point. Hovering over the decay field displays a 24-hour formatted local time that the pet decays. Note that times over 24 hours do not include dates. 
  * Removes the 'set stance' button for individual pets. Be warned, if you change the stance of the pet in the drop down it will go through immediately. Does not affect the 'Set All Pets' drop down. 
  * Adds colours to pets based on their ap and mp status, determined by optional thresholds. 
  * Hilights the first and second pets in most critical need of rejuvenations. Order is determined by lowest AP, ties are broken over MP then HP. (Caveat: Lowest AP may not apply when count to MP surplus is in play. More on that later.) 
  * If the pet has more MP than AP (an MP surplus) then its row is coloured red. 
  * If the pet is low on AP (defined by user option) then its row is coloured grey. If it is critically low on AP, it is coloured yellow. 
  * Count to MP Surplus forces the pet AP counts to be adjusted for MP. AP is therefore calculated variably, treating 0 AP as being the same as their current MP. This is a recommended feature for petmasters if you intend to keep your pets above an MP surplus to maximise their fighting potential, and to balance out large discrepancies between pet AP/MP totals when rejuvenating. 
  * AP Critical and AP Low are user options for setting when to hilight a pet. Default 8 critical and 20 low. Set to 0 to disable. MP surplus cannot be disabled currently. 

* Alchemy Interface 
  * A massive overhaul with many features. Definitely recommended to enable because it is one of the greatest features. Based upon but vastly improved over the version by ChesterKatz. Includes its own 'Help Page' as the 'Help: Alchemy Assistant' tab in the recipe pane. 
  * Uses colours that are friendlier to individuals who are colour-blind. 
  * Reformats the recipe pane into a human-comprehensible tabular system that can be collapsed/expanded. Remembers the toggle state of tabs. Has buttons to toggle all tabs open or closed at the top of the pane. 
  * Hilights the availability of components in a recipe. Brown for item in the safe/footlocker, blue for item in the inventory. Can be disabled with "Suppress Component Hilighting" option. Caveat: Cannot distinguish between one item in the inventory and more than one, so recipes calling for more than one may mark the multiples are present when they are not. 
  * Hilights the entire recipe if it is able to be brewed. Brown if you have all the components in the safe, blue if they are all in your inventory. 
  * Adds a brew button underneath the recipe name when you have all the components. The button will change to a warning button if you have a stygian bone leech in your inventory. You can safely ignore that warning. 
  * Component rarity is displayed. When recipe pane is open, also colours the rarity of items in the safe. Black is common, Green is uncommon, Red is rare. Non-transmutable components (blood and soul ices) are emboldened. 
  * Components that are available to retrieve from the safe have an 's' after them to retrieve them. If there are none in the safe but some in the footlocker, there is an 'f' instead. 
  * Adds basic help tabs for alchemy-specific knowledge, including fixed components. 
  * Includes a component dictionary for an at-a-glance overview of component stocks, as well as being able to quickly retrieve any component by clicking the 's' or 'f.' Useful if you must transmute components often and are tired of scrolling through the drop down to find an equal rarity. 
  * Indicated preserved components in a recipe, if any. Is not perfectly accurate due to the indefinite nature of the circumstances. 
  * Quick Inventory Potions adds links beneath a recipe name to quickly place or retrieve a potion into or out of the public safe. Useful if you are batch-creating a potion and want to place them up quickly, or if you need to take potions out in bulk for enchantments/use. 
  * Display Potion Counts adds a count of potions in the safe (or if none, those in a footlocker) to the recipe name. Useful for an at-a-glance overview of potion stocks. 
  * Potions Critical/Low set the thresholds for the display potion count colours. Blue is good, Brown is low, Red is critical, Bold Black is 0. 
  * Always Hilight Safe always adds the background colours to safe and footlocker and alchemy dropdowns. 
  * Suppress Component Hilighting is not recommended by default. Disables the hilighting of components when they are in the safe or inventory. 
  * Suppress Leech Warning is not recommended by default. Prevents the alternate brew button when there is a leech in your inventory. 

* Access Keys 
  * Does nothing unless options are selected. Allows you to add custom access keys to certain actions. If you did not know about access keys, you should probably see if they are right for you. They improve the flow of the game immensely. 
  * Fort-bash Key: Recommended F. Attacks fortifications. 
  * Heal Key: Recommended X. Heals the currently selected player. Uses the first method of healing available in order: FAK, Bone Leech, Healing Herb, Surgery. 
  * Retrieve Item Key: Recommended E. Thrown weapon users, rejoice! Speeds up attacks immensely. Use with the default pick-up module enabled. 
  * Enter/Exit Key: Recommended B. To enter or exit a building quickly. Does not work to enter with a closed door if you have certain skills that bypass doors through separate means (stepping of the corner). 
  * Recapture Key: Recommended L. For retrieving captured standards before pets maul you. Use with the recapture default module. 
  * Power Repair/Remove Key: Recommended J. For cutting/restoring power to a tile.

* Remove Gem Colour 
  * Requires spellcraft, only applies to a faction's safe and not your footlocker or inventory. 
  * Removes the colour of the gem entirely, places all the gems in the same place (Spellgem -) and sorts them alphabetically by name and charges left. 

* Inventory Tweaks 
  * Does nothing unless options are selected. Improves the inventory pane to be less cluttered. 
  * Fast Charge/Reload places items that can be reloaded (bullhorns, guns, bows, spellgems, etc.) at the top of the inventory pane. 
  * Hide Weightless Items hides items with no weight (clothes in particular.) Adds a show/hide toggle to the 'Worn' Header at the top of the inventory. Does not hide items that can be manabitten. 
  * Hidden/Shown state is remembered between page loads. 
  * Short Item Names generally shortens the inventory. Removes 'Bottle of|Bunch of|Can of|Chunk of|Dose of|Pair of|Piece of|Potion of|Set of|Slice of|Suit of' text. Shortens (magical) and (enchanted) tags. Shortens spellgems. Shortens glyphs.
    * Caveat: Does not resort items alphabetically. Bottles are still found in the B sections, even if their letter begins with V. 
  * Short Item Extras is not generally recommended. Shortens shots to format as #s and item quality to the Q5 system. 
  * Context Buttons adds buttons to the inventory to quickly perform basic actions. Select the context (give to selected person, place in safe, place in footlocker) at the top of the inventory. Streamlines bulk inventory management actions. Context buttons only display when there is a selected context; setting the context to None will render them invisible. 
  * Colour Components emboldens and colours components in the inventory list according to rarity. 

* Target Set-Up Default 
  * After grinding over 2000 targets shot, I decided this needed to exist. Too late for me but not for you. 
  * Defaults the set-up drop-down to the last item. If your default is usually a potion that you do not want to lose, try enabling this module. Speeds up the grind slightly.

* Recapture Default 
  * Defaults the recapture standard drop-down to the last option. Helps recapturing immensely. 

* Speech Default 
  * For everyone who has ever accidentally whispered an emote to someone you just gave an item to or attacked. 
  * Defaults speech to 'Everyone Here' when you load the page. 
