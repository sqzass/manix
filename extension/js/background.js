chrome.runtime.onInstalled.addListener(({ reason }) => {
    console.info(`[manix/lumen] onInstalled · ${reason}`);
});