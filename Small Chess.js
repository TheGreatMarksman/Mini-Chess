'use strict';

//---------------------------------------------------------------------------
// CONSTANTS
//---------------------------------------------------------------------------

const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 800;
//console.log(screen.width);
const WINDOW_SCREEN_DIFFERENCE = (screen.width/2)-(SCREEN_WIDTH/2) - 9;
//console.log("diff " + WINDOW_SCREEN_DIFFERENCE);
const TILE_WIDTH = 130; // 390/3 so 10 pixels of border
const TILE_HEIGHT = 130; // 780/6 so 20 pixels of border
const HORIZONTAL_MARGIN = 5;
const VERTICAL_MARGIN = 10;
//---------------------------------------------------------------------------
// GLOBALS
//---------------------------------------------------------------------------
var screen;
var board = Array(18);
var pieces = [];
var playerColour;
var playersTurn = false;
var pieceSelectedNumber = -1;
var pieceSelectedMoves = [];
var gameStarted = false;
var counter = 0;
var oldTimeStamp = 0;
var movingPieceNumber = -1;

//---------------------------------------------------------------------------
// INTERRUPTS
//---------------------------------------------------------------------------
document.addEventListener("mousedown", event => {
    //console.log(screen.width);
    //console.log("x " + (event.clientX-WINDOW_SCREEN_DIFFERENCE) + " y " + event.clientY);
    //console.log("clientx " + (event.clientX) + " clienty " + event.clientY);
    //let cheese = document.getElementById("game").style.margin;
    //console.log(cheese);
    if(!gameStarted){
        gameStarted = true;
        createWorld();
        drawScreen();
        runGame(0);
    }
    if(gameStarted && playersTurn && movingPieceNumber == -1){
        if(pieceSelectedNumber == -1){
            for(let i = 0; i < board.length; i++){
                if(clickingTile(i, event.clientX-WINDOW_SCREEN_DIFFERENCE, event.clientY) && board[i].piece != null){
                    //if(clickingTile(i, event.clientX, event.clientY)){
                    //console.log("clicking " + i);
                    //console.log("x " + (event.clientX-WINDOW_SCREEN_DIFFERENCE) + " y " + event.clientY);
                    if(pieces[board[i].piece].colour == playerColour){
                        //let original = pieces[board[i][j].piece].type;
                        //console.log("test " + original);

                        pieceSelectedNumber = board[i].piece;
                        //console.log("clicking tile " + i + ". Piece: " + pieces[board[i].piece].type);
                        pieceSelectedMoves = viableMoves(pieceSelectedNumber, playerColour);
                        //drawScreen();
                        
                        // for(let i = 0; i < board.length; i++){
                        //     if(board[i].piece != null) console.log("board " + i + ": " + pieces[board[i].piece].colour + " " + pieces[board[i].piece].type + " #" + board[i].piece);
                        // }
                    }
                }
             }
        }else{
            for(let i = 0; i < board.length; i++){
                if(clickingTile(i, event.clientX-WINDOW_SCREEN_DIFFERENCE, event.clientY)){
                    if(board[i].piece != null && board[i].piece == pieceSelectedNumber){
                        pieceSelectedNumber = -1;
                        drawScreen();
                    }else{
                        for(let m = 0; m < pieceSelectedMoves.length; m++){
                            if(pieceSelectedMoves[m] == i){
                                if(board[i].piece != null){
                                    if(pieceSelectedNumber >= board[i].piece) pieceSelectedNumber -= 1;
                                    removePiece(i);
                                }
                                let selectedTile = findPieceTile(pieceSelectedNumber);
                                board[selectedTile].piece = null;
                                board[i].piece = pieceSelectedNumber;
                                movingPieceNumber = pieceSelectedNumber;
                                pieceSelectedNumber = -1;
                            }
                        }
                    }
                }
            }
        }
    }
});

