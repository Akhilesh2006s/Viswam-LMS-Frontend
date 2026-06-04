(function () {

let answerBox = null;
let stepList = null;
let errorBox = null;
let techniqueBox = null;
let questionBox = null;
const RODS=13;
const BEAD_H=24;
const BAR_TOP=52;
const FIRST_EARTH=BAR_TOP;
const EARTH_DOWN=[250-(4*BEAD_H),250-(3*BEAD_H),250-(2*BEAD_H),250-BEAD_H];

let abacusEl=null;
let rowEl=null;
let totalBoxEl=null;

const states=[];

function bindPageElements(){
answerBox=document.getElementById("answerResult");
stepList=document.getElementById("stepList");
errorBox=document.getElementById("errorBox");
techniqueBox=document.getElementById("techniqueResult");
questionBox=document.getElementById("question_box");
abacusEl=document.getElementById("abacus");
rowEl=document.getElementById("rodValuesRow");
totalBoxEl=document.getElementById("totalValue");
}

function rodValue(s){
return (s.h?5:0)+s.e;
}

function showError(msg){
if(errorBox) errorBox.innerText = msg;
}

function clearError(){
if(errorBox) errorBox.innerText = "";
}
function normalizeInput(input){

return input
.toLowerCase()

/* words → symbols */
.replace(/plus/g, "+")
.replace(/minus/g, "-")
.replace(/times/g, "*")
.replace(/dividedby/g, "/")
.replace(/divided\s*by/g, "/")
.replace(/div/g, "/")

/* symbols → standard */
.replace(/[x×]/g, "*")
.replace(/[÷]/g, "/")

/* remove spaces */
.replace(/\s+/g, "")

}
function updateTotal(){

if(!totalBoxEl) return;

let v = states.map(rodValue).join("").replace(/^0+/,"") || "0";

totalBoxEl.innerText = v;

/* show value in answer box if it exists */

let ansBox = document.getElementById("currentAnswer");

if(ansBox){
ansBox.value = v;
}

}

function updateEarth(s){

    const rod = s.eb[0].parentElement;
    const rodHeight = rod.offsetHeight;

    const BOTTOM_START = rodHeight - (4 * BEAD_H); // full stack base
    const ACTIVE_START = BAR_TOP + 2; // just below bar

    // 1. Reset ALL beads to bottom stack (like image)
    for(let i=0;i<4;i++){
        s.eb[i].style.top = (BOTTOM_START + i * BEAD_H) + "px";
    }

    // 2. Move active beads upward (touching bar)
    for(let i=0;i<s.e;i++){
        s.eb[i].style.top = (ACTIVE_START + i * BEAD_H) + "px";
    }

}

function createRod(i){

if(!abacusEl || !rowEl) return;

let rod=document.createElement("div");
rod.className="rod";

let line=document.createElement("div");
line.className="rod-line";
rod.appendChild(line);

// CREATE DOT ONLY ON RODS 1,4,7,10,13
if(i%3===0){
let dot=document.createElement("div");
dot.className="unit-dot";
rod.appendChild(dot);
}

let bar=document.createElement("div");
bar.className="unit-bar";
rod.appendChild(bar);

let up=document.createElement("div");
up.className="bead upper-bead";
up.style.top="0px";
rod.appendChild(up);

let eb=[];
for(let j=0;j<4;j++){
let b=document.createElement("div");
b.className="bead earth-bead";
b.style.top=EARTH_DOWN[j]+"px";
rod.appendChild(b);
eb.push(b);
}

let box=document.createElement("div");
box.className="rod-value-box";
box.innerText="0";
rowEl.appendChild(box);

let s={h:false,e:0,up,eb,box};

window.AbacusBeadCursor?.bindBead(up);

up.onclick=()=>{
const wasActive=s.h;
window.AbacusBeadCursor?.feedback(wasActive?"down":"up");
s.h=!s.h;
up.style.top=s.h?(BAR_TOP-BEAD_H)+"px":"0px";
box.innerText=rodValue(s);
updateTotal();
};

eb.forEach((b,idx)=>{
window.AbacusBeadCursor?.bindBead(b);
b.onclick=()=>{
const wasActive=idx<s.e;
window.AbacusBeadCursor?.feedback(wasActive?"down":"up");
if(idx<s.e)s.e=idx;
else s.e=idx+1;
updateEarth(s);
box.innerText=rodValue(s);
updateTotal();
};
});

states.push(s);
abacusEl.appendChild(rod);

}

function getAbacusValue(){

let v = states.map(rodValue).join("").replace(/^0+/,"") || "0";

return parseInt(v);

}

function clearAbacus(){
states.forEach(s=>{
s.h=false;
s.e=0;
s.up.style.top="0px";
updateEarth(s);
s.box.innerText="0";
});
updateTotal();
}

function initTeacherAbacusBoard(){
bindPageElements();
if(!abacusEl || !rowEl) return;

abacusEl.innerHTML="";
rowEl.innerHTML="";
states.length=0;

for(let i=0;i<RODS;i++) createRod(i);
window.AbacusBeadCursor?.resetBoardBinding?.();
window.AbacusBeadCursor?.bindBoard(abacusEl);
updateTotal();
}

/* ================================
ABACUS SOLVER ENGINE
================================ */

let steps = []
let stepIndex = 0
let isPrepared = false;

/* READ QUESTION */

function parseQuestion(){
bindPageElements();
if(!questionBox) return null;

let text = normalizeInput(questionBox.value)
let tokens = text.match(/(\d+|[\+\-\*\/])/g)

if(!tokens) return null

let start = tokens.shift()

let operations=[]

while(tokens.length>=2){

let op=tokens.shift()
let num=tokens.shift()

operations.push({
op:op,
num:num
})

}

return{
start:start,
operations:operations
}

}

/* TECHNIQUE DETECTION */

function detectTechnique(a,b,op){

a = Number(a)
b = Number(b)

/* ================= ADDITION ================= */

if(op === "+"){

/* 5's COMPLEMENT */
if(
(b===1 && a===4) ||
(b===2 && [3,4].includes(a)) ||
(b===3 && [2,3,4].includes(a)) ||
(b===4 && [1,2,3,4].includes(a))
){
return "5's Complement"
}

/* MIXED COMPLEMENT */
if(
(b===6 && [5,6,7,8].includes(a)) ||
(b===7 && [5,6,7].includes(a)) ||
(b===8 && [5,6].includes(a)) ||
(b===9 && [5].includes(a))
){
return "Mixed Complement"
}

/* 10's COMPLEMENT */
if(
(b===1 && a===9) ||
(b===2 && [8,9].includes(a)) ||
(b===3 && [7,8,9].includes(a)) ||
(b===4 && [6,7,8,9].includes(a)) ||
(b===5 && [5,6,7,8,9].includes(a)) ||
(b===6 && [4,9].includes(a)) ||
(b===7 && [3,4,8,9].includes(a)) ||
(b===8 && [2,3,4,7,8,9].includes(a)) ||
(b===9 && [1,2,3,4,5,6,7,8,9].includes(a))
){
return "10's Complement"
}

/* DIRECT */
return "Direct Addition"

}

/* ================= SUBTRACTION ================= */

if(op === "-"){

/* 5's COMPLEMENT */
if(
(b===1 && [5].includes(a)) ||
(b===2 && [5,6].includes(a)) ||
(b===3 && [5,6,7].includes(a)) ||
(b===4 && [5,6,7,8].includes(a))
){
return "5's Complement"
}

/* MIXED COMPLEMENT */
if(
(b===6 && [1,2,3,4].includes(a)) ||
(b===7 && [2,3,4].includes(a)) ||
(b===8 && [3,4].includes(a)) ||
(b===9 && [4].includes(a))
){
return "Mixed Complement"
}

/* 10's COMPLEMENT */
if(a < b){
return "10's Complement"
}

/* DIRECT */
return "Direct Subtraction"

}

return "Direct"
}

/* ROD HIGHLIGHT */

function highlightRod(r){

document.querySelectorAll(".rod").forEach(x=>x.style.background="")

let rods=document.querySelectorAll(".rod")

if(rods[r])
rods[r].style.background="#ffeaa7"

}

/* READ ROD VALUE */

function getRodValue(index){

let s=states[index]

return (s.h?5:0)+s.e

}

/* SET ROD VALUE */

function setRodValue(index,val){

if(val<0) val=0
if(val>9) val=9

let s=states[index]

if(val>=5){

s.h=true
s.e=val-5

}else{

s.h=false
s.e=val

}

s.up.style.top=s.h?(BAR_TOP-BEAD_H)+"px":"0px"

updateEarth(s)

s.box.innerText=rodValue(s)

updateTotal()

}

function getPlaceName(index){

let place = RODS-1-index

if(place===0) return "Ones"
if(place===1) return "Tens"
if(place===2) return "Hundreds"
if(place===3) return "Thousands"

return `10^${place}`

}

/* EXECUTE STEP */

function nextStep(){

    // 🔥 IF FINISHED → NEXT CLICK CLEARS EVERYTHING
if(stepIndex === steps.length && steps.length > 0){

    techniqueBox.innerText = "Finished"

    let ans = calculateExpression()
    if(ans !== null){
        answerBox.innerText = ans
    }

    stepIndex++  // prevent repeat
    return
}

// 🔥 PREPARE ONLY ONCE
if (!isPrepared) {
    startSolve(false);
    isPrepared = true;
    let ans = calculateExpression();
    if (ans !== null && answerBox) {
        answerBox.innerText = ans;
    }
}

if(stepIndex>=steps.length) return

let step=steps[stepIndex]
let div=document.createElement("div")
div.className="step"
div.innerText=step.text
stepList.appendChild(div)

if(step.type==="info"){
techniqueBox.innerText = step.tech
stepIndex++
return
}

highlightRod(step.rod)

techniqueBox.innerText =
`Technique : ${step.tech}
Step : ${step.type==="add" ? "+" : "-"} ${step.value}`

let current=getRodValue(step.rod)

let result=current

if(step.type==="add")
result=current+step.value

if(step.type==="sub")
result=current-step.value

/* HANDLE CARRY */

if(result>9){

setRodValue(step.rod,result-10)

let left=Math.max(0,step.rod-1)

if(left>=0)
setRodValue(left,getRodValue(left)+1)

}

else if(result<0){

let left=Math.max(0,step.rod-1)

while(left>=0 && getRodValue(left)===0){
setRodValue(left,9)
left--
}

if(left>=0){
setRodValue(left,getRodValue(left)-1)
}

setRodValue(step.rod,result+10)

}

else{

setRodValue(step.rod,result)

}

stepIndex++
if(stepIndex > steps.length){
    clearQuestion()
    return
}

}


function clearQuestion(){

    // 🧹 clear input + UI
    questionBox.value = ""
    errorBox.innerText = ""
    stepList.innerHTML = ""

    // 🔄 reset logic
    steps = []
    stepIndex = 0
    isPrepared = false

    // 🧮 reset abacus
    clearAbacus()

    // 🧾 reset display
    techniqueBox.innerText = "Ready"
    answerBox.innerText = "0"

}   

function startSolve(showAnswer = true){

    steps = []
    stepIndex = 0
    isPrepared = showAnswer
    stepList.innerHTML = ""

    let rawText = normalizeInput(questionBox.value)

    // ❌ REMOVE auto-answer from here

    if(showAnswer){
        let ans = calculateExpression()
        if(ans !== null){
            answerBox.innerText = ans
        }
    }

    clearAbacus()

    let q = parseQuestion()
    if(!q){
        showError("Invalid question — use numbers with + − × ÷")
        return
    }

    clearError()

    let tempStates = new Array(RODS).fill(0)

    let runningValue = parseInt(q.start, 10)

    const needsInitialLoad =
        q.operations.length === 0 ||
        (q.operations[0].op !== "*" && q.operations[0].op !== "/")

    if(needsInitialLoad){
        generateLoadSteps(q.start, tempStates)
    }

    q.operations.forEach(opObj => {

        if(opObj.op === "+"){
            generateStepsForPair({
                a: runningValue.toString(),
                b: opObj.num,
                op: "+"
            }, tempStates)
            runningValue += parseInt(opObj.num, 10)
        }
        else if(opObj.op === "-"){
            generateStepsForPair({
                a: runningValue.toString(),
                b: opObj.num,
                op: "-"
            }, tempStates)
            runningValue -= parseInt(opObj.num, 10)
        }
        else if(opObj.op === "*"){
            generateMultiplicationSteps(runningValue.toString(), opObj.num, tempStates)
            runningValue *= parseInt(opObj.num, 10)
        }
        else if(opObj.op === "/"){
            generateDivisionSteps(runningValue.toString(), opObj.num, tempStates)
            const divisor = parseInt(opObj.num, 10)
            runningValue = divisor === 0 ? runningValue : Math.floor(runningValue / divisor)
        }

    })

    techniqueBox.innerText = "Ready"
}

function techniqueExplanation(tech,a,b){

if(tech==="5's Complement")
return `+ ${b} = +5 - ${5-b}`

if(tech==="10's Complement")
return `+ ${b} = -${10-b} + 10`

if(tech==="Mixed Complement")
return `+ ${b} = +${b-5} - 5 + 10`

return "Direct move beads"

}

function loadNumberOnAbacus(num){

let digits = num.split("").reverse()

for(let i=0;i<digits.length;i++){

let rodIndex = RODS - 1 - i
if(rodIndex < 0) continue

setRodValue(rodIndex, parseInt(digits[i]))

}

}

function calculateExpression(){

let text = normalizeInput(questionBox.value);

let tokens = text.match(/(\d+(\.\d+)?|[\+\-\*\/])/g);

if(!tokens) return null;

let result = parseFloat(tokens.shift());

while(tokens.length >= 2){

let op = tokens.shift();
let num = parseFloat(tokens.shift());

if(op === "+") result += num;
else if(op === "-") result -= num;
else if(op === "*") result *= num;
else if(op === "/"){
if(num === 0) return null;
result /= num;
}

}

if(Number.isInteger(result)) return result;
return parseFloat(result.toFixed(4));

}

function generateMultiplicationSteps(multiplicand, multiplier, tempStates){

let mc = parseInt(multiplicand, 10);
let ml = parseInt(multiplier, 10);

if(Number.isNaN(mc) || Number.isNaN(ml) || mc < 0 || ml < 0){
showError("Multiplication requires non-negative whole numbers");
return;
}

if(ml === 0 || mc === 0){
steps.push({
rod:-1,
type:"info",
value:0,
tech:"Multiplication",
text:`${mc} × ${ml} = 0`
});
tempStates.fill(0);
return;
}

steps.push({
rod:-1,
type:"info",
value:0,
tech:"Multiplication",
text:`Multiply ${mc} × ${ml}: add ${mc}, ${ml} time(s)`
});

tempStates.fill(0);

for(let i=0;i<ml;i++){

steps.push({
rod:-1,
type:"info",
value:0,
tech:"Multiplication",
text:`--- Addition ${i + 1} of ${ml}: + ${mc} ---`
});

generateStepsForPair({
a:tempStates.slice().reverse().join("").replace(/^0+/,"") || "0",
b:String(mc),
op:"+"
}, tempStates);

}

}

function generateDivisionSteps(dividend, divisor, tempStates){

let dv = parseInt(dividend, 10);
let ds = parseInt(divisor, 10);

if(Number.isNaN(dv) || Number.isNaN(ds)){
showError("Division requires whole numbers");
return;
}

if(ds === 0){
showError("Cannot divide by zero");
return;
}

if(dv < 0 || ds < 0){
showError("Use positive whole numbers for the division demo");
return;
}

let remainder = dv % ds;

steps.push({
rod:-1,
type:"info",
value:0,
tech:"Division",
text:`Divide ${dv} ÷ ${ds}: subtract ${ds} repeatedly`
});

generateLoadSteps(String(dv), tempStates);

let running = dv;
let count = 0;

while(running >= ds){

count++;

steps.push({
rod:-1,
type:"info",
value:0,
tech:"Division",
text:`--- Subtraction ${count}: ${running} − ${ds} ---`
});

generateStepsForPair({
a:String(running),
b:String(ds),
op:"-"
}, tempStates);

running -= ds;

}

steps.push({
rod:-1,
type:"info",
value:0,
tech:"Division",
text:remainder === 0
? `Quotient = ${count} (board shows 0)`
: `Quotient = ${count}, remainder ${remainder} (board shows ${running})`
});

if(remainder !== 0){
showError(`${dv} ÷ ${ds} leaves remainder ${remainder}. Steps show repeated subtraction; exact quotient is ${Math.floor(dv / ds)} R${remainder}.`);
}

}

function generateStepsForPair(temp, tempStates){

if(temp.op !== "+" && temp.op !== "-"){
showError(`Cannot build bead steps for "${temp.op}". Use Show answer first.`);
return;
}

let B=temp.b.split("")
let max=B.length

for(let i=max-1;i>=0;i--){

let rodIndex = RODS-1-i
let d2=parseInt(B[max-1-i])

/* ✅ USE TEMP STATE */
let current = tempStates[rodIndex]

let tech = detectTechnique(current,d2,temp.op)

/* simulate */

let result = temp.op==="+" 
? current + d2 
: current - d2

if(result > 9){

tempStates[rodIndex] = result - 10

let left = rodIndex - 1
if(left >= 0) tempStates[left] += 1

}
else if(result < 0){

let left = rodIndex - 1

while(left >= 0 && tempStates[left] === 0){
tempStates[left] = 9
left--
}

if(left >= 0){
tempStates[left] -= 1
}

tempStates[rodIndex] = result + 10

}
else{

tempStates[rodIndex] = result

}

/* push step */

steps.push({
rod:rodIndex,
type:(temp.op=="+")?"add":"sub",
value:d2,
tech,
text:`${getPlaceName(rodIndex)} : ${current} ${temp.op} ${d2}
Technique : ${tech}`
})

}
}

function generateLoadSteps(num, tempStates){

let digits = num.split("")
let max = digits.length

for(let i=max-1;i>=0;i--){

let rodIndex = RODS-1-i
let value = parseInt(digits[max-1-i])

/* ✅ ADD THIS LINE HERE */
tempStates[rodIndex] = value

steps.push({
rod:rodIndex,
type:"add",
value:value,
tech:"Load Number",
text:`${getPlaceName(rodIndex)} : set ${value}`
})

}
}

window.initTeacherAbacusBoard = initTeacherAbacusBoard;
window.clearAbacus = clearAbacus;
window.getAbacusValue = getAbacusValue;
window.startSolve = startSolve;
window.nextStep = nextStep;
window.clearQuestion = clearQuestion;

clearError();

})();
