const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game rooms storage
const gameRooms = new Map();

class GameRoom {
  constructor(roomId, gameMode = 'individual') {
    this.roomId = roomId;
    this.gameMode = gameMode; // 'individual', 'team', or '1v1'
    this.players = [];
    this.teams = { team1: [], team2: [] }; // For 2v2 mode
    this.gameState = {
      game_state: 1, // Start multiplayer games in state 1 (skip initial play button)
      board_active: false,
      players: [],
      active_player: -1,
      dice_roll: -1,
      prev_player: undefined,
      prev_roll: undefined,
      game_mode: gameMode,
      teams: { team1: [], team2: [] }
    };
    this.board = {
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
  }

  getPlayerColor(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;
    
    if (this.gameMode === '1v1') {
      // In 1v1 mode, return the currently active color for this player
      return player.currentColor || player.colors[0];
    }
    
    return player.color;
  }

  setPlayerCurrentColor(playerId, color) {
    if (this.gameMode !== '1v1') return false;
    
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.colors.includes(color)) return false;
    
    player.currentColor = color;
    return true;
  }

  addPlayer(socket, playerName) {
    const colors = ["red", "green", "yellow", "blue"];
    
    if (this.gameMode === '1v1') {
      // In 1v1 mode, each player gets 2 opposite colors
      if (this.players.length >= 2) {
        return false; // Only 2 players allowed in 1v1
      }
      
      let playerColors = [];
      if (this.players.length === 0) {
        // First player gets red and green (opposite corners)
        playerColors = ['red', 'green'];
      } else {
        // Second player gets yellow and blue (opposite corners)
        playerColors = ['yellow', 'blue'];
      }

      const player = {
        id: socket.id,
        name: playerName,
        colors: playerColors, // Array of colors this player controls
        type: "HUMAN",
        isMultiColor: true
      };

      this.players.push(player);
      
      // Add entries for both colors
      playerColors.forEach(color => {
        this.gameState.players.push({ 
          color: color, 
          type: "HUMAN", 
          playerId: socket.id,
          playerName: playerName,
          isMultiColor: true
        });
      });
      
      return player;
    } else if (this.gameMode === 'team') {
      // Existing team logic
      const availableColors = colors.filter(color => 
        !this.players.find(p => p.color === color)
      );
      
      if (availableColors.length === 0) {
        return false; // Room is full
      }

      let team = null;
      // Assign teams: red+yellow vs green+blue
      if (availableColors.includes('red')) {
        team = 'team1';
      } else if (availableColors.includes('yellow')) {
        team = 'team1';
      } else if (availableColors.includes('green')) {
        team = 'team2';
      } else if (availableColors.includes('blue')) {
        team = 'team2';
      }

      const player = {
        id: socket.id,
        name: playerName,
        color: availableColors[0],
        type: "HUMAN",
        team: team
      };

      this.players.push(player);
      this.gameState.players.push({ color: player.color, type: "HUMAN", team: team });
      
      if (team) {
        this.teams[team].push(player);
        this.gameState.teams[team].push(player.color);
      }
      
      return player;
    } else {
      // Individual mode - existing logic
      const availableColors = colors.filter(color => 
        !this.players.find(p => p.color === color)
      );
      
      if (availableColors.length === 0) {
        return false; // Room is full
      }

      const player = {
        id: socket.id,
        name: playerName,
        color: availableColors[0],
        type: "HUMAN"
      };

      this.players.push(player);
      this.gameState.players.push({ color: player.color, type: "HUMAN" });
      
      return player;
    }
  }