//---------------------------------------------------------------------------
// ClASS Easing
//---------------------------------------------------------------------------
class Easing{
    constructor(style="Linear", valueStart=0, valueEnd=0, duration=0){
        this.setEasing(style, valueStart, valueEnd, duration);
        this.whenDone = function() {};
    }
    update(secondsPassed){
        this.secondsRemaining -= secondsPassed;
        if(this.secondsRemaining < 0) this.secondsRemaining = 0;
    }
    calculateEasing(easingStyle, time, beginningVal, changeInVal, duration){
        //set working variables
        let t = time;
        let b = beginningVal;
        let c = changeInVal;
        let d = duration;
        //find easing style and return apporpiate value
        if(easingStyle == "Linear") return c*t/d+b;
        else if(easingStyle == "Ballistic") return b+(4*c*t/d)-(4*c*t*t/(d*d));
        else if(easingStyle == "SineIn") return -c*Math.cos(t/d*(Math.PI/2)) + c+ b;
        else if(easingStyle == "SineOut") return c*Math.sin(t/d*(Math.PI/2)) + b;
        else if(easingStyle == "Sine") return -c/2*(Math.cos(Math.PI*t/d)-1) + b;
        else console.error ("ERROR Easing.calculateEasing()l unkown easingStyle.");
    }
    //getters
    getEasingValue(){
        //assume a countdown procedure (as opposed to counting up)
        if(this.secondsRemaining == 0) return this.valueEnd;
        let completed = this.duration - this.secondsRemaining;
        let result = this.calculateEasing(
            this.style,
            completed,
            this.valueStart,
            (this.valueEnd-this.valueStart),
            this.duration
        );
        return result;
    }
    isActive(){
        return (this.secondsRemaining > 0);
    }
    //setters
    setEasing(style, start, end, duration){
        this.style = style;
        this.valueStart = start;
        this.valueEnd = end;
        this.duration = duration;
        this.secondsRemaining = duration;
    }
}

//---------------------------------------------------------------------------
// CLASS Timer
//---------------------------------------------------------------------------
class Timer{
    constructor(){
        let date = new Date();
        this.startedAt = 0; //date.getTime();
        this.currTimeStamp = 0;
        this.lastTimeStamp = 0;
        this.fps = 0;
        this.frameCounter = 0;
    }
    update(timeStamp){
        //console.log("timer.update timestamp = " + timeStamp);
        if(isNaN(timeStamp)){ console.error("ERROR, Timer.update(): timestamp is NaN."); return; }
        if(this.startedAt == 0){
            this.startedAt = timeStamp;
            this.currTimeStamp = timeStamp;
            this.lastTimeStamp = timeStamp;
        }
        this.lastTimeStamp = this.currTimeStamp;
        this.currTimeStamp = timeStamp;
        this.frameCounter ++;
        if(this.frameCounter > Number.MAX_SAFE_INTEGER) console.error("ERROR, Timer.update(): frameCounter has exceeded max safe integer" + 
        ". Heat death of the universe has occured.");
    }
    getFps(){ return Math.round(1/this.getSecondsPassed()); }
    getSecondsPassed(){ return Math.min( (this.currTimeStamp-this.lastTimeStamp) / 1000, 0.1); } // Avoid overly large gaps
    getTotalSeconds(){ return (this.lastTimeStamp-this.startedAt)/1000; }
}

