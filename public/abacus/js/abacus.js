(function () {

const RODS=13;
const BEAD_H=24;
const BAR_TOP=52;
const FIRST_EARTH=BAR_TOP;
const EARTH_DOWN=[250-(4*BEAD_H),250-(3*BEAD_H),250-(2*BEAD_H),250-BEAD_H];

let abacusEl=null;
let rowEl=null;
let totalBoxEl=null;

const states=[];

function bindElements(){
abacusEl=document.getElementById("abacus");
rowEl=document.getElementById("rodValuesRow");
totalBoxEl=document.getElementById("totalValue");
}

function rodValue(s){
return (s.h?5:0)+s.e;
}

function updateTotal(){

if(!totalBoxEl) return;

let v = states.map(rodValue).join("").replace(/^0+/,"") || "0";

totalBoxEl.innerText = v;

let ansBox = document.getElementById("currentAnswer");

if(ansBox){
ansBox.value = v;
}

}

function updateEarth(s){

    const rod = s.eb[0].parentElement;
    const rodHeight = rod.offsetHeight;

    const BOTTOM_START = rodHeight - (4 * BEAD_H);
    const ACTIVE_START = BAR_TOP + 2;

    for(let i=0;i<4;i++){
        s.eb[i].style.top = (BOTTOM_START + i * BEAD_H) + "px";
    }

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

up.onclick=()=>{
s.h=!s.h;
up.style.top=s.h?(BAR_TOP-BEAD_H)+"px":"0px";
box.innerText=rodValue(s);
updateTotal();
};

eb.forEach((b,idx)=>{
b.onclick=()=>{
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

function initAbacusBoard(){
bindElements();
if(!abacusEl || !rowEl) return;

abacusEl.innerHTML="";
rowEl.innerHTML="";
states.length=0;

for(let i=0;i<RODS;i++) createRod(i);
updateTotal();
}

window.initAbacusBoard = initAbacusBoard;
window.clearAbacus = clearAbacus;
window.getAbacusValue = getAbacusValue;

})();
