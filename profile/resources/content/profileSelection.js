/* -*- Mode: C; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
 * The contents of this file are subject to the Netscape Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/NPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *
 * The Original Code is Mozilla Communicator client code, released
 * March 31, 1998.
 *
 * The Initial Developer of the Original Code is Netscape
 * Communications Corporation. Portions created by Netscape are
 * Copyright (C) 1998-1999 Netscape Communications Corporation. All
 * Rights Reserved.
 *
 * Contributor(s):
 *   Ben Goodger (03/01/00)
 *   Seth Spitzer (28/10/99)
 *   Dan Veditz <dveditz@netscape.com>
 */

var gProfileManagerBundle;
var gBrandBundle;
var profile     = Components.classes["@mozilla.org/profile/manager;1"].getService();
if (profile)
  profile       = profile.QueryInterface(Components.interfaces.nsIProfileInternal);

var Registry;

function StartUp()
{
  gProfileManagerBundle = document.getElementById("bundle_profileManager");
  gBrandBundle = document.getElementById("bundle_brand");

  SetUpOKCancelButtons();
  centerWindowOnScreen();
  if(window.location && window.location.search && window.location.search == "?manage=true" )
    SwitchProfileManagerMode();

  var dirServ = Components.classes['@mozilla.org/file/directory_service;1'].createInstance();
  dirServ = dirServ.QueryInterface(Components.interfaces.nsIProperties);

  // "AggRegF" stands for Application Registry File.
  // Forgive the weird name directory service has adapted for
  // application registry file....
  var regFile = dirServ.get("AppRegF", Components.interfaces.nsIFile);

  Registry = Components.classes['@mozilla.org/registry;1'].createInstance();
  Registry = Registry.QueryInterface(Components.interfaces.nsIRegistry);
  Registry.open(regFile.path);

  // get new profile registry & users location and dump it to console
  // to let users know about it.
  var regFolder = dirServ.get("AppRegD", Components.interfaces.nsIFile);
  dump("New location for profile registry and user profile directories is -> " + regFolder.path + "\n");

  loadElements();
  highlightCurrentProfile();

  // set the checkbox to reflect the current state.
  var offlineState = document.getElementById("offlineState");
  try {
    var ioService = nsJSComponentManager.getServiceByID("{9ac9e770-18bc-11d3-9337-00104ba0fd40}",
                                                    "nsIIOService");
    offlineState.checked = ioService.offline;
  }
  catch(e) {
  }

  var profileTree = document.getElementById("profiles");
  profileTree.focus();

  DoEnabling();
}

// select the last opened profile in the profile list
function highlightCurrentProfile()
{
  try {
    var currentProfile = profile.currentProfile;
    if( !currentProfile )
      return;
    var currentProfileItem = document.getElementById( ( "profileName_" + currentProfile ) );
    var profileList = document.getElementById( "profiles" );
    if( currentProfileItem ) {
      profileList.selectItem( currentProfileItem );
      profileList.ensureElementIsVisible( currentProfileItem );
    }
  }
  catch(e) {
    dump("*** failed to select current profile in list\n");
  }
}

// function : <profileSelection.js>::AddItem();
// purpose  : utility function for adding items to a tree.
function AddItem( aChildren, aProfileObject )
{
  var kids    = document.getElementById(aChildren);
  var item    = document.createElement("treeitem");
  var row     = document.createElement("treerow");
  var cell    = document.createElement("treecell");
  cell.setAttribute("label", aProfileObject.mName );
  cell.setAttribute("rowMigrate",  aProfileObject.mMigrated );
  cell.setAttribute("class", "treecell-iconic");
  row.appendChild(cell);
  item.appendChild(row);
  item.setAttribute("profile_name", aProfileObject.mName );
  item.setAttribute("rowName", aProfileObject.mName );
  item.setAttribute("id", ( "profileName_" + aProfileObject.mName ) );
  // 23/10/99 - no roaming access yet!
  //  var roaming = document.getElementById("roamingitem");
  //  kids.insertBefore(item,roaming);
  kids.appendChild(item);
  return item;
}

function Profile ( aName, aMigrated )
{
  this.mName       = aName ? aName : null;
  this.mMigrated   = aMigrated ? aMigrated : null;
}

// function : <profileSelection.js>::loadElements();
// purpose  : load profiles into tree
function loadElements()
{
  try {
    var profileRoot = Registry.getKey(Registry.Common, "Profiles");
    var regEnum = Registry.enumerateSubtrees( profileRoot );

    // the registry class is old and uses sucky nsIEnumerator instead
    // of nsISimpleEnumerator. We'll rely on a blank profile name to
    // throw us out of the while loop for now.
    regEnum.first();
    while (true)
    {
      var node = regEnum.currentItem();
      node = node.QueryInterface(Components.interfaces.nsIRegistryNode);

      if ( node.name == "" )
        break;

      var migrated = Registry.getString( node.key, "migrated" );

      AddItem( "profilekids", new Profile( node.name, migrated ) );

      regEnum.next();
    }
  }
  catch (e) {}
}


