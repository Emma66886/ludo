// Multiplayer Game Component with Socket.IO integration
class MultiplayerGame extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: null,
      connected: false,
      roomId: '',
      playerName: '',
      currentPlayer: null,
      players: [],
      game: Object.assign({}, game_init),
      board: JSON.parse(JSON.stringify(board_init)),
      showJoinForm: true,
      gameMessage: '',
      isMyTurn: false
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
        game: data.gameState,
        board: data.board,
        showJoinForm: false,
        gameMessage: `You joined as ${data.player.color} player`
      });
    });

    socket.on('player-joined', (data) => {
      console.log('Player joined:', data);
      this.setState({
        players: data.players,
        game: data.gameState,
        gameMessage: `${data.player.name} joined as ${data.player.color}`
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

    socket.on('move-made', (data) => {
      console.log('Move made:', data);
      this.setState({
        game: data.gameState,
        board: data.board,
        gameMessage: `Player made a move`,
        isMyTurn: this.isMyTurn(data.gameState)
      });
    });
  }

  isMyTurn(gameState) {
    if (!this.state.currentPlayer || !this.state.players.length) return false;
    const myPlayerIndex = this.state.players.findIndex(p => p.id === this.state.currentPlayer.id);
    return gameState.active_player === myPlayerIndex;
  }

  joinRoom() {
    const { socket, roomId, playerName } = this.state;
    if (!socket || !roomId.trim() || !playerName.trim()) {
      this.setState({ gameMessage: 'Please enter both room ID and your name' });
      return;
    }

    socket.emit('join-room', { roomId: roomId.trim(), playerName: playerName.trim() });
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
    const { showJoinForm, connected, gameMessage, game, board, players, currentPlayer, isMyTurn } = this.state;

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
