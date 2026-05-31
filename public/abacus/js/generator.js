/* ---------------- OPERATION TYPES ---------------- */

const OPERATIONS = {
DIRECT_ADD:"direct_add",
DIRECT_SUB:"direct_sub",

FIVE_ADD:"5add",
FIVE_SUB:"5sub",

TEN_ADD:"10add",
TEN_SUB:"10sub",

MIX_ADD:"mixadd",
MIX_SUB:"mixsub",

MASTERING:"mastering",

MULTIPLY:"multiply",
DIVIDE:"divide",
DECIMAL:"decimal",
DECIMALMUL:"decimalmul",
DECIMALDIVI:"decimaldivi",
BODMAS:"bodmas",
SQRT:"sqrt",
PERCENT:"percent",
RANDOM:"random"
};

/* ---------------- RULE TABLES ---------------- */

const tensDirectAddRestricted = {
1:[1,2,5,6,7], 
2:[1,5,6], 
3:[5],  
5:[1,2,3], 
6:[1,2], 
7:[1],
8:[0],
};

const tensDirectSubRestricted = { 
2:[1], 
3:[1], 
4:[1,2],  
6:[0], 
7:[1,5], 
8:[1,2,5,6], 
9:[1,2,3,5,6,7] ,
};

const directAdd={
1:[1,2,3,5,6,7,8],
2:[1,2,5,6,7],
3:[1,5,6],
4:[5],
5:[1,2,3,4],
6:[1,2,3],
7:[1,2],
8:[1]
};

const directSub={
1:[1],
2:[1,2],
3:[1,2,3],
4:[1,2,3,4],
5:[5],
6:[1,5,6],
7:[1,2,5,6,7],
8:[1,2,3,5,6,7,8],
9:[1,2,3,4,5,6,7,8,9]
};

const fiveAdd={
1:[4],
2:[3,4],
3:[2,3,4],
4:[1,2,3,4]
};

const fiveSub={
5:[1,2,3,4],
6:[2,3,4],
7:[3,4],
8:[4]
};

const tenAdd={
1:[9],
2:[8,9],
3:[7,8,9],
4:[6,7,8,9],
5:[5],
6:[4,5,9],
7:[3,4,5,8,9],
8:[2,3,4,5,7,8,9],
9:[1,2,3,4,5,6,7,8,9]
};

const tenSub={
0:[1,2,3,4,5,6,7,8,9],
1:[2,3,4,5,7,8,9],
2:[3,4,5,9],
3:[4,5,9],
4:[5],
5:[6,7,8,9],
6:[7,8,9],
7:[8,9],
8:[9]
};

const mixAdd={
5:[6,7,8,9],
6:[6,7,8],
7:[6,7],
8:[6]
};

const mixSub={
1:[6],
2:[6,7],
3:[6,7,8],
4:[6,7,8,9]
};

/* ---------------- GLOBALS ---------------- */

let answers=[];
let problems=[];
let userAnswers=[];
let currentQuestion=0;

/* ---------------- UTILITIES ---------------- */

function rand(arr){
    if(!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random()*arr.length)];
}

// Add this here!
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ---------------- OPERATION SYMBOL ---------------- */

function topicOperation(topic){

if(
topic===OPERATIONS.DIRECT_ADD||
topic===OPERATIONS.FIVE_ADD||
topic===OPERATIONS.TEN_ADD||
topic===OPERATIONS.MIX_ADD
) return "+";

if(
topic===OPERATIONS.DIRECT_SUB||
topic===OPERATIONS.FIVE_SUB||
topic===OPERATIONS.TEN_SUB||
topic===OPERATIONS.MIX_SUB
) return "-";

return "+";

}

/* ---------------- DIGIT ENGINES ---------------- */

function onesDigit(current,topic){

if(topic===OPERATIONS.DIRECT_ADD) return rand(directAdd[current]||[]);
if(topic===OPERATIONS.DIRECT_SUB) return rand(directSub[current]||[]);

if(topic===OPERATIONS.FIVE_ADD) return rand(fiveAdd[current]||[]);
if(topic===OPERATIONS.FIVE_SUB) return rand(fiveSub[current]||[]);

if(topic===OPERATIONS.TEN_ADD) return rand(tenAdd[current]||[]);
if(topic===OPERATIONS.TEN_SUB) return rand(tenSub[current]||[]);

if(topic===OPERATIONS.MIX_ADD) return rand(mixAdd[current]||[]);
if(topic===OPERATIONS.MIX_SUB) return rand(mixSub[current]||[]);

return null;

}

