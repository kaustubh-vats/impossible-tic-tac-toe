function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element as T;
}

class Player {
  name: string;
  symbol: string;

  constructor(name: string, symbol: string) {
    this.name = name;
    this.symbol = symbol;
  }

  setSymbol(symbol: string): void {
    this.symbol = symbol;
  }
}

class GameBoard {
  winningCombos: number[][];
  cells: Array<string | null>;

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

  reset(): void {
    this.cells = Array(9).fill(null);
  }

  placeMark(index: number, symbol: string): boolean {
    if (this.cells[index]) return false;
    this.cells[index] = symbol;
    return true;
  }

  resetMark(index: number): boolean {
    if (!this.cells[index]) return false;
    this.cells[index] = null;
    return true;
  }

  getEmptyCells(): number[] {
    return this.cells
      .map((value, index) => (value === null ? index : null))
      .filter((value): value is number => value !== null);
  }

  getWinningCombo(symbol: string): number[] | null {
    return (
      this.winningCombos.find((combo) =>
        combo.every((index) => this.cells[index] === symbol),
      ) || null
    );
  }

  hasWinner(symbol: string): boolean {
    return Boolean(this.getWinningCombo(symbol));
  }

  isDraw(): boolean {
    return this.cells.every(Boolean);
  }

  getCells(): Array<string | null> {
    return this.cells;
  }
}

class ScoreTracker {
  humanWins: number;
  humanLosses: number;
  computerWins: number;
  computerLosses: number;

  constructor() {
    this.humanWins = 0;
    this.humanLosses = 0;
    this.computerWins = 0;
    this.computerLosses = 0;
  }

  recordHumanWin(): void {
    this.humanWins += 1;
    this.computerLosses += 1;
  }

  recordComputerWin(): void {
    this.computerWins += 1;
    this.humanLosses += 1;
  }
}

class Intelligence {
  board: GameBoard;
  symbol: string;
  alternateSymbol: string;

  constructor(board: GameBoard, symbol: string) {
    this.board = board;
    this.symbol = symbol;
    this.alternateSymbol = symbol === "X" ? "O" : "X";
  }

  minMax(board: GameBoard, depth: number, isMaxim: boolean): number {
    if (board.hasWinner(this.symbol)) {
      return 10 - depth;
    }
    if (board.hasWinner(this.alternateSymbol)) {
      return -10 - depth;
    }
    if (board.isDraw()) {
      return 0;
    }

    const cells = board.getCells();
    let bestScore = isMaxim ? -Infinity : Infinity;
    const currentSymbol = isMaxim ? this.symbol : this.alternateSymbol;

    for (let i = 0; i < cells.length; i += 1) {
      if (!cells[i]) {
        board.placeMark(i, currentSymbol);
        const score = this.minMax(board, depth + 1, !isMaxim);
        bestScore = isMaxim
          ? Math.max(score, bestScore)
          : Math.min(score, bestScore);
        board.resetMark(i);
      }
    }
    return bestScore;
  }

