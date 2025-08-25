{ 
    // tudo entre {} para isolar as variaveis do ambiente externo
    // como nao tem nenhum var, da o mesmo que usar uma IIFE

    console.log('testando se o contentScript roda')

    let ytpLeftControls, youtubePlayer;
    let currentVideo = ''
    let currentVideoBookmarks = [];

    chrome.runtime.onMessage.addListener((message, sender, response) => { 
        const {type, value, videoId} = message; // deconstruct the message that was listened 

        if (type === 'NEW') { // if the message is of the type NEW, than set currVideo and call newVideoLoaded
            currentVideo = videoId;
            console.log('new video loaded', videoId)
            newVideoLoaded(); 
        } else if (type == 'PLAY') { 
            console.log('video', currentVideo, 'timestamp', value)
            youtubePlayer.currentTime = value
        } else if (type == 'DELETE') {
            console.log('tempo a ser deletado', value)
            console.log('bookmarks antes de deletar', currentVideoBookmarks)
            currentVideoBookmarks = currentVideoBookmarks.filter( b => b.time != value); // excluir bookmark que tem o timestamp igual ao que foi deletado
            console.log('bookmarks depois de deletar', currentVideoBookmarks)
            chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) }); // atualiza os bookmarks salvos do video atual
            response(currentVideoBookmarks); // uses the callback function sent by the messager (updates the popup bookmarks)
        }
    });

    const newVideoLoaded = async () => { // if it doesnt exist, create the bookmark buttom
        const bookmarkBtn = document.getElementsByClassName("bookmark-btn")[0]

        if (!bookmarkBtn) {
            const bookmarkBtn = document.createElement("img");

            bookmarkBtn.src = chrome.runtime.getURL('assets/bookmark.png');
            console.log('url da imagem', chrome.runtime.getURL('assets/bookmark.png'))
            bookmarkBtn.className = 'ytp-button bookmark-btn';
            bookmarkBtn.title = 'Click to bookmark current timestamp'; // texto que aparece quando passa o mouse em cima
            bookmarkBtn.style.aspectRatio = '1/1' // mantem proporcao de quadrado
            bookmarkBtn.style.flexShrink = '0'; // ignora flexbox e nao encolhe esse botao 

            ytpLeftControls = document.getElementsByClassName('ytp-left-controls')[0];
            youtubePlayer = document.getElementsByClassName('video-stream')[0];
            ytpLeftControls.appendChild(bookmarkBtn);
            
            console.log('bookmarkBtn', bookmarkBtn);

            bookmarkBtn.addEventListener('click', addNewBookmarkEventHandler);

            console.log('buttom created')
        }

        currentVideoBookmarks = await fetchBookmarks();
        console.log('bookmarks do video atual: ', currentVideoBookmarks)
    };

    const addNewBookmarkEventHandler = async () => {
        console.log('buttom pressed');

        const currentTime = youtubePlayer.currentTime;
        const newBookmark = {
            time: currentTime,
            description: "Bookmark at " + getTime(currentTime)
        }

        console.log('novo bookmark: ', newBookmark);

        currentVideoBookmarks = await fetchBookmarks(); // pega os bookmarks salvos do video atual (novamente, so pra ter certeza)
        currentVideoBookmarks = [...currentVideoBookmarks, newBookmark];
        currentVideoBookmarks.sort((a,b) => a.time - b.time)
        console.log('salvos do video atual: ', currentVideoBookmarks)

        chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) }); // atualiza os bookmarks do video atual. Ex.: {videoID : {time : 20392, description: "Bookmark at 00:34:12"}}
        
    };

    const fetchBookmarks = async () => { // asynchronously fech the bookmarks of the current video from the storage
        console.log('id video atual', currentVideo, 'é esse');
        const obj = await chrome.storage.sync.get([currentVideo]); // pega os bookmarks salvos no storage vinculados ao videoID atual
        console.log('fetch', obj[currentVideo]);
        return obj[currentVideo] ? JSON.parse(obj[currentVideo]) : [];
    }

    newVideoLoaded();

    const getTime = t => {
      let date = new Date(0);
      date.setSeconds(t);
      
      return date.toISOString().substring(11,19);
    }
}
