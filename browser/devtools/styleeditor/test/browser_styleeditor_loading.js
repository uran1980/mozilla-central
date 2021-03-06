/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TESTCASE_URI = TEST_BASE + "longload.html";


function test()
{
  waitForExplicitFinish();

  gBrowser.selectedTab = gBrowser.addTab();

  // launch Style Editor right when the tab is created (before load)
  // this checks that the Style Editor still launches correctly when it is opened
  // *while* the page is still loading. The Style Editor should not signal that
  // it is loaded until the accompanying content page is loaded.
  launchStyleEditorChrome(function (aChrome) {
    content.location = TESTCASE_URI;
      is(aChrome.contentWindow.document.readyState, "complete",
         "content document is complete");

      let root = gChromeWindow.document.querySelector(".splitview-root");
      ok(!root.classList.contains("loading"),
         "style editor root element does not have 'loading' class name anymore");

      let button = gChromeWindow.document.querySelector(".style-editor-newButton");
      ok(!button.hasAttribute("disabled"),
         "new style sheet button is enabled");

      button = gChromeWindow.document.querySelector(".style-editor-importButton");
      ok(!button.hasAttribute("disabled"),
         "import button is enabled");

      finish();
  });
}
