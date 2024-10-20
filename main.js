let name = document.querySelector(".name");
let beforename = document.querySelector(".before-name")
let dots = document.querySelector(".dots")
let dotted = dots.innerHTML;
let named = name.innerHTML;
let beforenamed = beforename.innerHTML;
let beforenameArr = beforenamed.split("");
let nameArr = named.split("");
let dotArr = dotted.split("");
let description = document.querySelector(".description");
console.log(beforenameArr);

let beforenamecount = 0;
let namecount = 0;
let dotcount = 0;
beforename.innerHTML = "";
name.innerHTML = "";
dots.innerHTML = "";
let element = document.querySelector(".fadein")
let opacity = 0;

let backtotop = document.querySelector(".backtotop")


backtotop.addEventListener("click", () =>{
    window.scrollTo({
        top:0,
        behavior:"smooth"
    })
})
function typedjs() {
    if(beforenamecount < beforenameArr.length){
        beforename.innerHTML += beforenamed.charAt(beforenamecount);
        beforenamecount++;
    } else {
        
        name.innerHTML += named.charAt(namecount)
        namecount++
    }
    
}
function dotjs() {
    if(namecount >= nameArr.length){
        dots.innerHTML += dotted.charAt(dotcount);
        dotcount++
    } 
}
setInterval(() => {
    typedjs()
},100)
setInterval(()=> {
    dotjs()
},200)
// Fadein effect 
function fadein(){
    
        opacity += 0.005;//increments opacity
        if(opacity >=1){
            opacity = 1;
            return; //Stop the animation when fully visible
        }
        element.style.opacity = opacity;
        requestAnimationFrame(fadein)// call fadein again for the next frame

    }


requestAnimationFrame(fadein);
let blog = document.querySelector(".blog");
let loading = document.querySelector(".loading");
let loaded = loading.innerHTML;
let loadArr = loaded.split("");
console.log(loadArr)
let loadingdot = document.querySelector(".loadingdots");
let loaddot = loadingdot.innerHTML
let loaddotArr = loaddot.split("")
console.log(loaddotArr);
let loadingcount = 0;
let loadingdotcount = 0;
loading.innerHTML = "";
loadingdot.innerHTML = "";

function loadingjs() {
    if(loadingcount < loadArr.length){
        loading.innerHTML += loaded.charAt(loadingcount);
        loadingcount++
    } else if(loadingcount >= loadArr.length){
        if(loadingdotcount < loaddotArr.length){
            loadingdot.innerHTML += loaddot.charAt(loadingdotcount);
            loadingdotcount++
        }
        
    }
}
setInterval( () => {
    loadingjs()
},500)
blog.addEventListener("mouseover", loadingjs())



