
angular.module('songhop.controllers', ['ionic', 'songhop.services'])


/*
Controller for the discover page
*/
.controller('DiscoverCtrl', function($scope, $timeout, $ionicLoading, User, Recommendations) {

	// helper functions for loading
	var showLoading = function(){
		$ionicLoading.show({
			template: '<i class="ion-loading-c"></i>',
			noBackdrop: true,
		});
	};

	var hideLoading = function(){
		$ionicLoading.hide();
	};

	// set loading to true first time while we retrieve songs from server
	showLoading();

	// get list of songs and set currentSong as first song in list 
	Recommendations.init()
	.then(function(){
		$scope.currentSong = Recommendations.queue[0];
		Recommendations.playCurrentSong();
	})
	.then(function(){
		// turn loading off
		hideLoading();
		$scope.currentSong.loaded = true;
	});

	$scope.sendFeedback = function(bool){

		// add in favorites if bool == true
		if (bool) User.addSongToFavorites($scope.currentSong);

		// set rated of song and hide song
		$scope.currentSong.rated = bool;
		$scope.currentSong.hide = true;
		Recommendations.nextSong();

		// animation of song changes
		$timeout(function(){
			$scope.currentSong = Recommendations.queue[0];
			$scope.currentSong.loaded = false;
		}, 250);

		// play current song
		Recommendations.playCurrentSong()
		.then(function(){
			$scope.currentSong.loaded = true;
		});

	};

	$scope.nextAlbumImg = function(){
		if (Recommendations.queue.length > 1){
			return Recommendations.queue[1].image_large;
		}
		return '';
	};

})


/*
Controller for the favorites page
*/
.controller('FavoritesCtrl', function($scope, $window, User) {

	$scope.favorites = User.favorites;

	$scope.removeSong = function(song, index){
		User.removeSongFromFavorites(song, index);
	};

	$scope.openSong = function(song){
		$window.open(song.open_url, "_system");
	};

	$scope.username = User.username;

	$scope.logout = function(){
		User.destroySession();
		// instead of using $state.go, redirect is used to ensure views aren't cached
		$window.location.href = 'index.html';
	};

})


/*
Controller for our tab bar
*/
.controller('TabsCtrl', function($scope, User, Recommendations) {
	// stop audio when going to favorites page and set newFavorites = 0
	$scope.enteringFavorites = function(){
		Recommendations.haltAudio();
		User.newFavorites = 0;
	};

	// function to play song on tab-deselect
	$scope.leavingFavorites = function(){
		Recommendations.init();
	};

	// expose number of new favorites to scope
	$scope.favCount = User.favoriteCount;

})

// Splash controller
.controller('SplashCtrl', function($scope, $state, User){
	// attempt to signup/login via User.auth 
	$scope.submitForm = function(username, signinUp){
		User.auth(username, signinUp).then(function(){
			// session is set, redirect to discover
			$state.go('tab.discover');
		}, function(){
			// error handling here
			alert('Hmm... try another username maybe!');
		})
	};
})

;



