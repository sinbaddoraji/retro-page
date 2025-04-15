class PacMan extends GameEngine {
    constructor() {
        super('gameCanvas', {
            width: 800,
            height: 600,
            fps: 60
        });
        
        this.input = new InputHandler();
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        
        // Maze dimensions
        this.cellSize = 20;
        this.mazeWidth = Math.floor(this.canvas.width / this.cellSize);
        this.mazeHeight = Math.floor(this.canvas.height / this.cellSize);
        
        // Initialize game objects
        this.pacman = {
            x: 1,
            y: 1,
            direction: 'right',
            nextDirection: 'right',
            mouthOpen: true,
            mouthAngle: 0.2,
            speed: 1
        };
        
        this.ghosts = [
            { x: 10, y: 10, color: '#ff0000', direction: 'right', speed: 0.5 }, // Red
            { x: 15, y: 10, color: '#00ffff', direction: 'left', speed: 0.5 },  // Cyan
            { x: 10, y: 15, color: '#ff00ff', direction: 'up', speed: 0.5 },    // Pink
            { x: 15, y: 15, color: '#ffa500', direction: 'down', speed: 0.5 }   // Orange
        ];
        
        this.dots = [];
        this.powerPellets = [];
        
        this.initializeMaze();
        this.setupEventListeners();
        
        // Start the game in menu state
        this.render();
    }
    
    initializeMaze() {
        // Simple maze layout (1 = wall, 0 = path, 2 = dot, 3 = power pellet)
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,2,1],
            [1,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,1],
            [1,2,1,2,1,1,2,1,1,1,1,1,2,1,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,2,1],
            [1,2,1,2,1,2,2,2,2,2,2,2,2,2,1,2,1,2,2,1],
            [1,2,1,2,1,1,1,1,2,1,1,1,1,1,1,2,1,2,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        // Initialize dots and power pellets
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                if (this.maze[y][x] === 2) {
                    this.dots.push({ x, y });
                } else if (this.maze[y][x] === 3) {
                    this.powerPellets.push({ x, y });
                }
            }
        }
    }
    
    setupEventListeners() {
        const startButton = document.getElementById('startButton');
        const pauseButton = document.getElementById('pauseButton');
        
        startButton.addEventListener('click', () => {
            if (this.gameState === 'menu' || this.gameState === 'gameOver') {
                this.resetGame();
                this.gameState = 'playing';
                this.start();
                startButton.textContent = 'Restart Game';
            } else if (this.gameState === 'playing') {
                this.resetGame();
                this.gameState = 'playing';
            }
        });
        
        pauseButton.addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.pause();
                this.gameState = 'paused';
                pauseButton.textContent = 'Resume';
            } else if (this.gameState === 'paused') {
                this.resume();
                this.gameState = 'playing';
                pauseButton.textContent = 'Pause';
            }
        });
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing') {
                switch(e.key) {
                    case 'ArrowUp':
                        this.pacman.nextDirection = 'up';
                        break;
                    case 'ArrowDown':
                        this.pacman.nextDirection = 'down';
                        break;
                    case 'ArrowLeft':
                        this.pacman.nextDirection = 'left';
                        break;
                    case 'ArrowRight':
                        this.pacman.nextDirection = 'right';
                        break;
                }
            }
        });
    }
    
    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.pacman = {
            x: 1,
            y: 1,
            direction: 'right',
            nextDirection: 'right',
            mouthOpen: true,
            mouthAngle: 0.2,
            speed: 1
        };
        this.initializeMaze();
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update Pac-Man
        this.updatePacman(deltaTime);
        
        // Update ghosts
        this.updateGhosts(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Check win condition
        if (this.dots.length === 0 && this.powerPellets.length === 0) {
            this.level++;
            this.initializeMaze();
        }
    }
    
    updatePacman(deltaTime) {
        // Animate mouth
        this.pacman.mouthAngle += 0.1;
        if (this.pacman.mouthAngle > 0.2) {
            this.pacman.mouthOpen = !this.pacman.mouthOpen;
            this.pacman.mouthAngle = 0;
        }
        
        // Try to change direction
        if (this.canMove(this.pacman.nextDirection)) {
            this.pacman.direction = this.pacman.nextDirection;
        }
        
        // Move in current direction
        if (this.canMove(this.pacman.direction)) {
            const moveAmount = this.pacman.speed * (deltaTime / 16.67); // Normalize to 60fps
            switch(this.pacman.direction) {
                case 'up':
                    this.pacman.y -= moveAmount;
                    break;
                case 'down':
                    this.pacman.y += moveAmount;
                    break;
                case 'left':
                    this.pacman.x -= moveAmount;
                    break;
                case 'right':
                    this.pacman.x += moveAmount;
                    break;
            }
            
            // Snap to grid when close to center of cell
            const cellX = Math.round(this.pacman.x);
            const cellY = Math.round(this.pacman.y);
            if (Math.abs(this.pacman.x - cellX) < 0.1 && Math.abs(this.pacman.y - cellY) < 0.1) {
                this.pacman.x = cellX;
                this.pacman.y = cellY;
            }
        }
        
        // Check for dots and power pellets
        this.checkCollectibles();
    }
    
    updateGhosts(deltaTime) {
        this.ghosts.forEach(ghost => {
            // Update vulnerability timer if ghost is vulnerable
            if (ghost.vulnerable && ghost.vulnerableTimer) {
                ghost.vulnerableTimer -= deltaTime;
                if (ghost.vulnerableTimer <= 0) {
                    ghost.vulnerable = false;
                    ghost.vulnerableTimer = 0;
                }
            }
            
            // Only update ghost position on whole number positions for better grid alignment
            if (Math.abs(ghost.x - Math.round(ghost.x)) < 0.1 && Math.abs(ghost.y - Math.round(ghost.y)) < 0.1) {
                ghost.x = Math.round(ghost.x);
                ghost.y = Math.round(ghost.y);
                
                // Ghost AI: Determine next direction
                let newDirection;
                
                if (ghost.vulnerable) {
                    // When vulnerable, try to move away from pacman
                    const dx = ghost.x - this.pacman.x;
                    const dy = ghost.y - this.pacman.y;
                    
                    if (Math.abs(dx) > Math.abs(dy)) {
                        newDirection = dx > 0 ? 'right' : 'left';
                        if (!this.canMove(newDirection, ghost.x, ghost.y)) {
                            newDirection = dy > 0 ? 'down' : 'up';
                        }
                    } else {
                        newDirection = dy > 0 ? 'down' : 'up';
                        if (!this.canMove(newDirection, ghost.x, ghost.y)) {
                            newDirection = dx > 0 ? 'right' : 'left';
                        }
                    }
                    
                    // If still can't move, pick a random valid direction
                    if (!this.canMove(newDirection, ghost.x, ghost.y)) {
                        const possibleDirections = ['up', 'down', 'left', 'right'];
                        const validDirections = possibleDirections.filter(dir => 
                            this.canMove(dir, ghost.x, ghost.y) && 
                            dir !== this.getOppositeDirection(ghost.direction)
                        );
                        if (validDirections.length > 0) {
                            newDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
                        }
                    }
                } else {
                    // Normal behavior: Try to chase pacman
                    const dx = this.pacman.x - ghost.x;
                    const dy = this.pacman.y - ghost.y;
                    
                    // Prefer horizontal or vertical based on distance
                    if (Math.abs(dx) > Math.abs(dy)) {
                        newDirection = dx > 0 ? 'right' : 'left';
                        if (!this.canMove(newDirection, ghost.x, ghost.y)) {
                            newDirection = dy > 0 ? 'down' : 'up';
                        }
                    } else {
                        newDirection = dy > 0 ? 'down' : 'up';
                        if (!this.canMove(newDirection, ghost.x, ghost.y)) {
                            newDirection = dx > 0 ? 'right' : 'left';
                        }
                    }
                    
                    // If still can't move, avoid going back if possible
                    if (!this.canMove(newDirection, ghost.x, ghost.y)) {
                        const possibleDirections = ['up', 'down', 'left', 'right'];
                        const validDirections = possibleDirections.filter(dir => 
                            this.canMove(dir, ghost.x, ghost.y) && 
                            dir !== this.getOppositeDirection(ghost.direction)
                        );
                        
                        if (validDirections.length > 0) {
                            newDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
                        } else {
                            // If no options, allow reversing
                            const allValidDirections = possibleDirections.filter(dir => 
                                this.canMove(dir, ghost.x, ghost.y)
                            );
                            if (allValidDirections.length > 0) {
                                newDirection = allValidDirections[Math.floor(Math.random() * allValidDirections.length)];
                            }
                        }
                    }
                }
                
                if (newDirection && this.canMove(newDirection, ghost.x, ghost.y)) {
                    ghost.direction = newDirection;
                }
            }
            
            // Move ghost in current direction
            const moveAmount = ghost.speed * (deltaTime / 16.67); // Normalize to 60fps
            switch(ghost.direction) {
                case 'up':
                    ghost.y -= moveAmount;
                    break;
                case 'down':
                    ghost.y += moveAmount;
                    break;
                case 'left':
                    ghost.x -= moveAmount;
                    break;
                case 'right':
                    ghost.x += moveAmount;
                    break;
            }
        });
    }
    
    canMove(direction, x = this.pacman.x, y = this.pacman.y) {
        let newX = x;
        let newY = y;
        
        switch(direction) {
            case 'up':
                newY--;
                break;
            case 'down':
                newY++;
                break;
            case 'left':
                newX--;
                break;
            case 'right':
                newX++;
                break;
        }
        
        return this.maze[newY] && this.maze[newY][newX] !== 1;
    }
    
    checkCollectibles() {
        // Convert pacman position to grid cell
        const pacmanCellX = Math.round(this.pacman.x);
        const pacmanCellY = Math.round(this.pacman.y);
        
        // Check for dots
        for (let i = this.dots.length - 1; i >= 0; i--) {
            const dot = this.dots[i];
            if (dot.x === pacmanCellX && dot.y === pacmanCellY) {
                this.dots.splice(i, 1);
                this.score += 10;
                document.getElementById('score').textContent = this.score;
                break;
            }
        }
        
        // Check for power pellets
        for (let i = this.powerPellets.length - 1; i >= 0; i--) {
            const pellet = this.powerPellets[i];
            if (pellet.x === pacmanCellX && pellet.y === pacmanCellY) {
                this.powerPellets.splice(i, 1);
                this.score += 50;
                
                // Make ghosts vulnerable
                this.ghosts.forEach(ghost => {
                    ghost.vulnerable = true;
                    ghost.vulnerableTimer = 10000; // 10 seconds of vulnerability
                });
                
                document.getElementById('score').textContent = this.score;
                break;
            }
        }
    }
    
    checkCollisions() {
        // Convert pacman position to grid cell
        const pacmanCellX = Math.round(this.pacman.x);
        const pacmanCellY = Math.round(this.pacman.y);
        
        // Check collision with ghosts
        for (let i = 0; i < this.ghosts.length; i++) {
            const ghost = this.ghosts[i];
            const ghostCellX = Math.round(ghost.x);
            const ghostCellY = Math.round(ghost.y);
            
            // If pacman and ghost are in the same cell or very close
            if (Math.abs(pacmanCellX - ghostCellX) < 0.5 && 
                Math.abs(pacmanCellY - ghostCellY) < 0.5) {
                
                if (ghost.vulnerable) {
                    // Eat the ghost
                    ghost.x = 10 + i;
                    ghost.y = 10;
                    ghost.vulnerable = false;
                    this.score += 200;
                    document.getElementById('score').textContent = this.score;
                } else {
                    // Pacman dies
                    this.lives--;
                    document.getElementById('lives').textContent = this.lives;
                    
                    if (this.lives <= 0) {
                        this.gameState = 'gameOver';
                        this.pause();
                    } else {
                        // Reset positions
                        this.pacman.x = 1;
                        this.pacman.y = 1;
                        this.pacman.direction = 'right';
                        this.pacman.nextDirection = 'right';
                        
                        this.ghosts.forEach((ghost, index) => {
                            ghost.x = 10 + index % 2 * 5;
                            ghost.y = 10 + Math.floor(index / 2) * 5;
                        });
                    }
                }
            }
        }
    }
    
    getOppositeDirection(direction) {
        switch(direction) {
            case 'up': return 'down';
            case 'down': return 'up';
            case 'left': return 'right';
            case 'right': return 'left';
            default: return direction;
        }
    }
    
    render() {
        this.clear();
        
        // Draw maze
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                if (this.maze[y][x] === 1) {
                    this.drawRect(
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize,
                        '#0000ff'
                    );
                }
            }
        }
        
        // Draw dots
        this.dots.forEach(dot => {
            this.drawCircle(
                dot.x * this.cellSize + this.cellSize / 2,
                dot.y * this.cellSize + this.cellSize / 2,
                2,
                '#fff'
            );
        });
        
        // Draw power pellets
        this.powerPellets.forEach(pellet => {
            this.drawCircle(
                pellet.x * this.cellSize + this.cellSize / 2,
                pellet.y * this.cellSize + this.cellSize / 2,
                5,
                '#fff'
            );
        });
        
        // Draw Pac-Man
        this.drawPacman();
        
        // Draw ghosts
        this.ghosts.forEach(ghost => {
            this.drawGhost(ghost);
        });
        
        // Draw game state
        if (this.gameState === 'menu') {
            this.drawText('PAC-MAN', this.canvas.width / 2, this.canvas.height / 2 - 50, '#ff0', 32);
            this.drawText('Press Start', this.canvas.width / 2, this.canvas.height / 2 + 50, '#fff', 16);
        } else if (this.gameState === 'gameOver') {
            this.drawText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2, '#f00', 32);
            this.drawText('Press Start', this.canvas.width / 2, this.canvas.height / 2 + 50, '#fff', 16);
        } else if (this.gameState === 'paused') {
            this.drawText('PAUSED', this.canvas.width / 2, this.canvas.height / 2, '#fff', 32);
        }
    }
    
    drawPacman() {
        const x = this.pacman.x * this.cellSize + this.cellSize / 2;
        const y = this.pacman.y * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize / 2;
        
        this.ctx.fillStyle = '#ff0';
        this.ctx.beginPath();
        
        let startAngle, endAngle;
        switch(this.pacman.direction) {
            case 'right':
                startAngle = this.pacman.mouthOpen ? 0.2 : 0;
                endAngle = this.pacman.mouthOpen ? 1.8 * Math.PI : 2 * Math.PI;
                break;
            case 'left':
                startAngle = this.pacman.mouthOpen ? Math.PI + 0.2 : Math.PI;
                endAngle = this.pacman.mouthOpen ? Math.PI * 2.8 : Math.PI * 3;
                break;
            case 'up':
                startAngle = this.pacman.mouthOpen ? Math.PI * 1.5 + 0.2 : Math.PI * 1.5;
                endAngle = this.pacman.mouthOpen ? Math.PI * 3.3 : Math.PI * 3.5;
                break;
            case 'down':
                startAngle = this.pacman.mouthOpen ? Math.PI * 0.5 + 0.2 : Math.PI * 0.5;
                endAngle = this.pacman.mouthOpen ? Math.PI * 2.3 : Math.PI * 2.5;
                break;
        }
        
        this.ctx.arc(x, y, radius, startAngle, endAngle);
        this.ctx.lineTo(x, y);
        this.ctx.fill();
    }
    
    drawGhost(ghost) {
        const x = ghost.x * this.cellSize;
        const y = ghost.y * this.cellSize;
        const radius = this.cellSize / 2;
        
        // Draw ghost body
        this.ctx.fillStyle = ghost.vulnerable ? '#0000FF' : ghost.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, Math.PI, 0, false);
        this.ctx.lineTo(x + radius, y + radius);
        
        // Draw ghost "feet"
        const feetWidth = radius / 2;
        for (let i = 0; i < 3; i++) {
            this.ctx.lineTo(x + radius - (i * feetWidth), y + (i % 2 === 0 ? radius / 2 : radius));
        }
        
        this.ctx.lineTo(x - radius, y + radius);
        this.ctx.lineTo(x - radius, y);
        this.ctx.fill();
        
        // Draw eyes
        const eyeRadius = radius / 4;
        const eyeOffsetX = radius / 3;
        const eyeOffsetY = -radius / 4;
        
        // White part of eyes
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(x - eyeOffsetX, y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pupils - look in direction of movement
        this.ctx.fillStyle = '#000000';
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        
        switch(ghost.direction) {
            case 'up':
                pupilOffsetY = -eyeRadius / 2;
                break;
            case 'down':
                pupilOffsetY = eyeRadius / 2;
                break;
            case 'left':
                pupilOffsetX = -eyeRadius / 2;
                break;
            case 'right':
                pupilOffsetX = eyeRadius / 2;
                break;
        }
        
        // Left eye pupil
        this.ctx.beginPath();
        this.ctx.arc(x - eyeOffsetX + pupilOffsetX, y + eyeOffsetY + pupilOffsetY, eyeRadius / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right eye pupil
        this.ctx.beginPath();
        this.ctx.arc(x + eyeOffsetX + pupilOffsetX, y + eyeOffsetY + pupilOffsetY, eyeRadius / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // If vulnerable, draw "scared" mouth
        if (ghost.vulnerable) {
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x - radius / 2, y + radius / 3);
            this.ctx.lineTo(x - radius / 4, y + radius / 2);
            this.ctx.lineTo(x, y + radius / 3);
            this.ctx.lineTo(x + radius / 4, y + radius / 2);
            this.ctx.lineTo(x + radius / 2, y + radius / 3);
            this.ctx.stroke();
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new PacMan();
}); 