//---------------------------------------------------------------------------
// CLASS Screen
//---------------------------------------------------------------------------
class Screen{
    constructor(refreshFunction = this.refresh){
        this.canvas = document.getElementById("canvas");
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext("2d");
        this.functionRefresh = refreshFunction;
        this.background = null;
        this.assetDictionary = {};
        this.assetOrder = [];
    }
    registerAsset(name, asset){
        if(this.assetOrder.indexOf(name) != -1){
            console.error("ERROR, Screen.registerAsset(): Asset '"+ name + "' has already been registered.");
            return;
        }
        this.assetDictionary[name] = asset;
        this.assetOrder.push(name);
        this.asset.registerScreen(this);
        console.debug("asset '" + name + "' has been registered with screen");
    }
    deregisterAsset(name){
        let index = this.assetOrder.indexOf(name);
        if(index == -1) console.error("ERROR, Screen.deregisterAsset(): Asset '" + name + "' is not currently registered.");
        let removed = this.assetOrder.splice(index, 1);
        return removed;
    }
    clear(){
        this.ctx.clearRect(0, 0, this.width, this.height);
        //console.log("clearing");
    }
    refresh(){
        this.clear();
        //console.log("Current pose index " + sprCheese.poseIndex);
    }
    drawSprite(sprite){
        this.ctx.save();
        //rotate, orient, scale, and draw this character
        this.ctx.translate(sprite.getPosX()+sprite.getCogX(), sprite.getPosY()+sprite.getCogY());
        this.ctx.rotate(sprite.getRotation() * Math.PI / 180);
        this.ctx.transform(
            sprite.getFlipX() ? -1 : 1, //horizontal scaling...set direction of x axis
            0, //vertical skewing
            0, //horizontal skewing
            sprite.getFlipY() ? -1 : 1, //vertical scaling... set direction of y axis
            0, //horizontal movement... x origin remains at 0 (otherwise try "this.x + this.flipX ? this.image.width : 0")
            0 //vertical movement... y origin remains at 0 (otherwise try "this.y + this.flipY ? this.image.height : 0")
        );
        this.ctx.drawImage(
            sprite.image,                           //actually spritesheet
            sprite.getPose()*sprite.getWidth(), 0,  //start of current sprite (x, y) on spritesheet
            sprite.getWidth(), sprite.getHeight(),  //dimensions of sprite
            -sprite.getCogX()*sprite.getScalingX(), -sprite.getCogY()*sprite.getScalingY(), //position of sprite on canvas (x, y)
            sprite.getWidth()*sprite.getScalingX(), //width on canvas (stretched to fit)
            sprite.getHeight()*sprite.getScalingY(), //height on canvas (stretched to fit)
        );
        //console.log("scalingX: " + sprite.getScalingX() + " scalingY " + sprite.getScalingY());
        if(sprite.getCogDisplayStatus()){
            this.ctx.fillStyle = "red";
            this.ctx.fillRect(-2, -2, 4, 4); //debugging aid
        }
        this.ctx.restore(); 
    }
    drawSimpleSprite(sprite){
        this.ctx.drawImage(sprite.image, sprite.posX, sprite.posY,
            sprite.getWidth()*sprite.getScalingX(), sprite.getHeight()*sprite.getScalingY());
        //this.ctx.drawImage(sprite.image, sprite.posX, sprite.posY, sprite.getWidth(), sprite.getHeight());
    }
    drawLine(x1, y1, x2, y2, width = 1){
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    // getter functions
    getAssetObject(name){ return this.assetDictionary[name]; }
    getAssetName(object){
        for(let i = 0; i < this.assetOrder.length; i++){
            if(this.getAssetObject(this.assetOrder[i]) === object) return this.assetOrder[i];
        }
    }
    getAssetOrder(){ return this.assetOrder; }

    // setter function
    setAssetOrder(order){
        if(order.length != this.assetOrder.length){ console.error("ERROR, Screen.setAssetOrder(): " +
            order.length + " arguments passed; " + 
            this.assetOrder.length + " assets have been registered.");
            return;
        }
        //Ensure all listed assets are correctly registered with no duplicates
        let newOrder = [];
        for(let i = 0; i < this.assetOrder.length; i++){
            if(this.assetOrder.indexOf(order[i]) == -1){
                console.error("ERROR, Screen.setAssetOrder(): assetName '" + order[i] + "' has not been registered.");
                return;
            }
            if(newOrder.indexOf(order[i]) == -1){
                console.error("ERROR, Screen.setAssetOrder(): assetName '" + order[i] + "' was duplicated in argument list.");
                return;
            }
            newOrder.push(order[i]);
        }
        this.assetOrder = newOrder;
    }
}

//---------------------------------------------------------------------------
// CLASS Sprite
//---------------------------------------------------------------------------
class Sprite{
    constructor(spriteSheet, width, height){
        //this.cogX = 0;
        //this.cogY = 0;
        this.currentLoop = null;
        this.flipX = 0;
        this.flipY = 0;
        this.registeredScreen = null;
        this.image = new Image();
        this.image.src = spriteSheet;
        this.width = width;
        this.height = height;
        this.posX = 100;
        this.posY = 100;
        this.prevX = this.posX;
        this.prevX = this.posX;
        this.easingVelX = new Easing();
        this.easingVelY = new Easing();
        this.poseIndex = 0;
        this.rotation = 0; //in radians
        this.scalingX = 1;
        this.scalingY = 1;
        this.showCog = false;
        this.loopIdle = this.createLoopObject(
            "Idle", 
            [0,0], 
            1,
            [0,0],
            [0,0]);
        this.setLoop(this.loopIdle);
    }
    registerScreen(screen){
        this.registeredScreen = screen;
        //console.debug("Screen has been registered to Sprite");
    }
    createLoopObject(name, array, duration, offsetX=[], offsetY=[]){
        return {name: name, array: array, duration: duration, offsetX: offsetX, offsetY: offsetY};
    }
    update(secondsPassed){
        this.move(secondsPassed);
        this.handleCollisions(secondsPassed);
        this.updateEasings(secondsPassed);
    }
    move(secondsPassed){
        if(this.registeredScreen == null) console.error("ERROR, Sprite.move(): sprite has no registered screen.");
        this.posX -= this.getVelX()*secondsPassed;
        this.posY -= this.getVelY()*secondsPassed;
    }
    handleCollisions(secondsPassed){
        if(this.getPosX() < 0) this.setPosX(0);
        if(this.getPosY() < 0) this.setPosY(0);
        if(this.getPosX() >= this.registeredScreen.width - this.width) this.setPosX(this.registeredScreen.width-this.width);
        if(this.getPosY() >= this.registeredScreen.height - this.height) this.setPosY(this.registeredScreen.height-this.height4);
    }
    updateEasings(secondsPassed){
        this.easingVelX.update(secondsPassed);
        this.easingVelY.update(secondsPassed);
    }
    //getters
    getCogX(){ return this.cogX; } // centre of gravity
    getCogY(){ return this.cogY; } //centre of gravity
    getCogDisplayStatus(){ return this.showCog; }
    getCurrentLoop(){ return this.currentLoop; }
    getFlipX(){ return this.flipX; }
    getFlipY(){ return this.flipY; }
    getPose(){ 
        //console.log("Ball.getPose: gaius = " + this.getCurrentLoop().array[this.poseIndex]);
        return this.getCurrentLoop().array[this.poseIndex];
    }
    getPosX(){ return this.posX; }
    getPosY(){ return this.posY; }
    getRotation(){ return this.rotation; }
    getScalingX(){ return this.scalingX; }
    getScalingY(){ return this.scalingY; }
    getVelX(){ return this.easingVelX.getEasingValue(); } //velocity including current point in easing cycle
    getVelY(){ return this.easingVelY.getEasingValue(); }
    getWidth(){ return this.width; }
    getHeight(){ return this.height; }
    
