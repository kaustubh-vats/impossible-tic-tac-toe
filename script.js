class Player {
  constructor(name, symbol) {
    this.name = name;
    this.symbol = symbol;
  }

  setSymbol(symbol) {
    this.symbol = symbol;
  }
}

class GameBoard {
  constructor() {
    this.winningCombos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    this.cells = Array(9).fill(null);
  }

  reset() {
    this.cells = Array(9).fill(null);
  }

  placeMark(index, symbol) {
    if (this.cells[index]) return false;
    this.cells[index] = symbol;
    return true;
  }

  resetMark(index) {
    if (!this.cells[index]) return false;
    this.cells[index] = null;
    return true;
  }

  getEmptyCells() {
    return this.cells
      .map((value, index) => (value === null ? index : null))
      .filter((value) => value !== null);
  }

  getWinningCombo(symbol) {
    return (
      this.winningCombos.find((combo) =>
        combo.every((index) => this.cells[index] === symbol),
      ) || null
    );
  }

  hasWinner(symbol) {
    return Boolean(this.getWinningCombo(symbol));
  }

  isDraw() {
    return this.cells.every(Boolean);
  }

  getCells() {
    return this.cells;
  }
}

class ScoreTracker {
  constructor() {
    this.humanWins = 0;
    this.humanLosses = 0;
    this.computerWins = 0;
    this.computerLosses = 0;
  }

  recordHumanWin() {
    this.humanWins += 1;
    this.computerLosses += 1;
  }

  recordComputerWin() {
    this.computerWins += 1;
    this.humanLosses += 1;
  }
}

class Intelligence{
    constructor(board, symbol) {
        this.board = board;
        this.symbol = symbol;
        this.alternateSymbol = symbol === "X" ? "O" : "X";
    }

    minMax(board, depth, isMaxim) {
        if(board.hasWinner(this.symbol)) {
            return 10 - depth;
        }
        if(board.hasWinner(this.alternateSymbol)) {
            return (-10 - depth);
        }
        if(board.isDraw()) {
            return 0;
        }

        const cells = board.getCells()
        let bestScore = (isMaxim) ? -Infinity : Infinity;
        const currentSymbol = (isMaxim) ? this.symbol : this.alternateSymbol;
        for(let i = 0; i < cells.length; i++) {
            if(!cells[i]) {
                board.placeMark(i, currentSymbol);
                const score = this.minMax(board, depth+1, !isMaxim);
                bestScore = (isMaxim) ? Math.max(score, bestScore) : Math.min(score, bestScore);
                board.resetMark(i);
            }
        }
        return bestScore;
    }
    
    getBestMove() {
        const cells = this.board.getCells();
        let bestMove = -1;
        let maxScore = -Infinity;
        for(let i = 0; i < cells.length; i++) {
            if(!cells[i]) {
                this.board.placeMark(i, this.symbol);
                const score = this.minMax(this.board, 1, false);
                if(score > maxScore) {
                    maxScore = score;
                    bestMove = i;
                }
                this.board.resetMark(i);
            }
        }
        return bestMove;
    }

}

class TicTacToeApp {
  constructor() {
    this.boardEl = document.getElementById("board");
    this.statusEl = document.getElementById("status");
    this.restartBtn = document.getElementById("restartBtn");
    this.newBtn = document.getElementById("newGameBtn");
    this.chooseXBtn = document.getElementById("chooseX");
    this.chooseOBtn = document.getElementById("chooseO");
    this.humanSymbolEl = document.getElementById("humanSymbol");
    this.humanWinsEl = document.getElementById("humanWins");
    this.humanLossesEl = document.getElementById("humanLosses");
    this.computerSymbolEl = document.getElementById("computerSymbol");
    this.computerWinsEl = document.getElementById("computerWins");
    this.computerLossesEl = document.getElementById("computerLosses");
    this.modeToggleContainerEl = document.querySelector(".mode-toggle");
    this.impossibleModeToggle = document.getElementById("impossibleModeSwitch");
    this.modeTipEl = document.getElementById("modeTip");
    this.impossibleMode = Boolean(this.impossibleModeToggle?.checked);

    this.board = new GameBoard();
    this.scores = new ScoreTracker();
    this.human = new Player("You", "X");
    this.computer = new Player("Computer", "O");
    this.currentSymbol = this.human.symbol;
    this.gameOver = false;
    this.winCombo = null;
    this.computerMoveTimeout = null;
    this.modeLocked = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
    this.updateStatus();
    this.renderScores();
    this.syncModeToggleState();
  }

  bindEvents() {
    this.restartBtn.addEventListener("click", () => this.reset(false));
    this.newBtn.addEventListener("click", () => this.reset(true));
    this.chooseXBtn.addEventListener("click", () => this.setPlayerSymbol("X"));
    this.chooseOBtn.addEventListener("click", () => this.setPlayerSymbol("O"));
    if (this.impossibleModeToggle) {
      this.impossibleModeToggle.addEventListener("change", () => {
        if (this.modeLocked) {
          this.impossibleModeToggle.checked = this.impossibleMode;
          this.showModeLockedTip();
          return;
        }
        this.impossibleMode = this.impossibleModeToggle.checked;
        this.updateModeTip();
      });
    }
    if (this.modeToggleContainerEl) {
      this.modeToggleContainerEl.addEventListener("click", (event) => {
        if (!this.modeLocked) return;
        event.preventDefault();
        event.stopPropagation();
        if (this.impossibleModeToggle) {
          this.impossibleModeToggle.checked = this.impossibleMode;
        }
        this.showModeLockedTip();
      });
    }
  }

