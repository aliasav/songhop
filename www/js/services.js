
angular.module('songhop.services', ['ionic.utils'])

.factory('User', function($http, $q, $localstorage, SERVER){
	var o = {
		favorites: [],
		newFavorites: 0,
		username: false,
		session_id: false,

		addSongToFavorites: function(song){
			if(!song) return false;
			o.favorites.unshift(song);
			o.newFavorites++;

			// persist to server
			return $http.post(SERVER.url + '/favorites', {session_id : o.session_id, song_id : song.song_id })
		},
		
		removeSongFromFavorites: function(song, index){
			if (!song) return false;
			o.favorites.splice(index, 1);

			// persist to server
			return $http({
				method: 'DELETE',
				url: SERVER.url + '/favorites',
				params: { session_id : o.session_id, song_id : song.song_id }
			});
		},

		favoriteCount: function(){
			return o.newFavorites;
		},

		auth: function(username, signingUp){
			var authRoute;
			if(signingUp){
				authRoute = 'signup';
			} else{
				authRoute = 'login';
			}
			return $http.post(SERVER.url + '/' + authRoute, {username : username}).success(function(data){
				o.setSession(data.username, data.session_id, data.favorites);
			});
		},

		populateFavorites: function(){
			return $http({
				method: 'GET',
				url: SERVER.url + '/favorites',
				params: { session_id : o.session_id }
			}).success(function(data){
				// merge data into queue
				o.favorites = data;
			})
		},

		setSession: function(username, session_id, favorites){
			if (username) o.username = username;
			if (session_id) o.session_id = session_id;
			if (favorites) o.favorites = favorites;

			// set data in localstorage object
			$localstorage.setObject('user', {username : username, session_id : session_id });
		},

		checkSession: function(){
			var defer = $q.defer();
			if (o.session_id){
				// if this session is already initialised in this service
				defer.resolve(true);
			} else {
				// detect if there is a session in localstorage from previous use
				// if it is, pull into our service
				var user = $localstorage.getObject('user');
				if(user.username){
					// grab favorites
					o.setSession(user.username, user.session_id);
					o.populateFavorites().then(function(){
						defer.resolve(true);
					});
				} else {
					// if no user in localstorage then reject
					defer.resolve(false);
				}
			}

			return defer.promise;
		},

		destroySession: function(){
			$localstorage.setObject('user', {});
			o.username = false;
			o.session_id = false;
			o.favorites = [];
			o.newFavorites = 0;
		},
	}
	return o;
})

.factory('Recommendations', function($http, SERVER, $q){
	var media;
	var o = {
		queue : [], // will contain song objects

		// function to add to songs queue
		getNextSongs: function(){
			// http.get to url which sends a list of song objects
			return $http({
				method: 'GET',
				url: SERVER.url + '/recommendations'
			}).success(function(data){
				o.queue = o.queue.concat(data);
			})
		},
		
		nextSong: function(){
			o.queue.shift();
			o.haltAudio();
			if(o.queue.length <= 3){
				o.getNextSongs();
			}
		},
		
		playCurrentSong : function(){
			// create defer object
			var defer = $q.defer();
			
			// play current song's preview
			media = new Audio(o.queue[0].preview_url);
			
			// when song loaded, resolve the promise to let controller know
			media.addEventListener("loadeddata", function(){
				defer.resolve();
			});
			media.play();
			return defer.promise;
		},
		
		haltAudio: function(){
			if(media) media.pause();
		},

		init: function(){
			if (o.queue.length === 0){
				return o.getNextSongs();
			} else{
				return o.playCurrentSong();
			}
		},

	};
	return o;
})
;

