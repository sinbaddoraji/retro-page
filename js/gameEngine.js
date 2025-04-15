class GameEngine {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.options = {
            width: 800,
            height: 600,
            fps: 60,
            ...options
        };
        
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        
        this.gameLoop = this.gameLoop.bind(this);
        this.lastTime = 0;
        this.accumulator = 0;
        this.timestep = 1000 / this.options.fps;
        
        this.isRunning = false;
        this.isPaused = false;
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    stop() {
        this.isRunning = false;
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
    }
    
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        if (!this.isPaused) {
            this.accumulator += deltaTime;
            
            while (this.accumulator >= this.timestep) {
                this.update(this.timestep);
                this.accumulator -= this.timestep;
            }
            
            this.render();
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    // To be implemented by child classes
    update(deltaTime) {
        throw new Error('update() must be implemented by child class');
    }
    
    // To be implemented by child classes
    render() {
        throw new Error('render() must be implemented by child class');
    }
    
    // Helper methods
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }
    
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawText(text, x, y, color = '#fff', fontSize = 20, font = 'Arial') {
        this.ctx.fillStyle = color;
        this.ctx.font = `${fontSize}px ${font}`;
        this.ctx.fillText(text, x, y);
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
} 