    //setters
    setAccelerateX(velTarget, style, duration){ //DO NOT ADD setVelX etc. functions
        this.easingVelX.setEasing(style, this.getVelX, velTarget, duration);
    }
    setAccelerateY(velTarget, style, duration){ //DO NOT ADD setVelY etc. functions
        this.easingVelY.setEasing(style, this.getVelY, velTarget, duration);
    }
    setCog(cogX, cogY){ this.cogX = cogX; this.cogY = cogY; }
    setLocation(x, y){
        this.posX = x;
        this.posY = y;
        this.prevX = x;
        this.prevY = y;
        //console.debug("CONFIRM, Sprite.setLocation(): location set to (" + x + "," + y + ").");
    }
    setLoop(loopObject){
        this.currentLoop = loopObject;
        //console.log("currentLoop: " + loopObject.name);
        this.poseInterval = loopObject.duration/(loopObject.array.length);
    }
    setPosX(x){ this.posX = x; }
    setPosY(y){ this.posY = y; }
    setScalingX(x){ this.scalingX = x; }
    setScalingY(y){ this.scalingY = y; }
    describe(){
        return("id = " + this.id + ", Sprite, source ='" + this.image.src + 
            "', location = (" + this.posX + "," + this.posY +
            "), centre of gravity = (" + this.cogX + "," + this.cogY + 
            "), velocity = <" + this.velX + "," + this.velY +
            ">, pos = " + this.poseIndex + " loop = '" + this.currentLoop + "'" + 
            ", scaling = (" + this.scalingX + "'" + this.scalingY + ")" +
            ", flip = (" + this.flipX + "," + this.flipY + ")"
        );
    }
}

//---------------------------------------------------------------------------
// CLASS Tile
//---------------------------------------------------------------------------
class Tile{
    constructor(left, top, width, height, colour){
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.image = null;
        this.status = "empty";
        this.piece = null;
        this.colour = colour;
        this.createImage();
    }
    getColour(){ return this.colour; }
    setImage(image){ this.image = image; }
    setColour(colour){ this.colour = colour; }
    createImage(){
        let image;
        if(this.colour == "white"){
            image = new Sprite("Beige Tile.png", 200, 200);
        }else if(this.colour == "black"){
            image = new Sprite("Brown Tile.png", 200, 200);
        }
        this.setImage(image);
        this.image.setLocation(this.left, this.top); 
        this.image.registerScreen(screen);
        this.image.setCog(0, 0);
        this.image.setScalingX(TILE_WIDTH/200);
        this.image.setScalingY(TILE_HEIGHT/200);
        //console.log(image);
    }
}

//---------------------------------------------------------------------------
// CLASS Piece
//---------------------------------------------------------------------------
class Piece{
    constructor(left, top, width, height, colour, type){
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.image = null;
        this.type = type;
        this.colour = colour;
        //this.tile = null;
        this.selected = false;
        this.createImage();
    }
    setImage(image){ this.image = image; }
    getType(){ return this.type; }
    getColour(){ return this.colour; }
    setType(type){ this.type = type; }
    setImgPosition(left, top){
        this.left = left
        this.top = top;
        this.image.setLocation(this.left + HORIZONTAL_MARGIN, this.top + VERTICAL_MARGIN);
    }
    createImage(){
        let image;
        if(this.type == "king" && this.colour == "white") image = new Sprite("White King.png", 200, 200);
        if(this.type == "king" && this.colour == "black") image = new Sprite("Black King.png", 200, 200);
        if(this.type == "knight" && this.colour == "white") image = new Sprite("White Knight.png", 200, 200);
        if(this.type == "knight" && this.colour == "black") image = new Sprite("Black Knight.png", 200, 200);
        if(this.type == "pawn" && this.colour == "white") image = new Sprite("White Pawn.png", 200, 200);
        if(this.type == "pawn" && this.colour == "black") image = new Sprite("Black Pawn.png", 200, 200);
        this.setImage(image);
        this.image.setLocation(this.left, this.top); 
        this.image.registerScreen(screen);
        this.image.setCog(0, 0);
        this.image.setScalingX(TILE_WIDTH/200);
        this.image.setScalingY(TILE_HEIGHT/200);
        //console.log(image);
    }
}


//---------------------------------------------------------------------------
// ACTUAL GAME
//---------------------------------------------------------------------------

function setUp(){
    screen = new Screen();
}

function makeMenu(){
    screen.clear();
    screen.ctx.fillStyle = "BurlyWood";
    screen.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    screen.ctx.fillStyle = "blue";
    screen.ctx.font = "30px Arial";
    screen.ctx.fillText("Small Chess", SCREEN_WIDTH/2 - (SCREEN_WIDTH/6) - 10, SCREEN_HEIGHT / 3);
    screen.ctx.fillText("Click Screen To Play!", SCREEN_WIDTH/2 - (SCREEN_WIDTH/3) - 5, SCREEN_HEIGHT / 3 + 60);
}

function createWorld(){
    let left = HORIZONTAL_MARGIN;
    let top = VERTICAL_MARGIN;
    playerColour = findPieceColour();
    let colour = playerColour;
    for(let i = 0; i < board.length; i++){
        board[i] = new Tile(left, top, TILE_WIDTH, TILE_HEIGHT, colour);
        makePiece(i, left, top, playerColour);
        if(left >= SCREEN_WIDTH - (HORIZONTAL_MARGIN) - TILE_WIDTH){
            left = HORIZONTAL_MARGIN;
            top += TILE_HEIGHT;
        }else{ left += TILE_WIDTH; }
        colour = swapColour(colour);
    }

    // board[9].piece = board[12].piece;
    // board[12].piece = null;
    // movingPieceNumber = board[9].piece;
    //console.log("pieces 9: " + pieces[9].left + " " + pieces[9].top);
    if(playerColour == "white") playersTurn = true;
}

function runGame(timeStamp){
    let currentTime = timeStamp;
    let secondsPassed = timeStamp - oldTimeStamp;
    oldTimeStamp = currentTime;
    counter += secondsPassed;
    if(movingPieceNumber != -1) movePieces(secondsPassed);
    if(counter >= 1000){
        //console.log("Second");
        counter = 0;
    }
    if(movingPieceNumber != -1 || pieceSelectedNumber != -1) drawScreen();
    window.requestAnimationFrame(runGame);
}

function drawScreen(){
    screen.clear();
    screen.ctx.fillStyle = "gray";
    screen.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    for(let i = 0; i < board.length; i++){
        screen.drawSprite(board[i].image);
    }
    if(pieceSelectedNumber != -1) showAvailableMoves(pieceSelectedNumber);
    for(let i = 0; i < pieces.length; i++){
        //console.log("pieces " + pieces[i]);
        screen.drawSprite(pieces[i].image);
    }
}

function movePieces(secondsPassed){
    let tileX = (toTileX(findPieceTile(movingPieceNumber)) * TILE_WIDTH) + HORIZONTAL_MARGIN;
    let tileY = (toTileY(findPieceTile(movingPieceNumber)) * TILE_HEIGHT) + VERTICAL_MARGIN;
    let pixels = 10;
    if(tileX > pieces[movingPieceNumber].left){
        if(tileX > pieces[movingPieceNumber].left + pixels) pieces[movingPieceNumber].left += pixels;
        else pieces[movingPieceNumber].left = tileX;
    }
    if(tileX < pieces[movingPieceNumber].left){
        if(tileX < pieces[movingPieceNumber].left - pixels) pieces[movingPieceNumber].left -= pixels;
        else pieces[movingPieceNumber].left = tileX;
    }
    if(tileY > pieces[movingPieceNumber].top){
        if(tileY > pieces[movingPieceNumber].top + pixels) pieces[movingPieceNumber].top += pixels;
        else pieces[movingPieceNumber].top = tileY;
    }
    if(tileY < pieces[movingPieceNumber].top){
        if(tileY < pieces[movingPieceNumber].top - pixels) pieces[movingPieceNumber].top -= pixels;
        else pieces[movingPieceNumber].top = tileY;
    }
    pieces[movingPieceNumber].setImgPosition(pieces[movingPieceNumber].left, pieces[movingPieceNumber].top);

    if(pieces[movingPieceNumber].left == tileX && pieces[movingPieceNumber].top == tileY){
        movingPieceNumber = -1;
        //console.log("left " + tileX);
        //console.log("top " + tileY);
        drawScreen();
        if(checkGameOver() != -1){
            endGame(checkGameOver());
        }else{
            //console.log("players turn: " + playersTurn);
            if(!playersTurn) playersTurn = true;
            else{
                playersTurn = false;
                opponentsTurn();
            }
        }
    }
    //if(pieces[movingPieceNumber].left == tileX && pieces[movingPieceNumber].top == tileY) pieces[movingPieceNumber].setImgPosition(tileX+TILE_WIDTH, tileY+TILE_HEIGHT);
}

function makePiece(tile, left, top, playerColour){
    //Computer pieces
    let piece = null;
    //console.log("making tile: " + tile);
    if((tile == 0|| tile == 1)){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, swapColour(playerColour), "knight");
    }
    if(tile == 2){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, swapColour(playerColour), "king");
    }
    if((tile >= 3) && (tile <= 5)){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, swapColour(playerColour), "pawn");
    }
    //Player pieces
    if((tile == board.length-1) || (tile == board.length-2)){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, playerColour, "knight");
    }
    if(tile == board.length-3){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, playerColour, "king");
    }
    if((tile >= 12) && (tile <= 14)){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, playerColour, "pawn");
    }
    //if(typeof piece !== undefined){
    if(piece != null){
        pieces.push(piece);
        let num = pieces.length - 1;
        //pieces[num].tile = tile;
        board[tile].piece = num;
        //console.log("piece made " + piece);
    }
}

