// 游戏配置
const BOARD_SIZE = 8;
const FRUITS = ['🍎', '🍊', '🍇', '🍓', '🍌', '🥝'];
const TARGET_SCORE = 1000;
const MAX_MOVES = 30;

// 游戏状态
let board = [];
let score = 0;
let moves = MAX_MOVES;
let selectedCell = null;
let isProcessing = false;
let gameState = 'start';

// DOM元素
const gameBoard = document.getElementById('gameBoard');
const scoreElement = document.getElementById('score');
const movesElement = document.getElementById('moves');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const finalScoreElement = document.getElementById('final-score');

// 初始化游戏
function initGame() {
    board = [];
    score = 0;
    moves = MAX_MOVES;
    selectedCell = null;
    isProcessing = false;
    
    // 创建初始棋盘（确保没有预存在的匹配）
    do {
        createBoard();
    } while (findMatches().length > 0);
    
    renderBoard();
    updateUI();
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameState = 'playing';
}

// 创建棋盘
function createBoard() {
    board = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            board[row][col] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        }
    }
}

// 渲染棋盘
function renderBoard() {
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'fruit';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.textContent = board[row][col];
            
            if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                cell.classList.add('selected');
            }
            
            cell.addEventListener('click', () => handleCellClick(row, col));
            gameBoard.appendChild(cell);
        }
    }
}

// 处理点击
function handleCellClick(row, col) {
    if (isProcessing || gameState !== 'playing') return;
    
    if (!selectedCell) {
        // 选择第一个水果
        selectedCell = { row, col };
        renderBoard();
        return;
    }
    
    // 检查是否点击同一个水果（取消选择）
    if (selectedCell.row === row && selectedCell.col === col) {
        selectedCell = null;
        renderBoard();
        return;
    }
    
    // 检查是否相邻
    const rowDiff = Math.abs(selectedCell.row - row);
    const colDiff = Math.abs(selectedCell.col - col);
    
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // 交换水果
        swapFruits(selectedCell, { row, col });
    } else {
        // 选择新的水果
        selectedCell = { row, col };
        renderBoard();
    }
}

// 交换水果
async function swapFruits(cell1, cell2) {
    isProcessing = true;
    selectedCell = null;
    
    // 交换
    const temp = board[cell1.row][cell1.col];
    board[cell1.row][cell1.col] = board[cell2.row][cell2.col];
    board[cell2.row][cell2.col] = temp;
    
    renderBoard();
    await wait(200);
    
    // 检查是否有匹配
    const matches = findMatches();
    
    if (matches.length > 0) {
        // 有效移动
        moves--;
        updateUI();
        await processMatches();
        
        // 检查游戏结束
        if (score >= TARGET_SCORE) {
            gameWin();
        } else if (moves <= 0) {
            gameOver();
        }
    } else {
        // 无效移动，交换回来
        await wait(200);
        const temp = board[cell1.row][cell1.col];
        board[cell1.row][cell1.col] = board[cell2.row][cell2.col];
        board[cell2.row][cell2.col] = temp;
        renderBoard();
    }
    
    isProcessing = false;
}

// 查找匹配
function findMatches() {
    const matches = [];
    const visited = new Set();
    
    // 检查横向匹配
    for (let row = 0; row < BOARD_SIZE; row++) {
        let count = 1;
        for (let col = 1; col < BOARD_SIZE; col++) {
            if (board[row][col] === board[row][col - 1]) {
                count++;
            } else {
                if (count >= 3) {
                    for (let i = col - count; i < col; i++) {
                        matches.push({ row, col: i });
                    }
                }
                count = 1;
            }
        }
        if (count >= 3) {
            for (let i = BOARD_SIZE - count; i < BOARD_SIZE; i++) {
                matches.push({ row, col: i });
            }
        }
    }
    
    // 检查纵向匹配
    for (let col = 0; col < BOARD_SIZE; col++) {
        let count = 1;
        for (let row = 1; row < BOARD_SIZE; row++) {
            if (board[row][col] === board[row - 1][col]) {
                count++;
            } else {
                if (count >= 3) {
                    for (let i = row - count; i < row; i++) {
                        if (!matches.some(m => m.row === i && m.col === col)) {
                            matches.push({ row: i, col });
                        }
                    }
                }
                count = 1;
            }
        }
        if (count >= 3) {
            for (let i = BOARD_SIZE - count; i < BOARD_SIZE; i++) {
                if (!matches.some(m => m.row === i && m.col === col)) {
                    matches.push({ row: i, col });
                }
            }
        }
    }
    
    return matches;
}

