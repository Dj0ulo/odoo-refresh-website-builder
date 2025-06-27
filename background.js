const runOdooRedirect = (tab) => {
  // First, try to click the edit button on the current page.
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => {
      const editButton = document.querySelector('.o_edit_website_container > :first-child');
      const saveButton = document.querySelector('[data-action=save]');
      if (editButton && !saveButton) {
        editButton.click();
        return true; // Indicate that we clicked the button
      }
      return false; // Indicate that we did not click
    }
  }).then((injectionResults) => {
    const clicked = injectionResults[0].result;
    if (!clicked) {
      // We didn't click the button, so we need to redirect.
      const listener = (tabId, changeInfo, updatedTab) => {
        if (tabId === tab.id && changeInfo.status === 'complete' && updatedTab.url.includes('/odoo/action-website.website_preview')) {
          // Now inject the script to click the edit button.
          chrome.scripting.executeScript({
            target: {tabId: tabId},
            func: () => {
              const observer = new MutationObserver((mutationsList, observer) => {
                for(const mutation of mutationsList) {
                  if (mutation.type === 'childList') {
                    const editButton = document.querySelector('.o_edit_website_container > :first-child');
                    if (editButton) {
                      editButton.click();
                      observer.disconnect();
                      return;
                    }
                  }
                }
              });

              observer.observe(document.body, { childList: true, subtree: true });
            }
          });
          // Important: Remove the listener now that we're done.
          chrome.tabs.onUpdated.removeListener(listener);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);

      // Perform the redirect.
      chrome.tabs.update(tab.id, {url: new URL(tab.url).origin + "/odoo/action-website.website_preview"});
    }
  });
};

chrome.action.onClicked.addListener((tab) => {
  runOdooRedirect(tab);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-feature") {
    runOdooRedirect(tab);
  }
});