function findPieceColour(){
    return "white";
}

function swapColour(colour){
    if(colour == "white") return "black";
    if(colour == "black") return "white";
}

function clickingTile(tile, mouseX, mouseY){
    let withinLeft = (mouseX <= board[tile].left+TILE_WIDTH);
    let withinRight = (mouseX >= board[tile].left);
    let withinTop = (mouseY <= board[tile].top+TILE_HEIGHT);
    let withinBottom = (mouseY >= board[tile].top);
    if(withinLeft && withinRight && withinTop && withinBottom) return true;
    return false;
}

function findPieceTile(pieceNum){
    for(let i = 0; i < board.length; i++){
        if(board[i].piece == pieceNum) return i;
    }
}

function viableMoves(pieceNum, colour){
    //console.log("viable moves");
    let moves = [];
    let tile = findPieceTile(pieceNum);
    let tileX = toTileX(tile);
    let position = -1;
    if(pieces[pieceNum].type == "knight"){
        if(tileX == 0){
            //position = pieces[pieceNum].tile + 2 + 3;
            position = tile + 2 + 3;
            if(isViable(position, colour)) moves.push(position);

            position = tile + 2 - 3;
            if(isViable(position, colour)) moves.push(position);
        }else{
            position = tile - 1 + 6;
            if(isViable(position, colour)) moves.push(position);

            position = tile - 1 - 6;
            if(isViable(position, colour)) moves.push(position);
        }
        if(tileX == 2){
            position = tile - 2 + 3;
            if(isViable(position, colour)) moves.push(position);

            position = tile - 2 - 3;
            if(isViable(position, colour)) moves.push(position);
        }else{
            position = tile + 1 + 6;
            if(isViable(position, colour)) moves.push(position);
    
            position = tile + 1 - 6;
            if(isViable(position, colour)) moves.push(position);
        }
    }

    if(pieces[pieceNum].type == "king"){
        if(tileX != 0){
            position = tile -1;
            if(isViable(position, colour)) moves.push(position);

            //diagonals
            position = tile - 1 + 3;
            if(isViable(position, colour)) moves.push(position);

            position = tile - 1 - 3;
            if(isViable(position, colour)) moves.push(position);
        }
        if(tileX != 2){
            let position = tile + 1;
            if(isViable(position, colour)) moves.push(position);

            //diagonals
            position = tile + 1 + 3;
            if(isViable(position, colour)) moves.push(position);
            
            position = tile + 1 - 3;
            if(isViable(position, colour)) moves.push(position);
        }
        position = tile + 3;
        if(isViable(position, colour)) moves.push(position);
            
        position = tile -3;
        if(isViable(position, colour)) moves.push(position);
    }

    if(pieces[pieceNum].type == "pawn"){
        if(colour == "white"){
            position = tile - 3;
            if(isViable(position, colour, "moving")) moves.push(position);

            if(tileX != 0){
                position = tile - 1 - 3;
                if(isViable(position, colour, "attacking")) moves.push(position);
            }
            if(tileX !=  2){
                position = tile + 1 - 3;
                if(isViable(position, colour, "attacking")) moves.push(position);
            }
        }else{
            position = tile + 3;
            if(isViable(position, colour, "moving")) moves.push(position);

            if(tileX != 0){
                position = tile - 1 + 3;
                if(isViable(position, colour, "attacking")) moves.push(position);
            }
            if(tileX !=  2){
                position = tile + 1 + 3;
                if(isViable(position, colour, "attacking")) moves.push(position);
            }
        }
        //for(let i = 0; i < moves.length; i++) console.log("moves " + i + ": " + moves[i]);
    } 
    //console.log("x " + moves[0].x);
    return moves;
}