  getBestMove(): number {
    const cells = this.board.getCells();
    let bestMove = -1;
    let maxScore = -Infinity;

    for (let i = 0; i < cells.length; i += 1) {
      if (!cells[i]) {
        this.board.placeMark(i, this.symbol);
        const score = this.minMax(this.board, 1, false);
        if (score > maxScore) {
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
  boardEl: HTMLElement;
  statusEl: HTMLElement;
  restartBtn: HTMLButtonElement;
  newBtn: HTMLButtonElement;
  chooseXBtn: HTMLButtonElement;
  chooseOBtn: HTMLButtonElement;
  humanSymbolEl: HTMLElement;
  humanWinsEl: HTMLElement;
  humanLossesEl: HTMLElement;
  computerSymbolEl: HTMLElement;
  computerWinsEl: HTMLElement;
  computerLossesEl: HTMLElement;
  modeToggleContainerEl: HTMLElement | null;
  impossibleModeToggle: HTMLInputElement;
  modeTipEl: HTMLElement;
  impossibleMode: boolean;

  board: GameBoard;
  scores: ScoreTracker;
  human: Player;
  computer: Player;
  currentSymbol: string;
  gameOver: boolean;
  winCombo: number[] | null;
  computerMoveTimeout: ReturnType<typeof setTimeout> | null;
  modeLocked: boolean;

  constructor() {
    this.boardEl = getRequiredElement<HTMLElement>("board");
    this.statusEl = getRequiredElement<HTMLElement>("status");
    this.restartBtn = getRequiredElement<HTMLButtonElement>("restartBtn");
    this.newBtn = getRequiredElement<HTMLButtonElement>("newGameBtn");
    this.chooseXBtn = getRequiredElement<HTMLButtonElement>("chooseX");
    this.chooseOBtn = getRequiredElement<HTMLButtonElement>("chooseO");
    this.humanSymbolEl = getRequiredElement<HTMLElement>("humanSymbol");
    this.humanWinsEl = getRequiredElement<HTMLElement>("humanWins");
    this.humanLossesEl = getRequiredElement<HTMLElement>("humanLosses");
    this.computerSymbolEl = getRequiredElement<HTMLElement>("computerSymbol");
    this.computerWinsEl = getRequiredElement<HTMLElement>("computerWins");
    this.computerLossesEl = getRequiredElement<HTMLElement>("computerLosses");
    this.modeToggleContainerEl = document.querySelector(".mode-toggle");
    this.impossibleModeToggle =
      getRequiredElement<HTMLInputElement>("impossibleModeSwitch");
    this.modeTipEl = getRequiredElement<HTMLElement>("modeTip");
    this.impossibleMode = this.impossibleModeToggle.checked;

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

  init(): void {
    this.bindEvents();
    this.render();
    this.updateStatus();
    this.renderScores();
    this.syncModeToggleState();
  }

  bindEvents(): void {
    this.restartBtn.addEventListener("click", () => this.reset(false));
    this.newBtn.addEventListener("click", () => this.reset(true));
    this.chooseXBtn.addEventListener("click", () => this.setPlayerSymbol("X"));
    this.chooseOBtn.addEventListener("click", () => this.setPlayerSymbol("O"));

    this.impossibleModeToggle.addEventListener("change", () => {
      if (this.modeLocked) {
        this.impossibleModeToggle.checked = this.impossibleMode;
        this.showModeLockedTip();
        return;
      }
      this.impossibleMode = this.impossibleModeToggle.checked;
      this.updateModeTip();
    });

    if (this.modeToggleContainerEl) {
      this.modeToggleContainerEl.addEventListener("click", (event: Event) => {
        if (!this.modeLocked) return;
        event.preventDefault();
        event.stopPropagation();
        this.impossibleModeToggle.checked = this.impossibleMode;
        this.showModeLockedTip();
      });
    }
  }

  setPlayerSymbol(symbol: string): void {
    this.human.setSymbol(symbol);
    this.computer.setSymbol(symbol === "X" ? "O" : "X");
    this.chooseXBtn.classList.toggle("active", symbol === "X");
    this.chooseOBtn.classList.toggle("active", symbol === "O");
    this.reset(true);
  }

  syncModeToggleState(): void {
    this.impossibleModeToggle.disabled = this.modeLocked;
    if (this.modeToggleContainerEl) {
      this.modeToggleContainerEl.classList.toggle("locked", this.modeLocked);
    }
    this.updateModeTip();
  }

  updateModeTip(): void {
    if (this.modeLocked) {
      this.modeTipEl.textContent = "Mode is locked while a game is in progress.";
      return;
    }
    this.modeTipEl.classList.remove("visible");
    this.modeTipEl.textContent = "You can change mode before starting a round.";
  }

  showModeLockedTip(): void {
    this.modeTipEl.classList.add("visible");
    this.modeTipEl.textContent =
      "You cannot change mode while a game is in progress.";
  }

  render(): void {
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

  renderScores(): void {
    this.humanSymbolEl.textContent = this.human.symbol;
    this.humanWinsEl.textContent = `W ${this.scores.humanWins}`;
    this.humanLossesEl.textContent = `L ${this.scores.humanLosses}`;
    this.computerSymbolEl.textContent = this.computer.symbol;
    this.computerWinsEl.textContent = `W ${this.scores.computerWins}`;
    this.computerLossesEl.textContent = `L ${this.scores.computerLosses}`;
  }

  handleHumanMove(index: number): void {
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

  handleComputerMove(): void {
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

  afterMove(player: Player): void {
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

  endGame(message: string): void {
    this.gameOver = true;
    this.modeLocked = false;
    this.updateStatus(message);
    this.renderScores();
    this.syncModeToggleState();
  }

  updateStatus(message?: string): void {
    if (message) {
      this.statusEl.textContent = message;
      return;
    }

    this.statusEl.textContent =
      this.currentSymbol === this.human.symbol
        ? "Your turn"
        : "Computer thinking...";
  }

  reset(randomizeStarter: boolean): void {
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

  queueComputerMove(): void {
    this.clearComputerMoveTimeout();
    this.computerMoveTimeout = setTimeout(() => {
      this.computerMoveTimeout = null;
      this.handleComputerMove();
    }, 400);
  }

  clearComputerMoveTimeout(): void {
    if (!this.computerMoveTimeout) return;
    clearTimeout(this.computerMoveTimeout);
    this.computerMoveTimeout = null;
  }
}

new TicTacToeApp();
