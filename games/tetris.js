class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextPieceCanvas = document.getElementById('nextPieceCanvas');
        this.nextPieceCtx = this.nextPieceCanvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 300;
        this.canvas.height = 600;
        this.nextPieceCanvas.width = 100;
        this.nextPieceCanvas.height = 100;
        
        // Game settings
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.score = 0;
        this.highScore = localStorage.getItem('tetrisHighScore') || 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        
        // Game board
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        
        // Tetrominoes
        this.tetrominoes = [
            [[1, 1, 1, 1]], // I
            [[1, 1], [1, 1]], // O
            [[1, 1, 1], [0, 1, 0]], // T
            [[1, 1, 1], [1, 0, 0]], // L
            [[1, 1, 1], [0, 0, 1]], // J
            [[1, 1, 0], [0, 1, 1]], // S
            [[0, 1, 1], [1, 1, 0]]  // Z
        ];
        
        // Colors for tetrominoes
        this.colors = [
            '#00f0f0', // I - Cyan
            '#f0f000', // O - Yellow
            '#a000f0', // T - Purple
            '#f0a000', // L - Orange
            '#0000f0', // J - Blue
            '#00f000', // S - Green
            '#f00000'  // Z - Red
        ];
        
        // Current and next piece
        this.currentPiece = this.newPiece();
        this.nextPiece = this.newPiece();
        
        // Game speed
        this.speed = 1000;
        this.lastTime = 0;
        this.dropCounter = 0;
        
        // Controls
        this.keys = {
            left: false,
            right: false,
            down: false,
            rotate: false
        };
        
        // Event listeners
        this.setupEventListeners();
        
        // Start game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    newPiece() {
        const randomIndex = Math.floor(Math.random() * this.tetrominoes.length);
        return {
            shape: this.tetrominoes[randomIndex],
            color: this.colors[randomIndex],
            x: Math.floor(this.cols / 2) - Math.floor(this.tetrominoes[randomIndex][0].length / 2),
            y: 0
        };
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'ArrowDown':
                    this.keys.down = true;
                    break;
                case 'ArrowUp':
                    this.keys.rotate = true;
                    break;
                case ' ':
                    this.hardDrop();
                    break;
                case 'p':
                    this.togglePause();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'ArrowDown':
                    this.keys.down = false;
                    break;
                case 'ArrowUp':
                    this.keys.rotate = false;
                    break;
            }
        });
    }
    
    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    hardDrop() {
        while (!this.collision()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        this.merge();
        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.newPiece();
        this.drawNextPiece();
    }
    
    collision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x] === 0) continue;
                
                const newX = this.currentPiece.x + x;
                const newY = this.currentPiece.y + y;
                
                if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                    return true;
                }
                
                if (newY >= 0 && this.board[newY][newX]) {
                    return true;
                }
            }
        }
        return false;
    }
    
    merge() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x] === 0) continue;
                
                const newX = this.currentPiece.x + x;
                const newY = this.currentPiece.y + y;
                
                if (newY >= 0) {
                    this.board[newY][newX] = this.currentPiece.color;
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.speed = Math.max(100, 1000 - (this.level - 1) * 100);
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('tetrisHighScore', this.highScore);
            }
            
            this.updateScore();
        }
    }
    
    updateScore() {
        document.querySelector('.score').textContent = `Score: ${this.score}`;
        document.querySelector('.high-score').textContent = `High Score: ${this.highScore}`;
        document.querySelector('.level').textContent = `Level: ${this.level}`;
        document.querySelector('.lines').textContent = `Lines: ${this.lines}`;
    }
    
    rotate() {
        const originalShape = this.currentPiece.shape;
        const rows = originalShape.length;
        const cols = originalShape[0].length;
        
        // Create a new rotated shape
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = originalShape[y][x];
            }
        }
        
        // Store original position
        const originalX = this.currentPiece.x;
        const originalY = this.currentPiece.y;
        
        // Try the rotation
        this.currentPiece.shape = rotated;
        
        // If there's a collision, try wall kicks
        if (this.collision()) {
            this.currentPiece.x -= 1;
            if (this.collision()) {
                this.currentPiece.x += 2;
                if (this.collision()) {
                    this.currentPiece.x -= 1;
                    this.currentPiece.y -= 1;
                    if (this.collision()) {
                        // If all wall kicks fail, revert the rotation
                        this.currentPiece.shape = originalShape;
                        this.currentPiece.x = originalX;
                        this.currentPiece.y = originalY;
                    }
                }
            }
        }
    }
    
    drawNextPiece() {
        this.nextPieceCtx.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        
        const blockSize = 20;
        const offsetX = (this.nextPieceCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (this.nextPieceCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x]) {
                    this.nextPieceCtx.fillStyle = this.nextPiece.color;
                    this.nextPieceCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            }
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(
                        x * this.blockSize,
                        y * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                }
            }
        }
        
        // Draw current piece
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.ctx.fillStyle = this.currentPiece.color;
                    this.ctx.fillRect(
                        (this.currentPiece.x + x) * this.blockSize,
                        (this.currentPiece.y + y) * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                }
            }
        }
    }
    
    gameLoop(time = 0) {
        if (this.gameOver || this.paused) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.speed) {
            this.currentPiece.y++;
            if (this.collision()) {
                this.currentPiece.y--;
                this.merge();
                this.clearLines();
                this.currentPiece = this.nextPiece;
                this.nextPiece = this.newPiece();
                this.drawNextPiece();
                
                if (this.collision()) {
                    this.gameOver = true;
                    alert('Game Over!');
                    return;
                }
            }
            this.dropCounter = 0;
        }
        
        // Handle movement
        if (this.keys.left) {
            this.currentPiece.x--;
            if (this.collision()) {
                this.currentPiece.x++;
            }
        }
        
        if (this.keys.right) {
            this.currentPiece.x++;
            if (this.collision()) {
                this.currentPiece.x--;
            }
        }
        
        if (this.keys.down) {
            this.currentPiece.y++;
            if (this.collision()) {
                this.currentPiece.y--;
            }
        }
        
        if (this.keys.rotate) {
            this.rotate();
            this.keys.rotate = false;
        }
        
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Tetris();
}); 