function isViable(position, colour, pawnStatus = "none"){
    //let tileX = position % 3;
    //let tileY = position % 6;
    //if(tileX > (board.length-1) % 3 || tileX < 0) return false;
    //if(tileY > (board.length-1) % 6 || tileY < 0) return false;

    if(position < 0 || position >= board.length) return false;
    if(board[position].piece != null){
        if(pieces[board[position].piece].colour == colour) return false;
        if(pawnStatus == "moving") return false;
        if(pawnStatus == "attacking") return true;
    }
    if(pawnStatus == "attacking") return false;

    //console.log("y " + position.y);
    //console.log("x " + position.x);
    return true;
}

function showAvailableMoves(pieceNum){
    console.log("showAvailableMoves");
    //console.log("pieceNumber " + pieceNumber);
    screen.ctx.fillStyle = "blue";
    let tile = findPieceTile(pieceNum);
    let tileX = toTileX(tile);
    let tileY = toTileY(tile);
    screen.ctx.fillRect((tileX * TILE_WIDTH) + HORIZONTAL_MARGIN, (tileY * TILE_HEIGHT) + VERTICAL_MARGIN, TILE_WIDTH, TILE_HEIGHT);
    let moves = pieceSelectedMoves;
    for(let i = 0; i < moves.length; i++){
        tileX = toTileX(moves[i]);
        tileY = toTileY(moves[i]);
        //console.log("tileX " + tileX);
        //console.log("tileY " + tileY);
        screen.ctx.fillRect((tileX * TILE_WIDTH) + HORIZONTAL_MARGIN, (tileY * TILE_WIDTH) + VERTICAL_MARGIN, TILE_WIDTH, TILE_HEIGHT);
        //console.log("x: " + ((tileX * TILE_WIDTH) + HORIZONTAL_MARGIN));
        //console.log("y: " + ((tileY * TILE_WIDTH) + VERTICAL_MARGIN));
    }
}