  removePlayer(socketId) {
    const playerIndex = this.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      const removedPlayer = this.players.splice(playerIndex, 1)[0];
      
      if (this.gameMode === '1v1') {
        // Remove all colors associated with this player
        this.gameState.players = this.gameState.players.filter(p => p.playerId !== socketId);
      } else if (this.gameMode === 'team') {
        this.gameState.players = this.gameState.players.filter(p => p.color !== removedPlayer.color);
        
        // Remove from team
        if (removedPlayer.team) {
          this.teams[removedPlayer.team] = this.teams[removedPlayer.team].filter(p => p.id !== socketId);
          this.gameState.teams[removedPlayer.team] = this.gameState.teams[removedPlayer.team].filter(color => color !== removedPlayer.color);
        }
      } else {
        this.gameState.players = this.gameState.players.filter(p => p.color !== removedPlayer.color);
      }
      
      return removedPlayer;
    }
    return null;
  }

  getPlayer(socketId) {
    return this.players.find(p => p.id === socketId);
  }

  isFull() {
    if (this.gameMode === '1v1') {
      return this.players.length >= 2;
    }
    return this.players.length >= 4;
  }

  rollDice(playerIndex) {
    const board = JSON.parse(JSON.stringify(this.board));
    let game = Object.assign({}, this.gameState);

    let canPlay = false;
    const player = game.players[playerIndex].color;

    // Dice Roll
    const dice_roll = Math.floor(Math.random() * 6 + 1);

    // Import board metadata
    const board_metadata = {
      green: { start: 0, turn: 50, finish: 104 },
      blue: { start: 13, turn: 11, finish: 117 },
      yellow: { start: 26, turn: 24, finish: 130 },
      red: { start: 39, turn: 37, finish: 143 }
    };

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
      game.board_active = true;
      game.active_player = playerIndex;
      game.dice_roll = dice_roll;
      game.prev_player = undefined;
      game.prev_roll = undefined;
    } else {
      const next_player_idx = this.nextPlayer(playerIndex);
      game.board_active = false;
      game.active_player = next_player_idx;
      game.dice_roll = -1;
      game.prev_player = playerIndex;
      game.prev_roll = dice_roll;
    }

    this.gameState = game;
    this.board = board;
    
    return { canPlay, dice_roll };
  }

  nextPlayer(player) {
    return (player + 1) % this.gameState.players.length;
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

  makeMove(playerIndex, coin) {
    const board = JSON.parse(JSON.stringify(this.board));
    let game = Object.assign({}, this.gameState);

    const safe_cells = [0, 8, 13, 21, 26, 34, 39, 47];
    const board_metadata = {
      green: { start: 0, turn: 50, finish: 104 },
      blue: { start: 13, turn: 11, finish: 117 },
      yellow: { start: 26, turn: 24, finish: 130 },
      red: { start: 39, turn: 37, finish: 143 }
    };

    const coin_position_map = this.getPositionMap(board);
    const player = game.players[playerIndex].color;
    const player_next_pos = board[player][coin].next_pos;

    let playAgain = false;
    let gameOver = false;

    // Handle next_pos having existing player
    if (!safe_cells.includes(player_next_pos)) {
      const existing_player = coin_position_map[player_next_pos]
        ? coin_position_map[player_next_pos][0]
        : undefined;

      if (existing_player && existing_player.player != player) {
        const jail_position = board[existing_player.player][existing_player.coin].jail_pos;
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
      if (this.gameMode === 'team') {
        const winningTeam = this.checkTeamWin();
        if (winningTeam) {
          gameOver = true;
          game.winning_team = winningTeam;
        } else {
          playAgain = true;
        }
      } else if (this.gameMode === '1v1') {
        const winner = this.check1v1Win();
        if (winner) {
          gameOver = true;
          game.winner = winner;
        } else {
          playAgain = true;
        }
      } else {
        if (Object.values(board[player]).every(coin => coin.status === 2)) {
          gameOver = true;
        } else {
          playAgain = true;
        }
      }
    } else {
      // Move the active coin
      if (board[player][coin].status === 1) {
        board[player][coin].pos = player_next_pos;
      }

      // Remove active status of other coins for player
      for (const coinKey in board[player]) {
        if (board[player][coinKey].status === 1) {
          board[player][coinKey].status = 0;
        }
      }
    }

    if (gameOver) {
      game.game_state = 3;
      game.board_active = false;
      game.active_player = playerIndex;
      game.dice_roll = -1;
    }
    // Player rolls again
    else if (playAgain || game.dice_roll == 6) {
      game.board_active = false;
      game.active_player = playerIndex;
      game.dice_roll = -1;
    }
    // Next player's turn
    else {
      const next_player_idx = this.nextPlayer(playerIndex);
      game.board_active = false;
      game.active_player = next_player_idx;
      game.dice_roll = -1;
    }

    this.gameState = game;
    this.board = board;
    
    return { playAgain, gameOver };
  }

  getPositionMap(board) {
    const coin_position_map = {};
    for (const player in board) {
      for (const coin in board[player]) {
        const coin_meta = board[player][coin];
        const status = coin_meta.status;
        if (coin_position_map[coin_meta.pos]) {
          coin_position_map[coin_meta.pos].push({ player, coin, status });
        } else {
          coin_position_map[coin_meta.pos] = [{ player, coin, status }];
        }
      }
    }
    return coin_position_map;
  }

  canStart() {
    if (this.gameMode === 'team') {
      return this.players.length === 4; // Need exactly 4 players for 2v2
    } else if (this.gameMode === '1v1') {
      return this.players.length === 2; // Need exactly 2 players for 1v1
    }
    return this.players.length >= 2;
  }

  check1v1Win() {
    if (this.gameMode !== '1v1') return null;

    const board_metadata = {
      green: { finish: 104 },
      blue: { finish: 117 },
      yellow: { finish: 130 },
      red: { finish: 143 }
    };

    // Check if player 1 (red + green) has won
    const player1Colors = ['red', 'green'];
    const player1Won = player1Colors.every(color => {
      return Object.values(this.board[color]).every(coin => coin.status === 2);
    });

    if (player1Won) return this.players[0];

    // Check if player 2 (yellow + blue) has won
    const player2Colors = ['yellow', 'blue'];
    const player2Won = player2Colors.every(color => {
      return Object.values(this.board[color]).every(coin => coin.status === 2);
    });

    if (player2Won) return this.players[1];

    return null;
  }

  checkTeamWin() {
    if (this.gameMode !== 'team') return null;

    const board_metadata = {
      green: { finish: 104 },
      blue: { finish: 117 },
      yellow: { finish: 130 },
      red: { finish: 143 }
    };

    // Check if team1 (red + yellow) has won
    const team1Colors = ['red', 'yellow'];
    const team1Won = team1Colors.every(color => {
      return Object.values(this.board[color]).every(coin => coin.status === 2);
    });

    if (team1Won) return 'team1';

    // Check if team2 (green + blue) has won
    const team2Colors = ['green', 'blue'];
    const team2Won = team2Colors.every(color => {
      return Object.values(this.board[color]).every(coin => coin.status === 2);
    });

    if (team2Won) return 'team2';

    return null;
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (data) => {
    const { roomId, playerName, gameMode = 'individual' } = data;
    
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, new GameRoom(roomId, gameMode));
    }

    const room = gameRooms.get(roomId);
    
    // Check if game mode matches
    if (room.gameMode !== gameMode) {
      socket.emit('game-mode-mismatch', { 
        expectedMode: room.gameMode,
        providedMode: gameMode 
      });
      return;
    }
    
    if (room.isFull()) {
      socket.emit('room-full');
      return;
    }

    const player = room.addPlayer(socket, playerName);
    if (!player) {
      socket.emit('room-full');
      return;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerId = player.id;

    // Send current game state to the joining player
    socket.emit('joined-room', {
      player,
      gameState: room.gameState,
      board: room.board,
      players: room.players,
      teams: room.teams
    });

    // Notify other players in the room
    socket.to(roomId).emit('player-joined', {
      player,
      players: room.players,
      teams: room.teams,
      gameState: room.gameState
    });

    console.log(`Player ${playerName} joined room ${roomId} as ${player.color} (${gameMode} mode)${player.team ? ` on ${player.team}` : ''}`);
  });

  socket.on('start-game', () => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room || !room.canStart()) return;

    room.gameState.game_state = 2;
    room.gameState.active_player = 0;

    io.to(roomId).emit('game-started', {
      gameState: room.gameState,
      board: room.board
    });

    console.log(`Game started in room ${roomId}`);
  });

  socket.on('roll-dice', (data) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== room.gameState.active_player) return; // Not this player's turn

    // Use the game logic to roll dice
    const result = room.rollDice(playerIndex);

    // Broadcast the dice roll to all players in the room
    io.to(roomId).emit('dice-rolled', {
      playerIndex,
      diceRoll: result.dice_roll,
      canPlay: result.canPlay,
      gameState: room.gameState,
      board: room.board
    });

    console.log(`Player ${player.name} rolled ${result.dice_roll} in room ${roomId}`);
  });

  socket.on('make-move', (data) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== room.gameState.active_player) return; // Not this player's turn

    const { coin } = data;

    // Use the game logic to make the move
    const result = room.makeMove(playerIndex, coin);

    // Broadcast the move to all players in the room
    io.to(roomId).emit('move-made', {
      playerIndex,
      coin,
      playAgain: result.playAgain,
      gameOver: result.gameOver,
      winningTeam: room.gameState.winning_team,
      winner: room.gameState.winner,
      gameState: room.gameState,
      board: room.board
    });

    console.log(`Player ${player.name} made a move with ${coin} in room ${roomId}`);
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    const removedPlayer = room.removePlayer(socket.id);
    if (removedPlayer) {
      socket.to(roomId).emit('player-left', {
        player: removedPlayer,
        players: room.players
      });

      // If room is empty, clean it up
      if (room.players.length === 0) {
        gameRooms.delete(roomId);
        console.log(`Room ${roomId} deleted - no players left`);
      }

      console.log(`Player ${removedPlayer.name} left room ${roomId}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Ludo multiplayer server running on port ${PORT}`);
});