function tensDigit(current, op, topic){

let options;

// 🔴 Apply restricted rules ONLY for 10's and MIX topics
if(
topic === OPERATIONS.TEN_ADD ||
topic === OPERATIONS.TEN_SUB ||
topic === OPERATIONS.MIX_ADD ||
topic === OPERATIONS.MIX_SUB
){
    if(op === "+"){
        options = tensDirectAddRestricted[current] || [];
    }else{
        options = tensDirectSubRestricted[current] || [];
    }
}
else{
    // 🟢 Keep old behavior for Direct & 5's
    if(op === "+"){
        options = directAdd[current] || [];
    }else{
        options = directSub[current] || [];
    }
}

if(!options || options.length === 0){
    return null;
}

return rand(options);
}

/* ---------------- LEVEL TOPICS ---------------- */

function levelTopics(category, levelName){

// ⭐ STAR JUNIORS
if(category === "Star Juniors"){

if(levelName === "SJ1") return [OPERATIONS.DIRECT_ADD];

if(levelName === "SJ2")
return [OPERATIONS.DIRECT_ADD, OPERATIONS.DIRECT_SUB];

if(levelName === "SJ3")
return [OPERATIONS.DIRECT_ADD, OPERATIONS.DIRECT_SUB, OPERATIONS.FIVE_ADD];

if(levelName === "SJ4")
return [OPERATIONS.FIVE_ADD, OPERATIONS.FIVE_SUB];
}

// 🧠 JUNIORS
if(category === "Juniors"){

if(levelName === "J1")
return [OPERATIONS.DIRECT_ADD, OPERATIONS.DIRECT_SUB, OPERATIONS.FIVE_ADD, OPERATIONS.FIVE_SUB];

if(levelName === "J2")
return [OPERATIONS.TEN_ADD, OPERATIONS.TEN_SUB];

if(levelName === "J3")
return [OPERATIONS.MIX_ADD, OPERATIONS.MIX_SUB];

if(levelName === "J4")
return [OPERATIONS.MASTERING];
}

// 🚀 SENIORS
if(category === "Seniors"){

if(levelName === "S1")
return [OPERATIONS.FIVE_ADD, OPERATIONS.FIVE_SUB, OPERATIONS.TEN_ADD, OPERATIONS.TEN_SUB];

if(levelName === "S2")
return [OPERATIONS.FIVE_ADD, OPERATIONS.FIVE_SUB, OPERATIONS.TEN_ADD, OPERATIONS.TEN_SUB, OPERATIONS.MIX_ADD, OPERATIONS.MIX_SUB];

if(levelName === "S3")
return [OPERATIONS.MASTERING];

if(levelName === "S4")
return [OPERATIONS.MASTERING, OPERATIONS.MULTIPLY];

if(levelName === "S5")
return [OPERATIONS.MASTERING, OPERATIONS.MULTIPLY, OPERATIONS.DIVIDE];

if(levelName === "S6")
return [OPERATIONS.MASTERING, OPERATIONS.MULTIPLY, OPERATIONS.DIVIDE, OPERATIONS.DECIMAL];

if(levelName === "S7")
return [OPERATIONS.MULTIPLY, OPERATIONS.DECIMAL, OPERATIONS.MASTERING, OPERATIONS.DECIMALMUL];

if(levelName === "S8")
return [OPERATIONS.DECIMALMUL, OPERATIONS.DECIMALDIVI, OPERATIONS.MULTIPLY, OPERATIONS.DIVIDE, OPERATIONS.BODMAS];

if(levelName === "S9")
return [OPERATIONS.MULTIPLY, OPERATIONS.DIVIDE, OPERATIONS.BODMAS, OPERATIONS.SQRT, OPERATIONS.PERCENT];

if(levelName === "S10")
return [OPERATIONS.RANDOM];
}

return [OPERATIONS.DIRECT_ADD];
}

/* ---------------- RANDOM RESOLVER ---------------- */