function removePiece(tile){
    // console.log("before splice");
    // for(let i = 0; i < board.length; i++){
    //     if(board[i].piece != null) console.log("board " + i + ": " + pieces[board[i].piece].colour + " " + pieces[board[i].piece].type + " #" + board[i].piece);
    // }

    let index = board[tile].piece;
    board[tile].piece = null;
    pieces.splice(index, 1);
    for(let i = 0; i < board.length; i++){
        if(board[i].piece != null && board[i].piece >= index) board[i].piece -= 1;
    }

    // console.log();
    // console.log("after splice");
    // for(let i = 0; i < board.length; i++){
    //     if(board[i].piece != null) console.log("board " + i + ": " + pieces[board[i].piece].colour + " " + pieces[board[i].piece].type + " #" + board[i].piece);
    // }
}

function opponentsTurn(){
    console.log("opponents turn");
    if(gameStarted){
        let pieceChoice = null;
        let moveChoice = null;
        let finished = false;

        //First check if there is a piece that can take an opponents piece
        for(let i = 0; i < pieces.length; i++){
            if(pieces[i].colour != playerColour){
                let moves = viableMoves(i, swapColour(playerColour));
                for(let j = 0; j < moves.length; j++){
                    if(board[moves[j]].piece != null){
                        pieceChoice = i;
                        moveChoice = j;
                        j = moves.length;
                        i = pieces.length;
                    }
                }
            }
        }

        //Then check if there is a piece that can move
        if(pieceChoice == null){
            for(let i = 0; i < pieces.length; i++){
                if(pieces[i].colour != playerColour){
                    let moves = viableMoves(i, swapColour(playerColour));
                    if(moves.length > 0) pieceChoice = i;
                }
            }
        }

        //Moving the piece
        if(pieceChoice != null){
            let moves = viableMoves(pieceChoice, swapColour(playerColour));
            if(moveChoice == null) moveChoice = 0;
            if(board[moves[moveChoice]].piece != null){
                if(pieceChoice >= board[moves[moveChoice]].piece) pieceChoice -= 1;
                removePiece(moves[moveChoice]);
            }
            let tile = findPieceTile(pieceChoice);
            board[tile].piece = null;
            //pieces[pieceChoice].setTile(moves[moveChoice]);
            board[moves[moveChoice]].piece = pieceChoice;
            movingPieceNumber = pieceChoice;
        }else{
            //playerTurn = true; here because in movePieces it sets that after the pieces move: so one is needed here if the opponent can't move
            playersTurn = true;
        }

        /*
        while(finished == false){
            pieceChoice = randomNumber(0, pieces.length - 1);
            if(pieces[pieceChoice].colour != playerColour){
                moves = viableMoves(pieceChoice, swapColour(playerColour));
                // This statement was removed because it would cause an infinite loop if no piece could move: if(moves.length >= 1) finished = true;
                finished = true;
            }
        }
        //If a piece has no moves, than the opponent might skip it's turn
        if(moves.length != 0){
            let moveChoice = randomNumber(0, moves.length - 1);
            if(board[moves[moveChoice]].piece != null){
                if(pieceChoice >= board[moves[moveChoice]].piece) pieceChoice -= 1;
                removePiece(moves[moveChoice]);
            }
            let tile = findPieceTile(pieceChoice);
            board[tile].piece = null;
            //pieces[pieceChoice].setTile(moves[moveChoice]);
            board[moves[moveChoice]].piece = pieceChoice;
            movingPieceNumber = pieceChoice;
            //console.log("Moved " + pieces[pieceChoice].colour + " "  + pieces[pieceChoice].type + " to " + moves[moveChoice]);
            //pieces[pieceChoice].setImgPosition(toTileX(moves[moveChoice]) * TILE_WIDTH, toTileY(moves[moveChoice]) * TILE_HEIGHT);
        }else{
            playersTurn = true;
        }
        */
    }
}

