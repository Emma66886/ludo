var isBotsTurn = function isBotsTurn(game) {
  return game.game_state === 2 && game.players[game.active_player].type === "BOT";
};

var botPlay = function botPlay(game, board) {
  if (game.dice_roll === -1) {
    botRollDice(game);
  } else if (game.dice_roll > 0) {
    botPlayCoin(game, board);
  }
};

var botRollDice = function botRollDice(game) {
  var player_color = game.players[game.active_player].color;

  var dom_elem = document.querySelector(".board-container .board-item.jail.jail-" + player_color + " .cell-" + player_color + ".occupied");
  botAction(dom_elem);
};

var botPlayCoin = function botPlayCoin(game, board) {
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
  var coin_position_map = getPositionMap(board);

  // Current bot player's coins array
  var player_color = game.players[game.active_player].color;
  var jail_coins = [];
  var home_run_coins = [];
  var active_coins = [];

  // Order positions of player coins
  for (var coin in board[player_color]) {
    var coin_meta = board[player_color][coin];
    var coin_obj = Object.assign({}, coin_meta, { id: coin });

    if (coin_meta.pos > 200) {
      jail_coins.push(coin_obj);
    } else if (coin_meta.pos >= 100) {
      home_run_coins.push(coin_obj);
    } else {
      if (active_coins.length === 0) {
        active_coins.push(coin_obj);
      } else {
        var coin_home_distance = (52 + board_metadata[player_color].turn - coin_meta.pos) % 52;

        // Insert sorted by distance from home_turn
        var i = 0;
        while (i < active_coins.length) {
          var itr_home_distance = (52 + board_metadata[player_color].turn - active_coins[i].pos) % 52;
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
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = active_coins[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _coin = _step.value;

      var next_pos = _coin.pos + game.dice_roll;

      if (!safe_cells.includes(next_pos)) {
        // Fetch existing_player in next_pos
        var existing_player = coin_position_map[next_pos] ? coin_position_map[next_pos][0] : undefined;

        // Handle next_pos has another coin of different player, make move
        if (existing_player && existing_player.player != game.active_player) {
          var click_pos = _coin.pos;
          var _dom_elem3 = document.querySelector(".board-container .board-item.playground .cell-" + _coin.pos + ".play-cell.occupied");
          botAction(_dom_elem3);
          return;
        }
      }
    }

    // Dice outcome 6: Free jailed coins if any
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  if (game.dice_roll === 6 && jail_coins.length > 0) {
    var dom_elem = document.querySelector(".board-container .board-item.jail.jail-" + player_color + " .jail-cell.cell-" + jail_coins[0].pos + ".occupied");
    botAction(dom_elem);
    return;
  }

  // If any opponent coin exists in current coin position - 5, make move to flee
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = active_coins[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _coin2 = _step2.value;

      // Interate over previous 5 cells
      for (var danger_pos = _coin2.pos - 1; danger_pos > _coin2.pos - 5; danger_pos--) {
        var _existing_player = coin_position_map[danger_pos] ? coin_position_map[danger_pos][0] : undefined;

        if (_existing_player && _existing_player.player != game.active_player) {
          var _dom_elem4 = document.querySelector(".board-container .board-item.playground .cell-" + _coin2.pos + ".play-cell.occupied");
          botAction(_dom_elem4);
          return;
        }
      }
    }

    // If any coin next_pos is safe_cells, make move
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = active_coins[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var _coin3 = _step3.value;

      var next_pos = _coin3.pos + game.dice_roll;
      if (safe_cells.includes(next_pos)) {
        var _dom_elem5 = document.querySelector(".board-container .board-item.playground .cell-" + _coin3.pos + ".play-cell.occupied");
        botAction(_dom_elem5);
        return;
      }
    }

    // If any coin current pos is in home cells, make move
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = home_run_coins[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var _coin4 = _step4.value;

      // special handling for 151
      var cpos = _coin4.pos === 151 ? _coin4.pos - 52 : _coin4.pos;
      var next_pos = cpos + game.dice_roll;
      if (next_pos <= board_metadata[player_color].finish) {
        var _dom_elem6 = document.querySelector(".board-container .board-item.playground .cell-" + _coin4.pos + ".play-cell.occupied");
        botAction(_dom_elem6);
        return;
      }
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  var coins_with_nearby_opponent = [];
  var coins_in_safe_cell = [];
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = active_coins[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var _coin5 = _step5.value;

      var next_pos = _coin5.pos + game.dice_roll;
      var skip_coin = false;

      // Interate over next 5 cells to look for nearby opponent
      // If opponent coin between pos and next_pos, skip and try next coin
      for (var _danger_pos = _coin5.pos + 1; _danger_pos <= next_pos; _danger_pos++) {
        var _existing_player2 = coin_position_map[_danger_pos] ? coin_position_map[_danger_pos][0] : undefined;

        if (_existing_player2 && _existing_player2.player != game.active_player) {
          coins_with_nearby_opponent.push(_coin5);
          skip_coin = true;
        }
      }

      // If coin is in safe_cell, skip and try next coin
      if (!skip_coin && safe_cells.includes(_coin5.pos)) {
        coins_in_safe_cell.push(_coin5);
        skip_coin = true;
      }

      if (!skip_coin) {
        var _dom_elem7 = document.querySelector(".board-container .board-item.playground .cell-" + _coin5.pos + ".play-cell.occupied");
        botAction(_dom_elem7);
        return;
      }
    }

    // All rules skipped, play first coin in safe cell
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  if (coins_in_safe_cell.length > 0) {
    var _dom_elem = document.querySelector(".board-container .board-item.playground .cell-" + coins_in_safe_cell[0].pos + ".play-cell.occupied");
    botAction(_dom_elem);
    return;
  }

  // All rules skipped, play first coin with nearby opponent
  if (coins_with_nearby_opponent.length > 0) {
    var _dom_elem2 = document.querySelector(".board-container .board-item.playground .cell-" + coins_with_nearby_opponent[0].pos + ".play-cell.occupied");
    botAction(_dom_elem2);
    return;
  }
};

var botAction = function botAction(dom_elem, player_color) {
  var player_dom = void 0;
  for (var i = 0; i < dom_elem.children.length; i++) {
    if (dom_elem.children[i].classList.contains("active-player-icon")) {
      player_dom = dom_elem.children[i];
    }
  }
  if (player_dom) {
    setTimeout(showBotIcon, 500, player_dom);
    setTimeout(botClick, 1320, player_dom); // To match shake animation timing of .82s
  }
};

var showBotIcon = function showBotIcon(player_dom) {
  player_dom.classList.toggle("visible");
  player_dom.classList.toggle("shake");
};

var botClick = function botClick(player_dom) {
  player_dom.classList.toggle("visible");
  player_dom.classList.toggle("shake");
  player_dom.click();
};
var colors = ["red", "green", "yellow", "blue"];
var dice_face = ["", "one", "two", "three", "four", "five", "six"];
var safe_cells = [0, 8, 13, 21, 26, 34, 39, 47];

var board_metadata = {
  green: {
    start: 0,
    turn: 50,
    finish: 104,
    jail: {
      coin_cells: [210, 212, 220, 222],
      dice_roll_cell: 216,
      player_icon_cell: 224
    },
    cells: [[49, 50, 51], [48, 151, 0], [47, 100, 1], [46, 101, 2], [45, 102, 3], [44, 103, 4]]
  },
  blue: {
    start: 13,
    turn: 11,
    finish: 117,
    jail: {
      coin_cells: [223, 225, 233, 235],
      dice_roll_cell: 229,
      player_icon_cell: 217
    },
    cells: [[5, 6, 7, 8, 9, 10], [116, 115, 114, 113, 112, 11], [17, 16, 15, 14, 13, 12]]
  },
  yellow: {
    start: 26,
    turn: 24,
    finish: 130,
    jail: {
      coin_cells: [236, 238, 246, 248],
      dice_roll_cell: 242,
      player_icon_cell: 234
    },
    cells: [[30, 129, 18], [29, 128, 19], [28, 127, 20], [27, 126, 21], [26, 125, 22], [25, 24, 23]]
  },
  red: {
    start: 39,
    turn: 37,
    finish: 143,
    jail: {
      coin_cells: [249, 251, 259, 261],
      dice_roll_cell: 255,
      player_icon_cell: 267
    },
    cells: [[38, 39, 40, 41, 42, 43], [37, 138, 139, 140, 141, 142], [36, 35, 34, 33, 32, 31]]
  }
};

var board_init = {
  green: {
    G1: { status: 0, jail_pos: 210, pos: 210, next_pos: 210 },
    G2: { status: 0, jail_pos: 212, pos: 212, next_pos: 212 },
    G3: { status: 0, jail_pos: 220, pos: 220, next_pos: 220 },
    G4: { status: 0, jail_pos: 222, pos: 222, next_pos: 222 }
  },
  blue: {
    B1: { status: 0, jail_pos: 223, pos: 223, next_pos: 223 },
    B2: { status: 0, jail_pos: 225, pos: 225, next_pos: 225 },
    B3: { status: 0, jail_pos: 233, pos: 233, next_pos: 233 },
    B4: { status: 0, jail_pos: 235, pos: 235, next_pos: 235 }
  },
  yellow: {
    Y1: { status: 0, jail_pos: 236, pos: 236, next_pos: 236 },
    Y2: { status: 0, jail_pos: 238, pos: 238, next_pos: 238 },
    Y3: { status: 0, jail_pos: 246, pos: 246, next_pos: 246 },
    Y4: { status: 0, jail_pos: 248, pos: 248, next_pos: 248 }
  },
  red: {
    R1: { status: 0, jail_pos: 249, pos: 249, next_pos: 249 },
    R2: { status: 0, jail_pos: 251, pos: 251, next_pos: 251 },
    R3: { status: 0, jail_pos: 259, pos: 259, next_pos: 259 },
    R4: { status: 0, jail_pos: 261, pos: 261, next_pos: 261 }
  }
};

var game_init = {
  game_state: 0,
  board_active: false,
  players: [],
  active_player: -1,
  dice_roll: -1,
  prev_player: undefined,
  prev_roll: undefined
};

var getPositionMap = function getPositionMap(board) {
  var coin_position_map = {};
  for (var player in board) {
    for (var coin in board[player]) {
      var coin_meta = board[player][coin];
      var status = coin_meta.status;
      if (coin_position_map[coin_meta.pos]) {
        coin_position_map[coin_meta.pos].push({ player: player, coin: coin, status: status });
      } else {
        coin_position_map[coin_meta.pos] = [{ player: player, coin: coin, status: status }];
      }
    }
  }

  return coin_position_map;
};
var _jsxFileName = "src/display-board.js";
function Home(props) {
  if (props.game.game_state === 0) {
    return React.createElement(
      "div",
      { className: "board-item home start-btn-container", __source: {
          fileName: _jsxFileName,
          lineNumber: 4
        },
        __self: this
      },
      React.createElement("div", { className: "play-btn", onClick: function onClick() {
          return props.initGame();
        }, __source: {
          fileName: _jsxFileName,
          lineNumber: 5
        },
        __self: this
      })
    );
  }

  var cells = [];

  cells.push(React.createElement("div", { key: "home-cell-red-green", className: "home-cell cell-red-green", __source: {
      fileName: _jsxFileName,
      lineNumber: 13
    },
    __self: this
  }));
  cells.push(React.createElement("div", {
    key: "home-cell-green-blue",
    className: "home-cell cell-green-blue",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 16
    },
    __self: this
  }));
  cells.push(React.createElement("div", { key: "home-cell-center", className: "home-cell cell-center", __source: {
      fileName: _jsxFileName,
      lineNumber: 22
    },
    __self: this
  }));
  cells.push(React.createElement("div", {
    key: "home-cell-yellow-red",
    className: "home-cell cell-yellow-red",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 25
    },
    __self: this
  }));
  cells.push(React.createElement("div", {
    key: "home-cell-blue-yellow",
    className: "home-cell cell-blue-yellow",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 31
    },
    __self: this
  }));

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = colors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var color = _step.value;

      var classnames = [];
      classnames.push("home-cell");
      classnames.push("cell-" + color);

      var coins = [];
      var coinClass = [];
      if (props.actor_positions[board_metadata[color].finish]) {
        classnames.push("occupied");

        var coinvPos = 0;
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = props.actor_positions[board_metadata[color].finish][Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var coin = _step2.value;

            coinClass.push("coin");
            coinClass.push("coin-" + color);
            coinClass.push("coin-" + coinvPos);
            coins.push(React.createElement("div", {
              key: "home-coin-" + color + "-" + coinvPos,
              className: coinClass.join(" "),
              __source: {
                fileName: _jsxFileName,
                lineNumber: 53
              },
              __self: this
            }));
            coinvPos++;
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
      cells.push(React.createElement(
        "div",
        { key: "home-cell-" + color, className: classnames.join(" "), __source: {
            fileName: _jsxFileName,
            lineNumber: 62
          },
          __self: this
        },
        coins
      ));
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return React.createElement(
    "div",
    { className: "board-item home", __source: {
        fileName: _jsxFileName,
        lineNumber: 68
      },
      __self: this
    },
    cells
  );
}

function Jail(props) {
  var _this = this;

  var cells = [];
  var playable_colors = [];
  var assigned_players_map = {};

  // Populate from game metadata
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = props.game.players[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var player = _step3.value;

      playable_colors.push(player.color);
      assigned_players_map[player.color] = player.type;
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  var _loop = function _loop(i) {
    var classnames = [];
    var clickAction = "";
    var coins = [];
    var action_icon = [];
    var player_icon = [];
    var cellId = board_metadata[props.color].finish + i + 100;

    // Jail cells
    if (board_metadata[props.color].jail.coin_cells.includes(cellId)) {
      classnames.push("jail-cell");
      classnames.push("cell-" + cellId);

      if (props.actor_positions[board_metadata[props.color].finish]) {
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = props.actor_positions[board_metadata[props.color].finish][Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var coin = _step4.value;

            if (board_init[props.color][coin.coin].jail_pos === cellId) {
              classnames.push("icon-cell far fa-home");
            }
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      }

      var cell_actor = props.actor_positions[cellId] ? props.actor_positions[cellId].find(function (cell_actor) {
        return cell_actor.player === props.color;
      }) : undefined;

      if (cell_actor && cell_actor.status !== 2) {
        classnames.push("occupied");

        var coinClass = [];
        coinClass.push("coin");
        coinClass.push("coin-" + cell_actor.player);
        coinClass.push("coin-0");

        // Check if coin is active for play
        if (props.game.board_active && cell_actor.status === 1) {
          coinClass.push("glow");
          coinClass.push("active");
          clickAction = "playCoin";
        }

        coins.push(React.createElement("div", { key: "jail-coin-" + i, className: coinClass.join(" "), __source: {
            fileName: _jsxFileName,
            lineNumber: 127
          },
          __self: _this
        }));

        if (assigned_players_map[cell_actor.player] === "BOT") {
          player_icon.push(React.createElement("div", {
            key: "jail-bot-player-" + i,
            className: "active-player-icon player-icon-" + cell_actor.player + " icon-cell far fa-robot",
            __source: {
              fileName: _jsxFileName,
              lineNumber: 132
            },
            __self: _this
          }));
        }
      }
    }
    // Center cell to show dice
    else if (board_metadata[props.color].jail.dice_roll_cell === cellId) {
        classnames.push("cell-" + props.color);
        classnames.push("occupied");

        var actionClass = [];
        var content = "";
        if (playable_colors[props.game.active_player] == props.color) {
          if (props.game.board_active) {
            actionClass.push("dice-face");
            actionClass.push("icon-cell");
            actionClass.push("far fa-dice-" + dice_face[props.game.dice_roll]);
          } else if (props.game.game_state === 2) {
            actionClass.push("action-button dice");
            actionClass.push("spinner");
            content = 127922;
            clickAction = "rollDice";
          } else if (props.game.game_state === 3) {
            actionClass.push("action-button trophy");
            actionClass.push("zoominout");
            content = 127942;
            clickAction = "gaveOver";
          }

          action_icon.push(React.createElement(
            "div",
            { key: "jail-action-" + i, className: actionClass.join(" "), __source: {
                fileName: _jsxFileName,
                lineNumber: 169
              },
              __self: _this
            },
            String.fromCodePoint(content)
          ));

          if (assigned_players_map[props.color] === "BOT") {
            player_icon.push(React.createElement("div", {
              key: "jail-bot-player-" + i,
              className: "active-player-icon player-icon-" + props.color + " icon-cell far fa-robot",
              __source: {
                fileName: _jsxFileName,
                lineNumber: 176
              },
              __self: _this
            }));
          }
        } else if (playable_colors[props.game.prev_player] == props.color) {
          classnames.push("dice-face");
          classnames.push("icon-cell");
          classnames.push("far fa-dice-" + dice_face[props.game.prev_roll]);
          classnames.push("fade-out");
        }
      }
      // Corner cell to show player icon
      else if (board_metadata[props.color].jail.player_icon_cell === cellId) {
          classnames.push("cell-" + props.color);
          classnames.push("icon-cell");

          var assignedclass = [];
          assignedclass.push("player-icon");
          assignedclass.push("player-icon-" + props.color);
          assignedclass.push("far");
          if (assigned_players_map[props.color] === "HUMAN") {
            assignedclass.push("fa-user");
            if (props.game.game_state === 2 && playable_colors[props.game.active_player] == props.color) {
              assignedclass.push("shake");
            }
          }
          if (assigned_players_map[props.color] === "BOT") {
            assignedclass.push("fa-robot");
          }

          player_icon.push(React.createElement("div", { key: "jail-player-" + i, className: assignedclass.join(" "), __source: {
              fileName: _jsxFileName,
              lineNumber: 216
            },
            __self: _this
          }));
        } else {
          classnames.push("cell-" + props.color);
        }

    var clickFunc = undefined;
    if (clickAction === "playCoin") {
      clickFunc = function clickFunc() {
        return props.coinClickHandler(props.game.active_player, props.actor_positions[cellId][0].coin, props.game.dice_roll);
      };
    } else if (clickAction === "rollDice") {
      clickFunc = function clickFunc() {
        return props.diceClickHandler(props.game.active_player);
      };
    } else if (clickAction === "gaveOver") {
      clickFunc = function clickFunc() {
        return props.trophyClickHandler();
      };
    }

    cells.push(React.createElement(
      "div",
      {
        key: "jail-cell-" + props.color + "-" + i,
        className: classnames.join(" "),
        onClick: clickFunc,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 237
        },
        __self: _this
      },
      coins,
      action_icon,
      player_icon
    ));
  };

  for (var i = 0; i < 25; i++) {
    _loop(i);
  }

  var classnames = [];
  classnames.push("board-item");
  classnames.push("jail");
  classnames.push("jail-" + props.color);
  if (!assigned_players_map[props.color]) {
    classnames.push("disabled");
  }
  return React.createElement(
    "div",
    { className: classnames.join(" "), __source: {
        fileName: _jsxFileName,
        lineNumber: 256
      },
      __self: this
    },
    cells
  );
}

function Playground(props) {
  var _this2 = this;

  var cells = [];
  var rows = props.cells.length;
  var cols = props.cells[0].length;
  var playable_colors = [];
  var assigned_players_map = {};

  // Populate from game metadata
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = props.game.players[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var player = _step5.value;

      playable_colors.push(player.color);
      assigned_players_map[player.color] = player.type;
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  for (var i = 0; i < rows; i++) {
    var _loop2 = function _loop2(j) {
      var coins = [];
      var player_icon = [];
      var cellActor = undefined;
      var canClick = false;
      var cellId = props.cells[i][j];

      // Prepare classes for cell
      var classnames = [];
      classnames.push("cell-" + cellId);
      classnames.push("play-cell");

      if (cellId >= 100) {
        classnames.push("cell-" + props.color);
      }
      if (board_metadata[props.color] && board_metadata[props.color].start == cellId) {
        classnames.push("cell-" + props.color);
      }
      if (safe_cells.includes(cellId)) {
        classnames.push("icon-cell far fa-star");
      }

      // Check for cell occupancy
      if (props.actor_positions[cellId]) {
        classnames.push("occupied");

        // Determine cell actor
        cellActor = props.actor_positions[cellId].find(function (cell_actor) {
          return cell_actor.player === playable_colors[props.game.active_player];
        });
        cellActor = cellActor || props.actor_positions[cellId][0];

        // Handle multiple coins in cell
        var coinvPos = 0;
        var isCellActor = false;
        if (props.actor_positions[cellId].length > 1) {
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = props.actor_positions[cellId][Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var coin = _step6.value;

              // Determine active coin
              if (!isCellActor && coin.player === playable_colors[props.game.active_player]) {
                isCellActor = true;
              } else {
                coins.push(React.createElement("div", {
                  key: "playground-coin-" + coinvPos,
                  className: "coin coin-" + coin.player + " coin-" + coinvPos,
                  __source: {
                    fileName: _jsxFileName,
                    lineNumber: 322
                  },
                  __self: _this2
                }));
                coinvPos++;
              }
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }
        }

        // Add coin DOM for active coin
        var coinClass = [];
        coinClass.push("coin");
        coinClass.push("coin-" + cellActor.player);
        coinClass.push("coin-" + coinvPos);

        if (props.game.board_active && cellActor.status === 1) {
          coinClass.push("glow");
          coinClass.push("active");
          canClick = true;
        }

        coins.push(React.createElement("div", {
          key: "playground-coin-" + coinvPos,
          className: coinClass.join(" "),
          __source: {
            fileName: _jsxFileName,
            lineNumber: 345
          },
          __self: _this2
        }));

        if (assigned_players_map[cellActor.player] === "BOT") {
          player_icon.push(React.createElement("div", {
            key: "playground-player",
            className: "active-player-icon player-icon-" + cellActor.player + " icon-cell far fa-robot",
            __source: {
              fileName: _jsxFileName,
              lineNumber: 353
            },
            __self: _this2
          }));
        }
      }

      cells.push(React.createElement(
        "div",
        {
          key: "playground-cell-" + cellId,
          className: classnames.join(" "),
          onClick: canClick ? function () {
            return props.coinClickHandler(props.game.active_player, cellActor.coin, props.game.dice_roll);
          } : undefined,
          __source: {
            fileName: _jsxFileName,
            lineNumber: 366
          },
          __self: _this2
        },
        coins,
        player_icon
      ));
    };

    for (var j = 0; j < cols; j++) {
      _loop2(j);
    }
  }

  var classnames = [];
  classnames.push("board-item");
  classnames.push("playground");
  classnames.push("playground-" + props.color);
  classnames.push("rows-" + rows);
  classnames.push("cols-" + cols);

  return React.createElement(
    "div",
    { className: classnames.join(" "), __source: {
        fileName: _jsxFileName,
        lineNumber: 394
      },
      __self: this
    },
    cells
  );
}

function Board(props) {
  var coin_position_map = getPositionMap(props.board);

  var board = [];
  board.push(React.createElement(Home, {
    key: "home",
    game: props.game,
    actor_positions: coin_position_map,
    initGame: props.initGame,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 402
    },
    __self: this
  }));

  for (var i = 0; i < colors.length; i++) {
    var color = colors[i];
    board.push(React.createElement(Jail, {
      key: "jail-" + i,
      color: color,
      actor_positions: coin_position_map,
      game: props.game,
      coinClickHandler: props.coinClickHandler,
      diceClickHandler: props.diceClickHandler,
      trophyClickHandler: props.resetGame,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 413
      },
      __self: this
    }));
    board.push(React.createElement(Playground, {
      key: "playground-" + i,
      color: color,
      cells: board_metadata[color].cells,
      actor_positions: coin_position_map,
      game: props.game,
      coinClickHandler: props.coinClickHandler,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 424
      },
      __self: this
    }));
  }

  if (props.game.game_state > 1) {
    // Show reset button
    board.push(React.createElement(
      "div",
      { key: "top-menu", className: "top-menu", __source: {
          fileName: _jsxFileName,
          lineNumber: 438
        },
        __self: this
      },
      React.createElement("span", {
        title: "Game Wiki",
        className: "icon far fa-question",
        onClick: function onClick() {
          return window.open("https://en.wikipedia.org/wiki/Ludo_(board_game)", "_blank");
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 439
        },
        __self: this
      }),
      React.createElement("span", {
        title: "Reset Game",
        className: "icon fas fa-times",
        onClick: function onClick() {
          if (window.confirm("Reset the game?")) {
            props.resetGame();
          }
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 449
        },
        __self: this
      })
    ));
  }

  return React.createElement(
    "div",
    { className: "board-container", __source: {
        fileName: _jsxFileName,
        lineNumber: 462
      },
      __self: this
    },
    board
  );
}
var _jsxFileName = "src/dragable-assignment.js";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DraggableAssignBox = function (_React$Component) {
  _inherits(DraggableAssignBox, _React$Component);

  function DraggableAssignBox(props) {
    _classCallCheck(this, DraggableAssignBox);

    var _this = _possibleConstructorReturn(this, (DraggableAssignBox.__proto__ || Object.getPrototypeOf(DraggableAssignBox)).call(this, props));

    _this.setCurrentTarget = function (x, y) {
      _this.dragElem.style.zIndex = -1;
      var target = document.elementFromPoint(x, y) || document.body;
      _this.dragElem.style.zIndex = 1;
      // prevent it from selecting itself as the target
      _this.currentTarget = _this.dragElem.contains(target) ? document.body : target;
    };

    _this.generateEnterLeaveEvents = function (x, y) {
      _this.setCurrentTarget(x, y);
      if (_this.currentTarget !== _this.prevTarget) {
        if (_this.prevTarget) {
          _this.prevTarget.dispatchEvent(new CustomEvent("onTouchDragLeave"));
        }
        if (_this.currentTarget) {
          _this.currentTarget.dispatchEvent(new CustomEvent("onTouchDragEnter"));
        }
      }
      _this.prevTarget = _this.currentTarget;
    };

    _this.generateDropEvent = function (x, y) {
      // generate a drop event in whatever we're currently dragging over
      _this.setCurrentTarget(x, y);
      _this.currentTarget.dispatchEvent(new CustomEvent("onTouchDrop", {
        detail: {
          player: _this.dragElem.dataset.player,
          color: _this.currentTarget.dataset.color
        }
      }));
    };

    _this.state = {
      leftOffset: 0,
      topOffset: 0,
      left: 0,
      top: 0,
      dragging: false
    };
    _this.handleDrag = _this.handleDrag.bind(_this);
    _this.handleTouchStart = _this.handleTouchStart.bind(_this);
    _this.handleTouchMove = _this.handleTouchMove.bind(_this);
    _this.handleTouchEnd = _this.handleTouchEnd.bind(_this);
    _this.handleDragEnter = _this.handleDragEnter.bind(_this);
    _this.handleDragLeave = _this.handleDragLeave.bind(_this);
    _this.handleDrop = _this.handleDrop.bind(_this);
    _this.setCurrentTarget = _this.setCurrentTarget.bind(_this);
    _this.generateEnterLeaveEvents = _this.generateEnterLeaveEvents.bind(_this);
    _this.dragElem = null;
    _this.currentTarget = null;
    _this.prevTarget = null;
    _this.dropTarget = [];
    return _this;
  }

  _createClass(DraggableAssignBox, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.dropTarget[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var elem = _step.value;

          elem.addEventListener("onTouchDragEnter", this.handleDragEnter, false);
          elem.addEventListener("onTouchDragLeave", this.handleDragLeave, false);
          elem.addEventListener("onTouchDrop", this.handleDrop, false);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.dropTarget[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var elem = _step2.value;

          elem.removeEventListener("onTouchDragEnter", this.handleDragEnter, false);
          elem.removeEventListener("onTouchDragLeave", this.handleDragLeave, false);
          elem.removeEventListener("onTouchDrop", this.handleDrop, false);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: "handleDrag",
    value: function handleDrag(event, player) {
      event.dataTransfer.setData("player", player);
    }
  }, {
    key: "handleTouchStart",
    value: function handleTouchStart(event) {
      var rect = event.target.getBoundingClientRect();
      this.setState({
        leftOffset: rect.left - event.targetTouches[0].clientX,
        topOffset: rect.top - event.targetTouches[0].clientY,
        left: rect.left,
        top: rect.top,
        dragging: true
      });
      // Prepare the draggable icon
      this.dragElem.dataset.player = event.target.dataset.player;
      this.dragElem.classList.add(event.target.dataset.icon);
    }
  }, {
    key: "handleTouchMove",
    value: function handleTouchMove(event) {
      var x = event.targetTouches[0].clientX;
      var y = event.targetTouches[0].clientY;

      var stateChanges = { dragging: true };
      stateChanges.left = this.state.leftOffset + x;
      stateChanges.top = this.state.topOffset + y;

      this.setState(stateChanges);
      this.generateEnterLeaveEvents(x, y);
    }
  }, {
    key: "handleTouchEnd",
    value: function handleTouchEnd(event) {
      var x = event.changedTouches[0].clientX;
      var y = event.changedTouches[0].clientY;

      this.setState({ dragging: false });
      this.generateDropEvent(x, y);

      // Empty the draggable icon
      this.dragElem.dataset.player = "";
      this.dragElem.classList.remove("fa-user-tie");
      this.dragElem.classList.remove("fa-robot");
    }
  }, {
    key: "handleDragEnter",
    value: function handleDragEnter(event) {
      event.target.classList.add("hover");
      event.preventDefault();
    }
  }, {
    key: "handleDragLeave",
    value: function handleDragLeave(event) {
      event.target.classList.remove("hover");
      event.preventDefault();
    }
  }, {
    key: "handleDrop",
    value: function handleDrop(event, color) {
      event.target.classList.remove("hover");
      var player = void 0;
      if (event.type && event.type === "onTouchDrop") {
        player = event.detail["player"];
        color = event.detail["color"];
      } else {
        player = event.dataTransfer.getData("player");
      }
      this.props.assignPlayer(player, color);
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      // Assigned players map
      var assigned_players_map = {};
      var hasHumanPlayer = false;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.props.game.players[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var player = _step3.value;

          assigned_players_map[player.color] = player.type;
          hasHumanPlayer = hasHumanPlayer || player.type === "HUMAN";
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var drag_items = [];
      drag_items.push(React.createElement("div", {
        key: "drag-item-human",
        className: "drag-item icon-cell fad fa-user-tie",
        "data-player": "HUMAN",
        "data-icon": "fa-user-tie",
        draggable: "true",
        onDragStart: function onDragStart(event) {
          event.target.classList.add("drag");
          _this2.handleDrag(event, "HUMAN");
        },
        onDragEnd: function onDragEnd(event) {
          event.target.classList.remove("drag");
        },
        onTouchStart: function onTouchStart(event) {
          event.target.classList.add("drag");
          _this2.handleTouchStart(event);
        },
        onTouchMove: function onTouchMove(event) {
          event.target.classList.add("drag");
          _this2.handleTouchMove(event);
        },
        onTouchEnd: function onTouchEnd(event) {
          event.target.classList.remove("drag");
          _this2.handleTouchEnd(event);
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 154
        },
        __self: this
      }));
      if (this.props.game.players.length > 0 && hasHumanPlayer) {
        drag_items.push(React.createElement("div", { key: "drag-item-partition", className: "drag-item-partition", __source: {
            fileName: _jsxFileName,
            lineNumber: 183
          },
          __self: this
        }));

        drag_items.push(React.createElement("div", {
          key: "drag-item-bot",
          className: "drag-item icon-cell fad fa-robot",
          "data-player": "BOT",
          "data-icon": "fa-robot",
          draggable: "true",
          onDragStart: function onDragStart(event) {
            event.target.classList.add("drag");
            _this2.handleDrag(event, "BOT");
          },
          onDragEnd: function onDragEnd(event) {
            event.target.classList.remove("drag");
          },
          onTouchStart: function onTouchStart(event) {
            event.target.classList.add("drag");
            _this2.handleTouchStart(event);
          },
          onTouchMove: function onTouchMove(event) {
            event.target.classList.add("drag");
            _this2.handleTouchMove(event);
          },
          onTouchEnd: function onTouchEnd(event) {
            event.target.classList.remove("drag");
            _this2.handleTouchEnd(event);
          },
          __source: {
            fileName: _jsxFileName,
            lineNumber: 187
          },
          __self: this
        }));
      }

      var drop_items = [];

      var _loop = function _loop(i) {
        var color = colors[i];
        var assignedPlayer = [];
        var droppable = false;

        var dropclass = [];
        dropclass.push("drop-item");
        dropclass.push("cell-" + color);

        if (assigned_players_map[color]) {
          var assignedclass = [];
          assignedclass.push("assigned-item");
          assignedclass.push("player-icon-" + color);
          assignedclass.push("far");
          if (assigned_players_map[color] === "HUMAN") {
            assignedclass.push("fa-user");
          }
          if (assigned_players_map[color] === "BOT") {
            assignedclass.push("fa-robot");
          }
          assignedPlayer.push(React.createElement("div", {
            key: "drop-item-assigned-" + color,
            className: assignedclass.join(" "),
            __source: {
              fileName: _jsxFileName,
              lineNumber: 238
            },
            __self: _this2
          }));
          assignedPlayer.push(React.createElement("div", {
            key: "drop-item-undo-" + color,
            className: "undo icon-cell far fa-minus-circle",
            onClick: function onClick() {
              return _this2.props.unAssignPlayer(color);
            },
            __source: {
              fileName: _jsxFileName,
              lineNumber: 244
            },
            __self: _this2
          }));
        } else {
          dropclass.push("droppable");
          droppable = true;
        }

        drop_items.push(React.createElement(
          "div",
          {
            key: "drop-target-" + color,
            "data-color": color,
            ref: function ref(elem) {
              return _this2.dropTarget[i] = elem;
            },
            className: dropclass.join(" "),
            onDragOver: droppable ? function (e) {
              return _this2.handleDragEnter(e);
            } : undefined,
            onDragLeave: droppable ? function (e) {
              return _this2.handleDragLeave(e);
            } : undefined,
            onDrop: function onDrop(e) {
              return _this2.handleDrop(e, color);
            },
            __source: {
              fileName: _jsxFileName,
              lineNumber: 256
            },
            __self: _this2
          },
          assignedPlayer
        ));
      };

      for (var i = 0; i < colors.length; i++) {
        _loop(i);
      }

      var contents = [];
      // Show draggable section till all players not assigned
      if (this.props.game.players.length < 4) {
        contents.push(React.createElement(
          "div",
          { key: "dragzone", className: "dragzone", __source: {
              fileName: _jsxFileName,
              lineNumber: 274
            },
            __self: this
          },
          drag_items
        ));
        contents.push(React.createElement(
          "div",
          { key: "direction-zone", className: "direction-zone", __source: {
              fileName: _jsxFileName,
              lineNumber: 279
            },
            __self: this
          },
          React.createElement("i", { className: "icon-cell far fa-arrow-alt-down updown", __source: {
              fileName: _jsxFileName,
              lineNumber: 280
            },
            __self: this
          })
        ));
      }
      contents.push(React.createElement(
        "div",
        { key: "dropzone", className: "dropzone", __source: {
            fileName: _jsxFileName,
            lineNumber: 285
          },
          __self: this
        },
        drop_items
      ));

      // Show next button only after two players are assigned
      if (this.props.game.players.length > 1 && hasHumanPlayer) {
        contents.push(React.createElement(
          "div",
          {
            key: "next-zone",
            className: "next-zone",
            onClick: function onClick() {
              return _this2.props.startClickHandler();
            },
            __source: {
              fileName: _jsxFileName,
              lineNumber: 293
            },
            __self: this
          },
          React.createElement("i", { className: "icon-cell fas fa-chevron-right", __source: {
              fileName: _jsxFileName,
              lineNumber: 298
            },
            __self: this
          })
        ));
      }

      return React.createElement(
        "div",
        { className: "assignment-box", __source: {
            fileName: _jsxFileName,
            lineNumber: 304
          },
          __self: this
        },
        React.createElement(
          "div",
          { className: "contents", __source: {
              fileName: _jsxFileName,
              lineNumber: 305
            },
            __self: this
          },
          contents
        ),
        React.createElement("div", {
          className: "draggable-cell fad",
          style: {
            position: "fixed",
            left: this.state.left,
            top: this.state.top,
            display: this.state.dragging ? "block" : "none"
          },
          ref: function ref(elem) {
            return _this2.dragElem = elem;
          },
          "data-player": "HUMAN",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 306
          },
          __self: this
        })
      );
    }
  }]);

  return DraggableAssignBox;
}(React.Component);
var _jsxFileName = "src/game.js";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Game = function (_React$Component) {
  _inherits(Game, _React$Component);

  function Game(props) {
    _classCallCheck(this, Game);

    var _this = _possibleConstructorReturn(this, (Game.__proto__ || Object.getPrototypeOf(Game)).call(this, props));

    _this.state = {
      game: Object.assign({}, game_init),
      board: JSON.parse(JSON.stringify(board_init)) // Deep clone
    };

    _this.initGame = _this.initGame.bind(_this);
    _this.resetGame = _this.resetGame.bind(_this);
    _this.startGame = _this.startGame.bind(_this);
    _this.rollDice = _this.rollDice.bind(_this);
    _this.play = _this.play.bind(_this);
    _this.assignPlayer = _this.assignPlayer.bind(_this);
    _this.unAssignPlayer = _this.unAssignPlayer.bind(_this);
    return _this;
  }

  _createClass(Game, [{
    key: "initGame",
    value: function initGame() {
      var game = Object.assign({}, this.state.game);
      this.setState({
        game: Object.assign({}, game, {
          game_state: 1
        })
      });
    }
  }, {
    key: "resetGame",
    value: function resetGame() {
      this.setState({
        game: Object.assign({}, game_init),
        board: JSON.parse(JSON.stringify(board_init)) // Deep clone
      });
    }
  }, {
    key: "startGame",
    value: function startGame() {
      var game = this.state.game;
      this.setState({
        game: Object.assign({}, game, {
          game_state: 2,
          active_player: 0
        })
      });
    }
  }, {
    key: "assignPlayer",
    value: function assignPlayer(player, color) {
      var game = this.state.game;
      var players = [].concat(_toConsumableArray(game.players));
      players.push({ color: color, type: player });

      this.setState({
        game: Object.assign({}, game, {
          players: players
        })
      });
    }
  }, {
    key: "unAssignPlayer",
    value: function unAssignPlayer(color) {
      var game = this.state.game;
      var players = game.players.filter(function (p) {
        return p.color !== color;
      });

      this.setState({
        game: Object.assign({}, game, {
          players: players
        })
      });
    }
  }, {
    key: "nextPlayer",
    value: function nextPlayer(player) {
      return (player + 1) % this.state.game.players.length;
    }
  }, {
    key: "nextPosition",
    value: function nextPosition(curr_pos, dice_roll, home_turn, finish) {
      var next_pos = -1;
      if (curr_pos > 200) {
        next_pos = curr_pos;
      } else if (curr_pos >= 100) {
        // special handling for 151
        var cpos = curr_pos === 151 ? curr_pos - 52 : curr_pos;

        next_pos = cpos + dice_roll;
        next_pos = next_pos <= finish ? next_pos : curr_pos;
      } else {
        next_pos = (curr_pos + dice_roll) % 52;
        // Check for home run
        if (curr_pos <= home_turn && home_turn < curr_pos + dice_roll) {
          next_pos = next_pos + 100;
        }
      }
      return next_pos;
    }
  }, {
    key: "rollDice",
    value: function rollDice(player_idx) {
      var board = JSON.parse(JSON.stringify(this.state.board));
      var game = Object.assign({}, this.state.game);

      var canPlay = false;
      var player = game.players[player_idx].color;

      // Dice Roll
      var dice_roll = Math.floor(Math.random() * 6 + 1);
      // const dice_roll = parseInt(document.getElementById("dice").value);

      // Calculate status and next position for player coins
      for (var coin in board[player]) {
        var curr_position = board[player][coin].pos;

        // Ignore coins who have finished
        if (curr_position === board_metadata[player].finish) {
          continue;
        }

        // Compute next position
        var next_position = this.nextPosition(curr_position, dice_roll, board_metadata[player].turn, board_metadata[player].finish);

        // On dice roll outcome 6
        if (dice_roll == 6) {
          // Activate jailed coins
          if (curr_position > 200) {
            canPlay = true;
            board[player][coin].status = 1;
            board[player][coin].next_pos = board_metadata[player].start;
          }
          // Activate board coins
          else if (curr_position < 52) {
              canPlay = true;
              board[player][coin].status = 1;
              board[player][coin].next_pos = next_position;
            }
        }
        // Other dice roll outcomes
        else {
            if (next_position != curr_position) {
              canPlay = true;
              board[player][coin].status = 1;
              board[player][coin].next_pos = next_position;
            }
          }
      }

      if (canPlay) {
        game = Object.assign({}, game, {
          board_active: true,
          active_player: player_idx,
          dice_roll: dice_roll,
          prev_player: undefined,
          prev_roll: undefined
        });
      } else {
        var next_player_idx = this.nextPlayer(player_idx);
        game = Object.assign({}, game, {
          board_active: false,
          active_player: next_player_idx,
          dice_roll: -1,
          prev_player: player_idx,
          prev_roll: dice_roll
        });
      }

      this.setState({
        game: game,
        board: board
      });
    }
  }, {
    key: "play",
    value: function play(player_idx, coin, dice_roll) {
      var game = Object.assign({}, this.state.game);
      var board = JSON.parse(JSON.stringify(this.state.board));
      var coin_position_map = getPositionMap(board);

      var player = game.players[player_idx].color;
      var player_next_pos = board[player][coin].next_pos;

      var playAgain = false;
      var gaveOver = false;

      // Handle next_pos having existing player
      if (!safe_cells.includes(player_next_pos)) {
        // Fetching existing_player, if any, from next_pos
        var existing_player = coin_position_map[player_next_pos] ? coin_position_map[player_next_pos][0] : undefined;

        // Handle next_pos has another coin of different player, send coin to jail
        if (existing_player && existing_player.player != player) {
          var jail_position = board[existing_player.player][existing_player.coin].jail_pos;
          board[existing_player.player][existing_player.coin].pos = jail_position;
          board[existing_player.player][existing_player.coin].next_pos = jail_position;
          playAgain = true;
        }
      }

      // Handle next_pos is home/finish
      if (player_next_pos === board_metadata[player].finish) {
        board[player][coin].pos = player_next_pos;
        board[player][coin].status = 2;

        // Check game over condition
        if (Object.values(board[player]).every(function (coin) {
          return coin.status === 2;
        })) {
          gaveOver = true;
        } else {
          playAgain = true;
        }
      } else {
        // Move the active coin
        if (board[player][coin].status === 1) {
          board[player][coin].pos = player_next_pos;
        }

        // Remove active status of other coins for player
        for (var _coin in board[player]) {
          if (board[player][_coin].status === 1) {
            board[player][_coin].status = 0;
          }
        }
      }

      if (gaveOver) {
        game = Object.assign({}, game, {
          game_state: 3,
          board_active: false,
          active_player: player_idx,
          dice_roll: -1
        });
      }
      // Player rolls again
      else if (playAgain || dice_roll == 6) {
          game = Object.assign({}, game, {
            board_active: false,
            active_player: player_idx,
            dice_roll: -1
          });
        }
        // Next player's turn
        else {
            var next_player_idx = this.nextPlayer(player_idx);
            game = Object.assign({}, game, {
              board_active: false,
              active_player: next_player_idx,
              dice_roll: -1
            });
          }

      this.setState({
        game: game,
        board: board
      });
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      // Set up bot play
      if (isBotsTurn(this.state.game)) {
        botPlay(this.state.game, this.state.board);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var game = [];
      game.push(React.createElement(Board, {
        key: "board",
        board: this.state.board,
        game: this.state.game,
        initGame: this.initGame,
        resetGame: this.resetGame,
        coinClickHandler: this.play,
        diceClickHandler: this.rollDice,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 275
        },
        __self: this
      }));

      if (this.state.game.game_state === 1) {
        game.push(React.createElement(DraggableAssignBox, {
          key: "assignmentbox",
          game: this.state.game,
          startClickHandler: this.startGame,
          assignPlayer: this.assignPlayer,
          unAssignPlayer: this.unAssignPlayer,
          __source: {
            fileName: _jsxFileName,
            lineNumber: 288
          },
          __self: this
        }));
      }

      return React.createElement(
        "div",
        { className: "game-container", __source: {
            fileName: _jsxFileName,
            lineNumber: 298
          },
          __self: this
        },
        game
      );
    }
  }]);

  return Game;
}(React.Component);

// Game Mode Selector Component


var GameModeSelector = function (_React$Component2) {
  _inherits(GameModeSelector, _React$Component2);

  function GameModeSelector(props) {
    _classCallCheck(this, GameModeSelector);

    var _this2 = _possibleConstructorReturn(this, (GameModeSelector.__proto__ || Object.getPrototypeOf(GameModeSelector)).call(this, props));

    _this2.state = {
      selectedMode: null
    };
    return _this2;
  }

  _createClass(GameModeSelector, [{
    key: "render",
    value: function render() {
      var _this3 = this;

      if (this.state.selectedMode === 'single') {
        return React.createElement(Game, {
          __source: {
            fileName: _jsxFileName,
            lineNumber: 313
          },
          __self: this
        });
      }

      if (this.state.selectedMode === 'multi') {
        return React.createElement(MultiplayerGame, {
          __source: {
            fileName: _jsxFileName,
            lineNumber: 317
          },
          __self: this
        });
      }

      return React.createElement(
        "div",
        { className: "mode-selector", __source: {
            fileName: _jsxFileName,
            lineNumber: 321
          },
          __self: this
        },
        React.createElement(
          "h1",
          {
            __source: {
              fileName: _jsxFileName,
              lineNumber: 322
            },
            __self: this
          },
          "Ludo Game"
        ),
        React.createElement(
          "div",
          { className: "mode-buttons", __source: {
              fileName: _jsxFileName,
              lineNumber: 323
            },
            __self: this
          },
          React.createElement(
            "button",
            {
              className: "mode-btn single-player",
              onClick: function onClick() {
                return _this3.setState({ selectedMode: 'single' });
              },
              __source: {
                fileName: _jsxFileName,
                lineNumber: 324
              },
              __self: this
            },
            "Single Player / Local Multiplayer"
          ),
          React.createElement(
            "button",
            {
              className: "mode-btn multiplayer",
              onClick: function onClick() {
                return _this3.setState({ selectedMode: 'multi' });
              },
              __source: {
                fileName: _jsxFileName,
                lineNumber: 330
              },
              __self: this
            },
            "Online Multiplayer"
          )
        )
      );
    }
  }]);

  return GameModeSelector;
}(React.Component);

ReactDOM.render(React.createElement(GameModeSelector, {
  __source: {
    fileName: _jsxFileName,
    lineNumber: 342
  },
  __self: this
}), document.getElementById("root"));
var _jsxFileName = 'src/multiplayer.js';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Multiplayer Game Component with Socket.IO integration
var MultiplayerGame = function (_React$Component) {
  _inherits(MultiplayerGame, _React$Component);

  function MultiplayerGame(props) {
    _classCallCheck(this, MultiplayerGame);

    var _this = _possibleConstructorReturn(this, (MultiplayerGame.__proto__ || Object.getPrototypeOf(MultiplayerGame)).call(this, props));

    _this.state = {
      socket: null,
      connected: false,
      roomId: '',
      playerName: '',
      gameMode: 'individual', // 'individual', 'team', or '1v1'
      currentPlayer: null,
      players: [],
      teams: { team1: [], team2: [] },
      game: Object.assign({}, game_init),
      board: JSON.parse(JSON.stringify(board_init)),
      showJoinForm: true,
      gameMessage: '',
      isMyTurn: false,
      // For 1v1 mode
      playerColors: [],
      currentColor: null
    };

    _this.initSocket = _this.initSocket.bind(_this);
    _this.joinRoom = _this.joinRoom.bind(_this);
    _this.startGame = _this.startGame.bind(_this);
    _this.rollDice = _this.rollDice.bind(_this);
    _this.play = _this.play.bind(_this);
    return _this;
  }

  _createClass(MultiplayerGame, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.initSocket();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      if (this.state.socket) {
        this.state.socket.disconnect();
      }
    }
  }, {
    key: 'initSocket',
    value: function initSocket() {
      var _this2 = this;

      var socket = io();

      socket.on('connect', function () {
        console.log('Connected to server');
        _this2.setState({ connected: true, socket: socket });
      });

      socket.on('disconnect', function () {
        console.log('Disconnected from server');
        _this2.setState({ connected: false });
      });

      socket.on('joined-room', function (data) {
        console.log('Joined room:', data);
        _this2.setState({
          currentPlayer: data.player,
          players: data.players,
          teams: data.teams || { team1: [], team2: [] },
          game: data.gameState,
          board: data.board,
          showJoinForm: false,
          gameMessage: 'You joined as ' + data.player.color + ' player' + (data.player.team ? ' on ' + data.player.team : '')
        });
      });

      socket.on('player-joined', function (data) {
        console.log('Player joined:', data);
        _this2.setState({
          players: data.players,
          teams: data.teams || { team1: [], team2: [] },
          game: data.gameState,
          gameMessage: data.player.name + ' joined as ' + data.player.color + (data.player.team ? ' on ' + data.player.team : '')
        });
      });

      socket.on('player-left', function (data) {
        console.log('Player left:', data);
        _this2.setState({
          players: data.players,
          gameMessage: data.player.name + ' left the game'
        });
      });

      socket.on('room-full', function () {
        _this2.setState({
          gameMessage: 'Room is full! Try another room.'
        });
      });

      socket.on('game-started', function (data) {
        console.log('Game started:', data);
        _this2.setState({
          game: data.gameState,
          board: data.board,
          gameMessage: 'Game started!',
          isMyTurn: _this2.isMyTurn(data.gameState)
        });
      });

      socket.on('dice-rolled', function (data) {
        console.log('Dice rolled:', data);
        _this2.setState({
          game: data.gameState,
          board: data.board,
          gameMessage: 'Player rolled ' + data.diceRoll,
          isMyTurn: _this2.isMyTurn(data.gameState)
        });
      });

      socket.on('game-mode-mismatch', function (data) {
        _this2.setState({
          gameMessage: 'This room is set to ' + data.expectedMode + ' mode. Please choose the correct mode or try a different room.'
        });
      });

      socket.on('move-made', function (data) {
        console.log('Move made:', data);
        var message = 'Player made a move';

        if (data.gameOver) {
          if (data.winningTeam) {
            var team1Colors = ['red', 'yellow'];
            var team2Colors = ['green', 'blue'];
            var winnerColors = data.winningTeam === 'team1' ? team1Colors : team2Colors;
            message = 'Game Over! Team ' + data.winningTeam + ' (' + winnerColors.join(' & ') + ') wins!';
          } else if (data.winner && _this2.state.gameMode === '1v1') {
            message = 'Game Over! ' + data.winner.name + ' wins with their colors!';
          } else {
            message = 'Game Over! Player wins!';
          }
        }

        _this2.setState({
          game: data.gameState,
          board: data.board,
          gameMessage: message,
          isMyTurn: _this2.isMyTurn(data.gameState)
        });
      });
    }
  }, {
    key: 'isMyTurn',
    value: function isMyTurn(gameState) {
      var _this3 = this;

      if (!this.state.currentPlayer || !this.state.players.length) return false;

      if (this.state.gameMode === '1v1') {
        // In 1v1 mode, check if any of our colors is the active player
        var myPlayer = this.state.players.find(function (p) {
          return p.id === _this3.state.currentPlayer.id;
        });
        if (myPlayer && myPlayer.colors) {
          var activePlayerObj = gameState.players[gameState.active_player];
          var activeColor = activePlayerObj ? activePlayerObj.color : null;
          return myPlayer.colors.includes(activeColor);
        }
      }

      var myPlayerIndex = this.state.players.findIndex(function (p) {
        return p.id === _this3.state.currentPlayer.id;
      });
      return gameState.active_player === myPlayerIndex;
    }
  }, {
    key: 'joinRoom',
    value: function joinRoom() {
      var _state = this.state,
          socket = _state.socket,
          roomId = _state.roomId,
          playerName = _state.playerName,
          gameMode = _state.gameMode;

      if (!socket || !roomId.trim() || !playerName.trim()) {
        this.setState({ gameMessage: 'Please enter both room ID and your name' });
        return;
      }

      socket.emit('join-room', {
        roomId: roomId.trim(),
        playerName: playerName.trim(),
        gameMode: gameMode
      });
    }
  }, {
    key: 'startGame',
    value: function startGame() {
      var socket = this.state.socket;

      if (!socket) return;
      socket.emit('start-game');
    }
  }, {
    key: 'rollDice',
    value: function rollDice() {
      var socket = this.state.socket;

      if (!socket || !this.state.isMyTurn) return;
      socket.emit('roll-dice');
    }
  }, {
    key: 'play',
    value: function play(playerIdx, coin, diceRoll) {
      var socket = this.state.socket;

      if (!socket || !this.state.isMyTurn) return;
      socket.emit('make-move', { coin: coin });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this4 = this;

      var _state2 = this.state,
          showJoinForm = _state2.showJoinForm,
          connected = _state2.connected,
          gameMessage = _state2.gameMessage,
          game = _state2.game,
          board = _state2.board,
          players = _state2.players,
          teams = _state2.teams,
          currentPlayer = _state2.currentPlayer,
          isMyTurn = _state2.isMyTurn,
          gameMode = _state2.gameMode;


      if (!connected) {
        return React.createElement(
          'div',
          { className: 'multiplayer-container', __source: {
              fileName: _jsxFileName,
              lineNumber: 197
            },
            __self: this
          },
          React.createElement(
            'div',
            { className: 'connection-status', __source: {
                fileName: _jsxFileName,
                lineNumber: 198
              },
              __self: this
            },
            React.createElement(
              'h2',
              {
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 199
                },
                __self: this
              },
              'Connecting to server...'
            )
          )
        );
      }

      if (showJoinForm) {
        return React.createElement(
          'div',
          { className: 'multiplayer-container', __source: {
              fileName: _jsxFileName,
              lineNumber: 207
            },
            __self: this
          },
          React.createElement(
            'div',
            { className: 'join-form', __source: {
                fileName: _jsxFileName,
                lineNumber: 208
              },
              __self: this
            },
            React.createElement(
              'h2',
              {
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 209
                },
                __self: this
              },
              'Join Multiplayer Ludo Game'
            ),
            React.createElement(
              'div',
              { className: 'form-group', __source: {
                  fileName: _jsxFileName,
                  lineNumber: 210
                },
                __self: this
              },
              React.createElement(
                'label',
                {
                  __source: {
                    fileName: _jsxFileName,
                    lineNumber: 211
                  },
                  __self: this
                },
                'Your Name:'
              ),
              React.createElement('input', {
                type: 'text',
                value: this.state.playerName,
                onChange: function onChange(e) {
                  return _this4.setState({ playerName: e.target.value });
                },
                placeholder: 'Enter your name',
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 212
                },
                __self: this
              })
            ),
            React.createElement(
              'div',
              { className: 'form-group', __source: {
                  fileName: _jsxFileName,
                  lineNumber: 219
                },
                __self: this
              },
              React.createElement(
                'label',
                {
                  __source: {
                    fileName: _jsxFileName,
                    lineNumber: 220
                  },
                  __self: this
                },
                'Room ID:'
              ),
              React.createElement('input', {
                type: 'text',
                value: this.state.roomId,
                onChange: function onChange(e) {
                  return _this4.setState({ roomId: e.target.value });
                },
                placeholder: 'Enter room ID (e.g., room123)',
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 221
                },
                __self: this
              })
            ),
            React.createElement(
              'div',
              { className: 'form-group', __source: {
                  fileName: _jsxFileName,
                  lineNumber: 228
                },
                __self: this
              },
              React.createElement(
                'label',
                {
                  __source: {
                    fileName: _jsxFileName,
                    lineNumber: 229
                  },
                  __self: this
                },
                'Game Mode:'
              ),
              React.createElement(
                'select',
                {
                  value: this.state.gameMode,
                  onChange: function onChange(e) {
                    return _this4.setState({ gameMode: e.target.value });
                  },
                  className: 'game-mode-select',
                  __source: {
                    fileName: _jsxFileName,
                    lineNumber: 230
                  },
                  __self: this
                },
                React.createElement(
                  'option',
                  { value: 'individual', __source: {
                      fileName: _jsxFileName,
                      lineNumber: 235
                    },
                    __self: this
                  },
                  'Individual (2-4 players)'
                ),
                React.createElement(
                  'option',
                  { value: 'team', __source: {
                      fileName: _jsxFileName,
                      lineNumber: 236
                    },
                    __self: this
                  },
                  'Team Mode (2 vs 2)'
                ),
                React.createElement(
                  'option',
                  { value: '1v1', __source: {
                      fileName: _jsxFileName,
                      lineNumber: 237
                    },
                    __self: this
                  },
                  '1 vs 1 (Two Colors Each)'
                )
              ),
              React.createElement(
                'div',
                { className: 'mode-description', __source: {
                    fileName: _jsxFileName,
                    lineNumber: 239
                  },
                  __self: this
                },
                gameMode === 'team' ? 'Team mode: Red & Yellow vs Green & Blue. Need exactly 4 players.' : gameMode === '1v1' ? '1v1 mode: Each player controls 2 colors (8 pieces total). Player 1 gets Red & Green, Player 2 gets Yellow & Blue.' : 'Individual mode: Every player for themselves. 2-4 players.'
              )
            ),
            React.createElement(
              'button',
              { onClick: this.joinRoom, className: 'join-btn', __source: {
                  fileName: _jsxFileName,
                  lineNumber: 248
                },
                __self: this
              },
              'Join Game'
            ),
            gameMessage && React.createElement(
              'div',
              { className: 'game-message', __source: {
                  fileName: _jsxFileName,
                  lineNumber: 251
                },
                __self: this
              },
              gameMessage
            )
          )
        );
      }

      return React.createElement(
        'div',
        { className: 'multiplayer-container', __source: {
            fileName: _jsxFileName,
            lineNumber: 258
          },
          __self: this
        },
        React.createElement(
          'div',
          { className: 'game-info', __source: {
              fileName: _jsxFileName,
              lineNumber: 259
            },
            __self: this
          },
          React.createElement(
            'h3',
            {
              __source: {
                fileName: _jsxFileName,
                lineNumber: 260
              },
              __self: this
            },
            'Multiplayer Ludo - Room: ',
            this.state.roomId
          ),
          React.createElement(
            'div',
            { className: 'game-mode-info', __source: {
                fileName: _jsxFileName,
                lineNumber: 261
              },
              __self: this
            },
            React.createElement(
              'strong',
              {
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 262
                },
                __self: this
              },
              'Mode:'
            ),
            ' ',
            game.game_mode === 'team' ? '2 vs 2 Teams' : game.game_mode === '1v1' ? '1 vs 1 (Two Colors)' : 'Individual'
          ),
          game.game_mode === 'team' ? React.createElement(
            'div',
            { className: 'teams-display', __source: {
                fileName: _jsxFileName,
                lineNumber: 270
              },
              __self: this
            },
            React.createElement(
              'div',
              { className: 'team team1', __source: {
                  fileName: _jsxFileName,
                  lineNumber: 271
                },
                __self: this
              },
              React.createElement(
                'h4',
                {
                  __source: {
                    fileName: _jsxFileName,
                    lineNumber: 272
                  },
                  __self: this
                },
                'Team 1 (Red & Yellow)'
              ),
              teams.team1.map(function (player) {
                return React.createElement(
                  'div',
                  { key: player.id, className: 'player-info ' + player.color, __source: {
                      fileName: _jsxFileName,
                      lineNumber: 274
                    },
                    __self: _this4
                  },
                  player.name,
                  ' (',
                  player.color,
                  ')',
                  currentPlayer && player.id === currentPlayer.id && ' - You'
                );
              })
            ),
            React.createElement(
              'div',
              { className: 'team team2', __source: {
                  fileName: _jsxFileName,
                  lineNumber: 280
                },
                __self: this
              },
              React.createElement(
                'h4',
                {
                  __source: {
                    fileName: _jsxFileName,
                    lineNumber: 281
                  },
                  __self: this
                },
                'Team 2 (Green & Blue)'
              ),
              teams.team2.map(function (player) {
                return React.createElement(
                  'div',
                  { key: player.id, className: 'player-info ' + player.color, __source: {
                      fileName: _jsxFileName,
                      lineNumber: 283
                    },
                    __self: _this4
                  },
                  player.name,
                  ' (',
                  player.color,
                  ')',
                  currentPlayer && player.id === currentPlayer.id && ' - You'
                );
              })
            )
          ) : game.game_mode === '1v1' ? React.createElement(
            'div',
            { className: 'teams-display', __source: {
                fileName: _jsxFileName,
                lineNumber: 291
              },
              __self: this
            },
            React.createElement(
              'div',
              { className: 'player-1v1', __source: {
                  fileName: _jsxFileName,
                  lineNumber: 292
                },
                __self: this
              },
              React.createElement(
                'h4',
                {
                  __source: {
                    fileName: _jsxFileName,
                    lineNumber: 293
                  },
                  __self: this
                },
                'Player 1 (Red & Green)'
              ),
              players.length > 0 && React.createElement(
                'div',
                { className: 'player-info multi-color', __source: {
                    fileName: _jsxFileName,
                    lineNumber: 295
                  },
                  __self: this
                },
                players[0].name,
                ' (Red & Green)',
                currentPlayer && players[0].id === currentPlayer.id && ' - You'
              )
            ),
            React.createElement(
              'div',
              { className: 'player-1v1', __source: {
                  fileName: _jsxFileName,
                  lineNumber: 301
                },
                __self: this
              },
              React.createElement(
                'h4',
                {
                  __source: {
                    fileName: _jsxFileName,
                    lineNumber: 302
                  },
                  __self: this
                },
                'Player 2 (Yellow & Blue)'
              ),
              players.length > 1 && React.createElement(
                'div',
                { className: 'player-info multi-color', __source: {
                    fileName: _jsxFileName,
                    lineNumber: 304
                  },
                  __self: this
                },
                players[1].name,
                ' (Yellow & Blue)',
                currentPlayer && players[1].id === currentPlayer.id && ' - You'
              )
            )
          ) : React.createElement(
            'div',
            { className: 'players-list', __source: {
                fileName: _jsxFileName,
                lineNumber: 312
              },
              __self: this
            },
            React.createElement(
              'h4',
              {
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 313
                },
                __self: this
              },
              'Players (',
              players.length,
              '/4):'
            ),
            players.map(function (player, index) {
              return React.createElement(
                'div',
                { key: player.id, className: 'player-info ' + player.color, __source: {
                    fileName: _jsxFileName,
                    lineNumber: 315
                  },
                  __self: _this4
                },
                player.name,
                ' (',
                player.color,
                ')',
                currentPlayer && player.id === currentPlayer.id && ' - You',
                game.active_player === index && ' - Current Turn'
              );
            })
          ),
          game.game_state === 1 && players.length >= 2 && React.createElement(
            'button',
            { onClick: this.startGame, className: 'start-btn', __source: {
                fileName: _jsxFileName,
                lineNumber: 325
              },
              __self: this
            },
            'Start Game'
          ),
          React.createElement(
            'div',
            { className: 'turn-indicator', __source: {
                fileName: _jsxFileName,
                lineNumber: 330
              },
              __self: this
            },
            isMyTurn ? "Your Turn!" : "Waiting for other player..."
          ),
          gameMessage && React.createElement(
            'div',
            { className: 'game-message', __source: {
                fileName: _jsxFileName,
                lineNumber: 334
              },
              __self: this
            },
            gameMessage
          )
        ),
        React.createElement(Board, {
          board: board,
          game: game,
          coinClickHandler: this.play,
          diceClickHandler: this.rollDice,
          isMultiplayer: true,
          isMyTurn: isMyTurn,
          __source: {
            fileName: _jsxFileName,
            lineNumber: 337
          },
          __self: this
        })
      );
    }
  }]);

  return MultiplayerGame;
}(React.Component);