function resolveRandomTopic(){
const pool = [
OPERATIONS.DIRECT_ADD,
OPERATIONS.DIRECT_SUB,
OPERATIONS.FIVE_ADD,
OPERATIONS.FIVE_SUB,
OPERATIONS.TEN_ADD,
OPERATIONS.TEN_SUB,
OPERATIONS.MIX_ADD,
OPERATIONS.MIX_SUB,
OPERATIONS.MASTERING,
OPERATIONS.MULTIPLY,
OPERATIONS.DIVIDE,
OPERATIONS.DECIMAL,
OPERATIONS.BODMAS,
OPERATIONS.SQRT,
OPERATIONS.PERCENT
];

return rand(pool);
}

/* ---------------- Mastering ---------------- */

function buildMastering(rows = 4) {
    let numbers = [];
    let ops = [];
    let total = randInt(50, 99); // Start high to allow more subtractions
    numbers.push(total);

    for (let i = 1; i < rows; i++) {
        let num = randInt(10, 99);
        let op = Math.random() < 0.5 ? "+" : "-";

        if (op === "-" && total - num < 0) op = "+";

        if (op === "+") total += num;
        else total -= num;

        numbers.push(num);
        ops.push(op);
    }
    return { numbers, ops, total, type: "mastering" };
}

/*----------------Mutiplication Table----------------*/

function buildMultiplication() {
    let num1 = randInt(100, 999); // 3-digit
    let num2 = randInt(2, 9);     // Simple multiplier
    return {
        numbers: [num1, num2],
        ops: ["×"],
        total: num1 * num2,
        type: "mul"
    };
}

function buildDivision() {
    let quotient = randInt(10, 99); // The answer
    let divisor = randInt(2, 9);
    let dividend = quotient * divisor; // Work backward for no remainders
    return {
        numbers: [dividend, divisor],
        ops: ["÷"],
        total: quotient,
        type: "divi"
    };
}


function buildDecimal() {
    // Generates numbers like 12.4 + 5.2
    let n1 = parseFloat((Math.random() * 50 + 10).toFixed(1));
    let n2 = parseFloat((Math.random() * 40 + 5).toFixed(1));
    return {
        numbers: [n1, n2],
        ops: ["+"],
        total: parseFloat((n1 + n2).toFixed(1)),
        type: "decimal"
    };
}

function buildDecimalmul() {
    // Generates numbers like 12.4 + 5.2
    let n1 = parseFloat((Math.random() * 50 + 10).toFixed(1));
    let n2 = randInt(2, 9);
    return {
        numbers: [n1, n2],
        ops: ["×"],
        total: parseFloat((n1 * n2).toFixed(1)),
        type: "decimalmul"
    };
}

function buildDecimaldivi() {
    // Generates numbers like 12.4 + 5.2
    let n1 = parseFloat((Math.random() * 50 + 10).toFixed(1));
    let n2 = randInt(2, 9);
    return {
        numbers: [n1, n2],
        ops: ["÷"],
        total: parseFloat((n1 / n2).toFixed(1)),
        type: "decimaldivi"
    };
}

function buildPercent() {
    let percent = rand( [10, 20, 25, 50, 75] ); // Standard percentiles
    let base = randInt(1, 10) * 40; // Ensure results are often whole numbers
    return {
        numbers: [percent, base],
        ops: ["% of"],
        total: (percent / 100) * base,
        type: "percent"
    };
}

function buildBodmas(){

let a = randInt(2,15);
let b = randInt(2,15);

let op1 = Math.random() < 0.5 ? "+" : "-";

let bracketValue;

if(op1 === "+"){
bracketValue = a + b;
}else{

/* prevent negative inside bracket */

if(a < b){
[a,b] = [b,a];
}

bracketValue = a - b;
}

/* choose × or ÷ */

let op2 = Math.random() < 0.5 ? "×" : "÷";

let c;

/* ensure division gives whole number */

if(op2 === "÷"){

let divisors = [];

for(let i=2;i<=10;i++){
if(bracketValue % i === 0){
divisors.push(i);
}
}

if(divisors.length === 0){

/* fallback to multiplication */

op2 = "×";
c = randInt(2,5);

}else{

c = divisors[Math.floor(Math.random()*divisors.length)];

}

}else{

c = randInt(2,5);

}

let total;

if(op2 === "×"){
total = bracketValue * c;
}else{
total = bracketValue / c;
}

return {

numbers:[a,b,c],
ops:[op1,op2],
total:total,
type:"bodmas"

};

}