// 处理匹配
async function processMatches() {
    let combo = 0;
    
    while (true) {
        const matches = findMatches();
        if (matches.length === 0) break;
        
        combo++;
        
        // 计算得分
        const baseScore = matches.length * 10;
        const comboBonus = (combo - 1) * 20;
        const roundScore = baseScore + comboBonus;
        score += roundScore;
        
        // 显示连击
        if (combo > 1) {
            showCombo(combo);
        }
        
        // 显示得分飘字
        if (matches.length > 0) {
            const firstMatch = matches[0];
            const cell = document.querySelector(`[data-row="${firstMatch.row}"][data-col="${firstMatch.col}"]`);
            if (cell) {
                showScorePopup(cell, roundScore);
            }
        }
        
        // 标记匹配的水果
        matches.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) cell.classList.add('matched');
        });
        
        await wait(400);
        
        // 消除水果
        matches.forEach(({ row, col }) => {
            board[row][col] = null;
        });
        
        renderBoard();
        await wait(200);
        
        // 下落
        dropFruits();
        renderBoard();
        await wait(300);
        
        // 填充新水果
        fillEmptyCells();
        renderBoard();
        await wait(300);
    }
    
    updateUI();
}

// 水果下落
function dropFruits() {
    for (let col = 0; col < BOARD_SIZE; col++) {
        let emptyRow = BOARD_SIZE - 1;
        
        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
            if (board[row][col] !== null) {
                if (row !== emptyRow) {
                    board[emptyRow][col] = board[row][col];
                    board[row][col] = null;
                }
                emptyRow--;
            }
        }
    }
}

// 填充空位
function fillEmptyCells() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                board[row][col] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
            }
        }
    }
}

// 显示得分飘字
function showScorePopup(element, points) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${points}`;
    
    const rect = element.getBoundingClientRect();
    const containerRect = gameBoard.getBoundingClientRect();
    
    popup.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top - containerRect.top}px`;
    
    gameBoard.appendChild(popup);
    
    setTimeout(() => popup.remove(), 1000);
}

// 显示连击
function showCombo(combo) {
    const comboText = document.createElement('div');
    comboText.className = 'combo-text';
    comboText.textContent = `${combo}连击!`;
    gameBoard.appendChild(comboText);
    
    setTimeout(() => comboText.remove(), 1000);
}

// 更新UI
function updateUI() {
    scoreElement.textContent = score;
    movesElement.textContent = moves;
    
    if (moves <= 5) {
        movesElement.style.color = '#FF6B6B';
    } else {
        movesElement.style.color = '#fff';
    }
}

// 游戏胜利
function gameWin() {
    gameState = 'won';
    resultTitle.textContent = '🎉 恭喜通关！';
    resultTitle.style.color = '#4CAF50';
    resultMessage.textContent = '太棒了！你在步数用完前达成了目标！';
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// 游戏结束
function gameOver() {
    gameState = 'lost';
    if (score >= TARGET_SCORE) {
        gameWin();
        return;
    }
    
    resultTitle.textContent = '💔 游戏结束';
    resultTitle.style.color = '#FF6B6B';
    resultMessage.textContent = '步数用完了，再接再厉！';
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// 工具函数
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 事件监听
document.getElementById('start-btn').addEventListener('click', initGame);
document.getElementById('restart-btn').addEventListener('click', initGame);

// 初始渲染（显示空棋盘）
renderBoard();
