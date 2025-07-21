// Multiplayer Game Component with Socket.IO integration
class MultiplayerGame extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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

    this.initSocket = this.initSocket.bind(this);
    this.joinRoom = this.joinRoom.bind(this);
    this.startGame = this.startGame.bind(this);
    this.rollDice = this.rollDice.bind(this);
    this.play = this.play.bind(this);
  }

  componentDidMount() {
    this.initSocket();
  }

  componentWillUnmount() {
    if (this.state.socket) {
      this.state.socket.disconnect();
    }
  }

  initSocket() {
    const socket = io();
    
    socket.on('connect', () => {
      console.log('Connected to server');
      this.setState({ connected: true, socket });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.setState({ connected: false });
    });

    socket.on('joined-room', (data) => {
      console.log('Joined room:', data);
      this.setState({
        currentPlayer: data.player,
        players: data.players,
        teams: data.teams || { team1: [], team2: [] },
        game: data.gameState,
        board: data.board,
        showJoinForm: false,
        gameMessage: `You joined as ${data.player.color} player${data.player.team ? ` on ${data.player.team}` : ''}`
      });
    });

    socket.on('player-joined', (data) => {
      console.log('Player joined:', data);
      this.setState({
        players: data.players,
        teams: data.teams || { team1: [], team2: [] },
        game: data.gameState,
        gameMessage: `${data.player.name} joined as ${data.player.color}${data.player.team ? ` on ${data.player.team}` : ''}`
      });
    });

    socket.on('player-left', (data) => {
      console.log('Player left:', data);
      this.setState({
        players: data.players,
        gameMessage: `${data.player.name} left the game`
      });
    });

    socket.on('room-full', () => {
      this.setState({
        gameMessage: 'Room is full! Try another room.'
      });
    });

    socket.on('game-started', (data) => {
      console.log('Game started:', data);
      this.setState({
        game: data.gameState,
        board: data.board,
        gameMessage: 'Game started!',
        isMyTurn: this.isMyTurn(data.gameState)
      });
    });

    socket.on('dice-rolled', (data) => {
      console.log('Dice rolled:', data);
      this.setState({
        game: data.gameState,
        board: data.board,
        gameMessage: `Player rolled ${data.diceRoll}`,
        isMyTurn: this.isMyTurn(data.gameState)
      });
    });

    socket.on('game-mode-mismatch', (data) => {
      this.setState({
        gameMessage: `This room is set to ${data.expectedMode} mode. Please choose the correct mode or try a different room.`
      });
    });

    socket.on('move-made', (data) => {
      console.log('Move made:', data);
      let message = 'Player made a move';
      
      if (data.gameOver) {
        if (data.winningTeam) {
          const team1Colors = ['red', 'yellow'];
          const team2Colors = ['green', 'blue'];
          const winnerColors = data.winningTeam === 'team1' ? team1Colors : team2Colors;
          message = `Game Over! Team ${data.winningTeam} (${winnerColors.join(' & ')}) wins!`;
        } else if (data.winner && this.state.gameMode === '1v1') {
          message = `Game Over! ${data.winner.name} wins with their colors!`;
        } else {
          message = 'Game Over! Player wins!';
        }
      }
      
      this.setState({
        game: data.gameState,
        board: data.board,
        gameMessage: message,
        isMyTurn: this.isMyTurn(data.gameState)
      });
    });
  }

  isMyTurn(gameState) {
    if (!this.state.currentPlayer || !this.state.players.length) return false;
    
    if (this.state.gameMode === '1v1') {
      // In 1v1 mode, check if any of our colors is the active player
      const myPlayer = this.state.players.find(p => p.id === this.state.currentPlayer.id);
      if (myPlayer && myPlayer.colors) {
        const activePlayerObj = gameState.players[gameState.active_player];
        const activeColor = activePlayerObj ? activePlayerObj.color : null;
        return myPlayer.colors.includes(activeColor);
      }
    }
    
    const myPlayerIndex = this.state.players.findIndex(p => p.id === this.state.currentPlayer.id);
    return gameState.active_player === myPlayerIndex;
  }

  joinRoom() {
    const { socket, roomId, playerName, gameMode } = this.state;
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

  startGame() {
    const { socket } = this.state;
    if (!socket) return;
    socket.emit('start-game');
  }

  rollDice() {
    const { socket } = this.state;
    if (!socket || !this.state.isMyTurn) return;
    socket.emit('roll-dice');
  }

  play(playerIdx, coin, diceRoll) {
    const { socket } = this.state;
    if (!socket || !this.state.isMyTurn) return;
    socket.emit('make-move', { coin });
  }

  render() {
    const { showJoinForm, connected, gameMessage, game, board, players, teams, currentPlayer, isMyTurn, gameMode } = this.state;

    if (!connected) {
      return (
        <div className="multiplayer-container">
          <div className="connection-status">
            <h2>Connecting to server...</h2>
          </div>
        </div>
      );
    }

    if (showJoinForm) {
      return (
        <div className="multiplayer-container">
          <div className="join-form">
            <h2>Join Multiplayer Ludo Game</h2>
            <div className="form-group">
              <label>Your Name:</label>
              <input
                type="text"
                value={this.state.playerName}
                onChange={(e) => this.setState({ playerName: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label>Room ID:</label>
              <input
                type="text"
                value={this.state.roomId}
                onChange={(e) => this.setState({ roomId: e.target.value })}
                placeholder="Enter room ID (e.g., room123)"
              />
            </div>
            <div className="form-group">
              <label>Game Mode:</label>
              <select 
                value={this.state.gameMode} 
                onChange={(e) => this.setState({ gameMode: e.target.value })}
                className="game-mode-select"
              >
                <option value="individual">Individual (2-4 players)</option>
                <option value="team">Team Mode (2 vs 2)</option>
                <option value="1v1">1 vs 1 (Two Colors Each)</option>
              </select>
              <div className="mode-description">
                {gameMode === 'team' ? 
                  'Team mode: Red & Yellow vs Green & Blue. Need exactly 4 players.' :
                  gameMode === '1v1' ?
                  '1v1 mode: Each player controls 2 colors (8 pieces total). Player 1 gets Red & Green, Player 2 gets Yellow & Blue.' :
                  'Individual mode: Every player for themselves. 2-4 players.'
                }
              </div>
            </div>
            <button onClick={this.joinRoom} className="join-btn">
              Join Game
            </button>
            {gameMessage && <div className="game-message">{gameMessage}</div>}
          </div>
        </div>
      );
    }

    return (
      <div className="multiplayer-container">
        <div className="game-info">
          <h3>Multiplayer Ludo - Room: {this.state.roomId}</h3>
          <div className="game-mode-info">
            <strong>Mode:</strong> {
              game.game_mode === 'team' ? '2 vs 2 Teams' : 
              game.game_mode === '1v1' ? '1 vs 1 (Two Colors)' : 
              'Individual'
            }
          </div>
          
          {game.game_mode === 'team' ? (
            <div className="teams-display">
              <div className="team team1">
                <h4>Team 1 (Red & Yellow)</h4>
                {teams.team1.map((player) => (
                  <div key={player.id} className={`player-info ${player.color}`}>
                    {player.name} ({player.color})
                    {currentPlayer && player.id === currentPlayer.id && ' - You'}
                  </div>
                ))}
              </div>
              <div className="team team2">
                <h4>Team 2 (Green & Blue)</h4>
                {teams.team2.map((player) => (
                  <div key={player.id} className={`player-info ${player.color}`}>
                    {player.name} ({player.color})
                    {currentPlayer && player.id === currentPlayer.id && ' - You'}
                  </div>
                ))}
              </div>
            </div>
          ) : game.game_mode === '1v1' ? (
            <div className="teams-display">
              <div className="player-1v1">
                <h4>Player 1 (Red & Green)</h4>
                {players.length > 0 && (
                  <div className={`player-info multi-color`}>
                    {players[0].name} (Red & Green)
                    {currentPlayer && players[0].id === currentPlayer.id && ' - You'}
                  </div>
                )}
              </div>
              <div className="player-1v1">
                <h4>Player 2 (Yellow & Blue)</h4>
                {players.length > 1 && (
                  <div className={`player-info multi-color`}>
                    {players[1].name} (Yellow & Blue)
                    {currentPlayer && players[1].id === currentPlayer.id && ' - You'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="players-list">
              <h4>Players ({players.length}/4):</h4>
              {players.map((player, index) => (
                <div key={player.id} className={`player-info ${player.color}`}>
                  {player.name} ({player.color})
                  {currentPlayer && player.id === currentPlayer.id && ' - You'}
                  {game.active_player === index && ' - Current Turn'}
                </div>
              ))}
            </div>
          )}
          
          {game.game_state === 1 && players.length >= 2 && (
            <button onClick={this.startGame} className="start-btn">
              Start Game
            </button>
          )}
          
          <div className="turn-indicator">
            {isMyTurn ? "Your Turn!" : "Waiting for other player..."}
          </div>
          
          {gameMessage && <div className="game-message">{gameMessage}</div>}
        </div>

        <Board
          board={board}
          game={game}
          coinClickHandler={this.play}
          diceClickHandler={this.rollDice}
          isMultiplayer={true}
          isMyTurn={isMyTurn}
        />
      </div>
    );
  }
}

// Create a game mode selector
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
