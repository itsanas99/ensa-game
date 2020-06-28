var BITMAPS = true;
var DEBUG = false;
var GLOWEFFECT = true;
var GLOWSHADOWBLUR = 8;
var SCOREDBKEY = "asteroids-score-1.1";
var g_asteroidImgs = [];
g_asteroidImgs[0] = new Image();
g_asteroidImgs[1] = new Image();
g_asteroidImgs[2] = new Image();
g_asteroidImgs[3] = new Image();
var g_shieldImg = new Image();
var g_backgroundImg = new Image();
var g_playerImg = new Image();
var g_enemyshipImg = new Image();
window.addEventListener("load", onloadHandler, false);
function onloadHandler() {
    var c, a = "en";
    if ((c = window.location.search.indexOf("locale=")) !== -1) {
        var b = window.location.search.substring(c + 7).split("&");
        if (b.length !== 0) {
            a = b[0]
        }
    }
    Game.Util.loadMessages(a);
    g_backgroundImg.src = "images/bg3_1.jpg";
    g_backgroundImg.onload = function() {
        GameHandler.init();
        if (GameHandler.audioContext) {
            GameHandler.loadSound("sounds/laser.mp3", "laser");
            GameHandler.loadSound("sounds/enemybomb.mp3", "enemy_bomb");
            GameHandler.loadSound("sounds/bigboom.mp3", "big_boom");
            GameHandler.loadSound("sounds/explosion1.mp3", "asteroid_boom1");
            GameHandler.loadSound("sounds/explosion2.mp3", "asteroid_boom2");
            GameHandler.loadSound("sounds/explosion3.mp3", "asteroid_boom3");
            GameHandler.loadSound("sounds/explosion4.mp3", "asteroid_boom4");
            GameHandler.loadSound("sounds/powerup.mp3", "powerup")
        }
        GameHandler.start(new Asteroids.Main())
    }
}
if (typeof Asteroids == "undefined" || !Asteroids) {
    var Asteroids = {}
}
Asteroids.Colours = {
    PARTICLE: "rgb(255,125,50)",
    ENEMY_SHIP: "rgb(200,200,250)",
    ENEMY_SHIP_DARK: "rgb(150,150,200)",
    GREEN_LASER: "rgb(120,255,120)",
    GREEN_LASER_DARK: "rgb(50,255,50)",
    GREEN_LASERX2: "rgb(120,255,150)",
    GREEN_LASERX2_DARK: "rgb(50,255,75)",
    PLAYER_BOMB: "rgb(155,255,155)",
    PLAYER_THRUST: "rgb(25,125,255)",
    PLAYER_SHIELD: "rgb(100,100,255)"
};
(function() {
    Asteroids.Main = function() {
        Asteroids.Main.superclass.constructor.call(this);
        var g = new Asteroids.AttractorScene(this);
        var e = new Game.Preloader();
        e.addImage(g_playerImg, "images/player.png");
        e.addImage(g_asteroidImgs[0], "images/asteroid1.png");
        e.addImage(g_asteroidImgs[1], "images/asteroid2.png");
        e.addImage(g_asteroidImgs[2], "images/asteroid3.png");
        e.addImage(g_asteroidImgs[3], "images/asteroid4.png");
        e.addImage(g_shieldImg, "images/shield.png");
        e.addImage(g_enemyshipImg, "images/enemyship1.png");
        e.onLoadCallback(function() {
            g.ready()
        });
        this.player = new Asteroids.Player(new Vector(GameHandler.width / 2,GameHandler.height / 2),new Vector(0,0),0);
        this.scenes.push(g);
        for (var k, f = 0; f < 12; f++) {
            k = new Asteroids.GameScene(this,f + 1);
            this.scenes.push(k)
        }
        this.scenes.push(new Asteroids.GameCompleted(this));
        this.endScene = new Asteroids.GameOverScene(this);
        for (var h, f = 0; f < this.STARFIELD_SIZE; f++) {
            h = new Asteroids.Star();
            h.init();
            this.starfield.push(h)
        }
        if (localStorage) {
            var j = localStorage.getItem(SCOREDBKEY);
            if (j) {
                this.highscore = j
            }
        }
        GameHandler.bitmaps = new Asteroids.Prerenderer();
        GameHandler.bitmaps.execute()
    }
    ;
    extend(Asteroids.Main, Game.Main, {
        STARFIELD_SIZE: 64,
        player: null,
        lives: 0,
        score: 0,
        highscore: 0,
        backgroundX: 0,
        starfield: [],
        onRenderGame: function c(e) {
            if (BITMAPS && !(DEBUG && DEBUG.NOBACKGROUND)) {
                e.drawImage(g_backgroundImg, this.backgroundX, 0, GameHandler.width, GameHandler.height, 0, 0, GameHandler.width, GameHandler.height);
                this.backgroundX += (0.25 * GameHandler.frameMultipler);
                if (this.backgroundX >= g_backgroundImg.width * 0.5) {
                    this.backgroundX -= g_backgroundImg.width * 0.5
                }
                e.shadowBlur = 0
            } else {
                e.shadowBlur = 0;
                e.clearRect(0, 0, GameHandler.width, GameHandler.height);
                if (!(DEBUG && DEBUG.NOBACKGROUND)) {
                    this.updateStarfield(e)
                }
                e.shadowBlur = GLOWEFFECT ? GLOWSHADOWBLUR : 0;
                e.lineWidth = 1.5
            }
        },
        isGameOver: function d() {
            return (this.lives === 0 && (this.currentScene.effects && this.currentScene.effects.length === 0))
        },
        updateStarfield: function b(e) {
            e.save();
            e.strokeStyle = "rgb(200,200,200)";
            for (var h, g = 0, f = this.starfield.length; g < f; g++) {
                h = this.starfield[g];
                h.render(e);
                h.z -= (h.VELOCITY * GameHandler.frameMultipler) * 0.1;
                if (h.z < 0.1 || h.prevx > GameHandler.height || h.prevy > GameHandler.width) {
                    h.init()
                }
            }
            e.restore()
        },
        updateActorPosition: function a(e) {
            e.position.add(e.vector.nscale(GameHandler.frameMultipler));
            if (e.position.x >= GameHandler.width) {
                e.position.x = 0
            } else {
                if (e.position.x < 0) {
                    e.position.x = GameHandler.width - 1
                }
            }
            if (e.position.y >= GameHandler.height) {
                e.position.y = 0
            } else {
                if (e.position.y < 0) {
                    e.position.y = GameHandler.height - 1
                }
            }
        }
    })
}
)();
(function() {
    Asteroids.AttractorScene = function(j) {
        this.game = j;
        var l = this;
        var k = function(m) {
            if (m.button === 0 && l.imagesLoaded) {
                l.start = true;
                return true
            }
        };
        GameHandler.canvas.addEventListener("mousedown", k, false);
        Asteroids.AttractorScene.superclass.constructor.call(this, false, null)
    }
    ;
    extend(Asteroids.AttractorScene, Game.Scene, {
        game: null,
        start: false,
        imagesLoaded: false,
        sine: 0,
        mult: 0,
        multIncrement: 0,
        actors: null,
        SCENE_LENGTH: 400,
        SCENE_FADE: 75,
        sceneRenderers: null,
        currentSceneRenderer: 0,
        currentSceneFrame: 0,
        isComplete: function h() {
            return this.start
        },
        onInitScene: function e() {
            this.start = false;
            this.mult = 512;
            this.multIncrement = 0.5;
            this.currentSceneRenderer = 0;
            this.currentSceneFrame = 0;
            this.sceneRenderers = [];
            this.sceneRenderers.push(this.sceneRendererWelcome);
            this.sceneRenderers.push(this.sceneRendererInfo);
            this.sceneRenderers.push(this.sceneRendererScores);
            this.actors = [];
            for (var k = 0; k < 8; k++) {
                var l = new Vector(Rnd() * GameHandler.width,Rnd() * GameHandler.height);
                var j = new Vector(((Rnd() * 2) - 1),((Rnd() * 2) - 1));
                this.actors.push(new Asteroids.Asteroid(l,j,randomInt(3, 4)))
            }
            this.game.score = 0;
            this.game.lives = 3
        },
        onRenderScene: function a(k) {
            if (this.imagesLoaded) {
                for (var p = 0, l = this.actors.length; p < l; p++) {
                    var o = this.actors[p];
                    o.onUpdate(this);
                    this.game.updateActorPosition(o);
                    o.onRender(k)
                }
                if (++this.currentSceneFrame === this.SCENE_LENGTH) {
                    if (++this.currentSceneRenderer === this.sceneRenderers.length) {
                        this.currentSceneRenderer = 0
                    }
                    this.currentSceneFrame = 0
                }
                k.save();
                if (this.currentSceneFrame < this.SCENE_FADE) {
                    k.globalAlpha = 1 - ((this.SCENE_FADE - this.currentSceneFrame) / this.SCENE_FADE)
                } else {
                    if (this.currentSceneFrame >= this.SCENE_LENGTH - this.SCENE_FADE) {
                        k.globalAlpha = ((this.SCENE_LENGTH - this.currentSceneFrame) / this.SCENE_FADE)
                    }
                }
                this.sceneRenderers[this.currentSceneRenderer].call(this, k);
                k.restore();
                this.sineText(k, Game.Util.message("Ensak 2D"), GameHandler.width * 0.5 - 130, GameHandler.height * 0.5 - 64)
            } else {
                var m = (BITMAPS ? Game.centerFillText : Game.centerDrawText);
                m(k, Game.Util.message("please-wait"), "18pt Arial", GameHandler.height * 0.5, "white")
            }
        },
        sceneRendererWelcome: function i(j) {
            j.fillStyle = j.strokeStyle = "white";
            var k = (BITMAPS ? Game.centerFillText : Game.centerDrawText);
            k(j, !iOS ? Game.Util.message("Touch space to start") : "Touch to start!", "18pt Arial", GameHandler.height * 0.5);
            k = (BITMAPS ? Game.fillText : Game.drawText);
            k(j, Game.Util.message("zaka & anas"), "10pt Arial", 16, 624)
        },
        sceneRendererInfo: function d(j) {
            j.fillStyle = j.strokeStyle = "white";
            var k = (BITMAPS ? Game.fillText : Game.drawText);
            
        },
        sceneRendererScores: function b(k) {
            k.fillStyle = k.strokeStyle = "white";
            var n = (BITMAPS ? Game.centerFillText : Game.centerDrawText);
            n(k, Game.Util.message("high-score"), "18pt Courier New", 320);
            var o = this.game.highscore.toString();
            for (var m = 0, l = 8 - o.length; m < l; m++) {
                o = "0" + o
            }
            n(k, o, "18pt Courier New", 350)
        },
        ready: function g() {
            this.imagesLoaded = true
        },
        sineText: function c(t, p, o, k) {
            this.mult += this.multIncrement;
            if (this.mult > 1024) {
                this.multIncrement = -this.multIncrement
            } else {
                if (this.mult < 128) {
                    this.multIncrement = -this.multIncrement
                }
            }
            var l = this.sine;
            for (var n = 0, m = p.length; n < m; n++) {
                var r = k + (Sin(l) * RAD) * this.mult;
                var s = o + (Cos(l++) * RAD) * (this.mult * 0.5);
                var q = (BITMAPS ? Game.fillText : Game.drawText);
                q(t, p[n], "36pt Courier New", s + n * 30, r, "white")
            }
            this.sine += 0.075
        },
        onKeyDownHandler: function f(j) {
            switch (j) {
            case GameHandler.KEY.SPACE:
                if (this.imagesLoaded) {
                    this.start = true
                }
                return true;
                break;
            case GameHandler.KEY.R:
                BITMAPS = !BITMAPS;
                return true;
                break;
            case GameHandler.KEY.S:
                GameHandler.soundEnabled = !GameHandler.soundEnabled;
                return true;
                break;
            case GameHandler.KEY.ESC:
                GameHandler.pause();
                return true;
                break
            }
        }
    })
}
)();
(function() {
    Asteroids.GameOverScene = function(d) {
        this.game = d;
        this.player = d.player;
        var c = new Game.Interval(Game.Util.message("game-over"),this.intervalRenderer);
        Asteroids.GameOverScene.superclass.constructor.call(this, false, c)
    }
    ;
    extend(Asteroids.GameOverScene, Game.Scene, {
        game: null,
        isComplete: function b() {
            return true
        },
        intervalRenderer: function a(d, c) {
            
            if (d.framecounter < 300) {
                Game.fillText(c, d.label, "18pt Courier New", GameHandler.width * 0.5 - 64, GameHandler.height * 0.5 - 32, "white");
                Game.fillText(c, Game.Util.message("score") + ": " + this.game.score, "14pt Courier New", GameHandler.width * 0.5 - 64, GameHandler.height * 0.5, "white");
                if (this.game.score === this.game.highscore) {
                    Game.fillText(c, Game.Util.message("new-high-score") + "!", "14pt Courier New", GameHandler.width * 0.5 - 64, GameHandler.height * 0.5 + 24, "white")
                }
            } else {
                d.complete = true
            }
        }
    })
}
)();
(function() {
    Asteroids.GameCompleted = function(d) {
        this.game = d;
        this.player = d.player;
        var c = new Game.Interval(Game.Util.message("congratulations"),this.intervalRenderer);
        Asteroids.GameCompleted.superclass.constructor.call(this, false, c)
    }
    ;
    extend(Asteroids.GameCompleted, Game.Scene, {
        game: null,
        isComplete: function b() {
            return true
        },
        intervalRenderer: function a(d, c) {
            if (d.framecounter++ === 0) {
                if (this.game.score === this.game.highscore) {
                    if (localStorage) {
                        localStorage.setItem(SCOREDBKEY, this.game.score)
                    }
                }
            }
            if (d.framecounter < 1000) {
                Game.fillText(c, d.label, "18pt Courier New", GameHandler.width * 0.5 - 96, GameHandler.height * 0.5 - 32, "white");
                Game.fillText(c, Game.Util.message("score") + ": " + this.game.score, "14pt Courier New", GameHandler.width * 0.5 - 64, GameHandler.height * 0.5, "white");
                if (this.game.score === this.game.highscore) {
                    Game.fillText(c, Game.Util.message("new-high-score") + "!", "14pt Courier New", GameHandler.width * 0.5 - 64, GameHandler.height * 0.5 + 24, "white")
                }
            } else {
                d.complete = true
            }
        }
    })
}
)();
(function() {
    Asteroids.GameScene = function(game, wave) {
        this.game = game;
        this.wave = wave;
        this.player = game.player;
        var interval = new Game.Interval(Game.Util.message("wave") + " " + wave,this.intervalRenderer);
        Asteroids.GameScene.superclass.constructor.call(this, true, interval)
    }
    ;
    extend(Asteroids.GameScene, Game.Scene, {
        game: null,
        wave: 0,
        input: {
            left: false,
            right: false,
            thrust: false,
            shield: false,
            fireA: false,
            fireB: false
        },
        player: null,
        actors: null,
        playerBullets: null,
        enemies: null,
        enemyBullets: null,
        effects: null,
        collectables: null,
        enemyShipCount: 0,
        enemyShipAdded: 0,
        scoredisplay: 0,
        skipLevel: false,
        onInitScene: function onInitScene() {
            this.actors = [];
            this.enemies = [];
            this.actors.push(this.enemies);
            this.actors.push(this.playerBullets = []);
            this.actors.push(this.enemyBullets = []);
            this.actors.push(this.effects = []);
            this.actors.push(this.collectables = []);
            this.resetPlayerActor(this.wave !== 1);
            var factor = 1 + ((this.wave - 1) * 0.075);
            for (var i = 1, j = (4 + this.wave); i < j; i++) {
                this.enemies.push(this.generateAsteroid(factor))
            }
            this.enemyShipAdded = GameHandler.frameStart;
            this.enemyShipCount = 0;
            this.interval.reset();
            this.skipLevel = false
        },
        resetPlayerActor: function resetPlayerActor(persistPowerUps) {
            this.actors.push([this.player]);
            with (this.player) {
                position.x = GameHandler.width / 2;
                position.y = GameHandler.height / 2;
                vector.x = 0;
                vector.y = 0;
                heading = 0;
                reset(persistPowerUps)
            }
            with (this.input) {
                left = false;
                right = false;
                thrust = false;
                shield = false;
                fireA = false;
                fireB = false
            }
        },
        onBeforeRenderScene: function onBeforeRenderScene() {
            if (this.input.left) {
                this.player.heading -= 4 * GameHandler.frameMultipler
            }
            if (this.input.right) {
                this.player.heading += 4 * GameHandler.frameMultipler
            }
            if (this.input.thrust) {
                this.player.thrust()
            } else {
                if (iOS) {
                    this.player.vector.scale(0.985)
                }
            }
            if (this.input.shield) {
                if (!this.player.expired()) {
                    this.player.activateShield()
                }
            }
            if (this.input.fireA || iOS || (DEBUG && DEBUG.AUTOFIRE)) {
                this.player.firePrimary(this.playerBullets)
            }
            if (this.input.fireB) {
                this.player.fireSecondary(this.playerBullets)
            }
            if (this.enemyShipCount <= (this.wave < 5 ? 0 : 1) && GameHandler.frameStart - this.enemyShipAdded > (20000 - (this.wave * 1024))) {
                this.enemies.push(new Asteroids.EnemyShip(this,(this.wave < 3 ? 0 : randomInt(0, 1))));
                this.enemyShipCount++;
                this.enemyShipAdded = GameHandler.frameStart
            }
            this.updateActors()
        },
        onRenderScene: function onRenderScene(ctx) {
            this.renderActors(ctx);
            if (DEBUG && DEBUG.COLLISIONRADIUS) {
                this.renderCollisionRadius(ctx)
            }
            this.renderOverlay(ctx);
            this.collisionDetectBullets();
            if (!this.player.expired()) {
                this.collisionDetectPlayer()
            } else {
                if (GameHandler.frameStart - this.player.killedOn > 3000) {
                    var tooClose = false;
                    var playerPos = new Vector(GameHandler.width * 0.5,GameHandler.height * 0.5);
                    for (var i = 0, j = this.enemies.length; i < j; i++) {
                        var enemy = this.enemies[i];
                        if (playerPos.distance(enemy.position) < 80) {
                            tooClose = true;
                            break
                        }
                    }
                    if (tooClose === false) {
                        this.resetPlayerActor()
                    }
                }
            }
        },
        isComplete: function isComplete() {
            return (this.skipLevel || (this.enemies.length === 0 && this.effects.length === 0))
        },
        intervalRenderer: function intervalRenderer(interval, ctx) {
            if (interval.framecounter++ < 100) {
                var f = (BITMAPS ? Game.fillText : Game.drawText);
                f(ctx, interval.label, "18pt Courier New", GameHandler.width * 0.5 - 48, GameHandler.height * 0.5 - 8, "white")
            } else {
                interval.complete = true
            }
        },
        onKeyDownHandler: function onKeyDownHandler(keyCode) {
            switch (keyCode) {
            case GameHandler.KEY.LEFT:
                this.input.left = true;
                return true;
                break;
            case GameHandler.KEY.RIGHT:
                this.input.right = true;
                return true;
                break;
            case GameHandler.KEY.UP:
            case GameHandler.GAMEPAD + 1:
                this.input.thrust = true;
                return true;
                break;
            case GameHandler.KEY.DOWN:
            case GameHandler.KEY.SHIFT:
            case GameHandler.GAMEPAD + 0:
                this.input.shield = true;
                return true;
                break;
            case GameHandler.KEY.SPACE:
            case GameHandler.GAMEPAD + 7:
                this.input.fireA = true;
                return true;
                break;
            case GameHandler.KEY.Z:
            case GameHandler.GAMEPAD + 2:
                this.input.fireB = true;
                return true;
                break;
            case GameHandler.KEY.R:
                BITMAPS = !BITMAPS;
                return true;
                break;
            case GameHandler.KEY.S:
                GameHandler.soundEnabled = !GameHandler.soundEnabled;
                return true;
                break;
            case GameHandler.KEY.A:
                if (DEBUG) {
                    this.enemies.push(this.generateAsteroid(1));
                    return true
                }
                break;
            case GameHandler.KEY.G:
                if (DEBUG) {
                    GLOWEFFECT = !GLOWEFFECT;
                    return true
                }
                break;
            case GameHandler.KEY.L:
                if (DEBUG) {
                    this.skipLevel = true;
                    return true
                }
                break;
            case GameHandler.KEY.E:
                if (DEBUG) {
                    this.enemies.push(new Asteroids.EnemyShip(this,randomInt(0, 1)));
                    return true
                }
                break;
            case GameHandler.KEY.ESC:
                GameHandler.pause();
                return true;
                break
            }
        },
        onKeyUpHandler: function onKeyUpHandler(keyCode) {
            switch (keyCode) {
            case GameHandler.KEY.LEFT:
                this.input.left = false;
                return true;
                break;
            case GameHandler.KEY.RIGHT:
                this.input.right = false;
                return true;
                break;
            case GameHandler.KEY.UP:
            case GameHandler.GAMEPAD + 1:
                this.input.thrust = false;
                return true;
                break;
            case GameHandler.KEY.DOWN:
            case GameHandler.KEY.SHIFT:
            case GameHandler.GAMEPAD + 0:
                this.input.shield = false;
                return true;
                break;
            case GameHandler.KEY.SPACE:
            case GameHandler.GAMEPAD + 7:
                this.input.fireA = false;
                return true;
                break;
            case GameHandler.KEY.Z:
            case GameHandler.GAMEPAD + 2:
                this.input.fireB = false;
                return true;
                break
            }
        },
        onAxisHandler: function onAxisHandler(axis, delta) {
            switch (axis) {
            case 0:
                switch (Math.round(delta)) {
                case 0:
                    this.input.left = this.input.right = false;
                    break;
                case 1:
                    this.input.right = true;
                    break;
                case -1:
                    this.input.left = true;
                    break
                }
                break
            }
        },
        touches: [],
        onTouchStartHandler: function onTouchStartHandler(event) {
            for (var i = 0, t; i < event.changedTouches.length; i++) {
                t = event.changedTouches[i];
                this.touches[t.identifier] = {
                    tx: t.screenX,
                    ty: t.screenY,
                    txd: t.screenX,
                    tyd: t.screenY
                }
            }
            return true
        },
        onTouchMoveHandler: function onTouchMoveHandler(event) {
            for (var i = 0, t; i < event.changedTouches.length; i++) {
                t = event.changedTouches[i];
                this.touches[t.identifier].tx = t.screenX;
                this.touches[t.identifier].ty = t.screenY
            }
            for (var i in this.touches) {
                if (this.touches[i].tx < window.innerWidth * 0.5) {
                    this.player.heading -= (this.touches[i].txd - this.touches[i].tx) * GameHandler.frameMultipler
                } else {
                    if (this.touches[i].ty < this.touches[i].tyd) {
                        this.player.thrust()
                    } else {
                        if (this.touches[i].ty - 16 > this.touches[i].tyd) {
                            this.player.activateShield()
                        }
                    }
                }
                this.touches[i].txd = this.touches[i].tx;
                this.touches[i].tyd = this.touches[i].ty
            }
            return true
        },
        onTouchEndHandler: function onTouchEndHandler(event) {
            for (var i = 0, t; i < event.changedTouches.length; i++) {
                t = event.changedTouches[i];
                delete this.touches[t.identifier]
            }
            return true
        },
        generateAsteroid: function generateAsteroid(speedFactor) {
            while (true) {
                var apos = new Vector(Rnd() * GameHandler.width,Rnd() * GameHandler.height);
                if (this.player.position.distance(apos) > 125) {
                    var vec = new Vector(((Rnd() * 2) - 1) * speedFactor,((Rnd() * 2) - 1) * speedFactor);
                    return new Asteroids.Asteroid(apos,vec,4)
                }
            }
        },
        updateActors: function updateActors() {
            for (var i = 0, j = this.actors.length; i < j; i++) {
                var actorList = this.actors[i];
                for (var n = 0; n < actorList.length; n++) {
                    var actor = actorList[n];
                    actor.onUpdate(this);
                    if (actor.expired()) {
                        actorList.splice(n, 1)
                    } else {
                        this.game.updateActorPosition(actor)
                    }
                }
            }
        },
        destroyPlayer: function destroyPlayer() {
            this.player.kill();
            this.game.lives--;
            var boom = new Asteroids.PlayerExplosion(this.player.position.clone(),this.player.vector.clone());
            this.effects.push(boom);
            GameHandler.playSound("big_boom")
        },
        collisionDetectPlayer: function collisionDetectPlayer() {
            var playerRadius = this.player.radius();
            var playerPos = this.player.position;
            for (var n = 0, m = this.enemies.length; n < m; n++) {
                var enemy = this.enemies[n];
                if (playerPos.distance(enemy.position) <= playerRadius + enemy.radius()) {
                    if (this.player.isShieldActive()) {
                        this.player.vector.scale(0.75);
                        enemy.hit(-1);
                        this.destroyEnemy(enemy, this.player.vector, true)
                    } else {
                        if (!(DEBUG && DEBUG.INVINCIBLE)) {
                            this.destroyPlayer()
                        }
                    }
                }
            }
            for (var i = 0; i < this.enemyBullets.length; i++) {
                var bullet = this.enemyBullets[i];
                if (playerPos.distance(bullet.position) <= playerRadius + bullet.radius()) {
                    if (this.player.isShieldActive()) {
                        this.enemyBullets.splice(i, 1)
                    } else {
                        if (!(DEBUG && DEBUG.INVINCIBLE)) {
                            this.destroyPlayer()
                        }
                    }
                }
            }
            for (var i = 0; i < this.collectables.length; i++) {
                var item = this.collectables[i];
                if (playerPos.distance(item.position) <= playerRadius + item.radius()) {
                    this.collectables.splice(i, 1);
                    item.collected(this.game, this.player, this);
                    GameHandler.playSound("powerup")
                }
            }
        },
        collisionDetectBullets: function collisionDetectBullets() {
            for (var i = 0, n, m; i < this.playerBullets.length; i++) {
                var bullet = this.playerBullets[i];
                var bulletRadius = bullet.radius();
                var bulletPos = bullet.position;
                for (n = 0,
                m = this.enemies.length,
                enemy,
                z; n < m; n++) {
                    enemy = this.enemies[n];
                    if (bulletPos.distance(enemy.position) <= bulletRadius + enemy.radius()) {
                        var effectRad = bullet.effectRadius();
                        if (effectRad === 0) {
                            if (enemy.hit(bullet.power())) {
                                this.destroyEnemy(enemy, bullet.vector, true);
                                this.generatePowerUp(enemy)
                            } else {
                                var effect = new Asteroids.PlayerBulletImpact(bullet.position,bullet.vector);
                                this.effects.push(effect)
                            }
                        } else {
                            enemy.hit(-1);
                            this.generatePowerUp(enemy);
                            var comboCount = 1;
                            var boom = new Asteroids.Explosion(bullet.position.clone(),bullet.vector.nscale(0.5),5);
                            this.effects.push(boom);
                            this.destroyEnemy(enemy, bullet.vector, true);
                            for (var x = 0, z = this.enemies.length, e; x < z; x++) {
                                e = this.enemies[x];
                                if (bulletPos.distance(e.position) <= effectRad + e.radius()) {
                                    e.hit(-1);
                                    this.generatePowerUp(e);
                                    this.destroyEnemy(e, bullet.vector, true);
                                    comboCount++
                                }
                            }
                            if (comboCount > 4) {
                                var inc = comboCount * 1000 * this.wave;
                                this.game.score += inc;
                                var vec = new Vector(0,-3);
                                var effect = new Asteroids.ScoreIndicator(new Vector(enemy.position.x,enemy.position.y - (enemy.size * 8)),vec.add(enemy.vector.nscale(0.5)),inc,16,Game.Util.message("hit-combo") + " X" + comboCount,"rgb(255,255,55)",1000);
                                this.effects.push(effect);
                                this.generatePowerUp(enemy, true)
                            }
                        }
                        this.playerBullets.splice(i, 1);
                        break
                    }
                }
            }
            for (var i = 0, n, m; i < this.enemyBullets.length; i++) {
                var bullet = this.enemyBullets[i];
                var bulletRadius = bullet.radius();
                var bulletPos = bullet.position;
                for (n = 0,
                m = this.enemies.length,
                z; n < m; n++) {
                    var enemy = this.enemies[n];
                    if (enemy instanceof Asteroids.Asteroid) {
                        if (bulletPos.distance(enemy.position) <= bulletRadius + enemy.radius()) {
                            if (enemy.hit(1)) {
                                this.destroyEnemy(enemy, bullet.vector, false)
                            } else {
                                var effect = new Asteroids.EnemyBulletImpact(bullet.position,bullet.vector);
                                this.effects.push(effect)
                            }
                            this.enemyBullets.splice(i, 1);
                            break
                        }
                    }
                }
            }
        },
        generatePowerUp: function generatePowerUp(enemy, force) {
            if (this.collectables.length < 5 && (force || randomInt(0, ((enemy instanceof Asteroids.Asteroid) ? 25 : 1)) === 0)) {
                var vec = enemy.vector.clone();
                var t = new Vector(0,-(Rnd() * 2));
                t.rotate(enemy.vector.theta() * (Rnd() * PI));
                vec.add(t);
                this.collectables.push(new Asteroids.PowerUp(new Vector(enemy.position.x,enemy.position.y - (enemy.size * 8)),vec))
            }
        },
        destroyEnemy: function destroyEnemy(enemy, parentVector, player) {
            if (enemy instanceof Asteroids.Asteroid) {
                GameHandler.playSound("asteroid_boom" + randomInt(1, 4));
                this.generateBabyAsteroids(enemy, parentVector);
                var boom = new Asteroids.AsteroidExplosion(enemy.position.clone(),enemy.vector.clone(),enemy);
                this.effects.push(boom);
                if (player) {
                    var inc = ((5 - enemy.size) * 4) * 100 * this.wave;
                    this.game.score += inc;
                    var vec = new Vector(0,-1.5).add(enemy.vector.nscale(0.5));
                    var effect = new Asteroids.ScoreIndicator(new Vector(enemy.position.x,enemy.position.y - (enemy.size * 8)),vec,inc);
                    this.effects.push(effect)
                }
            } else {
                if (enemy instanceof Asteroids.EnemyShip) {
                    GameHandler.playSound("asteroid_boom1");
                    var boom = new Asteroids.EnemyExplosion(enemy.position.clone(),enemy.vector.clone(),enemy);
                    this.effects.push(boom);
                    if (player) {
                        var inc = 2000 * this.wave * (enemy.size + 1);
                        this.game.score += inc;
                        var vec = new Vector(0,-1.5).add(enemy.vector.nscale(0.5));
                        var effect = new Asteroids.ScoreIndicator(new Vector(enemy.position.x,enemy.position.y - 16),vec,inc);
                        this.effects.push(effect)
                    }
                    this.enemyShipCount--
                }
            }
        },
        generateBabyAsteroids: function generateBabyAsteroids(asteroid, parentVector) {
            if (asteroid.size > 1) {
                for (var x = 0, xc = randomInt(asteroid.size / 2, asteroid.size - 1); x < xc; x++) {
                    var babySize = randomInt(1, asteroid.size - 1);
                    var vec = asteroid.vector.clone();
                    var t = new Vector(0,-Rnd());
                    t.rotate(asteroid.vector.theta() * (Rnd() * PI));
                    vec.add(t);
                    vec.add(parentVector.nscale(0.2));
                    var baby = new Asteroids.Asteroid(new Vector(asteroid.position.x + (Rnd() * 5) - 2.5,asteroid.position.y + (Rnd() * 5) - 2.5),vec,babySize,asteroid.type);
                    this.enemies.push(baby)
                }
            }
        },
        renderActors: function renderActors(ctx) {
            for (var i = 0, j = this.actors.length; i < j; i++) {
                var actorList = this.actors[i];
                for (var n = actorList.length - 1; n >= 0; n--) {
                    actorList[n].onRender(ctx)
                }
            }
        },
        renderCollisionRadius: function renderCollisionRadius(ctx) {
            ctx.save();
            ctx.strokeStyle = "rgb(255,0,0)";
            ctx.lineWidth = 0.5;
            ctx.shadowBlur = 0;
            for (var i = 0, j = this.actors.length; i < j; i++) {
                var actorList = this.actors[i];
                for (var n = actorList.length - 1, actor; n >= 0; n--) {
                    actor = actorList[n];
                    if (actor.radius) {
                        ctx.beginPath();
                        ctx.arc(actor.position.x, actor.position.y, actor.radius(), 0, TWOPI, true);
                        ctx.closePath();
                        ctx.stroke()
                    }
                }
            }
            ctx.restore()
        },
        renderOverlay: function renderOverlay(ctx) {
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgb(50,50,255)";
            ctx.strokeRect(4, 4, 101, 6);
            ctx.fillStyle = "rgb(100,100,255)";
            var energy = this.player.energy;
            if (energy > this.player.ENERGY_INIT) {
                energy = this.player.ENERGY_INIT
            }
            ctx.fillRect(5, 5, (energy / (this.player.ENERGY_INIT / 100)), 5);
            for (var i = 0; i < this.game.lives; i++) {
                if (BITMAPS) {
                    ctx.drawImage(g_playerImg, 0, 0, 64, 64, 380 + (i * 20), 0, 16, 16)
                } else {
                    ctx.save();
                    ctx.strokeStyle = "white";
                    ctx.translate(380 + (i * 16), 8);
                    ctx.beginPath();
                    ctx.moveTo(-4, 6);
                    ctx.lineTo(4, 6);
                    ctx.lineTo(0, -6);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore()
                }
            }
            var score = this.game.score;
            var inc = (score - this.scoredisplay) / 10;
            this.scoredisplay += inc;
            if (this.scoredisplay > score) {
                this.scoredisplay = score
            }
            var sscore = Ceil(this.scoredisplay).toString();
            for (var i = 0, j = 8 - sscore.length; i < j; i++) {
                sscore = "0" + sscore
            }
            Game.fillText(ctx, sscore, "12pt Courier New", 120, 12, "white");
            if (score > this.game.highscore) {
                this.game.highscore = score
            }
            sscore = this.game.highscore.toString();
            for (var i = 0, j = 8 - sscore.length; i < j; i++) {
                sscore = "0" + sscore
            }
            Game.fillText(ctx, Game.Util.message("hi-score") + ": " + sscore, "12pt Courier New", 220, 12, "white");
            if (DEBUG && DEBUG.FPS) {
                Game.fillText(ctx, "FPS: " + GameHandler.maxfps, "12pt Courier New", 0, GameHandler.height - 2, "lightblue")
            }
            ctx.restore()
        }
    })
}
)();
(function() {
    Asteroids.Star = function() {
        return this
    }
    ;
    Asteroids.Star.prototype = {
        MAXZ: 12,
        VELOCITY: 0.85,
        x: 0,
        y: 0,
        z: 0,
        prevx: 0,
        prevy: 0,
        init: function b() {
            this.prevx = this.prevy = 0;
            this.x = (Rnd() * GameHandler.width - (GameHandler.width * 0.5)) * this.MAXZ;
            this.y = (Rnd() * GameHandler.height - (GameHandler.height * 0.5)) * this.MAXZ;
            this.z = this.MAXZ
        },
        render: function a(c) {
            var d = this.x / this.z;
            var e = this.y / this.z;
            if (this.prevx) {
                c.lineWidth = 1 / this.z * 5 + 1;
                c.beginPath();
                c.moveTo(this.prevx + (GameHandler.width * 0.5), this.prevy + (GameHandler.height * 0.5));
                c.lineTo(d + (GameHandler.width * 0.5), e + (GameHandler.height * 0.5));
                c.stroke()
            }
            this.prevx = d;
            this.prevy = e
        }
    }
}
)();
(function() {
    Asteroids.Prerenderer = function() {
        Asteroids.Prerenderer.superclass.constructor.call(this);
        var b = function(e, i) {
            var j = [];
            for (var g = 3; g <= 6; g++) {
                var h = g << 1;
                e.width = e.height = h;
                var d = e.getContext("2d");
                var c = d.createRadialGradient(g, g, g >> 1, g, g, g);
                c.addColorStop(0, i);
                c.addColorStop(1, "#000");
                d.fillStyle = c;
                d.fillRect(0, 0, h, h);
                var f = new Image();
                f.src = e.toDataURL("image/png");
                j.push(f)
            }
            return j
        };
        this.addRenderer(function(c) {
            return b.call(this, c, Asteroids.Colours.PARTICLE)
        }, "points_" + Asteroids.Colours.PARTICLE);
        this.addRenderer(function(c) {
            return b.call(this, c, Asteroids.Colours.GREEN_LASER)
        }, "points_" + Asteroids.Colours.GREEN_LASER);
        this.addRenderer(function(c) {
            return b.call(this, c, Asteroids.Colours.ENEMY_SHIP)
        }, "points_" + Asteroids.Colours.ENEMY_SHIP);
        var a = function(e, i) {
            var j = [];
            for (var g = 4; g <= 32; g += 4) {
                var h = g << 1;
                e.width = e.height = h;
                var d = e.getContext("2d");
                var c = d.createRadialGradient(g, g, g >> 3, g, g, g);
                c.addColorStop(0, i);
                c.addColorStop(1, "#000");
                d.fillStyle = c;
                d.fillRect(0, 0, h, h);
                var f = new Image();
                f.src = e.toDataURL("image/png");
                j.push(f)
            }
            return j
        };
        this.addRenderer(function(c) {
            return a.call(this, c, Asteroids.Colours.PARTICLE)
        }, "smudges_" + Asteroids.Colours.PARTICLE);
        this.addRenderer(function(c) {
            return a.call(this, c, Asteroids.Colours.ENEMY_SHIP)
        }, "smudges_" + Asteroids.Colours.ENEMY_SHIP);
        this.addRenderer(function(d) {
            var g = 2
              , h = 6;
            var i = [];
            d.width = g + GLOWSHADOWBLUR * 2;
            d.height = h + GLOWSHADOWBLUR * 2;
            var c = d.getContext("2d");
            var f = function(k, j) {
                c.beginPath();
                c.moveTo(0, j);
                c.lineTo(k, 0);
                c.lineTo(0, -j);
                c.lineTo(-k, 0);
                c.closePath()
            };
            c.shadowBlur = GLOWSHADOWBLUR;
            c.translate(d.width * 0.5, d.height * 0.5);
            c.shadowColor = c.fillStyle = Asteroids.Colours.GREEN_LASER_DARK;
            f.call(this, g - 1, h - 1);
            c.fill();
            c.shadowColor = c.fillStyle = Asteroids.Colours.GREEN_LASER;
            f.call(this, g, h);
            c.fill();
            var e = new Image();
            e.src = d.toDataURL("image/png");
            i.push(e);
            d.width = d.width;
            c.shadowBlur = GLOWSHADOWBLUR;
            c.translate(d.width * 0.5, d.height * 0.5);
            c.shadowColor = c.strokeStyle = Asteroids.Colours.GREEN_LASER_DARK;
            f.call(this, g - 1, h - 1);
            c.stroke();
            c.shadowColor = c.strokeStyle = Asteroids.Colours.GREEN_LASER;
            f.call(this, g, h);
            c.stroke();
            e = new Image();
            e.src = d.toDataURL("image/png");
            i.push(e);
            return i
        }, "bullet");
        this.addRenderer(function(d) {
            var g = 2
              , h = 6;
            var i = [];
            d.width = g + GLOWSHADOWBLUR * 4;
            d.height = h + GLOWSHADOWBLUR * 2;
            var c = d.getContext("2d");
            var f = function(k, j) {
                c.beginPath();
                c.moveTo(0, j);
                c.lineTo(k, 0);
                c.lineTo(0, -j);
                c.lineTo(-k, 0);
                c.closePath()
            };
            c.shadowBlur = GLOWSHADOWBLUR;
            c.translate(d.width * 0.5, d.height * 0.5);
            c.save();
            c.translate(-4, 0);
            c.shadowColor = c.fillStyle = Asteroids.Colours.GREEN_LASERX2_DARK;
            f.call(this, g - 1, h - 1);
            c.fill();
            c.shadowColor = c.fillStyle = Asteroids.Colours.GREEN_LASERX2;
            f.call(this, g, h);
            c.fill();
            c.translate(8, 0);
            c.shadowColor = c.fillStyle = Asteroids.Colours.GREEN_LASERX2_DARK;
            f.call(this, g - 1, h - 1);
            c.fill();
            c.shadowColor = c.fillStyle = Asteroids.Colours.GREEN_LASERX2;
            f.call(this, g, h);
            c.fill();
            c.restore();
            var e = new Image();
            e.src = d.toDataURL("image/png");
            i.push(e);
            d.width = d.width;
            c.shadowBlur = GLOWSHADOWBLUR;
            c.translate(d.width * 0.5, d.height * 0.5);
            c.save();
            c.translate(-4, 0);
            c.shadowColor = c.strokeStyle = Asteroids.Colours.GREEN_LASERX2_DARK;
            f.call(this, g - 1, h - 1);
            c.stroke();
            c.shadowColor = c.strokeStyle = Asteroids.Colours.GREEN_LASERX2;
            f.call(this, g, h);
            c.stroke();
            c.translate(8, 0);
            c.shadowColor = c.strokeStyle = Asteroids.Colours.GREEN_LASERX2_DARK;
            f.call(this, g - 1, h - 1);
            c.stroke();
            c.shadowColor = c.strokeStyle = Asteroids.Colours.GREEN_LASERX2;
            f.call(this, g, h);
            c.stroke();
            c.restore();
            e = new Image();
            e.src = d.toDataURL("image/png");
            i.push(e);
            return i
        }, "bulletx2");
        this.addRenderer(function(e) {
            var c = 4;
            var h = [];
            e.width = e.height = c * 2 + GLOWSHADOWBLUR * 2;
            var d = e.getContext("2d");
            var g = function() {
                d.beginPath();
                d.moveTo(c * 2, 0);
                for (var j = 0; j < 15; j++) {
                    d.rotate(PIO8);
                    if (j % 2 === 0) {
                        d.lineTo((c * 2 / 0.525731) * 0.200811, 0)
                    } else {
                        d.lineTo(c * 2, 0)
                    }
                }
                d.closePath()
            };
            d.shadowBlur = GLOWSHADOWBLUR;
            d.shadowColor = d.fillStyle = Asteroids.Colours.PLAYER_BOMB;
            d.translate(e.width * 0.5, e.height * 0.5);
            g.call(this);
            d.fill();
            var f = new Image();
            f.src = e.toDataURL("image/png");
            h.push(f);
            e.width = e.width;
            d.shadowBlur = GLOWSHADOWBLUR;
            d.shadowColor = d.strokeStyle = Asteroids.Colours.PLAYER_BOMB;
            d.lineWidth = 1.5;
            d.translate(e.width * 0.5, e.height * 0.5);
            d.scale(0.9, 0.9);
            g.call(this);
            d.stroke();
            f = new Image();
            f.src = e.toDataURL("image/png");
            h.push(f);
            return h
        }, "bomb");
        this.addRenderer(function(d) {
            var e, i = [];
            for (var g = 1; g <= 4; g++) {
                var h = [];
                for (var f = 1; f <= 4; f++) {
                    d.width = d.height = f * 16 + GLOWSHADOWBLUR * 2;
                    var c = d.getContext("2d");
                    c.shadowBlur = GLOWSHADOWBLUR;
                    c.shadowColor = c.strokeStyle = "white";
                    c.translate(d.width * 0.5, d.height * 0.5);
                    c.scale(f * 0.8, f * 0.8);
                    c.lineWidth = (0.8 / f) * 2.5;
                    c.beginPath();
                    switch (g) {
                    case 1:
                        c.moveTo(0, 10);
                        c.lineTo(8, 6);
                        c.lineTo(10, -4);
                        c.lineTo(4, -2);
                        c.lineTo(6, -6);
                        c.lineTo(0, -10);
                        c.lineTo(-10, -3);
                        c.lineTo(-10, 5);
                        break;
                    case 2:
                        c.moveTo(0, 10);
                        c.lineTo(8, 6);
                        c.lineTo(10, -4);
                        c.lineTo(4, -2);
                        c.lineTo(6, -6);
                        c.lineTo(0, -10);
                        c.lineTo(-8, -8);
                        c.lineTo(-6, -3);
                        c.lineTo(-8, -4);
                        c.lineTo(-10, 5);
                        break;
                    case 3:
                        c.moveTo(-4, 10);
                        c.lineTo(1, 8);
                        c.lineTo(7, 10);
                        c.lineTo(10, -4);
                        c.lineTo(4, -2);
                        c.lineTo(6, -6);
                        c.lineTo(0, -10);
                        c.lineTo(-10, -3);
                        c.lineTo(-10, 5);
                        break;
                    case 4:
                        c.moveTo(-8, 10);
                        c.lineTo(7, 8);
                        c.lineTo(10, -2);
                        c.lineTo(6, -10);
                        c.lineTo(-2, -8);
                        c.lineTo(-6, -10);
                        c.lineTo(-10, -6);
                        c.lineTo(-7, 0);
                        break
                    }
                    c.closePath();
                    c.stroke();
                    e = new Image();
                    e.src = d.toDataURL("image/png");
                    h.push(e)
                }
                i.push(h)
            }
            return i
        }, "asteroid");
        this.addRenderer(function(e) {
            var c = 4;
            var h = [];
            e.width = e.height = c * 2 + GLOWSHADOWBLUR * 2;
            var d = e.getContext("2d");
            var g = function() {
                d.beginPath();
                d.moveTo(c * 2, 0);
                for (var j = 0; j < 7; j++) {
                    d.rotate(PIO4);
                    if (j % 2 === 0) {
                        d.lineTo((c * 2 / 0.525731) * 0.200811, 0)
                    } else {
                        d.lineTo(c * 2, 0)
                    }
                }
                d.closePath()
            };
            d.shadowBlur = GLOWSHADOWBLUR;
            d.shadowColor = d.fillStyle = Asteroids.Colours.ENEMY_SHIP;
            d.translate(e.width * 0.5, e.height * 0.5);
            d.beginPath();
            d.arc(0, 0, c - 1, 0, TWOPI, true);
            d.closePath();
            d.fill();
            g.call(this);
            d.fill();
            var f = new Image();
            f.src = e.toDataURL("image/png");
            h.push(f);
            e.width = e.width;
            d.shadowBlur = GLOWSHADOWBLUR;
            d.shadowColor = d.strokeStyle = Asteroids.Colours.ENEMY_SHIP;
            d.lineWidth = 1.5;
            d.translate(e.width * 0.5, e.height * 0.5);
            d.scale(0.9, 0.9);
            d.beginPath();
            d.arc(0, 0, c - 1, 0, TWOPI, true);
            d.closePath();
            d.stroke();
            g.call(this);
            d.stroke();
            f = new Image();
            f.src = e.toDataURL("image/png");
            h.push(f);
            return h
        }, "enemybullet");
        return this
    }
    ;
    extend(Asteroids.Prerenderer, Game.Prerenderer)
}
)();
(function() {
    Asteroids.Player = function(n, l, m) {
        Asteroids.Player.superclass.constructor.call(this, n, l);
        this.heading = m;
        this.energy = this.ENERGY_INIT;
        this.animImage = g_shieldImg;
        this.animLength = this.SHIELD_ANIM_LENGTH;
        this.primaryWeapons = [];
        return this
    }
    ;
    extend(Asteroids.Player, Game.SpriteActor, {
        MAX_PLAYER_VELOCITY: 8,
        PLAYER_RADIUS: 9,
        SHIELD_RADIUS: 14,
        SHIELD_ANIM_LENGTH: 100,
        SHIELD_MIN_PULSE: 20,
        ENERGY_INIT: 400,
        THRUST_DELAY_MS: 100,
        BOMB_RECHARGE_MS: 800,
        BOMB_ENERGY: 80,
        heading: 0,
        energy: 0,
        shieldCounter: 0,
        alive: true,
        primaryWeapons: null,
        bombRecharge: 0,
        thrustRecharge: 0,
        engineThrust: false,
        killedOn: 0,
        fireWhenShield: false,
        onRender: function k(l) {
            var o = this.heading * RAD;
            if (this.engineThrust) {
                l.save();
                l.translate(this.position.x, this.position.y);
                l.rotate(o);
                l.globalAlpha = 0.5 + Rnd() * 0.5;
                if (BITMAPS) {
                    l.globalCompositeOperation = "lighter";
                    l.fillStyle = Asteroids.Colours.PLAYER_THRUST
                } else {
                    l.shadowColor = l.strokeStyle = Asteroids.Colours.PLAYER_THRUST
                }
                l.beginPath();
                l.moveTo(-5, 8);
                l.lineTo(5, 8);
                l.lineTo(0, 18 + Rnd() * 6);
                l.closePath();
                if (BITMAPS) {
                    l.fill()
                } else {
                    l.stroke()
                }
                l.restore();
                this.engineThrust = false
            }
            if (BITMAPS) {
                var n = (this.PLAYER_RADIUS * 2) + 6;
                var m = Floor(this.heading) % 360;
                if (m < 0) {
                    m = 360 + m
                }
                l.save();
                l.drawImage(g_playerImg, 0, Floor(m / 4) * 64, 64, 64, this.position.x - (n / 2), this.position.y - (n / 2), n, n);
                l.restore()
            } else {
                l.save();
                l.shadowColor = l.strokeStyle = "#fff";
                l.translate(this.position.x, this.position.y);
                l.rotate(o);
                l.beginPath();
                l.moveTo(-6, 8);
                l.lineTo(6, 8);
                l.lineTo(0, -8);
                l.closePath();
                l.stroke();
                l.restore()
            }
            if (this.shieldCounter > 0 && this.energy > 0) {
                if (BITMAPS) {
                    l.save();
                    l.translate(this.position.x, this.position.y);
                    l.rotate(o);
                    this.renderSprite(l, -this.SHIELD_RADIUS - 1, -this.SHIELD_RADIUS - 1, (this.SHIELD_RADIUS * 2) + 2);
                    l.restore()
                } else {
                    l.save();
                    l.translate(this.position.x, this.position.y);
                    l.rotate(o);
                    l.shadowColor = l.strokeStyle = Asteroids.Colours.PLAYER_SHIELD;
                    l.beginPath();
                    l.arc(0, 2, this.SHIELD_RADIUS, 0, TWOPI, true);
                    l.closePath();
                    l.stroke();
                    l.restore()
                }
                this.shieldCounter--;
                this.energy -= 1.5
            }
        },
        thrust: function a() {
            if (GameHandler.frameStart - this.thrustRecharge > this.THRUST_DELAY_MS) {
                this.thrustRecharge = GameHandler.frameStart;
                var l = new Vector(0,!iOS ? -0.5 : -1.25);
                l.rotate(this.heading * RAD);
                this.vector.add(l);
                if (this.vector.length() > this.MAX_PLAYER_VELOCITY) {
                    this.vector.scale(this.MAX_PLAYER_VELOCITY / this.vector.length())
                }
            }
            this.engineThrust = true
        },
        activateShield: function c() {
            if (this.energy >= this.SHIELD_MIN_PULSE) {
                this.shieldCounter = this.SHIELD_MIN_PULSE
            }
        },
        isShieldActive: function j() {
            return (this.shieldCounter > 0 && this.energy > 0)
        },
        radius: function f() {
            return (this.isShieldActive() ? this.SHIELD_RADIUS : this.PLAYER_RADIUS)
        },
        expired: function h() {
            return !(this.alive)
        },
        kill: function g() {
            this.alive = false;
            this.killedOn = GameHandler.frameStart
        },
        firePrimary: function e(p) {
            var n = false;
            if (this.alive && (!this.isShieldActive() || this.fireWhenShield)) {
                for (var m in this.primaryWeapons) {
                    var l = this.primaryWeapons[m].fire();
                    if (l) {
                        if (isArray(l)) {
                            for (var o = 0; o < l.length; o++) {
                                p.push(l[o])
                            }
                        } else {
                            p.push(l)
                        }
                        if (!n) {
                            GameHandler.playSound("laser");
                            n = true
                        }
                    }
                }
            }
        },
        fireSecondary: function i(m) {
            if (this.alive && (!this.isShieldActive() || this.fireWhenShield) && this.energy > this.BOMB_ENERGY) {
                if (GameHandler.frameStart - this.bombRecharge > this.BOMB_RECHARGE_MS) {
                    this.bombRecharge = GameHandler.frameStart;
                    this.energy -= this.BOMB_ENERGY;
                    var l = new Vector(0,-3);
                    l.rotate(this.heading * RAD);
                    l.add(this.vector);
                    m.push(new Asteroids.Bomb(this.position.clone(),l))
                }
            }
        },
        onUpdate: function b() {
            if (!this.isShieldActive() && this.energy < this.ENERGY_INIT) {
                this.energy += 0.1
            }
        },
        reset: function d(l) {
            this.alive = true;
            if (!l) {
                this.primaryWeapons = [];
                this.primaryWeapons.main = new Asteroids.PrimaryWeapon(this);
                this.fireWhenShield = false
            }
            this.energy = this.ENERGY_INIT + this.SHIELD_MIN_PULSE;
            this.activateShield()
        }
    })
}
)();
(function() {
    Asteroids.Asteroid = function(g, d, f, e) {
        Asteroids.Asteroid.superclass.constructor.call(this, g, d);
        this.size = f;
        this.health = f;
        if (e === undefined) {
            e = randomInt(1, 4)
        }
        this.animImage = g_asteroidImgs[e - 1];
        this.type = e;
        this.animForward = (Rnd() < 0.5);
        this.animSpeed = 0.3 + Rnd() * 0.5;
        this.animLength = this.ANIMATION_LENGTH;
        this.rotation = randomInt(0, 180);
        this.rotationSpeed = (Rnd() - 0.5) / 30;
        return this
    }
    ;
    extend(Asteroids.Asteroid, Game.EnemyActor, {
        ANIMATION_LENGTH: 180,
        size: 0,
        type: 1,
        health: 0,
        rotation: 0,
        rotationSpeed: 0,
        onRender: function c(e) {
            var d = this.size * 8;
            e.save();
            if (BITMAPS) {
                this.renderSprite(e, this.position.x - d - 2, this.position.y - d - 2, (d * 2) + 4)
            } else {
                var f = d * 2 + GLOWSHADOWBLUR * 2;
                Game.Util.renderImageRotated(e, GameHandler.bitmaps.images.asteroid[this.type - 1][this.size - 1], this.position.x, this.position.y, f, f, this.rotation += this.rotationSpeed)
            }
            e.restore()
        },
        radius: function a() {
            return this.size * 8
        },
        hit: function b(d) {
            if (d !== -1) {
                this.health -= d
            } else {
                this.health = 0
            }
            return !(this.alive = (this.health > 0))
        }
    })
}
)();
(function() {
    Asteroids.EnemyShip = function(i, g) {
        this.size = g;
        if (this.size === 1) {
            this.BULLET_RECHARGE_MS = 1300;
            this.RADIUS = 8
        }
        var h, f;
        if (i.player.position.x < GameHandler.width / 2) {
            if (i.player.position.y < GameHandler.height / 2) {
                h = new Vector(GameHandler.width - 48,GameHandler.height - 48)
            } else {
                h = new Vector(GameHandler.width - 48,48)
            }
            f = new Vector(-(Rnd() + 0.25 + g * 0.75),Rnd() + 0.25 + g * 0.75)
        } else {
            if (i.player.position.y < GameHandler.height / 2) {
                h = new Vector(0,GameHandler.height - 48)
            } else {
                h = new Vector(0,48)
            }
            f = new Vector(Rnd() + 0.25 + g * 0.75,Rnd() + 0.25 + g * 0.75)
        }
        this.animImage = g_enemyshipImg;
        this.animLength = this.SHIP_ANIM_LENGTH;
        Asteroids.EnemyShip.superclass.constructor.call(this, h, f);
        return this
    }
    ;
    extend(Asteroids.EnemyShip, Game.EnemyActor, {
        SHIP_ANIM_LENGTH: 90,
        RADIUS: 16,
        BULLET_RECHARGE_MS: 1800,
        alive: true,
        size: 0,
        bulletRecharge: 0,
        onUpdate: function b(h) {
            if (this.size === 0) {
                if (Rnd() < 0.01) {
                    this.vector.y = -(this.vector.y + (0.25 - (Rnd() / 2)))
                }
            } else {
                if (Rnd() < 0.02) {
                    this.vector.y = -(this.vector.y + (0.5 - Rnd()))
                }
            }
            if (GameHandler.frameStart - this.bulletRecharge > this.BULLET_RECHARGE_MS && h.player.alive) {
                this.bulletRecharge = GameHandler.frameStart;
                var g = h.player.position.clone().sub(this.position);
                var i = (this.size === 0 ? 3 : 3.5) / g.length();
                g.x *= i;
                g.y *= i;
                g.x += (this.size === 0 ? (Rnd() * 2 - 1) : (Rnd() - 0.5));
                g.y += (this.size === 0 ? (Rnd() * 2 - 1) : (Rnd() - 0.5));
                var f = new Asteroids.EnemyBullet(this.position.clone(),g);
                h.enemyBullets.push(f);
                GameHandler.playSound("enemy_bomb")
            }
        },
        onRender: function e(g) {
            if (BITMAPS) {
                var f = this.RADIUS + 2;
                this.renderSprite(g, this.position.x - f, this.position.y - f, f * 2, true)
            } else {
                g.save();
                g.translate(this.position.x, this.position.y);
                if (this.size === 0) {
                    g.scale(2, 2);
                    g.lineWidth = 0.75
                }
                g.beginPath();
                g.moveTo(0, -4);
                g.lineTo(8, 3);
                g.lineTo(0, 8);
                g.lineTo(-8, 3);
                g.lineTo(0, -4);
                g.closePath();
                g.shadowColor = g.strokeStyle = Asteroids.Colours.ENEMY_SHIP_DARK;
                g.stroke();
                g.beginPath();
                g.moveTo(0, -8);
                g.lineTo(4, -4);
                g.lineTo(0, 0);
                g.lineTo(-4, -4);
                g.lineTo(0, -8);
                g.closePath();
                g.shadowColor = g.strokeStyle = Asteroids.Colours.ENEMY_SHIP;
                g.stroke();
                g.restore()
            }
        },
        radius: function a() {
            return this.RADIUS
        },
        hit: function d() {
            this.alive = false;
            return true
        },
        expired: function c() {
            return !this.alive
        }
    })
}
)();
(function() {
    Asteroids.Weapon = function(a) {
        this.player = a;
        return this
    }
    ;
    Asteroids.Weapon.prototype = {
        WEAPON_RECHARGE: 125,
        weaponRecharge: 0,
        player: null,
        fire: function() {
            if (GameHandler.frameStart - this.weaponRecharge > this.WEAPON_RECHARGE) {
                this.weaponRecharge = GameHandler.frameStart;
                return this.doFire()
            }
        },
        doFire: function() {}
    }
}
)();
(function() {
    Asteroids.PrimaryWeapon = function(a) {
        Asteroids.PrimaryWeapon.superclass.constructor.call(this, a);
        return this
    }
    ;
    extend(Asteroids.PrimaryWeapon, Asteroids.Weapon, {
        doFire: function() {
            var a = new Vector(0,-4.5);
            a.rotate(this.player.heading * RAD);
            a.add(this.player.vector);
            return new Asteroids.Bullet(this.player.position.clone(),a,this.player.heading)
        }
    })
}
)();
(function() {
    Asteroids.TwinCannonsWeapon = function(a) {
        this.WEAPON_RECHARGE = 150;
        Asteroids.TwinCannonsWeapon.superclass.constructor.call(this, a);
        return this
    }
    ;
    extend(Asteroids.TwinCannonsWeapon, Asteroids.Weapon, {
        doFire: function() {
            var a = new Vector(0,-4.5);
            a.rotate(this.player.heading * RAD);
            a.add(this.player.vector);
            return new Asteroids.BulletX2(this.player.position.clone(),a,this.player.heading)
        }
    })
}
)();
(function() {
    Asteroids.VSprayCannonsWeapon = function(a) {
        this.WEAPON_RECHARGE = 250;
        Asteroids.VSprayCannonsWeapon.superclass.constructor.call(this, a);
        return this
    }
    ;
    extend(Asteroids.VSprayCannonsWeapon, Asteroids.Weapon, {
        doFire: function() {
            var b, c;
            var a = [];
            c = this.player.heading - 15;
            b = new Vector(0,-3.75).rotate(c * RAD).add(this.player.vector);
            a.push(new Asteroids.Bullet(this.player.position.clone(),b,c));
            c = this.player.heading;
            b = new Vector(0,-3.75).rotate(c * RAD).add(this.player.vector);
            a.push(new Asteroids.Bullet(this.player.position.clone(),b,c));
            c = this.player.heading + 15;
            b = new Vector(0,-3.75).rotate(c * RAD).add(this.player.vector);
            a.push(new Asteroids.Bullet(this.player.position.clone(),b,c));
            return a
        }
    })
}
)();
(function() {
    Asteroids.SideGunWeapon = function(a) {
        this.WEAPON_RECHARGE = 250;
        Asteroids.SideGunWeapon.superclass.constructor.call(this, a);
        return this
    }
    ;
    extend(Asteroids.SideGunWeapon, Asteroids.Weapon, {
        doFire: function() {
            var b, c;
            var a = [];
            c = this.player.heading - 90;
            b = new Vector(0,-4.5).rotate(c * RAD).add(this.player.vector);
            a.push(new Asteroids.Bullet(this.player.position.clone(),b,c,750));
            c = this.player.heading + 90;
            b = new Vector(0,-4.5).rotate(c * RAD).add(this.player.vector);
            a.push(new Asteroids.Bullet(this.player.position.clone(),b,c,750));
            return a
        }
    })
}
)();
(function() {
    Asteroids.RearGunWeapon = function(a) {
        this.WEAPON_RECHARGE = 250;
        Asteroids.RearGunWeapon.superclass.constructor.call(this, a);
        return this
    }
    ;
    extend(Asteroids.RearGunWeapon, Asteroids.Weapon, {
        doFire: function() {
            var a = new Vector(0,-4.5);
            var b = this.player.heading + 180;
            a.rotate(b * RAD);
            a.add(this.player.vector);
            return new Asteroids.Bullet(this.player.position.clone(),a,b,750)
        }
    })
}
)();
(function() {
    Asteroids.Bullet = function(k, g, i, j) {
        Asteroids.Bullet.superclass.constructor.call(this, k, g);
        this.heading = i;
        if (j) {
            this.lifespan = j
        }
        this.bulletStart = GameHandler.frameStart;
        return this
    }
    ;
    extend(Asteroids.Bullet, Game.Actor, {
        BULLET_WIDTH: 2,
        BULLET_HEIGHT: 6,
        FADE_LENGTH: 200,
        heading: 0,
        lifespan: 1300,
        bulletStart: 0,
        powerLevel: 1,
        onRender: function f(g) {
            if (GameHandler.frameStart - this.bulletStart > 40) {
                g.save();
                if (BITMAPS) {
                    g.globalCompositeOperation = "lighter"
                }
                g.globalAlpha = this.fadeValue(1, this.FADE_LENGTH);
                g.translate(this.position.x, this.position.y);
                g.rotate(this.heading * RAD);
                g.drawImage(GameHandler.bitmaps.images.bullet[BITMAPS ? 0 : 1], -(this.BULLET_WIDTH + GLOWSHADOWBLUR * 2) * 0.5, -(this.BULLET_HEIGHT + GLOWSHADOWBLUR * 2) * 0.5);
                g.restore()
            }
        },
        expired: function e() {
            return (GameHandler.frameStart - this.bulletStart > this.lifespan)
        },
        effectRadius: function c() {
            return 0
        },
        radius: function a() {
            return (this.BULLET_HEIGHT + this.BULLET_WIDTH) * 0.5
        },
        power: function d() {
            return this.powerLevel
        },
        fadeValue: function b(i, h) {
            var j = this.lifespan - (GameHandler.frameStart - this.bulletStart)
              , g = i;
            if (j < h) {
                g = (i / h) * j;
                if (g < 0) {
                    g = 0
                } else {
                    if (g > i) {
                        g = i
                    }
                }
            }
            return g
        }
    })
}
)();
(function() {
    Asteroids.BulletX2 = function(e, c, d) {
        Asteroids.BulletX2.superclass.constructor.call(this, e, c, d);
        this.lifespan = 1750;
        this.powerLevel = 2;
        return this
    }
    ;
    extend(Asteroids.BulletX2, Asteroids.Bullet, {
        onRender: function b(c) {
            if (GameHandler.frameStart - this.bulletStart > 40) {
                c.save();
                if (BITMAPS) {
                    c.globalCompositeOperation = "lighter"
                }
                c.globalAlpha = this.fadeValue(1, this.FADE_LENGTH);
                c.translate(this.position.x, this.position.y);
                c.rotate(this.heading * RAD);
                c.drawImage(GameHandler.bitmaps.images.bulletx2[BITMAPS ? 0 : 1], -(this.BULLET_WIDTH + GLOWSHADOWBLUR * 4) * 0.5, -(this.BULLET_HEIGHT + GLOWSHADOWBLUR * 2) * 0.5);
                c.restore()
            }
        },
        radius: function a() {
            return (this.BULLET_HEIGHT)
        }
    })
}
)();
(function() {
    Asteroids.Bomb = function(e, d) {
        Asteroids.Bomb.superclass.constructor.call(this, e, d);
        this.lifespan = 3000;
        return this
    }
    ;
    extend(Asteroids.Bomb, Asteroids.Bullet, {
        BOMB_RADIUS: 4,
        FADE_LENGTH: 200,
        EFFECT_RADIUS: 45,
        onRender: function c(d) {
            d.save();
            if (BITMAPS) {
                d.globalCompositeOperation = "lighter"
            }
            d.globalAlpha = this.fadeValue(1, this.FADE_LENGTH);
            d.translate(this.position.x, this.position.y);
            d.rotate((GameHandler.frameStart % (360 * 32)) / 32);
            var e = this.fadeValue(1, this.FADE_LENGTH);
            if (e <= 0) {
                e = 0.01
            }
            d.scale(e, e);
            d.drawImage(GameHandler.bitmaps.images.bomb[BITMAPS ? 0 : 1], -(this.BOMB_RADIUS * 2 + GLOWSHADOWBLUR * 2) * 0.5, -(this.BOMB_RADIUS * 2 + GLOWSHADOWBLUR * 2) * 0.5);
            d.restore()
        },
        effectRadius: function b() {
            return this.EFFECT_RADIUS
        },
        radius: function a() {
            return this.fadeValue(this.BOMB_RADIUS, this.FADE_LENGTH)
        }
    })
}
)();
(function() {
    Asteroids.EnemyBullet = function(d, c) {
        Asteroids.EnemyBullet.superclass.constructor.call(this, d, c, 0);
        this.lifespan = 2800;
        return this
    }
    ;
    extend(Asteroids.EnemyBullet, Asteroids.Bullet, {
        BULLET_RADIUS: 4,
        FADE_LENGTH: 200,
        onRender: function b(c) {
            c.save();
            c.globalAlpha = this.fadeValue(1, this.FADE_LENGTH);
            if (BITMAPS) {
                c.globalCompositeOperation = "lighter"
            }
            c.translate(this.position.x, this.position.y);
            c.rotate((GameHandler.frameStart % (360 * 64)) / 64);
            var d = this.fadeValue(1, this.FADE_LENGTH);
            if (d <= 0) {
                d = 0.01
            }
            c.scale(d, d);
            c.drawImage(GameHandler.bitmaps.images.enemybullet[BITMAPS ? 0 : 1], -(this.BULLET_RADIUS * 2 + GLOWSHADOWBLUR * 2) * 0.5, -(this.BULLET_RADIUS * 2 + GLOWSHADOWBLUR * 2) * 0.5);
            c.restore()
        },
        radius: function a() {
            return this.fadeValue(this.BULLET_RADIUS, this.FADE_LENGTH) + 1
        }
    })
}
)();
(function() {
    Asteroids.Particles = function(g, c, f, d) {
        Asteroids.Particles.superclass.constructor.call(this, g, c);
        this.particles = new Array(f);
        for (var e = 0; e < f; e++) {
            this.particles[e] = d.call(this, e)
        }
        return this
    }
    ;
    extend(Asteroids.Particles, Game.Actor, {
        particles: null,
        onRender: function b(c) {
            c.save();
            c.shadowBlur = 0;
            c.globalCompositeOperation = "lighter";
            for (var d = 0, e; d < this.particles.length; d++) {
                e = this.particles[d];
                if (e.update()) {
                    c.save();
                    e.render(c);
                    c.restore()
                } else {
                    this.particles.splice(d, 1)
                }
            }
            c.restore()
        },
        expired: function a() {
            return (this.particles.length === 0)
        }
    })
}
)();
function AsteroidsParticle(a, b, c, d, g, e, f) {
    this.particleStart = GameHandler.frameStart;
    this.position = a;
    this.vector = b;
    this.size = c;
    this.type = d;
    this.lifespan = g;
    this.fadelength = e;
    this.colour = f ? f : Asteroids.Colours.PARTICLE;
    if (d === 1) {
        this.rotate = Rnd() * TWOPI;
        this.rotationv = (Rnd() - 0.5) * 0.5
    }
    this.fadeValue = function(j, i) {
        var k = this.lifespan - (GameHandler.frameStart - this.particleStart)
          , h = j;
        if (k < i) {
            h = (j / i) * k;
            if (h < 0) {
                h = 0
            } else {
                if (h > j) {
                    h = j
                }
            }
        }
        return h
    }
    ;
    this.update = function() {
        this.position.add(this.vector);
        return !(GameHandler.frameStart - this.particleStart > this.lifespan)
    }
    ;
    this.render = function(h) {
        h.globalAlpha = this.fadeValue(1, this.fadelength);
        switch (this.type) {
        case 0:
            h.translate(this.position.x, this.position.y);
            h.drawImage(GameHandler.bitmaps.images["points_" + this.colour][this.size], 0, 0);
            break;
        case 1:
            h.translate(this.position.x, this.position.y);
            var i = this.size;
            h.rotate(this.rotate);
            this.rotate += this.rotationv;
            h.strokeStyle = this.colour;
            h.lineWidth = 1.5;
            h.beginPath();
            h.moveTo(-i, -i);
            h.lineTo(i, i);
            h.closePath();
            h.stroke();
            break;
        case 2:
            var j = (this.size + 1) << 2;
            Game.Util.renderImage(h, GameHandler.bitmaps.images["smudges_" + this.colour][this.size], 0, 0, (this.size + 1) << 3, this.position.x - j, this.position.y - j, (this.size + 1) << 3);
            break
        }
    }
}
(function() {
    Asteroids.AsteroidExplosion = function(d, a, b) {
        var c = (BITMAPS ? b.size * 2 : b.size + 2);
        Asteroids.AsteroidExplosion.superclass.constructor.call(this, d, a, c, function() {
            var f = d.clone();
            if (BITMAPS) {
                if (Rnd() < 0.5) {
                    var e = new Vector(0,randomInt(5, 10));
                    e.rotate(Rnd() * TWOPI).add(a);
                    return new AsteroidsParticle(f,e,~~(Rnd() * 4),0,400,300)
                } else {
                    var e = new Vector(0,randomInt(1, 3));
                    e.rotate(Rnd() * TWOPI).add(a);
                    return new AsteroidsParticle(f,e,~~(Rnd() * 4) + b.size,2,500,250)
                }
            } else {
                var e = new Vector(0,randomInt(2, 5));
                e.rotate(Rnd() * TWOPI).add(a);
                return new AsteroidsParticle(f,e,Rnd() * b.size + 4,1,400,300,"white")
            }
        });
        return this
    }
    ;
    extend(Asteroids.AsteroidExplosion, Asteroids.Particles)
}
)();
(function() {
    Asteroids.PlayerExplosion = function(c, a) {
        var b = (BITMAPS ? 12 : 3);
        Asteroids.PlayerExplosion.superclass.constructor.call(this, c, a, b, function() {
            var e = c.clone();
            if (BITMAPS) {
                if (Rnd() < 0.5) {
                    var d = new Vector(0,randomInt(5, 10));
                    d.rotate(Rnd() * TWOPI).add(a);
                    return new AsteroidsParticle(e,d,~~(Rnd() * 4),0,400,300)
                } else {
                    var d = new Vector(0,randomInt(1, 3));
                    d.rotate(Rnd() * TWOPI).add(a);
                    return new AsteroidsParticle(e,d,~~(Rnd() * 4) + 2,2,500,250)
                }
            } else {
                var d = new Vector(0,randomInt(2, 5));
                d.rotate(Rnd() * TWOPI).add(a);
                return new AsteroidsParticle(e,d,6,1,400,300,"white")
            }
        });
        return this
    }
    ;
    extend(Asteroids.PlayerExplosion, Asteroids.Particles)
}
)();
(function() {
    Asteroids.EnemyExplosion = function(d, b, a) {
        var c = (BITMAPS ? 8 : 6);
        Asteroids.EnemyExplosion.superclass.constructor.call(this, d, b, c, function() {
            var f = d.clone();
            if (BITMAPS) {
                if (Rnd() < 0.5) {
                    var e = new Vector(0,randomInt(5, 10));
                    e.rotate(Rnd() * TWOPI).add(b);
                    return new AsteroidsParticle(f,e,~~(Rnd() * 4),0,400,300,Asteroids.Colours.ENEMY_SHIP)
                } else {
                    var e = new Vector(0,randomInt(1, 3));
                    e.rotate(Rnd() * TWOPI).add(b);
                    return new AsteroidsParticle(f,e,~~(Rnd() * 4) + (a.size === 0 ? 2 : 0),2,500,250,Asteroids.Colours.ENEMY_SHIP)
                }
            } else {
                var e = new Vector(0,randomInt(2, 4));
                e.rotate(Rnd() * TWOPI).add(b);
                return new AsteroidsParticle(f,e,(a.size === 0 ? 8 : 4),1,400,300,Asteroids.Colours.ENEMY_SHIP)
            }
        });
        return this
    }
    ;
    extend(Asteroids.EnemyExplosion, Asteroids.Particles)
}
)();
(function() {
    Asteroids.Explosion = function(d, b, c) {
        Asteroids.Explosion.superclass.constructor.call(this, d, b, this.FADE_LENGTH);
        this.size = c;
        return this
    }
    ;
    extend(Asteroids.Explosion, Game.EffectActor, {
        FADE_LENGTH: 300,
        size: 0,
        onRender: function a(c) {
            var e = Floor(this.effectValue(255))
              , b = this.effectValue(this.size * 8)
              , d = e.toString();
            c.save();
            c.globalAlpha = 0.75;
            c.fillStyle = "rgb(" + d + ",0,0)";
            c.beginPath();
            c.arc(this.position.x, this.position.y, b, 0, TWOPI, true);
            c.closePath();
            c.fill();
            c.restore()
        }
    })
}
)();
(function() {
    Asteroids.PlayerBulletImpact = function(b, a) {
        Asteroids.PlayerBulletImpact.superclass.constructor.call(this, b, a, 5, function() {
            var c = a.nscale(0.75 + Rnd() * 0.5);
            c.rotate(Rnd() * PIO4 - PIO8);
            return new AsteroidsParticle(b.clone(),c,~~(Rnd() * 4),0,250,150,Asteroids.Colours.GREEN_LASER)
        });
        return this
    }
    ;
    extend(Asteroids.PlayerBulletImpact, Asteroids.Particles)
}
)();
(function() {
    Asteroids.EnemyBulletImpact = function(b, a) {
        Asteroids.EnemyBulletImpact.superclass.constructor.call(this, b, a, 5, function() {
            var c = a.nscale(0.75 + Rnd() * 0.5);
            c.rotate(Rnd() * PIO4 - PIO8);
            return new AsteroidsParticle(b.clone(),c,~~(Rnd() * 4),0,250,150,Asteroids.Colours.ENEMY_SHIP)
        });
        return this
    }
    ;
    extend(Asteroids.EnemyBulletImpact, Asteroids.Particles)
}
)();
(function() {
    Asteroids.TextIndicator = function(f, b, g, d, e, c) {
        this.fadeLength = (c ? c : this.DEFAULT_FADE_LENGTH);
        Asteroids.TextIndicator.superclass.constructor.call(this, f, b, this.fadeLength);
        this.msg = g;
        if (d) {
            this.textSize = d
        }
        if (e) {
            this.colour = e
        }
        return this
    }
    ;
    extend(Asteroids.TextIndicator, Game.EffectActor, {
        DEFAULT_FADE_LENGTH: 500,
        fadeLength: 0,
        textSize: 12,
        msg: null,
        colour: "white",
        onRender: function a(b) {
            var c = this.effectValue(1);
            b.save();
            b.globalAlpha = c;
            Game.fillText(b, this.msg, this.textSize + "pt Courier New", this.position.x, this.position.y, this.colour);
            b.restore()
        }
    })
}
)();
(function() {
    Asteroids.ScoreIndicator = function(f, a, h, d, c, e, b) {
        var g = h.toString();
        if (c) {
            g = c + " " + g
        }
        Asteroids.ScoreIndicator.superclass.constructor.call(this, f, a, g, d, e, b);
        return this
    }
    ;
    extend(Asteroids.ScoreIndicator, Asteroids.TextIndicator)
}
)();
(function() {
    Asteroids.PowerUp = function(e, d) {
        Asteroids.PowerUp.superclass.constructor.call(this, e, d);
        return this
    }
    ;
    extend(Asteroids.PowerUp, Game.EffectActor, {
        RADIUS: 8,
        pulse: 128,
        pulseinc: 5,
        onRender: function c(d) {
            d.save();
            d.globalAlpha = 0.75;
            var e = "rgb(255," + this.pulse.toString() + ",0)";
            if (BITMAPS) {
                d.fillStyle = e;
                d.strokeStyle = "rgb(255,255,128)"
            } else {
                d.lineWidth = 2;
                d.shadowColor = d.strokeStyle = e
            }
            d.beginPath();
            d.arc(this.position.x, this.position.y, this.RADIUS, 0, TWOPI, true);
            d.closePath();
            if (BITMAPS) {
                d.fill()
            }
            d.stroke();
            d.restore();
            this.pulse += this.pulseinc;
            if (this.pulse > 255) {
                this.pulse = 256 - this.pulseinc;
                this.pulseinc = -this.pulseinc
            } else {
                if (this.pulse < 0) {
                    this.pulse = 0 - this.pulseinc;
                    this.pulseinc = -this.pulseinc
                }
            }
        },
        radius: function a() {
            return this.RADIUS
        },
        collected: function b(o, l, i) {
            var q = null;
            switch (randomInt(0, 9)) {
            case 0:
            case 1:
                q = Game.Util.message("powerup-energy-boost");
                l.energy += l.ENERGY_INIT / 2;
                if (l.energy > l.ENERGY_INIT) {
                    l.energy = l.ENERGY_INIT
                }
                break;
            case 2:
                q = Game.Util.message("powerup-fire-shielded");
                l.fireWhenShield = true;
                break;
            case 3:
                q = Game.Util.message("powerup-extra-life");
                o.lives++;
                break;
            case 4:
                q = Game.Util.message("powerup-slow-asteroids");
                for (var f = 0, g = i.enemies.length, h; f < g; f++) {
                    h = i.enemies[f];
                    if (h instanceof Asteroids.Asteroid) {
                        h.vector.scale(0.66)
                    }
                }
                break;
            case 5:
                q = Game.Util.message("powerup-smart-bomb");
                var j = 96;
                var e = new Asteroids.Explosion(this.position.clone(),this.vector.clone().scale(0.5),j / 8);
                i.effects.push(e);
                for (var f = 0, h, k = this.position; f < i.enemies.length; f++) {
                    h = i.enemies[f];
                    if (k.distance(h.position) <= j + h.radius()) {
                        h.hit(-1);
                        i.generatePowerUp(h);
                        i.destroyEnemy(h, this.vector, true)
                    }
                }
                break;
            case 6:
                q = Game.Util.message("powerup-twin-cannons");
                l.primaryWeapons.main = new Asteroids.TwinCannonsWeapon(l);
                break;
            case 7:
                q = Game.Util.message("powerup-spray-cannons");
                l.primaryWeapons.main = new Asteroids.VSprayCannonsWeapon(l);
                break;
            case 8:
                q = Game.Util.message("powerup-rear-gun");
                l.primaryWeapons.rear = new Asteroids.RearGunWeapon(l);
                break;
            case 9:
                q = Game.Util.message("powerup-side-guns");
                l.primaryWeapons.side = new Asteroids.SideGunWeapon(l);
                break
            }
            if (q) {
                var d = new Vector(0,-1.5);
                var p = new Asteroids.TextIndicator(new Vector(this.position.x,this.position.y - this.RADIUS),d,q,null,null,700);
                i.effects.push(p)
            }
        }
    })
}
)();
