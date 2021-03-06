

class Tank {
    
    constructor(id, x, y, userID) {
        this.username = '';
        this.id = id;
        this.left = 0;
        this.right = 0;
        this.currentShootCD = 0;
        this.shootCooldown = 10;
        this.canShoot = true;
        this.userID = userID;

        this.y = y;
        this.x = x;
        this.w = Tank.width;
        this.h = Tank.height;
    }

    move() {
        if (this.x > 50) {
        this.x += this.left * -3;
        }
        if (this.x < Tank.max_width - 50) {
        this.x += this.right * 3;
        }
    }
}

Tank.width = 70;
Tank.height =  35;
Tank.max_width = 1000;

module.exports = Tank


