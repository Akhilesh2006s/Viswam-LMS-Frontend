(function () {

async function loadCategories(){
    try {
        const json = await AbacusAPI.fetch('/portal/catalog');
        const categories = json.data.categories || [];
        const student = JSON.parse(localStorage.getItem("student") || "{}");
        let dropdown = document.getElementById("category");
        dropdown.innerHTML = "<option value=''>Select Category</option>";
        categories.forEach(c => {
            let op = document.createElement("option");
            op.value = c.category;
            op.text = c.category;
            dropdown.appendChild(op);
        });
        if (student.category) {
            dropdown.value = student.category;
            await updateLevels();
        }
    } catch (error) {
        console.error(error);
    }
}

async function updateLevels(){
    let category = document.getElementById("category").value;
    let levelDropdown = document.getElementById("level");
    levelDropdown.innerHTML = "<option value=''>Select Level</option>";
    if(!category) return;
    try {
        const json = await AbacusAPI.fetch('/portal/catalog');
        const cat = (json.data.categories || []).find(c => c.category === category);
        if (!cat) return;
        cat.levels.forEach((l) => {
            let op = document.createElement("option");
            op.value = l.level_name;
            op.text = l.Dropdown_names || l.level_name;
            op.dataset.rank = String(l.rank);
            levelDropdown.appendChild(op);
        });
        const student = JSON.parse(localStorage.getItem("student") || "{}");
        if (student.level && student.category === category) {
            levelDropdown.value = student.level;
        }
    } catch (error) {
        console.error(error);
    }
}

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
const directAdd={1:[1,2,3,5,6,7,8],2:[1,2,5,6,7],3:[1,5,6],4:[5],5:[1,2,3,4],6:[1,2,3],7:[1,2],8:[1]};
const directSub={1:[1],2:[1,2],3:[1,2,3],4:[1,2,3,4],5:[5],6:[1,5,6],7:[1,2,5,6,7],8:[1,2,3,5,6,7,8],9:[1,2,3,4,5,6,7,8,9]};
const fiveAdd={1:[4],2:[3,4],3:[2,3,4],4:[1,2,3,4]};
const fiveSub={5:[1,2,3,4],6:[2,3,4],7:[3,4],8:[4]};
const tenAdd={1:[9],2:[8,9],3:[7,8,9],4:[6,7,8,9],5:[5],6:[4,5,9],7:[3,4,5,8,9],8:[2,3,4,5,7,8,9],9:[1,2,3,4,5,6,7,8,9]};
const tenSub={0:[1,2,3,4,5,6,7,8,9],1:[2,3,4,5,7,8,9],2:[3,4,5,9],3:[4,5,9],4:[5],5:[6,7,8,9],6:[7,8,9],7:[8,9],8:[9]};
const mixAdd={5:[6,7,8,9],6:[6,7,8],7:[6,7],8:[6]};
const mixSub={1:[6],2:[6,7],3:[6,7,8],4:[6,7,8,9]};

/* ---------------- UTIL ---------------- */
function rand(arr){
    if(!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random()*arr.length)];
}

function topicOperation(topic){
    if([
        OPERATIONS.DIRECT_ADD,
        OPERATIONS.FIVE_ADD,
        OPERATIONS.TEN_ADD,
        OPERATIONS.MIX_ADD
    ].includes(topic)) return "+";

    return "-";
}

/* ---------------- DIGIT LOGIC ---------------- */
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

function tensDigit(current, op){

    let options = op === "+" ? directAdd[current] : directSub[current];

    if(!options || options.length === 0){
        return rand([1,2,3,4]); // fallback
    }

    options = options.filter(n => n <= 5);

    if(options.length === 0){
        return rand([1,2,3,4]); // fallback
    }

    return rand(options);
}

/* ---------------- LEVEL TOPICS ---------------- */
function levelTopics(category, levelName){

// STAR JUNIORS
if(category === "Star Juniors"){

if(levelName === "SJ1") return [OPERATIONS.DIRECT_ADD];
if(levelName === "SJ2") return [OPERATIONS.DIRECT_ADD, OPERATIONS.DIRECT_SUB];
if(levelName === "SJ3") return [OPERATIONS.DIRECT_ADD, OPERATIONS.DIRECT_SUB, OPERATIONS.FIVE_ADD];
if(levelName === "SJ4") return [OPERATIONS.FIVE_ADD, OPERATIONS.FIVE_SUB];

}

// JUNIORS
if(category === "Juniors"){

if(levelName === "J1") return [OPERATIONS.FIVE_ADD, OPERATIONS.FIVE_SUB];
if(levelName === "J2") return [OPERATIONS.TEN_ADD, OPERATIONS.TEN_SUB];
if(levelName === "J3") return [OPERATIONS.MIX_ADD, OPERATIONS.MIX_SUB];
if(levelName === "J4") return [OPERATIONS.RANDOM];

}

// SENIORS
if(category === "Seniors"){

if(levelName === "S1") return [OPERATIONS.FIVE_ADD, OPERATIONS.FIVE_SUB, OPERATIONS.TEN_ADD, OPERATIONS.TEN_SUB];
if(levelName === "S2") return [OPERATIONS.MIX_ADD, OPERATIONS.MIX_SUB];
if(levelName === "S3") return [OPERATIONS.MASTERING];
if(levelName === "S4") return [OPERATIONS.MASTERING, OPERATIONS.MULTIPLY];
if(levelName === "S5") return [OPERATIONS.DIVIDE];
if(levelName === "S6") return [OPERATIONS.DECIMAL];
if(levelName === "S7") return [OPERATIONS.DECIMALMUL];
if(levelName === "S8") return [OPERATIONS.BODMAS];
if(levelName === "S9") return [OPERATIONS.SQRT, OPERATIONS.PERCENT];
if(levelName === "S10") return [OPERATIONS.RANDOM];

}

return [OPERATIONS.DIRECT_ADD];
}   

/* ---------------- RANDOM ---------------- */
function resolveRandomTopic(){
    const weighted = [
        OPERATIONS.DIRECT_ADD,
        OPERATIONS.DIRECT_SUB,
        OPERATIONS.FIVE_ADD,
        OPERATIONS.FIVE_SUB,
        OPERATIONS.TEN_ADD,
        OPERATIONS.TEN_SUB,
        OPERATIONS.MIX_ADD
    ];
    return Math.random()<0.2 ? OPERATIONS.MIX_SUB : rand(weighted);
}

function buildMastering(rows){

let start = Math.floor(Math.random()*80)+20;

let numbers=[start];
let ops=[];
let total=start;

let curTens=Math.floor(start/10);
let curOnes=start%10;

for(let r=1;r<rows;r++){

let op=Math.random()<0.5?"+":"-";

let ones=Math.floor(Math.random()*10);
let tens=Math.floor(Math.random()*5)+1;

let num=tens*10+ones;

if(op==="-" && total-num<0){
op="+";
}

let onesCalc = op==="+" ? curOnes+ones : curOnes-ones;
let carry=0;

if(onesCalc>=10){
carry=1;
onesCalc-=10;
}
else if(onesCalc<0){
carry=-1;
onesCalc+=10;
}

let tensCalc = op==="+" ? curTens+tens+carry : curTens-tens+carry;

/* prevent negative tens */
if(tensCalc<0 || tensCalc>9){
r--;
continue;
}

total = op==="+" ? total+num : total-num;

curOnes=onesCalc;
curTens=tensCalc;

numbers.push(num);
ops.push(op);

}

return {
numbers:numbers,
ops:ops,
total:total,
type:"mastering"
};

}

/* ---------------- MULTIPLICATION PROBLEM ---------------- */

function buildMultiplication(){

    // âœ… Only allow 2 to 4 digits
    let digits = Math.floor(Math.random() * 3) + 2; // 2, 3, 4

    let min = Math.pow(10, digits - 1);  // 10, 100, 1000
    let max = Math.pow(10, digits) - 1;  // 99, 999, 9999

    let num1 = Math.floor(Math.random() * (max - min + 1)) + min;

    // âœ… single digit (2â€“9 ONLY)
    let num2 = Math.floor(Math.random() * 8) + 2;

    return {
        numbers: [num1, num2],
        ops: ["Ã—"],
        total: num1 * num2,
        type: "mul"
    };
}

function buildDivision(){

let quotient = Math.floor(Math.random()*90)+10;
let divisor = Math.floor(Math.random()*8)+2;

let dividend = quotient * divisor;

return{
numbers:[dividend,divisor],
ops:["Ã·"],
total:quotient,
type:"divi"
};

}

function buildDecimal(){

let n1 = parseFloat((Math.random()*50+10).toFixed(1));
let n2 = parseFloat((Math.random()*40+5).toFixed(1));

return{
numbers:[n1,n2],
ops:["+"],
total:parseFloat((n1+n2).toFixed(1)),
type:"decimal"
};

}

function buildDecimalmul(){

let n1=parseFloat((Math.random()*50+10).toFixed(1));
let n2=Math.floor(Math.random()*8)+2;

return{
numbers:[n1,n2],
ops:["Ã—"],
total:parseFloat((n1*n2).toFixed(1)),
type:"decimalmul"
};

}

function buildDecimaldivi(){

let n1=parseFloat((Math.random()*50+10).toFixed(1));
let n2=Math.floor(Math.random()*8)+2;

return{
numbers:[n1,n2],
ops:["Ã·"],
total:parseFloat((n1/n2).toFixed(1)),
type:"decimaldivi"
};

}

function buildBodmas(){

let a = Math.floor(Math.random()*14)+2;
let b = Math.floor(Math.random()*14)+2;

let op1 = Math.random()<0.5?"+":"-";

if(op1==="-" && a<b){
[a,b]=[b,a];
}

let bracketValue = op1==="+" ? a+b : a-b;

let op2 = Math.random()<0.5?"Ã—":"Ã·";

let c;

if(op2==="Ã·"){

let divisors=[];

for(let i=2;i<=10;i++){
if(bracketValue % i ===0){
divisors.push(i);
}
}

if(divisors.length===0){
op2="Ã—";
c=Math.floor(Math.random()*4)+2;
}
else{
c=divisors[Math.floor(Math.random()*divisors.length)];
}

}else{

c=Math.floor(Math.random()*4)+2;

}

let total = op2==="Ã—" ? bracketValue*c : bracketValue/c;

return{
numbers:[a,b,c],
ops:[op1,op2],
total:total,
type:"bodmas"
};

}

function buildSqrt(){

let squares=[];

for(let i=1;i<=31;i++){
squares.push(i*i);
}

let num=rand(squares);

return{
numbers:[num],
ops:["âˆš"],
total:Math.sqrt(num),
type:"sqrt"
};

}

function buildPercent(){

let percent = rand([10,20,25,50,75]);

let base = (Math.floor(Math.random()*9)+1)*40;

return{
numbers:[percent,base],
ops:["% of"],
total:(percent/100)*base,
type:"percent"
};

}

/* ---------------- BUILD PROBLEM ---------------- */
function buildProblem(rows,topics){

    let attempts = 0;
    
    while(attempts < 100){

        attempts++;

        let tens=Math.floor(Math.random()*8)+1;
        let ones=Math.floor(Math.random()*9)+1;

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

            let op=topicOperation(topic);

            let o=onesDigit(curOnes,topic);
            let t=tensDigit(curTens,op);

            if(o==null||t==null){
                valid=false;
                break;
            }

            let num=t*10+o;

            if(op === "+"){
                total += num;
            }else{
                total -= num;
                if(total < 0){
                    valid=false;
                    break;
                }
            }

            let onesCalc = op === "+" ? curOnes + o : curOnes - o;
            let carry = 0;

            if(onesCalc >= 10){
                carry = 1;
                onesCalc -= 10;
            }
            else if(onesCalc < 0){
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

            numbers.push(num);
            ops.push(op);
        }

        if(valid) return {numbers,ops,total};
    }

    throw new Error("Failed to generate");
}

/* ---------------- MAIN ---------------- */
let answers=[];

function renderPhysicalProblem(box, p, q){
        let wrap=document.createElement("div");
        wrap.className="problem physical-problem";

        let html=`<div class="serial">Q${q}</div><div class="problem-lines">`;

        function numLine(value, op){
            if(op){
                return `<div class="num"><span class="op">${op}</span><span class="digit">${value}</span></div>`;
            }
            return `<div class="num"><span class="digit">${value}</span></div>`;
        }

        if(p.type==="mul"){
            html+=numLine(p.numbers[0]);
            html+=numLine(p.numbers[1], "×");
        }
        else if(p.type==="divi"){
            html+=numLine(p.numbers[0]);
            html+=numLine(p.numbers[1], "÷");
        }
        else if(p.type==="decimal"){
            html+=numLine(p.numbers[0].toFixed(1));
            html+=numLine(p.numbers[1].toFixed(1), "+");
        }
        else if(p.type==="decimalmul"){
            html+=`<div class="num expr"><span class="digit">${p.numbers[0].toFixed(1)}</span> <span class="op">×</span> <span class="digit">${p.numbers[1]}</span></div>`;
        }
        else if(p.type==="decimaldivi"){
            html+=`<div class="num expr"><span class="digit">${p.numbers[0].toFixed(1)}</span> <span class="op">÷</span> <span class="digit">${p.numbers[1]}</span></div>`;
        }
        else if(p.type==="bodmas"){
            html+=`<div class="num expr"><span class="op">(</span><span class="digit">${p.numbers[0]}</span> <span class="op">${p.ops[0]}</span> <span class="digit">${p.numbers[1]}</span><span class="op">)</span> <span class="op">${p.ops[1]}</span> <span class="digit">${p.numbers[2]}</span></div>`;
        }
        else if(p.type==="sqrt"){
            html+=`<div class="num expr"><span class="op">√</span><span class="digit">${p.numbers[0]}</span></div>`;
        }
        else if(p.type==="percent"){
            html+=`<div class="num expr"><span class="digit">${p.numbers[0]}</span><span class="op">%</span> <span class="op">of</span> <span class="digit">${p.numbers[1]}</span></div>`;
        }
        else{
            html+=numLine(p.numbers[0]);
            for(let i=0;i<p.ops.length;i++){
                html+=numLine(p.numbers[i+1], p.ops[i]);
            }
        }

        html+=`</div><input type="number" class="answer" placeholder="Answer">`;
        html+=`<div class="result"></div>`;
        wrap.innerHTML = html;
        box.appendChild(wrap);
}

function generateQuestions(){

    localStorage.removeItem("problems");
    localStorage.removeItem("answers");
    localStorage.removeItem("userAnswers");
    localStorage.removeItem("score");

    let category = document.getElementById("category").value;
    let levelName = document.getElementById("level").value;

    if (!category || !levelName) {
        alert("Please select Category and Level");
        return;
    }

    let box = document.getElementById("questions");
    box.innerHTML = "";

    void (async function(){
        try{
            const set = await window.fetchAbacusQuestionSet(category, levelName, "physical-practice");
            const problems = set.problems;
            answers = set.answers;

            problems.forEach(function(p, index){
                renderPhysicalProblem(box, p, index + 1);
            });

            localStorage.setItem("problems", JSON.stringify(problems));
            localStorage.setItem("answers", JSON.stringify(answers));
        }catch(err){
            console.error(err);
            alert(err.message || "Failed to generate questions");
        }
    })();
}

/* ---------------- CHECK ---------------- */
function checkAnswers(){

    let inputs = document.querySelectorAll(".answer");

    let userAnswers = [];
    let score = 0;

    inputs.forEach((input,index)=>{

        let val = parseFloat(input.value);
        userAnswers.push(val);

        if(!isNaN(val) && Math.abs(val - answers[index]) < 0.01){
            score++;
        }
    });

    if(userAnswers.every(v => isNaN(v))){
        alert("Please answer at least one question");
        return;
    }

    // STORE
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
    localStorage.setItem("score", score);

    localStorage.setItem("category", document.getElementById("category").value);
    localStorage.setItem("level", document.getElementById("level").value);

    // ðŸ”¥ MODE HANDLING (IMPORTANT)
    localStorage.setItem("mode", "physical-practice");

    // REDIRECT
    window.location.href = "/abacus/practice/results";
}

/* ---------------- RESET ---------------- */
function resetAnswers(){
    document.querySelectorAll(".answer").forEach(i=>i.value="");
    document.querySelectorAll(".result").forEach(i=>{
        i.innerHTML="";
        i.className="result";
    });
}

function initPhysicalPractice() {
  void loadCategories();
}

window.loadCategories = loadCategories;
window.updateLevels = updateLevels;
window.generateQuestions = generateQuestions;
window.checkAnswers = checkAnswers;
window.resetAnswers = resetAnswers;
window.initPhysicalPractice = initPhysicalPractice;

initPhysicalPractice();

})();
