class SpaceInvaders {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game settings
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.highScore = localStorage.getItem('spaceInvadersHighScore') || 0;
        
        // Update display
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        
        // Game objects
        this.player = null;
        this.playerBullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.barriers = [];
        this.motherShip = null;
        
        // Game timing
        this.lastTime = 0;
        this.enemyMoveTime = 0;
        this.enemyMoveInterval = 1000; // Time between enemy movements
        this.enemyMoveDirection = 1; // 1 for right, -1 for left
        this.enemyDropAmount = 20; // How far enemies drop when reaching edge
        this.enemyBulletTime = 0;
        this.enemyBulletInterval = 1500; // Time between enemy bullets
        this.motherShipTime = 0;
        this.motherShipInterval = 15000; // Time between mothership appearances
        
        // Control settings
        this.keys = {
            left: false,
            right: false,
            fire: false
        };
        this.fireRate = 500; // Milliseconds between player shots
        this.lastFireTime = 0;
        
        // Initialize game
        this.setupEventListeners();
        this.showMenu();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing') {
                if (e.key === 'ArrowLeft') {
                    this.keys.left = true;
                } else if (e.key === 'ArrowRight') {
                    this.keys.right = true;
                } else if (e.key === ' ') {
                    this.keys.fire = true;
                } else if (e.key === 'p' || e.key === 'P') {
                    this.togglePause();
                }
            } else if (this.gameState === 'paused' && (e.key === 'p' || e.key === 'P')) {
                this.togglePause();
            } else if (this.gameState === 'menu' && e.key === 'Enter') {
                this.startGame();
            } else if (this.gameState === 'gameOver' && e.key === 'Enter') {
                this.startGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') {
                this.keys.left = false;
            } else if (e.key === 'ArrowRight') {
                this.keys.right = false;
            } else if (e.key === ' ') {
                this.keys.fire = false;
            }
        });
        
        // Button controls
        const startButton = document.getElementById('startButton');
        const pauseButton = document.getElementById('pauseButton');
        
        startButton.addEventListener('click', () => {
            if (this.gameState === 'menu' || this.gameState === 'gameOver') {
                this.startGame();
            }
        });
        
        pauseButton.addEventListener('click', () => {
            this.togglePause();
        });
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseButton').textContent = 'Resume';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseButton').textContent = 'Pause';
            this.gameLoop(performance.now());
        }
    }
    
    showMenu() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '40px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SPACE INVADERS', this.width / 2, this.height / 3);
        
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText('Press ENTER or Start Button to Play', this.width / 2, this.height / 2);
        
        this.drawAlien(this.width / 2 - 80, this.height * 2 / 3, 'type1', 40);
        this.drawAlien(this.width / 2, this.height * 2 / 3, 'type2', 40);
        this.drawAlien(this.width / 2 + 80, this.height * 2 / 3, 'type3', 40);
    }
    
    startGame() {
        // Reset game state
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Update display
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        document.getElementById('pauseButton').textContent = 'Pause';
        
        // Initialize game objects
        this.initializeLevel();
        
        // Start game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    initializeLevel() {
        // Clear previous objects
        this.playerBullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.barriers = [];
        this.motherShip = null;
        
        // Create player ship
        this.player = {
            x: this.width / 2 - 25,
            y: this.height - 60,
            width: 50,
            height: 30,
            speed: 5,
            color: '#00ff00'
        };
        
        // Create enemies
        const rows = 5;
        const cols = 11;
        const enemyWidth = 40;
        const enemyHeight = 30;
        const enemyPadding = 10;
        const enemyStartX = (this.width - (cols * (enemyWidth + enemyPadding))) / 2;
        const enemyStartY = 80;
        
        for (let row = 0; row < rows; row++) {
            let type;
            if (row === 0) type = 'type3';
            else if (row < 3) type = 'type2';
            else type = 'type1';
            
            for (let col = 0; col < cols; col++) {
                this.enemies.push({
                    x: enemyStartX + col * (enemyWidth + enemyPadding),
                    y: enemyStartY + row * (enemyHeight + enemyPadding),
                    width: enemyWidth,
                    height: enemyHeight,
                    type: type,
                    alive: true,
                    // Add points based on row (higher rows worth more)
                    points: (rows - row) * 10
                });
            }
        }
        
        // Set enemy movement based on level
        this.enemyMoveInterval = 1000 - (this.level - 1) * 100;
        this.enemyMoveInterval = Math.max(this.enemyMoveInterval, 100); // Min speed
        
        // Create barriers
        const barrierCount = 4;
        const barrierWidth = 80;
        const barrierHeight = 60;
        const barrierY = this.height - 150;
        const barrierPadding = (this.width - (barrierCount * barrierWidth)) / (barrierCount + 1);
        
        for (let i = 0; i < barrierCount; i++) {
            this.barriers.push({
                x: (i + 1) * barrierPadding + i * barrierWidth,
                y: barrierY,
                width: barrierWidth,
                height: barrierHeight,
                health: 100,
                color: '#00ff00'
            });
        }
        
        // Reset timing variables
        this.enemyMoveTime = 0;
        this.enemyMoveDirection = 1;
        this.enemyBulletTime = 0;
        this.motherShipTime = 0;
    }
    
    gameLoop(timestamp) {
        if (this.gameState !== 'playing') return;
        
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Update game objects
        this.updatePlayer(deltaTime, timestamp);
        this.updateBullets(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateBarriers();
        this.updateMotherShip(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Draw game objects
        this.drawObjects();
        
        // Check game over conditions
        this.checkGameStatus();
        
        // Continue game loop
        if (this.gameState === 'playing') {
            requestAnimationFrame(this.gameLoop.bind(this));
        } else if (this.gameState === 'gameOver') {
            this.showGameOver();
        }
    }
    
    updatePlayer(deltaTime, timestamp) {
        if (this.keys.left && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys.right && this.player.x + this.player.width < this.width) {
            this.player.x += this.player.speed;
        }
        
        // Handle firing
        if (this.keys.fire && timestamp - this.lastFireTime > this.fireRate) {
            this.playerBullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 15,
                speed: 7,
                color: '#00ff00'
            });
            this.lastFireTime = timestamp;
        }
    }
    
    updateBullets(deltaTime) {
        // Update player bullets
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            this.playerBullets[i].y -= this.playerBullets[i].speed;
            
            // Remove bullets that go offscreen
            if (this.playerBullets[i].y + this.playerBullets[i].height < 0) {
                this.playerBullets.splice(i, 1);
            }
        }
        
        // Update enemy bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            this.enemyBullets[i].y += this.enemyBullets[i].speed;
            
            // Remove bullets that go offscreen
            if (this.enemyBullets[i].y > this.height) {
                this.enemyBullets.splice(i, 1);
            }
        }
        
        // Enemy firing logic
        this.enemyBulletTime += deltaTime;
        if (this.enemyBulletTime > this.enemyBulletInterval) {
            this.enemyBulletTime = 0;
            
            // Find alive enemies and have a random one shoot
            const aliveEnemies = this.enemies.filter(enemy => enemy.alive);
            if (aliveEnemies.length > 0) {
                const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                this.enemyBullets.push({
                    x: randomEnemy.x + randomEnemy.width / 2 - 2,
                    y: randomEnemy.y + randomEnemy.height,
                    width: 4,
                    height: 15,
                    speed: 5,
                    color: '#ff0000'
                });
            }
        }
    }
    
    updateEnemies(deltaTime) {
        this.enemyMoveTime += deltaTime;
        
        if (this.enemyMoveTime > this.enemyMoveInterval) {
            this.enemyMoveTime = 0;
            
            let moveDown = false;
            
            // Check if any enemy will hit the edge
            for (const enemy of this.enemies) {
                if (!enemy.alive) continue;
                
                if ((this.enemyMoveDirection === 1 && enemy.x + enemy.width + 10 > this.width) ||
                    (this.enemyMoveDirection === -1 && enemy.x - 10 < 0)) {
                    moveDown = true;
                    break;
                }
            }
            
            // Move enemies
            for (const enemy of this.enemies) {
                if (!enemy.alive) continue;
                
                if (moveDown) {
                    enemy.y += this.enemyDropAmount;
                } else {
                    enemy.x += this.enemyMoveDirection * 10;
                }
            }
            
            // Change direction if needed
            if (moveDown) {
                this.enemyMoveDirection *= -1;
            }
        }
    }
    
    updateBarriers() {
        // Barriers don't need to be updated every frame, their state changes only with collisions
    }
    
    updateMotherShip(deltaTime) {
        this.motherShipTime += deltaTime;
        
        // Spawn mothership periodically
        if (this.motherShipTime > this.motherShipInterval && !this.motherShip) {
            this.motherShipTime = 0;
            
            // Randomly spawn from left or right
            const fromRight = Math.random() > 0.5;
            
            this.motherShip = {
                x: fromRight ? this.width : -60,
                y: 40,
                width: 60,
                height: 30,
                speed: fromRight ? -2 : 2,
                points: 100,
                color: '#ff0000'
            };
        }
        
        // Update mothership position
        if (this.motherShip) {
            this.motherShip.x += this.motherShip.speed;
            
            // Remove if off screen
            if ((this.motherShip.speed > 0 && this.motherShip.x > this.width) ||
                (this.motherShip.speed < 0 && this.motherShip.x + this.motherShip.width < 0)) {
                this.motherShip = null;
            }
        }
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            
            // Check against enemies
            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j];
                if (!enemy.alive) continue;
                
                if (this.checkCollision(bullet, enemy)) {
                    // Mark enemy as dead
                    enemy.alive = false;
                    
                    // Add to score
                    this.score += enemy.points;
                    document.getElementById('score').textContent = this.score;
                    
                    // Update high score if needed
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('spaceInvadersHighScore', this.highScore);
                        document.getElementById('highScore').textContent = this.highScore;
                    }
                    
                    // Remove bullet
                    this.playerBullets.splice(i, 1);
                    break;
                }
            }
            
            // Check against mothership
            if (this.motherShip && this.checkCollision(bullet, this.motherShip)) {
                // Add to score
                this.score += this.motherShip.points;
                document.getElementById('score').textContent = this.score;
                
                // Update high score if needed
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('spaceInvadersHighScore', this.highScore);
                    document.getElementById('highScore').textContent = this.highScore;
                }
                
                // Remove mothership and bullet
                this.motherShip = null;
                this.playerBullets.splice(i, 1);
            }
            
            // Check against barriers
            for (let j = 0; j < this.barriers.length; j++) {
                const barrier = this.barriers[j];
                
                if (this.checkCollision(bullet, barrier)) {
                    // Damage barrier
                    barrier.health -= 10;
                    
                    // Remove bullet
                    this.playerBullets.splice(i, 1);
                    break;
                }
            }
        }
        
        // Enemy bullets vs player
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            // Check against player
            if (this.checkCollision(bullet, this.player)) {
                // Lose a life
                this.lives--;
                document.getElementById('lives').textContent = this.lives;
                
                // Remove bullet
                this.enemyBullets.splice(i, 1);
                
                // Reset player position
                this.player.x = this.width / 2 - 25;
                
                // Break to avoid multiple hits in the same frame
                break;
            }
            
            // Check against barriers
            for (let j = 0; j < this.barriers.length; j++) {
                const barrier = this.barriers[j];
                
                if (this.checkCollision(bullet, barrier)) {
                    // Damage barrier
                    barrier.health -= 10;
                    
                    // Remove bullet
                    this.enemyBullets.splice(i, 1);
                    break;
                }
            }
        }
        
        // Enemies vs barriers (collision damage)
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            for (const barrier of this.barriers) {
                if (this.checkCollision(enemy, barrier)) {
                    // Destroy barrier completely if enemy reaches it
                    barrier.health = 0;
                }
            }
        }
        
        // Enemies vs player (collision damage)
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (this.checkCollision(enemy, this.player)) {
                // Instant game over if enemies reach player
                this.lives = 0;
            }
        }
    }
    
    checkCollision(objA, objB) {
        return (
            objA.x < objB.x + objB.width &&
            objA.x + objA.width > objB.x &&
            objA.y < objB.y + objB.height &&
            objA.y + objA.height > objB.y
        );
    }
    
    checkGameStatus() {
        // Check if all enemies are dead
        if (this.enemies.every(enemy => !enemy.alive)) {
            // Level complete
            this.level++;
            document.getElementById('level').textContent = this.level;
            this.initializeLevel();
        }
        
        // Check if player is out of lives
        if (this.lives <= 0) {
            this.gameState = 'gameOver';
        }
        
        // Check if enemies have reached bottom
        const bottomEnemy = this.enemies.find(enemy => enemy.alive && enemy.y + enemy.height > this.player.y);
        if (bottomEnemy) {
            this.gameState = 'gameOver';
        }
    }
    
    drawObjects() {
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw player details (to make it look like a ship)
        this.ctx.fillRect(this.player.x + this.player.width / 2 - 3, 
                          this.player.y - 10, 
                          6, 
                          10);
        
        // Draw player bullets
        for (const bullet of this.playerBullets) {
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        
        // Draw enemy bullets
        for (const bullet of this.enemyBullets) {
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            if (enemy.alive) {
                this.drawAlien(enemy.x, enemy.y, enemy.type, enemy.width);
            }
        }
        
        // Draw mothership
        if (this.motherShip) {
            this.drawMotherShip(this.motherShip.x, this.motherShip.y, this.motherShip.width, this.motherShip.height);
        }
        
        // Draw barriers
        for (const barrier of this.barriers) {
            if (barrier.health > 0) {
                // Set opacity based on health
                const opacity = barrier.health / 100;
                this.ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
                
                // Draw main barrier shape
                this.drawBarrier(barrier.x, barrier.y, barrier.width, barrier.height);
            }
        }
        
        // Draw score, lives, etc.
        // (We're updating the DOM elements directly instead)
    }
    
    drawAlien(x, y, type, size) {
        this.ctx.fillStyle = '#00ff00';
        
        switch (type) {
            case 'type1': // Bottom row aliens (simplest shape)
                // Draw body
                this.ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
                // Draw legs
                this.ctx.fillRect(x, y + size * 0.7, size * 0.2, size * 0.3);
                this.ctx.fillRect(x + size * 0.8, y + size * 0.7, size * 0.2, size * 0.3);
                // Draw antennae
                this.ctx.fillRect(x + size * 0.3, y, size * 0.1, size * 0.2);
                this.ctx.fillRect(x + size * 0.6, y, size * 0.1, size * 0.2);
                break;
                
            case 'type2': // Middle row aliens
                // Draw head
                this.ctx.fillRect(x + size * 0.25, y + size * 0.1, size * 0.5, size * 0.3);
                // Draw body
                this.ctx.fillRect(x + size * 0.1, y + size * 0.4, size * 0.8, size * 0.3);
                // Draw legs
                this.ctx.fillRect(x, y + size * 0.7, size * 0.2, size * 0.3);
                this.ctx.fillRect(x + size * 0.8, y + size * 0.7, size * 0.2, size * 0.3);
                // Draw eyes
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(x + size * 0.35, y + size * 0.2, size * 0.1, size * 0.1);
                this.ctx.fillRect(x + size * 0.55, y + size * 0.2, size * 0.1, size * 0.1);
                this.ctx.fillStyle = '#00ff00'; // Reset color
                break;
                
            case 'type3': // Top row aliens (most complex)
                // Draw saucer shape
                this.ctx.beginPath();
                this.ctx.ellipse(
                    x + size / 2, 
                    y + size / 2, 
                    size / 2, 
                    size / 3, 
                    0, 
                    0, 
                    Math.PI * 2
                );
                this.ctx.fill();
                
                // Draw dome
                this.ctx.beginPath();
                this.ctx.arc(
                    x + size / 2,
                    y + size / 3,
                    size / 4,
                    0,
                    Math.PI,
                    true
                );
                this.ctx.fill();
                
                // Draw "lights"
                this.ctx.fillStyle = '#000';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(
                        x + size * (0.3 + i * 0.2),
                        y + size * 0.6,
                        size * 0.1,
                        size * 0.1
                    );
                }
                this.ctx.fillStyle = '#00ff00'; // Reset color
                break;
        }
    }
    
    drawMotherShip(x, y, width, height) {
        this.ctx.fillStyle = '#ff0000';
        
        // Draw main saucer body
        this.ctx.beginPath();
        this.ctx.ellipse(
            x + width / 2,
            y + height / 2,
            width / 2,
            height / 3,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw dome
        this.ctx.beginPath();
        this.ctx.arc(
            x + width / 2,
            y + height / 2,
            height / 4,
            0,
            Math.PI,
            true
        );
        this.ctx.fill();
        
        // Draw lights
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < 4; i++) {
            this.ctx.fillRect(
                x + width * (0.2 + i * 0.2),
                y + height * 0.7,
                width * 0.05,
                height * 0.1
            );
        }
    }
    
    drawBarrier(x, y, width, height) {
        // Draw main shape
        this.ctx.fillRect(x, y, width, height / 2);
        
        // Draw left leg
        this.ctx.fillRect(x, y + height / 2, width / 3, height / 2);
        
        // Draw right leg
        this.ctx.fillRect(x + width * 2/3, y + height / 2, width / 3, height / 2);
        
        // Draw arch cutout (to match classic space invaders barriers)
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(
            x + width / 2,
            y + height / 2,
            width / 4,
            0,
            Math.PI,
            false
        );
        this.ctx.fill();
        this.ctx.fillStyle = '#00ff00'; // Reset fill color
    }
    
    showGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = '40px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 3);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2);
        
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText('Press ENTER or Start Button to Play Again', this.width / 2, this.height * 2/3);
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new SpaceInvaders();
}); 