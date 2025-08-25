import {getActiveTabURL} from './utils.js';

// adding a new bookmark row to the popup
const addNewBookmark = (bookmarkElement, bookmark) => {
    const bookmarkTitleElement = document.createElement("div");
    const newBookmarkElement = document.createElement("div");
    const controlsElement = document.createElement('div');

    bookmarkTitleElement.textContent = bookmark.description;
    bookmarkTitleElement.className = "bookmark-title";

    newBookmarkElement.id = "bookmark-" + bookmark.time;
    newBookmarkElement.className = "bookmark";
    newBookmarkElement.setAttribute("timestamp", bookmark.time); // cria o atributo timestamp e o atribui como o tempo guardado no bookmark 

    controlsElement.className = 'bookmark-controls';
    setBookmarkAttributes('play', onPlay, controlsElement);
    setBookmarkAttributes('delete', onDelete, controlsElement);

    newBookmarkElement.appendChild(bookmarkTitleElement);
    newBookmarkElement.appendChild(controlsElement);
    bookmarkElement.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentVideoBookmarks = []) => {
    const bookmarkElement = document.getElementById('bookmarks');
    bookmarkElement.innerHTML = '';

    console.log('viewBoookmarks currentVideoBookmarks', currentVideoBookmarks)
    if (currentVideoBookmarks.length > 0) {
        for (const bookmark of currentVideoBookmarks) {
            addNewBookmark(bookmarkElement, bookmark);
        }
    } else {
        bookmarkElement.innerHTML = '<i class = "row">No bookmarks to show</i>';
    }
};

const onPlay = async e => {
    console.log('bookmark foi clicado')
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp'); // pega o atributo timestamp do elemento clicado
    console.log('timestamp', bookmarkTime)
    const activeTab = await getActiveTabURL();
    
    chrome.tabs.sendMessage(
        activeTab.id, 
        {
            type: "PLAY",
            value: bookmarkTime
        }
    );

    console.log('mensagem enviada')
};

const onDelete = async e => {
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute('timestamp'); // pega o atributo timestamp do elemento clicado
    const activeTab = await getActiveTabURL(); 
    const bookmarkElementToDelete = document.getElementById('bookmark-' + bookmarkTime);
    console.log('were going to delete', bookmarkElementToDelete)
    bookmarkElementToDelete.remove();

    chrome.tabs.sendMessage(
        activeTab.id, // tab id
        { // message
            type: "DELETE",
            value: bookmarkTime
        }, 
        viewBookmarks // optional callback: passing to update visual after bookmark has been deleted (this callback is used on the response of the listener)
    );
};

const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
    const controlElement = document.createElement('img');
    controlElement.src = 'assets/' + src + '.png';
    controlElement.title = src;
    controlElement.addEventListener('click', eventListener);
    controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();
    const queryParameter = activeTab.url.split('?')[1];
    const urlParameters = new URLSearchParams(queryParameter);
    const currentVideo = urlParameters.get('v');
    console.log('id video', currentVideo);

    if (activeTab.url.includes('youtube.com/watch') && currentVideo){
        chrome.storage.sync.get([currentVideo], (data) => {
            const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : []; 
            console.log('bookmarks', currentVideoBookmarks);
            viewBookmarks(currentVideoBookmarks);
        });

        // isso aqui é a mesma coisa? que o de cima?
        // const data = await chrome.storage.sync.get([currentVideo]); 
        // const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];
        // viewBookmarks(currentVideoBookmarks);

    }else{
        const container = document.getElementsByClassName('container')[0];
        container.innerHTML = "<div class='title'>This is not a YouTube video page</div>" 
    }

});
