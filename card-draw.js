// Originally written by Ian.
// Revamped by Tana.
// I have opted for very verbose comments with the intent
// that less-JS-experienced clubmembers may open this in the future.

const tournament = 'neon';

const discordWebhookUrl = 'https://dis' + 'corda' + 'pp.com/api/webho' + 'oks/'; // so bots don't scrape it
const previousStateStack = [];
let cardObjects = [];
let songs = [];
let banList = [];
let isBanListActive = false;

// when the webpage is finished loading
$(document).ready(() => {
  const cards = $('#card_area');
  const cards_side = $('#sidebar_card_area');
  document.getElementById('draws').style.display = "none";
  document.getElementById('reset').style.display = "none";
  function initBanList(song){
	  banList.push(song.default_ban);
  }
  function resetBanList(song, index){
	  banList[index] = song.default_ban;
  }
  // load the song data
  // This may fail (eg when you're running a local copy of the site and
  // accessing via file:// urls).
  var jqXHR = $.getJSON(`res/${tournament}/data.json`, (data) => {
    songs = data;
	songs.forEach(initBanList)
  });
  
  // Register a failure handler.
  jqXHR.fail(function() {
    var str = "Fail to load JSON. Stopping the page from loading.";
    //alert(str)
	jqXHR = $.getJSON(`https://raw.githubusercontent.com/Daikyi/daikyi.github.io/main/res/neon/data.json`, (data) => {
		songs = data;
		songs.forEach(initBanList)
	});
    //throw new Error(str);
  });

  const statuses = ['card_regular', 'card_protected', 'card_vetoed'];
  const banState = ['unbanned', 'banned'];

  let currentPosition = -1;

  // return: array of indices of all acceptable songs
  function getSongIndices(diff_lo, diff_hi, mode) {
    const songIndicesArray = [];
    // for each song, create a copy for removal in pool
    for (let i = 0; i < songs.length; i += 1) {
		if (banList[i] === 0) {
			songIndicesArray.push(i);
		}
    }
    return songIndicesArray;
  }

  // param: number of cards you want, difficulty bounds lo/hi, mode string
  // return: array of random integers from set of all possible songs
  // there can be fewer cards than numRequested if not enough songs qualify
  function randomize(numRequested) {
    const chosenSongIndicesArray = [];
    const songIndicesArray = getSongIndices();

    // for a total of numRequested times (or until no good songs left)
    for (let i = 0; i < numRequested && songIndicesArray.length > 0; i += 1) {
      // pick a random item from the good song list
      let x = Math.floor(Math.random() * songIndicesArray.length);
      let songIndex = songIndicesArray[x];
      
      // add the chosen song to the output
      chosenSongIndicesArray.push(songIndex);

      // remove the chosen song from the pool
      songIndicesArray[x] = songIndicesArray[songIndicesArray.length-1];
      songIndicesArray.pop();
    }

    // now the array contains a lot of random numbers
    return chosenSongIndicesArray;
  }

  function clearCards(){
	// remove the old ones
    cards.empty();
    cards_side.empty();
    cardObjects = [];
  }

  function render(cardArray) {
    if (cardArray === null) {
      return;
    }

    clearCards();

    for (let i = 0; i < cardArray.length; i += 1) {
      const songObject = songs[cardArray[i]];
      const img = $(`
            <div class="card_regular">
                <div class="card_bound">
                    <div class="card_body">
						<div class="text_difficulty">${songObject.difficulty}</div>
						<div class="text_content_title">${songObject.title}</div>
						<div class="no_cmod_box">15m</div>
                    </div>
                </div>
            </div>
      `);
      const img_side = $(`
            <div class="card_regular">
                <div class="sidebar_card_body">
                    <div class="banner_image">
						<div class="text_difficulty">${songObject.difficulty}</div>
						<div class="text_content_title">${songObject.title}</div>
						<div class="no_cmod_box">15m</div>
					</div>
                </div>
            </div>
      `)
      //img.find('.banner_image').css('background-image', `url("res/${tournament}/banners/${songObject.banner_filename}")`);
      //img.find('.card_body').css('background', `url("res/${tournament}/cards/${songObject.card_filename}")`);
	  img.find('.card_body').css('background', `url("res/${tournament}/banners/${songObject.banner_filename}")`);
	  img.find('.card_body').css('opacity', `.9`);
      //img.find('.card_body').css('background-size', `cover`);
      img_side.find('.sidebar_card_body').css('background-image', `url("res/${tournament}/banners/${songObject.banner_filename}")`);
      img_side.find('.sidebar_card_body').css('opacity', `.9`);
      if (!songObject.is_no_cmod) {
        img.find('.no_cmod_box').remove();
        img_side.find('.no_cmod_box').remove();
      }
      if (songObject.subtitle === '') {
        img.find('.text_subtitle').remove();
      }
      img.status = 0;
      img.addClass(statuses[0]);
      img.click(() => {
        img.removeClass(statuses[img.status]);
        img_side.removeClass(statuses[img.status]);
        img.status += 1;
        img.status %= statuses.length;
        img.addClass(statuses[img.status]);
        img_side.addClass(statuses[img.status]);
      });
      img_side.click(() => {
        img.removeClass(statuses[img.status]);
        img_side.removeClass(statuses[img.status]);
        img.status += 1;
        img.status %= statuses.length;
        img.addClass(statuses[img.status]);
        img_side.addClass(statuses[img.status]);
      });
      cards.append(img);
      cards_side.append(img_side);
      cardObjects.push(img);
    }
  }

  function draw(number) {
    if (currentPosition < previousStateStack.length) {
      previousStateStack.length = currentPosition + 1;
    }
    const diff_lo = parseInt($('#diff_lo').val());
    const diff_hi = parseInt($('#diff_hi').val());
    const mode = $('input[type=radio][name=round]:checked').val();
    if (isNaN(diff_lo) || isNaN(diff_hi)) {
      console.log('bad parameters: '+[diff_lo, diff_hi, mode]);
      return;
    }
    const randomNumberArray = randomize(number);
    previousStateStack.push(randomNumberArray);
    currentPosition += 1;
	document.getElementById('bans').style.display = "block";
	document.getElementById('draws').style.display = "none";
    render(randomNumberArray);
  }
  
  function banDraw() {	
	//we render the thing yaaaay
	clearCards();

    for (let i = 0; i < songs.length; i += 1) {
      const songObject = songs[i];
      const img = $(`
            <div class="card_regular">
                <div class="card_bound">
                    <div class="card_body">
						<div class="text_difficulty">${songObject.difficulty}</div>
						<div class="text_content_title">${songObject.title}</div>
						<div class="no_cmod_box">15m</div>
                    </div>
                </div>
            </div>
      `);
		const img_side = $(`
            <div class="card_regular">
                <div class="sidebar_card_body">
                    <div class="banner_image">
						<div class="text_difficulty">${songObject.difficulty}</div>
						<div class="text_content_title">${songObject.title}</div>
						<div class="no_cmod_box">15m</div>
					</div>
                </div>
            </div>
      `)
	  img.find('.card_body').css('background', `url("res/${tournament}/banners/${songObject.banner_filename}")`);
	  img.find('.card_body').css('opacity', `.9`);
      img_side.find('.sidebar_card_body').css('background-image', `url("res/${tournament}/banners/${songObject.banner_filename}")`);
      img_side.find('.sidebar_card_body').css('opacity', `.9`);
      if (!songObject.is_no_cmod) {
        img.find('.no_cmod_box').remove();
        img_side.find('.no_cmod_box').remove();
      }
	  const isBanned = banList[i];
	  img.cardIndex = i;
	  img.status = isBanned;
      img.addClass(banState[isBanned]);
      img_side.addClass(banState[isBanned]);
      img.click(() => {
        img.removeClass(banState[img.status]);
        img_side.removeClass(banState[img.status]);
        img.status += 1;
        img.status %= banState.length;
        img.addClass(banState[img.status]);
        img_side.addClass(banState[img.status]);
		banList[img.cardIndex] = img.status;
      });
	  
	  img_side.click(() => {
        img.removeClass(banState[img.status]);
        img_side.removeClass(banState[img.status]);
        img.status += 1;
        img.status %= banState.length;
        img.addClass(banState[img.status]);
        img_side.addClass(banState[img.status]);
		banList[img.cardIndex] = img.status;
      });
	  
      cards.append(img);
	  cards_side.append(img_side);
      //cardObjects.push(img);
    }
	
  }

  function showDraw() {
	  if (currentPosition >= 0) {
		render(previousStateStack[currentPosition]);
	  } else {
		clearCards();
	  }
  }

  function fuckGoBack() {
    if (currentPosition > 0) {
      currentPosition -= 1;
    }
    render(previousStateStack[currentPosition]);
  }

  function fuckGoForward() {
    if (currentPosition < previousStateStack.length - 1) {
      currentPosition += 1;
    }
    render(previousStateStack[currentPosition]);
  }

  function webhook() {
    if (currentPosition < 0) {
      alert('fuck there\'s nothing here');
    }

    const thePicks = previousStateStack[currentPosition];
    const result = [];

    for (let i = 0; i < cardObjects.length; i += 1) {
      const curr = cardObjects[i];
      const active = curr.status !== 2;
      if (active) {
        result.push(songs[thePicks[i]].title);
      }
    }

    const resultString = result.join(', ');
    const theBody = `pool picks: ${resultString}\nAnnyeong!!!! owo wwwww~~~~~`;

    $.post(discordWebhookUrl, JSON.stringify({ content: theBody }), 'json');
  }

  $('#draw3').on ({
    click: function() {
        draw(3);
      },
    mouseenter: function() {
      document.getElementById('draw3').style.outline = '3px solid rgb(65,108,166)';
      },
    mouseout: function() {
      document.getElementById('draw3').style.outline = '';
      }
  });

  $('#draw5').on ({
    click: function() {
        draw(5);
      },
    mouseenter: function() {
      document.getElementById('draw5').style.outline = '3px solid rgb(65,108,166)';
      },
    mouseout: function() {
      document.getElementById('draw5').style.outline = '';
      }
  });

  $('#draw7').on({
    click: function() {
        draw(7);
      },
    mouseenter: function() {
      document.getElementById('draw7').style.outline = '3px solid rgb(65,108,166)';
      },
    mouseout: function() {
      document.getElementById('draw7').style.outline = '';
      }
  });
  $('#undo').on({
    click: function() {
        fuckGoBack();
      },
    mouseenter: function() {
      document.getElementById('undo').style.outline = '3px solid rgb(65,108,166)';
      },
    mouseout: function() {
      document.getElementById('undo').style.outline = '';
      }
  });
  $('#redo').on({
    click: function() {
        fuckGoForward();
      },
    mouseenter: function() {
      document.getElementById('redo').style.outline = '3px solid rgb(65,108,166)';
      },
    mouseout: function() {
      document.getElementById('redo').style.outline = '';
      }
  });
  $('#submit').on({
    click: function() {
            webhook();
      },
    mouseenter: function() {
      document.getElementById('submit').style.outline = '3px solid rgb(65,108,166)';
      },
    mouseout: function() {
      document.getElementById('submit').style.outline = '';
      }
  });
  $('#hide_vetoed').click(() => {
    const mode = $('input[name=hide_vetoed]').is(':checked');
    cards_side.removeClass('hide_vetoed');
    if (mode) {
      cards_side.addClass('hide_vetoed');
    }
  });
  
  $('#bans').on({
    click: function() {
        banDraw();
		document.getElementById('sidebar_text').innerHTML = "Ban List (for streaming)";
		document.getElementById('bans').style.display = "none";
		document.getElementById('draws').style.display = "block";
		document.getElementById('reset').style.display = "block";
		document.getElementById('veto_div').style.display = "none";
      },
    mouseenter: function() {
      document.getElementById('bans').style.outline = '3px solid rgb(65,108,166)';
      },
    mouseout: function() {
      document.getElementById('bans').style.outline = '';
      }
  });
  
  $('#draws').on({
    click: function() {
        showDraw();
		document.getElementById('sidebar_text').innerHTML = "Stage List (for streaming)";
		document.getElementById('bans').style.display = "block";
		document.getElementById('draws').style.display = "none";
		document.getElementById('reset').style.display = "none";
		document.getElementById('veto_div').style.display = "block";
      },
    mouseenter: function() {
      document.getElementById('draws').style.outline = '3px solid rgb(65,108,166)';
      },
    mouseout: function() {
      document.getElementById('draws').style.outline = '';
      }
  });  
  
  $('#reset').on({
    click: function() {
		 songs.forEach(resetBanList);
		 banDraw();
      },
    mouseenter: function() {
      document.getElementById('reset').style.outline = '3px solid rgb(65,108,166)';
      },
    mouseout: function() {
      document.getElementById('reset').style.outline = '';
      }
  });
});