// function : <profileSelection.js>::onStart();
// purpose  : starts mozilla given the selected profile (user choice: "Start Mozilla")
function onStart()
{
  var profileTree = document.getElementById("profiles");
  var selected = profileTree.selectedItems[0];

  var profilename = selected.getAttribute("profile_name");
  if( selected.firstChild.firstChild.getAttribute("rowMigrate") == "no" ) {
    var lString = gProfileManagerBundle.getString("migratebeforestart");
    lString = lString.replace(/\s*<html:br\/>/g,"\n");
    lString = lString.replace(/%brandShortName%/gi,
                              gBrandBundle.getString("brandShortName"));
    var title = gProfileManagerBundle.getString("migratetitle");

    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService();
    promptService = promptService.QueryInterface(Components.interfaces.nsIPromptService);
    if (promptService.confirm(window, title, lString)) {
      var profileDir = profile.getProfileDir(profilename);
      if (profileDir) {
        profileDir = profileDir.QueryInterface( Components.interfaces.nsIFile );
        if (profileDir) {
          if (!profileDir.exists()) {
            var errorMessage = gProfileManagerBundle.getString("sourceProfileDirMissing");
            var profileDirMissingTitle = gProfileManagerBundle.getString("sourceProfileDirMissingTitle");
            promptService.alert(window, profileDirMissingTitle, errorMessage);
              return false;          
          }
        }
      }      
      profile.migrateProfile( profilename, true );
    }
    else
      return false;
  }

  // start in online or offline mode
  var offlineState = document.getElementById("offlineState");
  var ioService = nsJSComponentManager.getServiceByID("{9ac9e770-18bc-11d3-9337-00104ba0fd40}",
                                                  "nsIIOService");
  ioService.offline = offlineState.checked;

  try {

    var dirExists;

    try {
      var profileDir = profile.getProfileDir(profilename);
      dirExists = profileDir.exists();
    }
    catch (e) {
      dirExists = false;
    }
    
	if (dirExists == false) {
	  var brandName = gBrandBundle.getString("brandShortName");
	  var alertString = gProfileManagerBundle.getFormattedString("profDirMissing", [brandName, profilename]);
	  alertString = alertString.replace(/\s*<html:br\/>/g,"\n");	  
      alert(alertString);
      return;
    }

    profile.startApprunner(profilename);
    ExitApp();
  }
  catch (ex) {
    //var stringA = gProfileManagerBundle.getString(failProfileStartA);
    //var stringB = gProfileManagerBundle.getString(failProfileStartB);
    //alert(stringA + " " + profilename + " " + stringB);
  }
  return true;
}

// function : <profileSelection.js>::onExit();
// purpose  : quits startup process (User Choice: "Exit")
function onExit()
{
  try {
    profile.forgetCurrentProfile();
  }
  catch (ex) {
    dump("Failed to forget current profile.\n");
  }
  ExitApp();
}

// function : <profileSelection.js>::ExitApp();
// purpose  : halts startup process forcefully
function ExitApp()
{
  // Need to call this to stop the event loop
  var appShell = Components.classes['@mozilla.org/appshell/appShellService;1'].getService();
  appShell = appShell.QueryInterface( Components.interfaces.nsIAppShellService);
  appShell.Quit();
}

function foo()
{
  if( !set ) {
    if( profileManagerMode == "manager" )
      oldCaptionManager = document.getElementById( "caption" ).firstChild.nodeValue;
    else
      oldCaptionSelection = document.getElementById( "caption" ).firstChild.nodeValue;
    ChangeCaption( "What Is Mozollia?" ); // DO NOT LOCALIZE!
    set = true;
  }
  else {
    var tempCaption = document.getElementById( "caption" ).firstChild.nodeValue;
    if( profileManagerMode == "manager" ) {
      ChangeCaption( oldCaptionManager );
      oldCaptionManager = tempCaption;
    }
    else {
      ChangeCaption( oldCaptionSelection )
      oldCaptionSelection = tempCaption;
    }
    set = false;
  }
}

function SetUpOKCancelButtons()
{
  doSetOKCancel( onStart, onExit, null, null );
  var okButton = document.getElementById("ok");
  var cancelButton = document.getElementById("cancel");

  var okButtonString;
  var cancelButtonString;

  try {
    okButtonString = gProfileManagerBundle.getString("startButton");
    okButtonString = okButtonString.replace(/%brandShortName%/,
                                            gBrandBundle.getString("brandShortName"));
    cancelButtonString = gProfileManagerBundle.getString("exitButton");
  } catch (e) {
    okButtonString = "Start Yah";
    cancelButtonString = "Exit Yah";
  }

  okButton.setAttribute( "label", okButtonString );
  okButton.setAttribute( "class", ( okButton.getAttribute("class") + " padded" ) );
  cancelButton.setAttribute( "label", cancelButtonString );
}