function checkGameOver(){
    let playerPieces = 0;
    let opponentPieces = 0;
    let playerHasKing = false;
    let opponentHasKing = false;
    for(let i = 0; i < pieces.length; i++){
        if(pieces[i].colour == playerColour){
            playerPieces ++;
            if(pieces[i].type == "king") playerHasKing = true;
        }else{
            opponentPieces ++;
            if(pieces[i].type == "king") opponentHasKing = true;
        }
    }
    //console.log("player: " + playerPieces + " opponent: " + opponentPieces);
    if(!playerHasKing) return swapColour(playerColour);
    if(!opponentHasKing) return playerColour;
    if(playerPieces == 0) return swapColour(playerColour);
    if(opponentPieces == 0) return playerColour;
    return -1;
}

function endGame(colour){
    console.log("endGame: colour: " + colour);
    screen.ctx.font = "30px Arial";
    screen.ctx.fillStyle = "blue";
    if(colour == playerColour){
        screen.ctx.fillText("YOU WON!", SCREEN_WIDTH/2 - (TILE_WIDTH/2), SCREEN_HEIGHT/2);
    }else{
        console.log("correct");
        screen.ctx.fillText("YOU LOST", SCREEN_WIDTH/2 - (TILE_WIDTH/2), SCREEN_HEIGHT/2);
    }
}

function randomNumber(num1, num2){
    return Math.floor(Math.random() * (num2 - num1 + 1) ) + num1;
}

function toTileX(tile){
    return (tile % 3);
}

function toTileY(tile){
    return (Math.floor(tile / 3));
}

function toTileNum(x, y){
    return x + (y * 3);
}

//---------------------------------------------------------------------------
// MAIN
//---------------------------------------------------------------------------

setUp();
makeMenu();
//createWorld();
//drawScreen();
//runGame(0);
