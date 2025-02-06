document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    const audioPlayer = document.getElementById('audioPlayer');
    const currentSong = document.getElementById('currentSong');

    // Create loaders
    const searchLoader = document.createElement('div');
    searchLoader.className = 'loader';
    searchLoader.id = 'searchLoader';
    searchResults.appendChild(searchLoader);

    const songLoader = document.createElement('div');
    songLoader.className = 'loader';
    songLoader.id = 'songLoader';
    currentSong.insertAdjacentElement('afterend', songLoader);

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    function showSearchLoader() {
        searchResults.innerHTML = '';
        searchResults.appendChild(searchLoader);
        searchLoader.classList.add('loader-active');
    }

    function hideSearchLoader() {
        searchLoader.classList.remove('loader-active');
    }

    function showSongLoader() {
        currentSong.style.display = 'none';
        songLoader.classList.add('loader-active');
    }

    function hideSongLoader() {
        songLoader.classList.remove('loader-active');
        currentSong.style.display = 'block';
    }

    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        showSearchLoader();

        fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        })
        .then(response => response.json())
        .then(results => {
            hideSearchLoader();
            displayResults(results);
        })
        .catch(error => {
            hideSearchLoader();
            handleError(error);
        });
    }

    function displayResults(results) {
        searchResults.innerHTML = '';
        searchResults.appendChild(searchLoader);
        
        results.forEach(result => {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';
            songItem.innerHTML = `
                <img src="${result.thumbnail}" alt="Thumbnail">
                <div class="song-info">
                    <div class="song-title">${result.title}</div>
                </div>
            `;
            
            songItem.addEventListener('click', () => playSong(result));
            searchResults.appendChild(songItem);
        });
    }

    function playSong(song) {
        showSongLoader();
        
        // Update now playing section while preserving currentSong reference
        const nowPlayingSection = document.querySelector('.now-playing');
        const songImg = document.createElement('img');
        songImg.src = song.thumbnail;
        songImg.alt = "Thumbnail";
        
        const nowPlayingInfo = document.createElement('div');
        nowPlayingInfo.className = 'now-playing-info';
        
        // Clear and update existing currentSong instead of recreating
        currentSong.textContent = song.title;
        nowPlayingInfo.appendChild(currentSong);
        
        // Clear and rebuild now playing section
        nowPlayingSection.innerHTML = '';
        nowPlayingSection.appendChild(songImg);
        nowPlayingSection.appendChild(nowPlayingInfo);
        nowPlayingSection.appendChild(songLoader);
        
        fetch('/get_audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoId: song.videoId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            audioPlayer.src = data.url;
            audioPlayer.play()
                .catch(error => {
                    handleError(error);
                    hideSongLoader();
                });
        })
        .catch(error => {
            handleError(error);
            hideSongLoader();
        });
    }

    function handleError(error) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = `Error: ${error.message}`;
        searchResults.insertAdjacentElement('beforebegin', errorMessage);
        
        setTimeout(() => {
            errorMessage.remove();
        }, 5000);
    }

    audioPlayer.addEventListener('canplay', () => {
        hideSongLoader();
    });
});