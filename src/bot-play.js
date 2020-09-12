const isBotsTurn = function(game) {
  return (
    game.game_state === 2 && game.players[game.active_player].type === "BOT"
  );
};

const botPlay = function(game, board) {
  if (game.dice_roll === -1) {
    botRollDice(game);
  } else if (game.dice_roll > 0) {
    botPlayCoin(game, board);
  }
};

const botRollDice = function(game) {
  const player_color = game.players[game.active_player].color;

  const dom_elem = document.querySelector(
    `.board-container .board-item.jail.jail-${player_color} .cell-${player_color}.occupied`
  );
  botAction(dom_elem);
};

const botPlayCoin = function(game, board) {
  /*
    Intelligent play logic

    1. Arrange coins in order of distance from home_turn
    2. If any coin next_pos has coin of opponent, make move
    3. Dice outcome 6: Free jailed coins if any
    4. If any coin pos - 5 has any opponent coins, make move
    5. If any coin next_pos is safe_cells, make move
    6. If any coin current pos is in home cells, make move
    7. If opponent coin between pos and next_pos, skip and try next coin
    8. If current pos is safe_cell, skip and try next coin
    9. Make move
    */

  // Fetch all coins position map
  const coin_position_map = getPositionMap(board);

  // Current bot player's coins array
  const player_color = game.players[game.active_player].color;
  const jail_coins = [];
  const home_run_coins = [];
  const active_coins = [];

  // Order positions of player coins
  for (const coin in board[player_color]) {
    const coin_meta = board[player_color][coin];
    const coin_obj = Object.assign({}, coin_meta, { id: coin });

    if (coin_meta.pos > 200) {
      jail_coins.push(coin_obj);
    } else if (coin_meta.pos >= 100) {
      home_run_coins.push(coin_obj);
    } else {
      if (active_coins.length === 0) {
        active_coins.push(coin_obj);
      } else {
        const coin_home_distance =
          (52 + board_metadata[player_color].turn - coin_meta.pos) % 52;

        // Insert sorted by distance from home_turn
        let i = 0;
        while (i < active_coins.length) {
          const itr_home_distance =
            (52 + board_metadata[player_color].turn - active_coins[i].pos) % 52;
          if (coin_home_distance > itr_home_distance) {
            i++;
          } else {
            break;
          }
        }
        active_coins.splice(i, 0, coin_obj);
      }
    }
  }

  // If any coin next_pos has coin of opponent, make move to jail opponent
  for (const coin of active_coins) {
    const next_pos = coin.pos + game.dice_roll;

    if (!safe_cells.includes(next_pos)) {
      // Fetch existing_player in next_pos
      const existing_player = coin_position_map[next_pos]
        ? coin_position_map[next_pos][0]
        : undefined;

      // Handle next_pos has another coin of different player, make move
      if (existing_player && existing_player.player != game.active_player) {
        const click_pos = coin.pos;
        const dom_elem = document.querySelector(
          `.board-container .board-item.playground .cell-${coin.pos}.play-cell.occupied`
        );
        botAction(dom_elem);
        return;
      }
    }
  }

  // Dice outcome 6: Free jailed coins if any
  if (game.dice_roll === 6 && jail_coins.length > 0) {
    const dom_elem = document.querySelector(
      `.board-container .board-item.jail.jail-${player_color} .jail-cell.cell-${jail_coins[0].pos}.occupied`
    );
    botAction(dom_elem);
    return;
  }

  // If any opponent coin exists in current coin position - 5, make move to flee
  for (const coin of active_coins) {
    // Interate over previous 5 cells
    for (
      let danger_pos = coin.pos - 1;
      danger_pos > coin.pos - 5;
      danger_pos--
    ) {
      const existing_player = coin_position_map[danger_pos]
        ? coin_position_map[danger_pos][0]
        : undefined;

      if (existing_player && existing_player.player != game.active_player) {
        const dom_elem = document.querySelector(
          `.board-container .board-item.playground .cell-${coin.pos}.play-cell.occupied`
        );
        botAction(dom_elem);
        return;
      }
    }
  }

  // If any coin next_pos is safe_cells, make move
  for (const coin of active_coins) {
    const next_pos = coin.pos + game.dice_roll;
    if (safe_cells.includes(next_pos)) {
      const dom_elem = document.querySelector(
        `.board-container .board-item.playground .cell-${coin.pos}.play-cell.occupied`
      );
      botAction(dom_elem);
      return;
    }
  }

  // If any coin current pos is in home cells, make move
  for (const coin of home_run_coins) {
    // special handling for 151
    let cpos = coin.pos === 151 ? coin.pos - 52 : coin.pos;
    const next_pos = cpos + game.dice_roll;
    if (next_pos <= board_metadata[player_color].finish) {
      const dom_elem = document.querySelector(
        `.board-container .board-item.playground .cell-${coin.pos}.play-cell.occupied`
      );
      botAction(dom_elem);
      return;
    }
  }

  const coins_with_nearby_opponent = [];
  const coins_in_safe_cell = [];
  for (const coin of active_coins) {
    const next_pos = coin.pos + game.dice_roll;
    let skip_coin = false;

    // Interate over next 5 cells to look for nearby opponent
    // If opponent coin between pos and next_pos, skip and try next coin
    for (let danger_pos = coin.pos + 1; danger_pos <= next_pos; danger_pos++) {
      const existing_player = coin_position_map[danger_pos]
        ? coin_position_map[danger_pos][0]
        : undefined;

      if (existing_player && existing_player.player != game.active_player) {
        coins_with_nearby_opponent.push(coin);
        skip_coin = true;
      }
    }

    // If coin is in safe_cell, skip and try next coin
    if (!skip_coin && safe_cells.includes(coin.pos)) {
      coins_in_safe_cell.push(coin);
      skip_coin = true;
    }

    if (!skip_coin) {
      const dom_elem = document.querySelector(
        `.board-container .board-item.playground .cell-${coin.pos}.play-cell.occupied`
      );
      botAction(dom_elem);
      return;
    }
  }

  // All rules skipped, play first coin in safe cell
  if (coins_in_safe_cell.length > 0) {
    const dom_elem = document.querySelector(
      `.board-container .board-item.playground .cell-${coins_in_safe_cell[0].pos}.play-cell.occupied`
    );
    botAction(dom_elem);
    return;
  }

  // All rules skipped, play first coin with nearby opponent
  if (coins_with_nearby_opponent.length > 0) {
    const dom_elem = document.querySelector(
      `.board-container .board-item.playground .cell-${coins_with_nearby_opponent[0].pos}.play-cell.occupied`
    );
    botAction(dom_elem);
    return;
  }
};

const botAction = function(dom_elem, player_color) {
  let player_dom;
  for (let i = 0; i < dom_elem.children.length; i++) {
    if (dom_elem.children[i].classList.contains("active-player-icon")) {
      player_dom = dom_elem.children[i];
    }
  }
  if (player_dom) {
    setTimeout(showBotIcon, 500, player_dom);
    setTimeout(botClick, 1320, player_dom); // To match shake animation timing of .82s
  }
};

const showBotIcon = function(player_dom) {
  player_dom.classList.toggle("visible");
  player_dom.classList.toggle("shake");
};

const botClick = function(player_dom) {
  player_dom.classList.toggle("visible");
  player_dom.classList.toggle("shake");
  player_dom.click();
};
