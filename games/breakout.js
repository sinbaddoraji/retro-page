class BreakoutGame {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Game settings
        this.score = 0;
        this.highScore = localStorage.getItem('breakoutHighScore') || 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.ballLaunched = false;
        
        // Update high score display
        document.getElementById('highScore').textContent = this.highScore;
        
        // Paddle properties
        this.paddleWidth = 100;
        this.paddleHeight = 20;
        this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
        this.paddleY = this.canvas.height - this.paddleHeight - 10;
        this.paddleSpeed = 10;
        
        // Ball properties
        this.ballRadius = 10;
        this.ballX = this.paddleX + this.paddleWidth / 2;
        this.ballY = this.paddleY - this.ballRadius;
        this.ballSpeedX = 5;
        this.ballSpeedY = -5;
        this.initialBallSpeed = 5;
        
        // Brick properties
        this.brickRowCount = 5;
        this.brickColumnCount = 10;
        this.brickWidth = 75;
        this.brickHeight = 20;
        this.brickPadding = 10;
        this.brickOffsetTop = 80;
        this.brickOffsetLeft = 25;
        this.bricks = [];
        
        // Controls
        this.rightPressed = false;
        this.leftPressed = false;
        this.mouseX = 0;
        this.useMouseControl = false;
        
        // Colors
        this.colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        
        // Buttons
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        
        // Initialize game
        this.initializeBricks();
        this.setupEventListeners();
        this.draw();
    }
    
    initializeBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                this.bricks[c][r] = { 
                    x: 0, 
                    y: 0, 
                    status: 1, 
                    color: this.colors[r % this.colors.length] 
                };
            }
        }
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.keyDownHandler.bind(this));
        document.addEventListener('keyup', this.keyUpHandler.bind(this));
        
        // Mouse events
        document.addEventListener('mousemove', this.mouseMoveHandler.bind(this));
        
        // Button events
        this.startButton.addEventListener('click', this.startGame.bind(this));
        this.pauseButton.addEventListener('click', this.togglePause.bind(this));
    }
    
    keyDownHandler(e) {
        if (this.gameOver) return;
        
        switch(e.key) {
            case 'Right':
            case 'ArrowRight':
                this.rightPressed = true;
                this.useMouseControl = false;
                break;
            case 'Left':
            case 'ArrowLeft':
                this.leftPressed = true;
                this.useMouseControl = false;
                break;
            case ' ':
                if (!this.ballLaunched) {
                    this.ballLaunched = true;
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
    
    keyUpHandler(e) {
        switch(e.key) {
            case 'Right':
            case 'ArrowRight':
                this.rightPressed = false;
                break;
            case 'Left':
            case 'ArrowLeft':
                this.leftPressed = false;
                break;
        }
    }
    
    mouseMoveHandler(e) {
        const relativeX = e.clientX - this.canvas.offsetLeft;
        if (relativeX > 0 && relativeX < this.canvas.width) {
            this.mouseX = relativeX;
            this.useMouseControl = true;
        }
    }
    
    startGame() {
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.ballLaunched = false;
        
        // Reset paddle position
        this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
        
        // Reset ball position and speed
        this.ballX = this.paddleX + this.paddleWidth / 2;
        this.ballY = this.paddleY - this.ballRadius;
        this.ballSpeedX = this.initialBallSpeed;
        this.ballSpeedY = -this.initialBallSpeed;
        
        // Reset bricks
        this.initializeBricks();
        
        // Update displays
        this.updateScore();
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        
        // Start game loop
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    togglePause() {
        this.paused = !this.paused;
        if (!this.paused && !this.gameOver && !this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('breakoutHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }
    }
    
    nextLevel() {
        this.level++;
        document.getElementById('level').textContent = this.level;
        
        // Increase difficulty
        this.initialBallSpeed += 1;
        this.ballSpeedX = this.ballSpeedX > 0 ? this.initialBallSpeed : -this.initialBallSpeed;
        this.ballSpeedY = this.ballSpeedY > 0 ? this.initialBallSpeed : -this.initialBallSpeed;
        
        // Reset ball and paddle
        this.ballLaunched = false;
        this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
        this.ballX = this.paddleX + this.paddleWidth / 2;
        this.ballY = this.paddleY - this.ballRadius;
        
        // Reset bricks with more rows in higher levels (max 8)
        this.brickRowCount = Math.min(5 + Math.floor(this.level / 2), 8);
        this.initializeBricks();
    }
    
    checkCollision() {
        // Check ball-paddle collision
        if (this.ballY + this.ballRadius > this.paddleY && 
            this.ballY - this.ballRadius < this.paddleY + this.paddleHeight &&
            this.ballX > this.paddleX && 
            this.ballX < this.paddleX + this.paddleWidth) {
            
            // Calculate where on the paddle the ball hit (normalized from -1 to 1)
            const hitPosition = (this.ballX - (this.paddleX + this.paddleWidth / 2)) / (this.paddleWidth / 2);
            
            // Change ball direction based on where it hit the paddle
            this.ballSpeedY = -Math.abs(this.ballSpeedY); // Always bounce up
            this.ballSpeedX = hitPosition * (this.initialBallSpeed); // Adjust horizontal speed
            
            // Ensure ball doesn't get stuck in paddle
            this.ballY = this.paddleY - this.ballRadius;
        }
        
        // Check ball-brick collision
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                
                if (brick.status === 1) {
                    if (this.ballX + this.ballRadius > brick.x && 
                        this.ballX - this.ballRadius < brick.x + this.brickWidth &&
                        this.ballY + this.ballRadius > brick.y && 
                        this.ballY - this.ballRadius < brick.y + this.brickHeight) {
                        
                        // Determine which side of the brick was hit
                        const centerX = brick.x + this.brickWidth / 2;
                        const centerY = brick.y + this.brickHeight / 2;
                        const dx = this.ballX - centerX;
                        const dy = this.ballY - centerY;
                        
                        // Horizontal collision is stronger (sides of brick)
                        if (Math.abs(dx) > Math.abs(dy) * this.brickWidth / this.brickHeight) {
                            this.ballSpeedX = -this.ballSpeedX;
                        } else { // Vertical collision (top/bottom of brick)
                            this.ballSpeedY = -this.ballSpeedY;
                        }
                        
                        brick.status = 0; // Break the brick
                        this.score += 10 * this.level; // More points in higher levels
                        this.updateScore();
                        
                        // Check if all bricks are broken
                        if (this.checkLevelComplete()) {
                            this.nextLevel();
                        }
                        
                        return; // Only break one brick per frame
                    }
                }
            }
        }
        
        // Check wall collisions
        if (this.ballX + this.ballRadius > this.canvas.width || this.ballX - this.ballRadius < 0) {
            this.ballSpeedX = -this.ballSpeedX;
        }
        
        if (this.ballY - this.ballRadius < 0) {
            this.ballSpeedY = -this.ballSpeedY;
        }
        
        // Check if ball goes out of bounds (bottom)
        if (this.ballY + this.ballRadius > this.canvas.height) {
            this.lives--;
            document.getElementById('lives').textContent = this.lives;
            
            if (this.lives === 0) {
                this.gameOver = true;
            } else {
                // Reset ball and paddle
                this.ballLaunched = false;
                this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
                this.ballX = this.paddleX + this.paddleWidth / 2;
                this.ballY = this.paddleY - this.ballRadius;
                this.ballSpeedX = this.initialBallSpeed;
                this.ballSpeedY = -this.initialBallSpeed;
            }
        }
    }
    
    checkLevelComplete() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    return false;
                }
            }
        }
        return true;
    }
    
    update() {
        // Move paddle with keyboard
        if (!this.useMouseControl) {
            if (this.rightPressed && this.paddleX < this.canvas.width - this.paddleWidth) {
                this.paddleX += this.paddleSpeed;
            } else if (this.leftPressed && this.paddleX > 0) {
                this.paddleX -= this.paddleSpeed;
            }
        } else {
            // Move paddle with mouse
            const paddleCenter = this.mouseX - this.paddleWidth / 2;
            if (paddleCenter > 0 && paddleCenter < this.canvas.width - this.paddleWidth) {
                this.paddleX = paddleCenter;
            }
        }
        
        // If ball is not launched, make it follow the paddle
        if (!this.ballLaunched) {
            this.ballX = this.paddleX + this.paddleWidth / 2;
            return;
        }
        
        // Move ball
        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;
        
        // Check collisions
        this.checkCollision();
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fill();
        this.ctx.closePath();
        
        // Draw paddle
        this.ctx.beginPath();
        this.ctx.rect(this.paddleX, this.paddleY, this.paddleWidth, this.paddleHeight);
        this.ctx.fillStyle = "#00FFFF";
        this.ctx.fill();
        this.ctx.closePath();
        
        // Draw bricks
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                    
                    this.bricks[c][r].x = brickX;
                    this.bricks[c][r].y = brickY;
                    
                    this.ctx.beginPath();
                    this.ctx.rect(brickX, brickY, this.brickWidth, this.brickHeight);
                    this.ctx.fillStyle = this.bricks[c][r].color;
                    this.ctx.fill();
                    this.ctx.closePath();
                }
            }
        }
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.font = "30px 'Press Start 2P'";
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.textAlign = "center";
            this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = "16px 'Press Start 2P'";
            this.ctx.fillText("Press R to restart", this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
        
        // Draw launch instruction
        if (!this.ballLaunched && !this.gameOver) {
            this.ctx.font = "16px 'Press Start 2P'";
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Press SPACE to launch", this.canvas.width / 2, this.canvas.height / 2);
        }
        
        // Draw pause message
        if (this.paused && !this.gameOver) {
            this.ctx.font = "30px 'Press Start 2P'";
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.textAlign = "center";
            this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    gameLoop(timestamp) {
        this.animationFrameId = null;
        
        if (!this.paused && !this.gameOver) {
            this.update();
        }
        
        this.draw();
        
        if (!this.paused && !this.gameOver) {
            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new BreakoutGame();
}); 