function buildSqrt() {
    let perfectSquares = [];
    
    // Generate squares from 1 to 31
    for (let i = 1; i <= 31; i++) {
        perfectSquares.push(i * i);
    }

    let num = rand(perfectSquares);

    return {
        numbers: [num],
        ops: ["√"],
        total: Math.sqrt(num),
        type: "sqrt"
    };
}

/* ---------------- BUILD PROBLEM ---------------- */

function buildProblem(rows, topics, category, levelName, q){

let attempts = 0;

while(attempts < 150){
attempts++;

/* ⭐ STAR LEVEL 1 EXCEPTION */


let tens, ones;

if(category === "Star Juniors" && levelName === "SJ1"){

// ⭐ First 10 questions → single digit
if(q <= 10){
    tens = 0;
    ones = randInt(1,4);
}
else if(q <= 15){
    tens = randInt(1,4);
    ones = randInt(1,4);
}

// ⭐ Questions 16–25 → normal star numbers
else{
    tens = randInt(1,8);
    ones = randInt(1,9);
}

}else{

// Normal generator
tens = Math.floor(Math.random()*8)+1;
ones = Math.floor(Math.random()*9)+1;

}

let curOnes=ones;
let curTens=tens;

let numbers=[tens*10+ones];
let ops=[];
let total=numbers[0];

let valid=true;

for(let r=1;r<rows;r++){

let topic = rand(topics);

if(topic === OPERATIONS.RANDOM){
topic = resolveRandomTopic();
}

// HARD EXIT OPERATIONS (non-digit systems)
if(topic === OPERATIONS.MASTERING){
return buildMastering(rows);
}

if(topic === OPERATIONS.MULTIPLY){
return buildMultiplication();
}

if(topic === OPERATIONS.DIVIDE){
return buildDivision();
}

if(topic === OPERATIONS.DECIMAL){
return buildDecimal();
}

if(topic === OPERATIONS.DECIMALMUL){
return buildDecimalmul();
}

if(topic === OPERATIONS.DECIMALDIVI){
return buildDecimaldivi();
}

if(topic === OPERATIONS.SQRT){
return buildSqrt();
}

if(topic === OPERATIONS.BODMAS){
return buildBodmas();
}

if(topic === OPERATIONS.PERCENT){
return buildPercent();
}


let op=topicOperation(topic);

let o=onesDigit(curOnes,topic);
let t;

// ⭐ Star Level 1 has no tens column
if(category === "Star Juniors" && levelName === "SJ1"){
    t = 0;
}else{
    t = tensDigit(curTens,op,topic);
}

if(o==null || t==null){
valid=false;
break;
}

let num=t*10+o;

numbers.push(num);
ops.push(op);

if(op === "+") total += num;
else{
total -= num;
if(total < 0){
valid=false;
break;
}
}

// digit logic
let onesCalc = op === "+" ? curOnes + o : curOnes - o;
let carry = 0;

if(onesCalc >= 10){
carry = 1;
onesCalc -= 10;
}else if(onesCalc < 0){
carry = -1;
onesCalc += 10;
}

let tensCalc = op === "+" ? curTens + t + carry : curTens - t + carry;

if(tensCalc > 9 || tensCalc < 0){
valid=false;
break;
}

curOnes = onesCalc;
curTens = tensCalc;

}

if(valid) return {numbers,ops,total};

}

throw new Error("Problem generation failed (rules too strict)");
}

/* ---------------- GENERATE QUESTIONS ---------------- */

function generateQuestions(){

let cat = document.getElementById("category").value;

let levelName = document.getElementById("level").value;

if (!cat || !levelName) {
    alert("Select category and level");
    return;
}

const mode = localStorage.getItem("mode") || "practice";

void (async function(){
try{
const set = await window.fetchAbacusQuestionSet(cat, levelName, mode);
answers = set.answers;
problems = set.problems;
userAnswers = [];
currentQuestion = 0;
showQuestion();
}catch(err){
console.error(err);
alert(err.message || "Failed to generate questions");
}
})();

}

/* ---------------- SHOW QUESTION ---------------- */

