const executeScript = async (tabId, func) => {
  try {
    const injectionResults = await chrome.scripting.executeScript({
      target: {tabId: tabId},
      func: func,
    });
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return null;
    }
    return injectionResults[0].result;
  } catch (error) {
    console.error(`Error executing script for tab ${tabId}:`, error);
    return null;
  }
};

const getDebugMode = (tabId) => {
  return executeScript(tabId, () => {
    const scriptElement = document.head.querySelector('script[id="web.layout.odooscript"]');
    if (scriptElement) {
      const scriptContent = scriptElement.innerHTML;
      const match = scriptContent.match(/debug: "([^"]*)"/);
      if (match) {
        return match[1];
      }
    }
    return null;
  });
};


const waitForEditButtonAndClick = (tabId) => {
  return executeScript(tabId, () => {
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
  });
};

const performRpcCall = (tabId) => {
  return executeScript(tabId, () => {
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
  });
};

const redirectToPreviewPage = (tabId, originalUrl) => {
  chrome.tabs.update(tabId, {url: new URL(originalUrl).origin + "/odoo/action-website.website_preview"});
};

const runOdooRedirect = async (tab) => {
  const listener = (tabId, changeInfo, updatedTab) => {
    if (tabId === tab.id && changeInfo.status === 'complete' && updatedTab.url.includes('/odoo/action-website.website_preview')) {
      waitForEditButtonAndClick(tabId);
      chrome.tabs.onUpdated.removeListener(listener);
    }
  };
  chrome.tabs.onUpdated.addListener(listener);

  const debugMode = await getDebugMode(tab.id);
  if (debugMode !== 'assets') {
    await performRpcCall(tab.id);
  }
  redirectToPreviewPage(tab.id, tab.url);
};

const updateIcon = async (tabId) => {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url) {
          await chrome.action.setIcon({path: "icons/grey.png", tabId: tabId});
          return;
        };
        const url = new URL(tab.url);

        if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
            await chrome.action.setIcon({path: "icons/grey.png", tabId: tabId});
            return;
        }

        const debugMode = await getDebugMode(tabId);
        let iconPath;
        switch (debugMode) {
            case 'assets':
                iconPath = 'icons/blue.png';
                break;
            case '1':
                iconPath = 'icons/purple.png';
                break;
            case '':
                iconPath = 'icons/pale.png';
                break;
            default:
                iconPath = 'icons/grey.png';
                break;
        }
        await chrome.action.setIcon({path: iconPath, tabId: tabId});
    } catch (error) {
        console.error(`Error updating icon for tab ${tabId}:`, error);
        try {
          await chrome.action.setIcon({path: "icons/grey.png", tabId: tabId});
        } catch (e) {
          console.error(`Error setting fallback icon for tab ${tabId}:`, e);
        }
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    updateIcon(tabId);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  updateIcon(activeInfo.tabId);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length > 0) {
      updateIcon(tabs[0].id);
    }
  });
});
