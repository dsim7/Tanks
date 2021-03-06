
let Tank = require('./tank');
let Enemy = require('./enemy');
let Bullet = require('./bullet');

class Model {
    constructor(io) {
      this.io = io;
  
      this.clients = {};
      this.tanks = [undefined, undefined];
      this.bullets = [];
      this.enemies = [];
      this.life = 5;
      this.score = 0;
      this.gamerunning = true;
      this.gameover = false;
      this.enemiesSpawning = false;
      this.enemiesSpawnTimer;
  
      // Start server work: updating the game state
      this.fps = 40;
      setInterval(() => {
        if (this.gamerunning) {
          this.updateTanks();
          this.updateEnemies();
          this.updateBullets();
        }
        if (this.gameover) {
          this.io.emit('gameover', '');
        }
        if (this.io !== undefined) {
          this.io.emit('update', {
            life : this.life,
            score: this.score,
            tanks : this.tanks,
            bullets : this.bullets,
            enemies : this.enemies,
            clients : this.clients
          });
        }
      }, 1000/this.fps);
  
      // On server connection, initialize socket
      this.io.on("connection", (socket) => {
        console.log("user " + socket.id + " connected");
        
        // on new user connect
        socket.on('new user', (user) => {
          let username = user.name.toUpperCase();
          this.clients[socket.id] = { };
          let client = this.clients[socket.id];
          client.username = username;
          if (this.tanks[0] === undefined) {
            console.log("initializing player 1 " + user.id);
            this.tanks[0] = new Tank(socket.id, (Model.canvas_width / 2), (Model.canvas_height - Tank.height), user.id);
            client.tank = this.tanks[0];
            client.tank.username = username;
          } else if (this.tanks[1] === undefined) {
            console.log("initializing player 2 " + user.id);
            this.tanks[1] = new Tank(socket.id, (Model.canvas_width / 2), Tank.height, user.id);
            client.tank = this.tanks[1];
            client.tank.username = username;
          }
        
          console.log(this.tanks);
          console.log(this.clients);  
  
          socket.emit('welcome', 'Welcome ' + socket.id);
        });
        
        // on game reset
        socket.on('gamereset', (msg) => {
          if (this.clients[socket.id] != null && this.clients[socket.id].tank !== undefined) {
            this.resetGame();
            this.enemiesSpawning = false;
          }
        });
  
        // on game start`
        socket.on('gamestart', (msg) => {
          if (this.clients[socket.id] != null && this.clients[socket.id].tank !== undefined) {
            this.resetGame();
  
            if (this.enemiesSpawnTimer !== undefined) {
              clearTimeout(this.enemiesSpawnTimer);
            }
  
            this.enemiesSpawning = true;
            this.spawnEnemy();
            let spawnEnemiesLoop = () => {
              let minInterval = 500;
              let maxInterval = 4000;
              let randTimeInterval = Math.round(Math.random() * maxInterval + minInterval);
              this.enemiesSpawnTimer = setTimeout(() => {
                      if (this.enemiesSpawning) {
                        this.spawnEnemy();
                        spawnEnemiesLoop();
                      } 
              }, randTimeInterval);
            }
            spawnEnemiesLoop();
          }
        });
  
        // on moving
        socket.on('move', (msg) => {
          if (this.clients[socket.id] !== undefined) {
            let movingTank = this.clients[socket.id].tank
            if (movingTank !== undefined) {
              if (msg === 'sl') {
                movingTank.left = 0;
              } else if (msg === 'sr') {
                movingTank.right = 0;
              } else if (msg === 'l') {
                movingTank.left = 1;
              } else if (msg === 'r') {
                movingTank.right = 1;
              }
            }
          }
        });
  
        // on firing
        socket.on('fire', (mouse) => {
          if (this.clients[socket.id] !== undefined) {
            let firingTank = this.clients[socket.id].tank;
            if (firingTank != null) {
              if (firingTank.canShoot) {
                let angle = Math.atan2(mouse.y - firingTank.y, mouse.x - firingTank.x);
                this.bullets.push(new Bullet(firingTank.x, firingTank.y, angle));
                firingTank.canShoot = false;
              }
            }
          }
        });
  
        // on player disconnect
        socket.on('disconnect', () => {
          console.log("user " + socket.id + " disconnected ");
          delete this.clients[socket.id];
          if (this.tanks[0] !== undefined && this.tanks[0].id === socket.id) {
            this.tanks[0] = undefined;
          } else if (this.tanks[1] !== undefined && this.tanks[1].id === socket.id) {
            this.tanks[1] = undefined;
          }
          
          console.log(this.tanks);
          console.log(this.clients);
        });
      });
    }
  
    // reset game state
    resetGame() {
      this.gameover = false;
      this.gamerunning = true;
      this.life = 5;
      this.score = 0;
      this.enemies.length = 0;
      this.bullets.length = 0;
    
      for (let i = 0; i < this.tanks.length; i++) {
        let tank = this.tanks[i];
        if (tank) {
          tank.x = Model.canvas_width / 2;
          tank.left = 0;
          tank.right = 0; 
        }
      }
    
      this.io.emit('gamereset', '');
    }
    
    // set gameover state
    gameOver() {
      this.gameover = true;
      this.gamerunning = false;
      this.enemiesSpawning = false;

      let scoreObj = { score : this.score }
      if (this.tanks[0] !== undefined) {
        scoreObj.user1 = this.tanks[0].userID;
        console.log(this.tanks[0].userID);
      }
      if (this.tanks[1] !== undefined) {
        scoreObj.user2 = this.tanks[1].userID;
        console.log(this.tanks[1].userID);
      }
      this.io.emit('score', scoreObj);
    }
    
    // spawn enemy
    spawnEnemy() {
      this.enemies.push(new Enemy(Math.round(Math.random() * (Model.canvas_height - (Enemy.height * 4)) + Enemy.height * 2)));
    }
  
    // update tanks states
    updateTanks() {
      for (let i = 0; i < this.tanks.length; i++) {
        let tank = this.tanks[i];
        if (tank != null) {
          tank.move();
          if (!tank.canShoot) {
            tank.currentShootCD += 1;
            if (tank.currentShootCD > tank.shootCooldown) {
              tank.canShoot = true;
              tank.currentShootCD = 0;
            }
          }
        }
      }
    }
    
    // update bullets states
    updateBullets() {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        let bullet = this.bullets[i];
        bullet.move();
    
        bullet.lifeTime -= 100;
        if (bullet.lifeTime < bullet.burstTime) {
          bullet.burst = true;
        }
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          let enemy = this.enemies[j];
          if (enemy !== undefined && bullet.detectCollision(enemy)) {
            enemy.life -= bullet.damage;
            bullet.lifeTime = bullet.burstTime;
            bullet.burst = true;
            break;
          }
        }
        if (bullet.lifeTime <= 0) {
          this.bullets.splice(i, 1);
        }
      }
    }
    
    // update enemies states
    updateEnemies() {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        let enemy = this.enemies[i];
        enemy.move();
        if (enemy.life <= 0) {
          this.enemies.splice(i, 1);
          this.score++;
        } else if (enemy.x >= Model.canvas_width) {
          this.enemies.splice(i, 1);
          this.life--;
        }
      }
      if (this.life <= 0) {
        this.gameOver();
      }
    }
}

Model.canvas_width = 1000;
Model.canvas_height = 400;

module.exports = Model;