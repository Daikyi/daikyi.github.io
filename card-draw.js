// Originally written by Ian.
// Revamped by Tana.
// I have opted for very verbose comments with the intent
// that less-JS-experienced clubmembers may open this in the future.

const tournament = 'neon';

const discordWebhookUrl = 'https://dis' + 'corda' + 'pp.com/api/webho' + 'oks/'; // so bots don't scrape it
const previousStateStack = [];
let cardObjects = [];
let songs = [];


// when the webpage is finished loading
$(document).ready(() => {
  const cards = $('#card_area');
  const cards_side = $('#sidebar_card_area');

  // load the song data
  // This may fail (eg when you're running a local copy of the site and
  // accessing via file:// urls).
  var jqXHR = $.getJSON(`res/${tournament}/data.json`, (data) => {
    songs = data;
  })

  // Register a failure handler.
  jqXHR.fail(function() {
    var str = "Fail to load JSON. Stopping the page from loading.";
    alert(str)
    throw new Error(str);
  });

  const statuses = ['card_regular', 'card_protected', 'card_vetoed'];

  let currentPosition = -1;

  // return: array of indices of all acceptable songs
  function getSongIndices(diff_lo, diff_hi, mode) {
    const songIndicesArray = [];
    // for each song, create a copy for removal in pool
    for (let i = 0; i < songs.length; i += 1) {
        songIndicesArray.push(i);
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
      songIndicesArray[x] = songIndicesArray[goodSongIndicesArray.length-1];
      songIndicesArray.pop();
    }

    // now the array contains a lot of random numbers
    return chosenSongIndicesArray;
  }

  function render(cardArray) {
    if (cardArray === null) {
      return;
    }

    // remove the old ones
    cards.empty();
    cards_side.empty();
    cardObjects = [];

    for (let i = 0; i < cardArray.length; i += 1) {
      const songObject = songs[cardArray[i]];
      const img = $(`
            <div class="card_regular">
                <div class="card_bound">
                    <div class="card_body">
                        <div class="info_bar">
                            <div class="info_title">
                                <div class="text_title">${songObject.title}</div>
                            </div>
                            <div class="info_difficulty">
                                <div class="text_difficulty_marker">Stage</div>
                                <div class="text_difficulty">${songObject.difficulty}</div>
                            </div>
                        </div>
                        <div class="banner_image"></div>
                        <div class="content_bar">
                            <div class="info_content_title">
                                <div class="text_content_title">${songObject.title}</div>
                            </div>
                            <div class="info_content_subtitle">
                                <div class="text_content_subtitle">${songObject.subtitle}</div>
                            </div>
                            <div class="info_content_cmod">
                                <div class="no_cmod_box">15 Mins</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
      `);
      const img_side = $(`
            <div class="card_regular">
                <div class="sidebar_card_body">
                    <div class="banner_image"></div>
                    <div class="text_difficulty">${songObject.difficulty}</div>
                </div>
            </div>
      `)
      img.find('.banner_image').css('background-image', `url("res/${tournament}/banners/${songObject.banner_filename}")`);
      img_side.find('.banner_image').css('background-image', `url("res/${tournament}/banners/${songObject.banner_filename}")`);
      if (!songObject.is_no_cmod) {
        img.find('.no_cmod_box').remove();
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
    render(randomNumberArray);
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
      document.getElementById('draw5').style.outline = '3px solid rgb(65,108,166)';
      },
    mouseout: function() {
      document.getElementById('draw5').style.outline = '';
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
});