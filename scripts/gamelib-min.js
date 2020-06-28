var iOS = (navigator.userAgent.indexOf("iPhone;") != -1 || navigator.userAgent.indexOf("iPod;") != -1 || navigator.userAgent.indexOf("iPad;") != -1);
var isFireFox = (navigator.userAgent.indexOf(" Firefox/") != -1);
var GameHandler = {
    game: null,
    paused: false,
    canvas: null,
    width: 0,
    height: 0,
    frameCount: 0,
    frameMultipler: 1,
    frameStart: 0,
    maxfps: 0,
    FPSMS: 1000 / 60,
    KEY: {
        SHIFT: 16,
        CTRL: 17,
        ESC: 27,
        RIGHT: 39,
        UP: 38,
        LEFT: 37,
        DOWN: 40,
        SPACE: 32,
        A: 65,
        E: 69,
        G: 71,
        L: 76,
        P: 80,
        R: 82,
        S: 83,
        Z: 90
    },
    GAMEPAD: 1000,
    audioContext: null,
    hasAudio: function() {
        return this.audioContext !== null
    },
    audioComp: null,
    audioGain: null,
    sounds: {},
    soundEnabled: true,
    init: function() {
        this.canvas = document.getElementById("canvas");
        this.width = this.canvas.height;
        this.height = this.canvas.width;
        this.audioContext = typeof AudioContext === "function" ? new AudioContext() : null;
        if (this.audioContext) {
            this.audioGain = this.audioContext.createGain();
            this.audioGain.gain.value = 0.05;
            this.audioComp = this.audioContext.createDynamicsCompressor();
            this.audioGain.connect(this.audioComp);
            this.audioComp.connect(this.audioContext.destination)
        }
    },
    start: function(a) {
        if (a instanceof Game.Main) {
            this.game = a;
            GameHandler.frameStart = Date.now()
        }
        GameHandler.game.frame.call(GameHandler.game)
    },
    pause: function() {
        if (this.paused) {
            this.paused = false;
            GameHandler.frameStart = Date.now();
            GameHandler.game.frame.call(GameHandler.game)
        } else {
            this.paused = true
        }
    },
    loadSound: function(a, d) {
        if (this.hasAudio()) {
            var c = new XMLHttpRequest();
            c.open("GET", a, true);
            c.responseType = "arraybuffer";
            var b = this;
            c.onload = function() {
                b.audioContext.decodeAudioData(c.response, function(e) {
                    b.sounds[d] = e
                })
            }
            ;
            c.send()
        }
    },
    playSound: function(b) {
        if (this.soundEnabled && this.hasAudio() && this.sounds[b]) {
            var a = this.audioContext.createBufferSource();
            a.buffer = this.sounds[b];
            a.connect(this.audioGain);
            a.start(0)
        }
    }
};
if (typeof Game == "undefined" || !Game) {
    var Game = {}
}
(function() {
    Game.Main = function() {
        var f = this;
        document.onkeydown = function(h) {
            var i = h.keyCode;
            if (f.sceneIndex !== -1) {
                if (f.scenes[f.sceneIndex].onKeyDownHandler(i)) {
                    h.preventDefault();
                    h.stopPropagation()
                }
            } else {
                if (i === GameHandler.KEY.SPACE) {
                    h.preventDefault();
                    h.stopPropagation()
                }
            }
        }
        ;
        document.onkeyup = function(h) {
            var i = h.keyCode;
            if (f.sceneIndex !== -1) {
                if (f.scenes[f.sceneIndex].onKeyUpHandler(i)) {
                    h.preventDefault();
                    h.stopPropagation()
                }
            } else {
                if (i === GameHandler.KEY.SPACE) {
                    h.preventDefault();
                    h.stopPropagation()
                }
            }
        }
        ;
        if (iOS) {
            document.body.addEventListener("touchstart", function d(h) {
                if (f.sceneIndex !== -1) {
                    if (f.scenes[f.sceneIndex].onTouchStartHandler(h)) {
                        h.preventDefault()
                    }
                }
            }, false);
            document.body.addEventListener("touchmove", function g(h) {
                if (f.sceneIndex !== -1) {
                    if (f.scenes[f.sceneIndex].onTouchMoveHandler(h)) {
                        h.preventDefault()
                    }
                }
            }, true);
            document.body.addEventListener("touchend", function e(h) {
                if (f.sceneIndex !== -1) {
                    if (f.scenes[f.sceneIndex].onTouchEndHandler(h)) {
                        h.preventDefault()
                    }
                }
            }, false);
            document.body.addEventListener("touchcancel", function e(h) {
                if (f.sceneIndex !== -1) {
                    if (f.scenes[f.sceneIndex].onTouchEndHandler(h)) {
                        h.preventDefault()
                    }
                }
            }, false)
        }
    }
    ;
    Game.Main.prototype = {
        scenes: [],
        startScene: null,
        endScene: null,
        currentScene: null,
        sceneIndex: -1,
        interval: null,
        frame: function b() {
            var h = Date.now();
            var g = this.currentScene;
            if (g === null) {
                this.sceneIndex = 0;
                g = this.scenes[0];
                g.onInitScene()
            } else {
                if (this.isGameOver()) {
                    this.sceneIndex = -1;
                    g = this.endScene;
                    g.onInitScene()
                }
            }
            if ((g.interval === null || g.interval.complete) && g.isComplete()) {
                this.sceneIndex++;
                if (this.sceneIndex < this.scenes.length) {
                    g = this.scenes[this.sceneIndex]
                } else {
                    this.sceneIndex = 0;
                    g = this.scenes[0]
                }
                g.onInitScene()
            }
            var e = GameHandler.canvas.getContext("2d");
            e.save();
            if (g.interval === null || g.interval.complete) {
                g.onBeforeRenderScene();
                this.onRenderGame(e);
                g.onRenderScene(e)
            } else {
                this.onRenderGame(e);
                g.interval.intervalRenderer.call(g, g.interval, e)
            }
            e.restore();
            this.currentScene = g;
            GameHandler.frameCount++;
            var f = h - GameHandler.frameStart;
            if (f === 0) {
                f = 1
            }
            if (GameHandler.frameCount % 16 === 0) {
                GameHandler.maxfps = ~~(1000 / f)
            }
            GameHandler.frameMultipler = f / GameHandler.FPSMS;
            GameHandler.frameStart = h;
            var d = ~~(GameHandler.FPSMS - (Date.now() - h));
            if (!GameHandler.paused) {
                requestAnimFrame(GameHandler.start, d)
            }
        },
        onRenderGame: function a(d) {},
        isGameOver: function c() {
            return false
        }
    }
}
)();
(function() {
    Game.Scene = function(n, m) {
        this.playable = n;
        this.interval = m
    }
    ;
    Game.Scene.prototype = {
        playable: true,
        interval: null,
        isPlayable: function d() {
            return this.playable
        },
        onInitScene: function i() {
            if (this.interval !== null) {
                this.interval.reset()
            }
        },
        onBeforeRenderScene: function f() {},
        onRenderScene: function c(m) {},
        onRenderInterval: function e(m) {},
        onKeyDownHandler: function k(m) {},
        onKeyUpHandler: function j(m) {},
        onAxisHandler: function b(m, n) {},
        onTouchStartHandler: function h(m) {},
        onTouchMoveHandler: function a(m) {},
        onTouchEndHandler: function g(m) {},
        isComplete: function l() {
            return false
        }
    }
}
)();
(function() {
    Game.Interval = function(b, c) {
        this.label = b;
        this.intervalRenderer = c;
        this.framecounter = 0;
        this.complete = false
    }
    ;
    Game.Interval.prototype = {
        label: null,
        intervalRenderer: null,
        framecounter: 0,
        complete: false,
        reset: function a() {
            this.framecounter = 0;
            this.complete = false
        }
    }
}
)();
(function() {
    Game.Actor = function(e, d) {
        this.position = e;
        this.vector = d;
        return this
    }
    ;
    Game.Actor.prototype = {
        position: null,
        vector: null,
        onUpdate: function a() {},
        onRender: function c(d) {},
        expired: function b() {
            return false
        }
    }
}
)();
(function() {
    Game.SpriteActor = function(d, b, c) {
        Game.SpriteActor.superclass.constructor.call(this, d, b);
        if (c) {
            this.frameSize = c
        }
        return this
    }
    ;
    extend(Game.SpriteActor, Game.Actor, {
        frameSize: 64,
        animImage: null,
        animLength: 0,
        animForward: true,
        animSpeed: 1,
        animFrame: 0,
        renderSprite: function a(c, b, e, d) {
            Game.Util.renderImage(c, this.animImage, 0, this.animFrame << 6, this.frameSize, b, e, d);
            if (this.animForward) {
                this.animFrame += (this.animSpeed * GameHandler.frameMultipler);
                if (this.animFrame >= this.animLength) {
                    this.animFrame = 0
                }
            } else {
                this.animFrame -= (this.animSpeed * GameHandler.frameMultipler);
                if (this.animFrame < 0) {
                    this.animFrame = this.animLength - 1
                }
            }
        }
    })
}
)();
(function() {
    Game.EnemyActor = function(d, c) {
        this.position = d;
        this.vector = c;
        return this
    }
    ;
    extend(Game.EnemyActor, Game.SpriteActor, {
        alive: true,
        expired: function a() {
            return !(this.alive)
        },
        hit: function b(c) {
            this.alive = false;
            return true
        }
    })
}
)();
(function() {
    Game.EffectActor = function(e, c, d) {
        Game.EffectActor.superclass.constructor.call(this, e, c);
        this.lifespan = d;
        this.effectStart = GameHandler.frameStart;
        return this
    }
    ;
    extend(Game.EffectActor, Game.Actor, {
        lifespan: 0,
        effectStart: 0,
        expired: function a() {
            return (GameHandler.frameStart - this.effectStart > this.lifespan)
        },
        effectValue: function b(d) {
            var c = d - ((d / this.lifespan) * (GameHandler.frameStart - this.effectStart));
            if (c < 0) {
                c = 0
            } else {
                if (c > d) {
                    c = d
                }
            }
            return c
        }
    })
}
)();
(function() {
    Game.Preloader = function() {
        this.images = new Array();
        return this
    }
    ;
    Game.Preloader.prototype = {
        images: null,
        callback: null,
        counter: 0,
        addImage: function b(c, d) {
            var e = this;
            c.url = d;
            c.onload = function() {
                e.counter++;
                if (e.counter === e.images.length) {
                    e.callback.call(e)
                }
            }
            ;
            this.images.push(c)
        },
        onLoadCallback: function a(e) {
            this.counter = 0;
            this.callback = e;
            for (var d = 0, c = this.images.length; d < c; d++) {
                this.images[d].src = this.images[d].url
            }
        }
    }
}
)();
Game.drawText = function(e, b, c, a, f, d) {
    e.save();
    if (d) {
        e.strokeStyle = d
    }
    e.font = c;
    e.strokeText(b, a, f);
    e.restore()
}
;
Game.centerDrawText = function(d, a, b, e, c) {
    d.save();
    if (c) {
        d.strokeStyle = c
    }
    d.font = b;
    d.strokeText(a, (GameHandler.width - d.measureText(a).width) / 2, e);
    d.restore()
}
;
Game.fillText = function(e, b, c, a, f, d) {
    e.save();
    if (d) {
        e.fillStyle = d
    }
    e.font = c;
    e.fillText(b, a, f);
    e.restore()
}
;
Game.centerFillText = function(d, a, b, e, c) {
    d.save();
    if (c) {
        d.fillStyle = c
    }
    d.font = b;
    d.fillText(a, (GameHandler.width - d.measureText(a).width) / 2, e);
    d.restore()
}
;
Game.Util = {};
Game.Util.renderImage = function renderImage(c, f, b, h, e, a, g, d) {
    c.drawImage(f, b, h, e, e, a, g, d, d);
    if (a < 0) {
        c.drawImage(f, b, h, e, e, GameHandler.width + a, g, d, d)
    }
    if (g < 0) {
        c.drawImage(f, b, h, e, e, a, GameHandler.height + g, d, d)
    }
    if (a < 0 && g < 0) {
        c.drawImage(f, b, h, e, e, GameHandler.width + a, GameHandler.height + g, d, d)
    }
    if (a + d > GameHandler.width) {
        c.drawImage(f, b, h, e, e, a - GameHandler.width, g, d, d)
    }
    if (g + d > GameHandler.height) {
        c.drawImage(f, b, h, e, e, a, g - GameHandler.height, d, d)
    }
    if (a + d > GameHandler.width && g + d > GameHandler.height) {
        c.drawImage(f, b, h, e, e, a - GameHandler.width, g - GameHandler.height, d, d)
    }
}
;
Game.Util.renderImageRotated = function renderImageRotated(k, b, g, f, i, d, a) {
    var c = i * 0.5
      , e = d * 0.5;
    var j = function(l, h) {
        k.save();
        k.translate(l, h);
        k.rotate(a);
        k.drawImage(b, -c, -e);
        k.restore()
    };
    j.call(this, g, f);
    if (g - c < 0) {
        j.call(this, GameHandler.width + g, f)
    }
    if (f - e < 0) {
        j.call(this, g, GameHandler.height + f)
    }
    if (g - c < 0 && f - e < 0) {
        j.call(this, GameHandler.width + g, GameHandler.height + f)
    }
    if (g - c + i > GameHandler.width) {
        j.call(this, g - GameHandler.width, f)
    }
    if (f - e + d > GameHandler.height) {
        j.call(this, g, f - GameHandler.height)
    }
    if (g - c + i > GameHandler.width && f - e + d > GameHandler.height) {
        j.call(this, g - GameHandler.width, f - GameHandler.height)
    }
}
;
Game.Util.messages = {};
Game.Util.message = function message(a) {
    var b = Game.Util.messages[a];
    return (b ? b : a)
}
;
Game.Util.loadMessages = function loadMessages(a) {
    var b = new XMLHttpRequest();
    if (b.overrideMimeType) {
        b.overrideMimeType("text/plain; charset=utf-8")
    }
    b.open("GET", "messages-" + a + ".txt", false);
    b.onreadystatechange = function(g) {
        if (b.readyState === 4) {
            if (b.status === 200 || b.status === 0) {
                if (b.responseText !== null) {
                    var f = b.responseText.split("\n");
                    for (var d = 0; d < f.length; d++) {
                        var c = f[d].split("=");
                        if (c[0] && c[1]) {
                            Game.Util.messages[c[0]] = c[1]
                        }
                    }
                }
            }
        }
    }
    ;
    b.send(null)
}
;
(function() {
    Game.Prerenderer = function() {
        this.images = [];
        this._renderers = [];
        return this
    }
    ;
    Game.Prerenderer.prototype = {
        images: null,
        _renderers: null,
        addRenderer: function a(c, d) {
            this._renderers[d] = c
        },
        execute: function b() {
            var c = document.createElement("canvas");
            for (var d in this._renderers) {
                this.images[d] = this._renderers[d].call(this, c)
            }
        }
    }
}
)();
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(b, a) {
        window.setTimeout(b, a)
    }
}
)();