  setPlayerSymbol(symbol) {
    this.human.setSymbol(symbol);
    this.computer.setSymbol(symbol === "X" ? "O" : "X");
    this.chooseXBtn.classList.toggle("active", symbol === "X");
    this.chooseOBtn.classList.toggle("active", symbol === "O");
    this.reset(true);
  }

  syncModeToggleState() {
    if (!this.impossibleModeToggle) return;
    this.impossibleModeToggle.disabled = this.modeLocked;
    if (this.modeToggleContainerEl) {
      this.modeToggleContainerEl.classList.toggle("locked", this.modeLocked);
    }
    this.updateModeTip();
  }

  updateModeTip() {
    if (!this.modeTipEl) return;
    if (this.modeLocked) {
      this.modeTipEl.textContent =
        "Mode is locked while a game is in progress.";
      return;
    }
    this.modeTipEl.classList.remove("visible");
    this.modeTipEl.textContent = "You can change mode before starting a round.";
  }

  showModeLockedTip() {
    if (!this.modeTipEl) return;
    this.modeTipEl.classList.add("visible");
    this.modeTipEl.textContent =
      "You cannot change mode while a game is in progress.";
  }

  render() {
    const fragment = document.createDocumentFragment();
    this.board.cells.forEach((value, index) => {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (value) {
        cell.textContent = value;
        cell.classList.add(value.toLowerCase(), "disabled");
      }

      if (this.winCombo && this.winCombo.includes(index)) {
        cell.classList.add("win");
      }

      cell.addEventListener("click", () => this.handleHumanMove(index));
      fragment.appendChild(cell);
    });
    this.boardEl.replaceChildren(fragment);
  }

  renderScores() {
    this.humanSymbolEl.textContent = this.human.symbol;
    this.humanWinsEl.textContent = `W ${this.scores.humanWins}`;
    this.humanLossesEl.textContent = `L ${this.scores.humanLosses}`;
    this.computerSymbolEl.textContent = this.computer.symbol;
    this.computerWinsEl.textContent = `W ${this.scores.computerWins}`;
    this.computerLossesEl.textContent = `L ${this.scores.computerLosses}`;
  }

  handleHumanMove(index) {
    if (this.gameOver || this.currentSymbol !== this.human.symbol) return;
    if (!this.board.placeMark(index, this.human.symbol)) return;
    this.modeLocked = true;
    this.syncModeToggleState();

    this.afterMove(this.human);
    if (this.gameOver) return;

    this.currentSymbol = this.computer.symbol;
    this.updateStatus();
    this.queueComputerMove();
  }

  handleComputerMove() {
    if (this.gameOver || this.currentSymbol !== this.computer.symbol) return;

    const empty = this.board.getEmptyCells();
    if (!empty.length) return;


    if (!this.impossibleMode) {
        const randomIndex = empty[Math.floor(Math.random() * empty.length)];
        this.board.placeMark(randomIndex, this.computer.symbol);
    } else {
        const intelligence = new Intelligence(this.board, this.computer.symbol);
        const bestMove = intelligence.getBestMove();
        this.board.placeMark(bestMove, this.computer.symbol);
    }
    this.modeLocked = true;
    this.syncModeToggleState();

    this.afterMove(this.computer);
    if (this.gameOver) return;

    this.currentSymbol = this.human.symbol;
    this.updateStatus();
  }

  afterMove(player) {
    this.winCombo = this.board.getWinningCombo(player.symbol);
    this.render();

    if (this.winCombo) {
      if (player === this.human) {
        this.scores.recordHumanWin();
        this.endGame("You win!");
      } else {
        this.scores.recordComputerWin();
        this.endGame("Computer wins!");
      }
      return;
    }

    if (this.board.isDraw()) {
      this.endGame("It's a draw!");
    }
  }

  endGame(message) {
    this.gameOver = true;
    this.modeLocked = false;
    this.updateStatus(message);
    this.renderScores();
    this.syncModeToggleState();
  }

  updateStatus(message) {
    if (message) {
      this.statusEl.textContent = message;
      return;
    }

    this.statusEl.textContent =
      this.currentSymbol === this.human.symbol
        ? "Your turn"
        : "Computer thinking...";
  }

  reset(randomizeStarter) {
    this.clearComputerMoveTimeout();
    this.board.reset();
    this.gameOver = false;
    this.winCombo = null;
    this.modeLocked = false;

    if (randomizeStarter) {
      this.currentSymbol =
        Math.random() < 0.5 ? this.human.symbol : this.computer.symbol;
    }

    this.render();
    this.updateStatus();
    this.renderScores();
    this.syncModeToggleState();

    if (this.currentSymbol === this.computer.symbol) {
      this.queueComputerMove();
    }
  }

  queueComputerMove() {
    this.clearComputerMoveTimeout();
    this.computerMoveTimeout = setTimeout(() => {
      this.computerMoveTimeout = null;
      this.handleComputerMove();
    }, 400);
  }

  clearComputerMoveTimeout() {
    if (!this.computerMoveTimeout) return;
    clearTimeout(this.computerMoveTimeout);
    this.computerMoveTimeout = null;
  }
}

new TicTacToeApp();