function showQuestion(){

let box=document.getElementById("questions");
box.innerHTML="";

let p=problems[currentQuestion];

let wrap=document.createElement("div");
wrap.className="problem";

/* LEFT: Question number */
let left=document.createElement("div");
left.className="q-left";
left.innerText="Question " + (currentQuestion+1);

/* RIGHT: Numbers */
let right=document.createElement("div");
right.className="q-right";

if(p.type === "mastering"){

let first=document.createElement("div");
first.innerText=p.numbers[0];
right.appendChild(first);

for(let i=0;i<p.ops.length;i++){
let r=document.createElement("div");
r.innerText=p.ops[i] + p.numbers[i+1];
right.appendChild(r);
}

}
else if(p.type === "mul"){
    let mulLine = document.createElement("div");
    
    // Combine everything into one string for a single line
    mulLine.innerText = p.numbers[0] + " × " + p.numbers[1];
    
    // Styling to keep it clean
    mulLine.style.fontSize = "20px";
    mulLine.style.textAlign = "right"; 

    right.appendChild(mulLine);
}


else if(p.type === "divi"){ // ADD THIS BLOCK
    let diviline = document.createElement("div");
    diviline.innerText = p.numbers[0] + "÷ " + p.numbers[1];

    diviline.style.fontSize = "20px";
    diviline.style.textAlign = "right";

    right.appendChild(diviline);
}
else if(p.type === "decimal") {
    // 1. Create the top number
    let topNum = document.createElement("div");
    topNum.innerText = p.numbers[0].toFixed(1);
    
    // 2. Create the bottom number row
    let bottomNum = document.createElement("div");
    
    // Use p.ops[0] to get the sign (+ or -) from your function
    // We add a space for better readability
    let sign = p.ops[0] || "+"; 
    bottomNum.innerText = sign + " " + p.numbers[1].toFixed(1);
    
    // 3. Visual Styling
    // Add the horizontal line under the second number
    bottomNum.style.borderBottom = "2px solid black";
    bottomNum.style.paddingBottom = "2px";
    bottomNum.style.width = "100%"; // Ensures the line spans the width
    bottomNum.style.textAlign = "right";

    right.appendChild(topNum);
    right.appendChild(bottomNum);
    
    // Container styling to keep everything aligned to the right
    right.style.display = "flex";
    right.style.flexDirection = "column";
    right.style.alignItems = "flex-end";
}
else if(p.type === "decimalmul"){
    let decimalmulLine = document.createElement("div");

    decimalmulLine.innerText =
        p.numbers[0].toFixed(1) + " × " + p.numbers[1];

    decimalmulLine.style.fontSize = "20px";
    decimalmulLine.style.textAlign = "right";

    right.appendChild(decimalmulLine);
}


else if(p.type === "decimaldivi"){
    let decimaldiviLine = document.createElement("div");

    decimaldiviLine.innerText =
        p.numbers[0].toFixed(1) + " ÷ " + p.numbers[1];

    decimaldiviLine.style.fontSize = "20px";
    decimaldiviLine.style.textAlign = "right";

    right.appendChild(decimaldiviLine);
}
else if (p.type === "bodmas") {
    let a = p.numbers[0];
    let b = p.numbers[1];
    let c = p.numbers[2];

    let op1 = p.ops[0];
    let op2 = p.ops[1];

    right.innerText = `(${a} ${op1} ${b}) ${op2} ${c}`;
}
else if(p.type === "sqrt") {
    right.innerText = "√" + p.numbers[0];
}
else if(p.type === "percent") {
    right.innerText = p.numbers[0] + "% of " + p.numbers[1];
}
else {

let first=document.createElement("div");
first.innerText=p.numbers[0];
right.appendChild(first);

for(let i=0;i<p.ops.length;i++){
let r=document.createElement("div");
r.innerText=p.ops[i] + p.numbers[i+1];
right.appendChild(r);
}

}

wrap.appendChild(left);
wrap.appendChild(right);

let input=document.createElement("input");
input.id="currentAnswer";
input.readOnly=true;
wrap.appendChild(input);

const mode = localStorage.getItem("mode");
let btn = document.createElement("button");
btn.innerText = "Next";
btn.classList.add("next-btn"); // 🔥 THIS is what you're missing

if(mode === "assessment"){
btn.onclick = assessmentQuestion;
    }
else if(mode === "practice"){
btn.onclick = nextQuestion;
}


wrap.appendChild(btn);
box.appendChild(wrap);

}

