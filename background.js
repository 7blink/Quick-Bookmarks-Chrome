var browser = chrome;
function createMenuIfNeeded(){
	chrome.bookmarks.search({title: 'Quick Bookmarks'}, function(bookmarkItems){onMainMenuFulfilled(bookmarkItems)});
}

function onMainMenuFulfilled(bookmarkItems){
	if(bookmarkItems.length < 1){
		createQuickBookmarksMenu()
	}else{
		createContextMenu()
	}
}

function createQuickBookmarksMenu(){
	chrome.bookmarks.create({title: "Quick Bookmarks"});
}

createMenuIfNeeded();


/*
//Create Context Menu
*/
function onFulfilled(bookmarkItems) {
	browser.contextMenus.create({
		id: 'Create Quick Bookmark',
		title: 'Create Quick Bookmark',
		"onclick": createQuickBookmark,
	});

	function logItems(bookmarkItem) {
	  if (bookmarkItem.url) {
		var id = bookmarkItem.title;
		browser.contextMenus.create({
			id: id,
			title: id,
			"onclick": openInNewTab,
		});
	  }
	  if (bookmarkItem.children) {
	    for (child of bookmarkItem.children) {
	      logItems(child);
	    }
	  }
	}

	function logSubTree(bookmarkItems) {
	  logItems(bookmarkItems[0]);
	}

	var subTreeID = bookmarkItems[0].id;

	browser.bookmarks.getSubTree(subTreeID, function(bookmarkItem){logSubTree(bookmarkItem)});
}

function onRejected(error) {
	console.log(`An error: ${error}`);
}

function createContextMenu(){
	browser.bookmarks.search({title: 'Quick Bookmarks'}, function(bookmarkItems){onFulfilled(bookmarkItems)});
}



/*
Open page in a new tab
*/
function openInNewTab(info, tab){
	function onFulfilled(bookmarkItems) {
		browser.tabs.create({
	    	url:bookmarkItems[0].url
	  	},
		function(tab) {
		  console.log(`Created new tab: ${tab.id}`)
		});

	}

	browser.bookmarks.search({title: info.menuItemId}, function(bookmarkItems) {onFulfilled(bookmarkItems)});
}

/*
Create new bookmark
*/
function createQuickBookmark(){
	browser.bookmarks.search({title: 'Quick Bookmarks'}, function(bookmarkItems){createBookmarkIfNonExists(bookmarkItems);});
}

function createBookmarkIfNonExists(bookmarkItems){

	var quickBookmarksMenuId = bookmarkItems[0].id;
	browser.tabs.query({active: true, currentWindow: true}, function(tabs){getExistingBookmarks(tabs, quickBookmarksMenuId)});
}

function getExistingBookmarks(tabs, quickBookmarksMenuId){
	if (tabs[0]) {
		currentTab = tabs[0];
		browser.bookmarks.search({title: currentTab.title},
			function(bookmarkItems){createIfNotInQuickBookmarksMenu(bookmarkItems, quickBookmarksMenuId, currentTab)});
	}
}

function createIfNotInQuickBookmarksMenu(bookmarkItems, quickBookmarksMenuId, currentTab){
	if(bookmarkItems.length < 1){
		browser.bookmarks.create({title: currentTab.title, url: currentTab.url, parentId: quickBookmarksMenuId});
	}else{
		var doesBookmarkExistInQuickBookmarksMenu = false;
		for(var bookmarkCounter = 0; bookmarkCounter < bookmarkItems.length; bookmarkCounter++){
			if(bookmarkItems[bookmarkCounter].parentId === quickBookmarksMenuId ){
				doesBookmarkExistInQuickBookmarksMenu = true;
			}
		}
		if(!doesBookmarkExistInQuickBookmarksMenu){
			browser.bookmarks.create({title: currentTab.title, url: currentTab.url, parentId: quickBookmarksMenuId});
		}
	}
}


/*
	refresh the context menu
*/
function contextMenuRefresh(){
    browser.contextMenus.removeAll(function(){setTimeout(createContextMenu, 100);});
}

/*
	Init
*/

// listen for bookmarks being created
browser.bookmarks.onCreated.addListener(contextMenuRefresh);
// listen for bookmarks being removed
browser.bookmarks.onRemoved.addListener(contextMenuRefresh);
// listen for bookmarks being changed
browser.bookmarks.onChanged.addListener(contextMenuRefresh);
// listen for bookmarks being moved
browser.bookmarks.onMoved.addListener(contextMenuRefresh);
