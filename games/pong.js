class PongGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resizeCanvas();
        
        // Game objects
        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            radius: Math.min(this.width, this.height) * 0.01, // Responsive ball size
            speed: 5,
            dx: 5,
            dy: 5
        };
        
        this.paddle = {
            width: Math.min(this.width, this.height) * 0.015, // Responsive paddle width
            height: Math.min(this.width, this.height) * 0.15, // Responsive paddle height
            x: this.width * 0.05, // 5% from left edge
            y: this.height / 2 - (Math.min(this.width, this.height) * 0.15) / 2,
            speed: 8
        };
        
        this.computerPaddle = {
            width: Math.min(this.width, this.height) * 0.015,
            height: Math.min(this.width, this.height) * 0.15,
            x: this.width * 0.95 - Math.min(this.width, this.height) * 0.015, // 5% from right edge
            y: this.height / 2 - (Math.min(this.width, this.height) * 0.15) / 2,
            speed: 5
        };
        
        // Game state
        this.playerScore = 0;
        this.computerScore = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        
        // Input handling
        this.keys = {
            up: false,
            down: false
        };
        
        // Adjust computer paddle difficulty settings
        this.computerReactionDelay = 0;
        this.maxReactionDelay = 0.15; // Reduced from 0.3 to make it more responsive
        this.reactionDelayTimer = 0;
        
        // Reduce error margin to make computer more accurate
        this.computerErrorMargin = 0.1; // Reduced from 0.2 to 0.1
        
        // Add difficulty scaling based on score difference
        this.difficultyMultiplier = 1;
        
        // Add prediction for ball movement
        this.predictionSteps = 3; // Number of steps to predict ball movement
        
        // Bind methods
        this.update = this.update.bind(this);
        this.draw = this.draw.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        // Add event listeners
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('resize', this.handleResize);
    }
    
    resizeCanvas() {
        // Set canvas size to match container
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    handleResize() {
        this.resizeCanvas();
        // Reset game objects with new dimensions
        this.ball.radius = Math.min(this.width, this.height) * 0.01;
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        
        this.paddle.width = Math.min(this.width, this.height) * 0.015;
        this.paddle.height = Math.min(this.width, this.height) * 0.15;
        this.paddle.x = this.width * 0.05;
        this.paddle.y = this.height / 2 - this.paddle.height / 2;
        
        this.computerPaddle.width = Math.min(this.width, this.height) * 0.015;
        this.computerPaddle.height = Math.min(this.width, this.height) * 0.15;
        this.computerPaddle.x = this.width * 0.95 - this.computerPaddle.width;
        this.computerPaddle.y = this.height / 2 - this.computerPaddle.height / 2;
    }
    
    handleKeyDown(e) {
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') this.keys.up = true;
        if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') this.keys.down = true;
    }
    
    handleKeyUp(e) {
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') this.keys.up = false;
        if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') this.keys.down = false;
    }
    
    start() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gamePaused = false;
            this.update();
        }
    }
    
    pause() {
        this.gamePaused = !this.gamePaused;
        if (!this.gamePaused) {
            this.update();
        }
    }
    
    reset() {
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        this.ball.dx = 5;
        this.ball.dy = 5;
        this.paddle.y = this.height / 2 - this.paddle.height / 2;
        this.computerPaddle.y = this.height / 2 - this.computerPaddle.height / 2;
        
        // Reset computer reaction delay
        this.reactionDelayTimer = 0;
        this.computerReactionDelay = Math.random() * this.maxReactionDelay / this.difficultyMultiplier;
    }
    
    predictBallPosition() {
        let predictedX = this.ball.x;
        let predictedY = this.ball.y;
        let predictedDx = this.ball.dx;
        let predictedDy = this.ball.dy;
        
        for (let i = 0; i < this.predictionSteps; i++) {
            predictedX += predictedDx;
            predictedY += predictedDy;
            
            // Simulate wall bounces
            if (predictedY < 0 || predictedY > this.height) {
                predictedDy *= -1;
            }
        }
        
        return { x: predictedX, y: predictedY };
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // Move player paddle
        if (this.keys.up && this.paddle.y > 0) {
            this.paddle.y -= this.paddle.speed;
        }
        if (this.keys.down && this.paddle.y < this.height - this.paddle.height) {
            this.paddle.y += this.paddle.speed;
        }
        
        // Update difficulty based on score difference
        const scoreDiff = this.computerScore - this.playerScore;
        this.difficultyMultiplier = 1 + Math.max(0, scoreDiff) * 0.1; // Increase difficulty when computer is ahead
        
        // Move computer paddle with improved AI
        this.reactionDelayTimer += 1/60;
        
        if (this.reactionDelayTimer >= this.computerReactionDelay) {
            const computerPaddleCenter = this.computerPaddle.y + this.computerPaddle.height / 2;
            
            // Predict ball position
            const predictedBall = this.predictBallPosition();
            
            // Calculate target position with error margin and difficulty scaling
            const targetY = predictedBall.y + 
                (Math.random() - 0.5) * this.computerPaddle.height * this.computerErrorMargin / this.difficultyMultiplier;
            
            // Adjust paddle speed based on difficulty
            const adjustedSpeed = this.computerPaddle.speed * this.difficultyMultiplier;
            
            if (computerPaddleCenter < targetY - 35) {
                this.computerPaddle.y += adjustedSpeed;
            } else if (computerPaddleCenter > targetY + 35) {
                this.computerPaddle.y -= adjustedSpeed;
            }
            
            // Reset delay timer and set new random delay
            this.reactionDelayTimer = 0;
            this.computerReactionDelay = Math.random() * this.maxReactionDelay / this.difficultyMultiplier;
        }
        
        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Ball collision with top and bottom
        if (this.ball.y + this.ball.radius > this.height || this.ball.y - this.ball.radius < 0) {
            this.ball.dy *= -1;
        }
        
        // Ball collision with paddles
        if (this.ball.dx < 0) {
            // Player paddle collision
            if (this.ball.x - this.ball.radius < this.paddle.x + this.paddle.width &&
                this.ball.y > this.paddle.y &&
                this.ball.y < this.paddle.y + this.paddle.height) {
                this.ball.dx *= -1;
                this.ball.dx += 0.5; // Increase speed
                this.ball.dy += (this.ball.y - (this.paddle.y + this.paddle.height / 2)) * 0.1;
            }
        } else {
            // Computer paddle collision
            if (this.ball.x + this.ball.radius > this.computerPaddle.x &&
                this.ball.y > this.computerPaddle.y &&
                this.ball.y < this.computerPaddle.y + this.computerPaddle.height) {
                this.ball.dx *= -1;
                this.ball.dx -= 0.5; // Increase speed
                this.ball.dy += (this.ball.y - (this.computerPaddle.y + this.computerPaddle.height / 2)) * 0.1;
            }
        }
        
        // Score points
        if (this.ball.x - this.ball.radius < 0) {
            this.computerScore++;
            this.reset();
        } else if (this.ball.x + this.ball.radius > this.width) {
            this.playerScore++;
            this.reset();
        }
        
        // Update score display
        document.getElementById('playerScore').textContent = this.playerScore;
        document.getElementById('computerScore').textContent = this.computerScore;
        
        this.draw();
        requestAnimationFrame(this.update);
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw center line
        this.ctx.strokeStyle = '#fff';
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw ball
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw paddles
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        this.ctx.fillRect(this.computerPaddle.x, this.computerPaddle.y, this.computerPaddle.width, this.computerPaddle.height);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new PongGame(canvas);
    
    // Add event listeners to buttons
    document.getElementById('startButton').addEventListener('click', () => game.start());
    document.getElementById('pauseButton').addEventListener('click', () => game.pause());
}); 