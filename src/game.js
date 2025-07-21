class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      game: Object.assign({}, game_init),
      board: JSON.parse(JSON.stringify(board_init)) // Deep clone
    };

    this.initGame = this.initGame.bind(this);
    this.resetGame = this.resetGame.bind(this);
    this.startGame = this.startGame.bind(this);
    this.rollDice = this.rollDice.bind(this);
    this.play = this.play.bind(this);
    this.assignPlayer = this.assignPlayer.bind(this);
    this.unAssignPlayer = this.unAssignPlayer.bind(this);
  }

  initGame() {
    let game = Object.assign({}, this.state.game);
    this.setState({
      game: {
        ...game,
        game_state: 1
      }
    });
  }

  resetGame() {
    this.setState({
      game: Object.assign({}, game_init),
      board: JSON.parse(JSON.stringify(board_init)) // Deep clone
    });
  }

  startGame() {
    let game = this.state.game;
    this.setState({
      game: {
        ...game,
        game_state: 2,
        active_player: 0
      }
    });
  }

  assignPlayer(player, color) {
    const game = this.state.game;
    const players = [...game.players];
    players.push({ color, type: player });

    this.setState({
      game: {
        ...game,
        players
      }
    });
  }

  unAssignPlayer(color) {
    const game = this.state.game;
    const players = game.players.filter(p => p.color !== color);

    this.setState({
      game: {
        ...game,
        players
      }
    });
  }

  nextPlayer(player) {
    return (player + 1) % this.state.game.players.length;
  }

  nextPosition(curr_pos, dice_roll, home_turn, finish) {
    let next_pos = -1;
    if (curr_pos > 200) {
      next_pos = curr_pos;
    } else if (curr_pos >= 100) {
      // special handling for 151
      let cpos = curr_pos === 151 ? curr_pos - 52 : curr_pos;

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

  rollDice(player_idx) {
    const board = JSON.parse(JSON.stringify(this.state.board));
    let game = Object.assign({}, this.state.game);

    let canPlay = false;
    const player = game.players[player_idx].color;

    // Dice Roll
    const dice_roll = Math.floor(Math.random() * 6 + 1);
    // const dice_roll = parseInt(document.getElementById("dice").value);

    // Calculate status and next position for player coins
    for (const coin in board[player]) {
      const curr_position = board[player][coin].pos;

      // Ignore coins who have finished
      if (curr_position === board_metadata[player].finish) {
        continue;
      }

      // Compute next position
      const next_position = this.nextPosition(
        curr_position,
        dice_roll,
        board_metadata[player].turn,
        board_metadata[player].finish
      );

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
      game = {
        ...game,
        board_active: true,
        active_player: player_idx,
        dice_roll,
        prev_player: undefined,
        prev_roll: undefined
      };
    } else {
      const next_player_idx = this.nextPlayer(player_idx);
      game = {
        ...game,
        board_active: false,
        active_player: next_player_idx,
        dice_roll: -1,
        prev_player: player_idx,
        prev_roll: dice_roll
      };
    }

    this.setState({
      game,
      board
    });
  }

  play(player_idx, coin, dice_roll) {
    let game = Object.assign({}, this.state.game);
    const board = JSON.parse(JSON.stringify(this.state.board));
    const coin_position_map = getPositionMap(board);

    const player = game.players[player_idx].color;
    const player_next_pos = board[player][coin].next_pos;

    let playAgain = false;
    let gaveOver = false;

    // Handle next_pos having existing player
    if (!safe_cells.includes(player_next_pos)) {
      // Fetching existing_player, if any, from next_pos
      const existing_player = coin_position_map[player_next_pos]
        ? coin_position_map[player_next_pos][0]
        : undefined;

      // Handle next_pos has another coin of different player, send coin to jail
      if (existing_player && existing_player.player != player) {
        const jail_position =
          board[existing_player.player][existing_player.coin].jail_pos;
        board[existing_player.player][existing_player.coin].pos = jail_position;
        board[existing_player.player][
          existing_player.coin
        ].next_pos = jail_position;
        playAgain = true;
      }
    }

    // Handle next_pos is home/finish
    if (player_next_pos === board_metadata[player].finish) {
      board[player][coin].pos = player_next_pos;
      board[player][coin].status = 2;

      // Check game over condition
      if (Object.values(board[player]).every(coin => coin.status === 2)) {
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
      for (const coin in board[player]) {
        if (board[player][coin].status === 1) {
          board[player][coin].status = 0;
        }
      }
    }

    if (gaveOver) {
      game = {
        ...game,
        game_state: 3,
        board_active: false,
        active_player: player_idx,
        dice_roll: -1
      };
    }
    // Player rolls again
    else if (playAgain || dice_roll == 6) {
      game = {
        ...game,
        board_active: false,
        active_player: player_idx,
        dice_roll: -1
      };
    }
    // Next player's turn
    else {
      const next_player_idx = this.nextPlayer(player_idx);
      game = {
        ...game,
        board_active: false,
        active_player: next_player_idx,
        dice_roll: -1
      };
    }

    this.setState({
      game,
      board
    });
  }

  componentDidUpdate() {
    // Set up bot play
    if (isBotsTurn(this.state.game)) {
      botPlay(this.state.game, this.state.board);
    }
  }

  render() {
    const game = [];
    game.push(
      <Board
        key="board"
        board={this.state.board}
        game={this.state.game}
        initGame={this.initGame}
        resetGame={this.resetGame}
        coinClickHandler={this.play}
        diceClickHandler={this.rollDice}
      />
    );

    if (this.state.game.game_state === 1) {
      game.push(
        <DraggableAssignBox
          key="assignmentbox"
          game={this.state.game}
          startClickHandler={this.startGame}
          assignPlayer={this.assignPlayer}
          unAssignPlayer={this.unAssignPlayer}
        />
      );
    }

    return <div className="game-container">{game}</div>;
  }
}

// Game Mode Selector Component
class GameModeSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedMode: null
    };
  }

  render() {
    if (this.state.selectedMode === 'single') {
      return <Game />;
    }

    if (this.state.selectedMode === 'multi') {
      return <MultiplayerGame />;
    }

    return (
      <div className="mode-selector">
        <h1>Ludo Game</h1>
        <div className="mode-buttons">
          <button 
            className="mode-btn single-player"
            onClick={() => this.setState({ selectedMode: 'single' })}
          >
            Single Player / Local Multiplayer
          </button>
          <button 
            className="mode-btn multiplayer"
            onClick={() => this.setState({ selectedMode: 'multi' })}
          >
            Online Multiplayer
          </button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<GameModeSelector />, document.getElementById("root"));
