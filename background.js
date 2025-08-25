console.log('testando se o background roda')
        
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { // envia uma mensagem quando a aba é atualizada 
  console.log('pagina atualizou');
  console.log('tab.url: ', tab.url);

  if (tab.url && tab.url.includes('youtube.com/watch')) { // the url exists and it is a video from youtube
    
    const queryParameter = tab.url.split('?')[1]; 
    const urlParameters = new URLSearchParams(queryParameter);
    videoId = urlParameters.get('v')
    console.log('videoId', videoId);

    chrome.tabs.sendMessage(
      tabId, // tabId
      { // message 
        type: "NEW",
        videoId: videoId
      }
    );

  }
});
