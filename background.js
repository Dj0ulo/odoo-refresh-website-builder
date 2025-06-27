const checkAndClickEditButton = async (tabId) => {
  const injectionResults = await chrome.scripting.executeScript({
    target: {tabId: tabId},
    func: () => {
      const editButton = document.querySelector('.o_edit_website_container > :first-child');
      const saveButton = document.querySelector('[data-action=save]');
      if (editButton && !saveButton) {
        editButton.click();
        return true;
      }
      return false;
    }
  });
  return injectionResults[0].result;
};

const waitForEditButtonAndClick = (tabId) => {
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
};

const performRpcCall = async (tabId) => {
  try {
    await chrome.scripting.executeScript({
      target: {tabId: tabId},
      func: () => {
        if (document.querySelector("script[src*='/debug/web.assets']")) {
          return;
        }
        return fetch(window.location.origin + '/web/dataset/call_kw/ir.attachment/regenerate_assets_bundles',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'call',
              params: {
                model: 'ir.attachment',
                method: 'regenerate_assets_bundles',
                args: [],
                kwargs: {},
              },
            }),
          }
        ).then(response => response.json())
         .then(data => {
            console.log('RPC call result:', data);
            return data;
         })
         .catch(error => {
            console.error('Error during RPC call:', error);
            throw error;
         });
      },
    });
  } catch (error) {
    console.error('Error injecting script or during RPC call:', error);
  }
};

const redirectToPreviewPage = (tabId, originalUrl) => {
  chrome.tabs.update(tabId, {url: new URL(originalUrl).origin + "/odoo/action-website.website_preview"});
};

const runOdooRedirect = async (tab) => {
  const clicked = await checkAndClickEditButton(tab.id);
  if (!clicked) {
    const listener = (tabId, changeInfo, updatedTab) => {
      if (tabId === tab.id && changeInfo.status === 'complete' && updatedTab.url.includes('/odoo/action-website.website_preview')) {
        waitForEditButtonAndClick(tabId);
        chrome.tabs.onUpdated.removeListener(listener);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);

    await performRpcCall(tab.id);
    redirectToPreviewPage(tab.id, tab.url);
  }
};

chrome.action.onClicked.addListener((tab) => {
  runOdooRedirect(tab);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-feature") {
    runOdooRedirect(tab);
  }
});