// Create a game mode selector


var GameModeSelector = function (_React$Component2) {
  _inherits(GameModeSelector, _React$Component2);

  function GameModeSelector(props) {
    _classCallCheck(this, GameModeSelector);

    var _this5 = _possibleConstructorReturn(this, (GameModeSelector.__proto__ || Object.getPrototypeOf(GameModeSelector)).call(this, props));

    _this5.state = {
      selectedMode: null
    };
    return _this5;
  }

  _createClass(GameModeSelector, [{
    key: 'render',
    value: function render() {
      var _this6 = this;

      if (this.state.selectedMode === 'single') {
        return React.createElement(Game, {
          __source: {
            fileName: _jsxFileName,
            lineNumber: 361
          },
          __self: this
        });
      }

      if (this.state.selectedMode === 'multi') {
        return React.createElement(MultiplayerGame, {
          __source: {
            fileName: _jsxFileName,
            lineNumber: 365
          },
          __self: this
        });
      }

      return React.createElement(
        'div',
        { className: 'mode-selector', __source: {
            fileName: _jsxFileName,
            lineNumber: 369
          },
          __self: this
        },
        React.createElement(
          'h1',
          {
            __source: {
              fileName: _jsxFileName,
              lineNumber: 370
            },
            __self: this
          },
          'Ludo Game'
        ),
        React.createElement(
          'div',
          { className: 'mode-buttons', __source: {
              fileName: _jsxFileName,
              lineNumber: 371
            },
            __self: this
          },
          React.createElement(
            'button',
            {
              className: 'mode-btn single-player',
              onClick: function onClick() {
                return _this6.setState({ selectedMode: 'single' });
              },
              __source: {
                fileName: _jsxFileName,
                lineNumber: 372
              },
              __self: this
            },
            'Single Player / Local Multiplayer'
          ),
          React.createElement(
            'button',
            {
              className: 'mode-btn multiplayer',
              onClick: function onClick() {
                return _this6.setState({ selectedMode: 'multi' });
              },
              __source: {
                fileName: _jsxFileName,
                lineNumber: 378
              },
              __self: this
            },
            'Online Multiplayer'
          )
        )
      );
    }
  }]);

  return GameModeSelector;
}(React.Component);
