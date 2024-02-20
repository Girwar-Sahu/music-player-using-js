document.addEventListener('DOMContentLoaded', async () => {
   const container = document.querySelector(".song-list-container");
   const playBtn = document.getElementById("playBtn");
   const range = document.getElementById('range');
   const songCurrentTime = document.getElementById("currentTime");
   const songDuration = document.getElementById("songDuration");
   const backwordBtn = document.getElementById("backwordBtn");
   const forwordBtn = document.getElementById("forwordBtn");
   const menu = document.querySelector(".menu");
   const playlist = document.querySelector(".playlist");
   const currentMusic = new Audio();
   currentMusic.preload = 'auto';
   let songs = [];
   let songIndex = 0;

   const fetchMetaData = (a) => {
      return new Promise((resolve, reject) => {
         jsmediatags.read(a.href, {
            onSuccess: function (tag) {
               const data = tag.tags.picture.data;
               const format = tag.tags.picture.format;
               let base64String = "";
               for (let i = 0; i < data.length; i++) {
                  base64String += String.fromCharCode(data[i]);
               }

               const imgSrc = `url(data:${format};base64,${window.btoa(base64String)})`;

               const songData = {
                  path: a.href,
                  title: tag.tags.title,
                  artist: tag.tags.artist,
                  cover: imgSrc
               };
               resolve(songData);
            },
            onError: function (error) {
               reject(error);
            }
         });
      });
   };

   const addSong = async () => {
      for (const song of songs) {
         container.innerHTML += `<div class="song-list">
            <div class="cover" style="background-image:${song.cover};"></div>
               <div class="song-dtls">
                  <h4>${song.title.split('(')[0].trim()}</h4>
                  <p>${song.artist.split('(')[0].trim()}</p>
                  <a href="${song.path}" data-index="${songs.indexOf(song)}" hidden></a>
               </div>
            </div>`;
      }
   };

   const formatTime = (time) => {
      const min = Math.floor(time / 60).toString().padStart(2, '0');
      const sec = Math.floor(time % 60).toString().padStart(2, '0');
      return `${min}:${sec}`;
   };

   const playSong = (index, load) => {
      if (index === 0 && load === "ok") {
         currentMusic.src = songs[index].path;
         currentMusic.pause();
      } else {
         currentMusic.src = songs[index].path;
         currentMusic.play();
         playBtn.classList.remove('pause');
         songIndex = index;
      }

      updatePlayerUI(index);
   };

   const updatePlayerUI = (index) => {
      document.getElementById('songImg').style.backgroundImage = songs[index].cover;
      document.getElementById('title').innerHTML = songs[index].title.split('(')[0].trim();
      document.getElementById('artist').innerHTML = songs[index].artist.split('(')[0].trim();
      range.value = 0;
   };

   const setupEventListeners = () => {
      playBtn.addEventListener('click', () => {
         if (playBtn.classList.contains('pause')) {
            currentMusic.play();
            playBtn.classList.remove('pause');
         } else {
            currentMusic.pause();
            playBtn.classList.add('pause');
         }
      });

      container.addEventListener('click', (e) => {
         const songElement = e.target.closest('.song-list');
         if (songElement) {
            const index = Array.from(songElement.parentNode.children).indexOf(songElement);
            playSong(index);
         }
      });

      range.addEventListener('input', (e) => {
         const clickPosition = e.target.value;
         const clickTime = clickPosition * currentMusic.duration;
         currentMusic.currentTime = clickTime;
         range.style.background = `linear-gradient(to right, #f53192 ${clickTime}%, #white ${clickTime}%)`;
      });

      forwordBtn.addEventListener('click', () => {
         songIndex = (songIndex === songs.length - 1) ? 0 : (songIndex + 1);
         playSong(songIndex);
      });

      backwordBtn.addEventListener('click', () => {
         songIndex = (songIndex === 0) ? (songs.length - 1) : (songIndex - 1);
         playSong(songIndex);
      });

      currentMusic.addEventListener('durationchange', () => {
         songDuration.innerHTML = formatTime(currentMusic.duration)
      })

      currentMusic.addEventListener('timeupdate', () => {
         songCurrentTime.innerHTML = formatTime(currentMusic.currentTime)
         range.value = Math.floor((currentMusic.currentTime / currentMusic.duration) * 100)
         range.style.background = `linear-gradient(to right, #f53192 ${range.value}%, #ccc ${range.value}%)`
      })

      currentMusic.addEventListener('ended', () => {
         songIndex = (songIndex === songs.length - 1) ? 0 : (songIndex + 1);
         playSong(songIndex);
      });

      menu.addEventListener('click', () => {
         playlist.classList.toggle("playlist-animation-out");
         // playlist.classList.toggle("playlist-animation-in");
      });
   };

   const main = async () => {
      const fetchSongs = await fetch("http://192.168.67.67:3000/songs/");
      const response = await fetchSongs.text();
      const div = document.createElement("div");
      div.innerHTML = response;
      const allA = div.getElementsByTagName("a");

      for (const a of allA) {
         if (a.href.endsWith(".mp3") || a.href.endsWith(".wav")) {
            songs.push(await fetchMetaData(a));
         }
      }

      await addSong();
      setupEventListeners();
      playSong(0, "ok");
   };

   await main();
});
