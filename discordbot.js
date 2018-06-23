//Imports & Constants
const Discord = require('discord.js');
const client = new Discord.Client();
const STAGE_IDLE = 0,
      STAGE_JOINING = 1,
      STAGE_PLAYING = 2;

//Main Variables
var gameStage = STAGE_IDLE; //0-idle; 1-add players; 2-in session
var players = [];
var activePlayer=-1;
var lastBid = "1 1";

//Define Player object
function Player(id,u) {
    this.id = id;
    this.user = u;
    this.dice = 1;
    this.diceVals = [];
}

// noinspection BadExpressionStatementJS
client.on('ready', () => {
    console.log('I am ready!');
});


//Start Bot
client.login('[Client ID Here]');

//Game Commands
// noinspection BadExpressionStatementJS
client.on('message', message => {
    if (message.content.substring(0,3) === "!ld") { //upon each message, if message starts with '!'
        msg = message.content.substring(4);

        //Stage Idle - Commands
        if (msg == "new" && gameStage==STAGE_IDLE) {
            message.channel.send("New game started!");
            message.channel.send("Who is playing?");
            gameStage = STAGE_JOINING;
        }

        //Stage Joining - Commands
        if(msg == "join" && gameStage==STAGE_JOINING){
            addPlayer(message,message.author);
        }
        if(msg == "start" && gameStage==STAGE_JOINING){
            if(players.length<2){
                message.channel.send("Not enough players!")
            }
            else{
                roll();
                message.channel.send("Dice rolls sent to PM's!");
                message.channel.send(playerOrder());
                setActivePlayer();
                gameStage = STAGE_PLAYING;
            }
        }

        //Stage Playing - Commands
        if(gameStage == STAGE_PLAYING){ //at this point, activePlayer is 0
        //check for active player, then check for move validity
            if(message.author.id == players[activePlayer].id){
                if(msg == "bs" && lastBid!="1 1"){
                    var lastPlayer = players[(activePlayer-1)%players.length];
                    var currPlayer = players[activePlayer];
                    console.log("last:" + lastPlayer);
                    console.log("curr:" + currPlayer);
                    var countClaimed = lastBid.split(" ")[0];
                    var valueClaimed = lastBid.split(" ")[1];
                    var count = 0;

                    //check if dice counts are accurate
                    for(var i=0; i<players.length;i++){ //check every player
                        for(var j = 0; j<players[i].diceVals.length; j++){
                            if(valueClaimed == players[i].diceVals[j] || players[i].diceVals[j]==1){
                                console.log(players[i].diceVals[j]);
                                count++;
                            }
                        }
                    }
                    message.channel.send("Count = " + count);
                    if(count<countClaimed){
                        //print all the players and their dice vals
                        for(var i=0; i<players.length;i++){ //check every player
                            message.channel.send(players[i].user.tag + " " + players[i].diceVals.toString() + "\n");
                        }
                        message.channel.send(lastPlayer.user.tag + " lied and will lose a dice!");
                        lastPlayer.dice--;
                        resetGame(activePlayer,message);


                    }
                    else{
                        //print all the players and their dice vals
                        //reduce current players dice
                        //print bs wrong
                        for(var i=0; i<players.length;i++){
                            message.channel.send(players[i].user.tag + " " + players[i].diceVals.toString() + "\n");
                        }
                        message.channel.send(currPlayer.user.tag + " was wrong and will lose a dice!");
                        currPlayer.dice--;
                        resetGame((activePlayer-1)%players.length,message);
                    }
                }
                //the only other option is a bid
                else if(isValid(msg)){
                    lastBid = msg;
                    console.log(lastBid);
                    setActivePlayer();
                }
                else{
                    if(msg!="start"){ //todo: fancier fix later
                        message.channel.send("Invalid move!");
                    }
                }
            }
        }

        //Any Stage Commands
        if (msg == "debug") {
            //fix pedro problem !ld4 5 should not work!!
        }
    }
});

//Game Functions
function addPlayer(m,p) {
    if(players.length>0) {
        var inArray = false;
        for (var i = 0; i < players.length; i++) {
            if (players[i].id == p.id){
                inArray = true;
            }
        }
        if(inArray==false){
            players.push(new Player(p.id,p));
            m.channel.send(p.tag + " added!");
            console.log(p.tag + " added after search");
        }
    }
    else{
        players.push(new Player(p.id,p));
        m.channel.send(p.tag + " added!");
        console.log(p.tag + " added from else");
    }
}

function roll() {
    for(var i=0; i<players.length;i++){
        var diceRolls = [];
        for(var j=0; j<players[i].dice;j++){
            diceRolls.push(Math.floor(Math.random() * 6) + 1);
        }
        players[i].diceVals = diceRolls;
        console.log(diceRolls);
        players[i].user.send(diceRolls.toString());
        console.log("Sent dice rolls to " + players[i].user.tag);
    }
}

function playerOrder(){ //adding shuffle method later
    var temp = "Player Order: ";
    for(var i=0; i<players.length;i++){
        temp += players[i].user.tag + " ";
    }
    return temp;
}

function setActivePlayer() {
    if(activePlayer == -1){
        activePlayer = 0;
    }
    else{
        activePlayer=(activePlayer+1)%players.length;
    }
    console.log(activePlayer);
}

function isValid(str){
    var nums = str.split(" ");
    var lastNums = lastBid.split(" ");
    if(nums.length!=2 || isNaN(nums[0]) || isNaN([1]) ||  parseInt(nums[1])==1 || parseInt(nums[1])>6 || parseInt(nums[1])<2 || parseInt(nums[0])<=parseInt(lastNums[0])){
        return false;
    }
    else{
        return true;
    }
}

function resetGame(p,m){
    lastBid = "1 1";
    activePlayer = p;
    //remove 0-dice players
    for(var i=0; i<players.length;i++) {
        if(players[i].dice==0){
            m.channel.send("@!" + players[i].id + " is out of the game!");
            if(activePlayer>i){
                activePlayer--;
            }
            players.splice(i,1);
        }
    }
    //if one player with dice, then stop game
    if(players.length==1){
        //end game stuff here
        m.channel.send("@!" + players[0].id + " wins!");
        gameStage = STAGE_IDLE;
        players = [];
        activePlayer=-1;
        lastBid = "1 1";
    }
    else{
        roll();
    }
}
