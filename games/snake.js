class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        // Game settings
        this.tileSize = 20;
        this.tileCount = this.canvas.width / this.tileSize;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        
        // Update high score display
        document.getElementById('highScore').textContent = this.highScore;
        
        // Snake properties
        this.snake = [
            { x: 10, y: 10 }
        ];
        this.velocity = { x: 0, y: 0 };
        this.foodPosition = { x: 5, y: 5 };
        
        // Game state
        this.gameOver = false;
        this.paused = false;
        
        // Controls
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        
        // Event listeners
        this.setupEventListeners();
        
        // Colors
        this.snakeColor = '#00ff00';
        this.foodColor = '#ff0000';
        this.gridColor = '#333333';
        
        // Game speed
        this.speed = 10;
        this.lastTime = 0;
        
        // Start the game
        this.startGame();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Button controls
        this.startButton.addEventListener('click', this.startGame.bind(this));
        this.pauseButton.addEventListener('click', this.togglePause.bind(this));
    }
    
    handleKeyPress(e) {
        // Prevent reversing direction
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (this.velocity.y !== 1) {
                    this.velocity = { x: 0, y: -1 };
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (this.velocity.y !== -1) {
                    this.velocity = { x: 0, y: 1 };
                }
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (this.velocity.x !== 1) {
                    this.velocity = { x: -1, y: 0 };
                }
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (this.velocity.x !== -1) {
                    this.velocity = { x: 1, y: 0 };
                }
                break;
            case 'p':
            case 'P':
                this.togglePause();
                break;
            case 'r':
            case 'R':
                this.startGame();
                break;
        }
    }
    
    startGame() {
        // Reset snake
        this.snake = [{ x: 10, y: 10 }];
        this.velocity = { x: 0, y: 0 };
        
        // Reset score
        this.score = 0;
        document.getElementById('score').textContent = this.score;
        
        // Place food
        this.placeFood();
        
        // Reset game state
        this.gameOver = false;
        this.paused = false;
        
        // Start game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    placeFood() {
        // Randomly place food where snake isn't
        let validPosition = false;
        let newFoodPosition;
        
        while (!validPosition) {
            newFoodPosition = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            
            validPosition = true;
            
            // Check if food is on snake
            for (let segment of this.snake) {
                if (segment.x === newFoodPosition.x && segment.y === newFoodPosition.y) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        this.foodPosition = newFoodPosition;
    }
    
    checkCollision() {
        const head = this.snake[0];
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        // Check self collision (starting from the 4th segment)
        for (let i = 4; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    moveSnake() {
        // Don't move if no velocity
        if (this.velocity.x === 0 && this.velocity.y === 0) {
            return;
        }
        
        // Create new head based on velocity
        const head = { 
            x: this.snake[0].x + this.velocity.x,
            y: this.snake[0].y + this.velocity.y
        };
        
        // Add new head to beginning of snake
        this.snake.unshift(head);
        
        // Check if snake ate food
        if (head.x === this.foodPosition.x && head.y === this.foodPosition.y) {
            // Increase score
            this.score += 10;
            document.getElementById('score').textContent = this.score;
            
            // Update high score if needed
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
                document.getElementById('highScore').textContent = this.highScore;
            }
            
            // Place new food
            this.placeFood();
        } else {
            // Remove tail if didn't eat
            this.snake.pop();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.canvas.width, i * this.tileSize);
            this.ctx.stroke();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw snake
        this.ctx.fillStyle = this.snakeColor;
        for (let segment of this.snake) {
            this.ctx.fillRect(
                segment.x * this.tileSize,
                segment.y * this.tileSize,
                this.tileSize - 1,
                this.tileSize - 1
            );
        }
        
        // Draw food
        this.ctx.fillStyle = this.foodColor;
        this.ctx.fillRect(
            this.foodPosition.x * this.tileSize,
            this.foodPosition.y * this.tileSize,
            this.tileSize - 1,
            this.tileSize - 1
        );
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '14px "Press Start 2P"';
            this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
        
        // Draw pause message
        if (this.paused && !this.gameOver) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    gameLoop(timestamp) {
        if (this.gameOver || this.paused) {
            this.draw();
            return;
        }
        
        // Calculate time since last frame
        const elapsed = timestamp - this.lastTime;
        
        // Move snake based on speed
        if (elapsed > 1000 / this.speed) {
            this.lastTime = timestamp;
            
            this.moveSnake();
            
            // Check collision
            if (this.checkCollision()) {
                this.gameOver = true;
            }
        }
        
        // Draw the game
        this.draw();
        
        // Continue game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new SnakeGame();
}); 