/* ---------------- NEXT QUESTION ---------------- */

function nextQuestion(){

let val = getAbacusValue();

if(val === "" || val === null || val === undefined){
val = 0;
}

userAnswers.push(val);

currentQuestion++;

if(currentQuestion<25){
showQuestion();
}else{
showWorksheet();
}

clearAbacus();

}


function assessmentQuestion(){

let val = getAbacusValue();

if(val === "" || val === null || val === undefined){
val = 0;
}

userAnswers.push(val);

currentQuestion++;

if(currentQuestion<25){
showQuestion();
}else{
assessmentworksheet();
}

clearAbacus();

}

/* ---------------- RESULT ---------------- */

function showWorksheet(){

let score = 0;

// Calculate correct answers
for(let i = 0; i < answers.length; i++){
    if(Number(userAnswers[i]) === answers[i]){
        score++;
    }
}

// Store everything
localStorage.setItem("problems", JSON.stringify(problems));
localStorage.setItem("answers", JSON.stringify(answers));
localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
localStorage.setItem("score", score);

let category = document.getElementById("category").value;

let selectedOption = document.getElementById("level").selectedOptions[0];

localStorage.setItem("category", category);
localStorage.setItem("levelName", selectedOption.text);
localStorage.setItem("levelRank", selectedOption.dataset.rank || selectedOption.value);

localStorage.setItem("mode", "practice");

let start = Number(localStorage.getItem("startTime"));
let timeTaken = Math.floor((Date.now() - start) / 1000);

localStorage.setItem("timeTaken", timeTaken);
// Redirect
window.location.href = "/abacus/practice/results";

}

function assessmentworksheet(){

let score = 0;

// Calculate correct answers
for(let i = 0; i < answers.length; i++){
    if(Number(userAnswers[i]) === answers[i]){
        score++;
    }
}

// Store everything
localStorage.setItem("problems", JSON.stringify(problems));
localStorage.setItem("answers", JSON.stringify(answers));
localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
localStorage.setItem("score", score);

let category = document.getElementById("category").value;

let selectedOption = document.getElementById("level").selectedOptions[0];

localStorage.setItem("category", category);
localStorage.setItem("levelName", selectedOption.text);
localStorage.setItem("levelRank", selectedOption.dataset.rank || selectedOption.value);

localStorage.setItem("mode", "assessment");

let start = Number(localStorage.getItem("startTime"));
let timeTaken = Math.floor((Date.now() - start) / 1000);

localStorage.setItem("timeTaken", timeTaken);
// Redirect
window.location.href = "/abacus/assessment/results";

}



function startAssessment(){

    console.log("🔥 startAssessment triggered");

    let category = document.getElementById("category").value;
    let level = document.getElementById("level").value;

    console.log("CATEGORY:", category, "LEVEL:", level);

    if(!category || !level){
        alert("Please select Category and Level");
        return;
    }

    const now = Date.now();
    localStorage.setItem("startTime", now);

    console.log("⏱ startTime saved:", now);

    currentQuestion = 0;

    console.log("📦 generating questions...");
    generateQuestions();

    console.log("⏳ starting timer...");
    startTimer();

    localStorage.setItem("mode", "assessment");
    localStorage.setItem("category", category);
localStorage.setItem("level", level);
localStorage.setItem("startTime", Date.now());
}

function startSession(){

    const mode = localStorage.getItem("mode");

    let category = document.getElementById("category").value;
    let level = document.getElementById("level").value;

    if(!category || !level){
        alert("Select category and level");
        return;
    }

    localStorage.setItem("category", category);
    localStorage.setItem("level", level);

    generateQuestions();

    const timerBox = document.getElementById("timer");

    if(mode === "assessment"){
        timerBox.style.display = "block";
        startTimer();
    }

    else if(mode === "practice"){
        timerBox.style.display = "none";
    }
}

function submitTest(){

  let start = Number(localStorage.getItem("startTime"));

  if(!start){
      console.warn("No start time found!");
      return;
  }

  let timeTaken = Math.floor((Date.now() - start) / 1000);

  localStorage.setItem("timeTaken", timeTaken);

  assessmentworksheet(); // ✅ DO NOT redirect here
}

function startPractice(){
    localStorage.setItem("mode", "practice");
    startSession();
}