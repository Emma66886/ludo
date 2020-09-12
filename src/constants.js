const colors = ["red", "green", "yellow", "blue"];
const dice_face = ["", "one", "two", "three", "four", "five", "six"];
const safe_cells = [0, 8, 13, 21, 26, 34, 39, 47];

const board_metadata = {
  green: {
    start: 0,
    turn: 50,
    finish: 104,
    jail: {
      coin_cells: [210, 212, 220, 222],
      dice_roll_cell: 216,
      player_icon_cell: 224
    },
    cells: [
      [49, 50, 51],
      [48, 151, 0],
      [47, 100, 1],
      [46, 101, 2],
      [45, 102, 3],
      [44, 103, 4]
    ]
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
    cells: [
      [5, 6, 7, 8, 9, 10],
      [116, 115, 114, 113, 112, 11],
      [17, 16, 15, 14, 13, 12]
    ]
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
    cells: [
      [30, 129, 18],
      [29, 128, 19],
      [28, 127, 20],
      [27, 126, 21],
      [26, 125, 22],
      [25, 24, 23]
    ]
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
    cells: [
      [38, 39, 40, 41, 42, 43],
      [37, 138, 139, 140, 141, 142],
      [36, 35, 34, 33, 32, 31]
    ]
  }
};

const board_init = {
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

const game_init = {
  game_state: 0,
  board_active: false,
  players: [],
  active_player: -1,
  dice_roll: -1,
  prev_player: undefined,
  prev_roll: undefined
};

const getPositionMap = function(board) {
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
};
