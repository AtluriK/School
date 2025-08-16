// ================= Storage Keys =================
const storageLessonKey = `${pageKeyPrefix}-lessonIndex`;
const storageTaskKey = `${pageKeyPrefix}-taskIndex`;
const charIndexKey = `${pageKeyPrefix}-charIndex`;
const totalKeystrokesKey = `${pageKeyPrefix}-totalKeystrokes`;
const errorsKey = `${pageKeyPrefix}-errors`;
const intervalsKey = `${pageKeyPrefix}-keystrokeIntervals`;

// ================= Initialize Lesson & Task =================
let lessonIndex = parseInt(localStorage.getItem(storageLessonKey)) || 0;
let taskIndex = parseInt(localStorage.getItem(storageTaskKey)) || 0;
let charIndex = parseInt(localStorage.getItem(charIndexKey)) || 0;

// ================= Typing Stats =================
let startTime = null;
let totalKeystrokes = parseInt(localStorage.getItem(totalKeystrokesKey)) || 0;
let errors = parseInt(localStorage.getItem(errorsKey)) || 0;
let lastKeyTime = null;
let keystrokeIntervals = JSON.parse(localStorage.getItem(intervalsKey)) || [];
let lastHandUsed = "right"; // for thumb highlighting
const fingerErrors = { pinky: 0, ring: 0, middle: 0, index: 0, thumb: 0 };
const keyErrors = {}; // { "f": 3, "j": 2 }

// ================= Keyboard Layout & Finger Mapping =================
const keyboardLayout = [
  ["`","1","2","3","4","5","6","7","8","9","0","-","=","Backspace"],
  ["Tab","Q","W","E","R","T","Y","U","I","O","P","[","]","\\"],
  ["CapsLock","A","S","D","F","G","H","J","K","L",";","'","Enter"],
  ["Shift","Z","X","C","V","B","N","M",",",".","/","Shift"],
  ["Ctrl","Fn","Win","Alt"," ","Altgr","Fn","Ctrl"]
];

const fingerClass = {
  "`":"pinky","~":"pinky","1":"pinky","!":"pinky","q":"pinky","a":"pinky","z":"pinky",
  "Tab":"pinky","CapsLock":"pinky","Shift":"pinky","Ctrl":"pinky","Fn":"pinky",
  "2":"ring","@":"ring","w":"ring","s":"ring","x":"ring",
  "3":"middle","#":"middle","e":"middle","d":"middle","c":"middle",
  "4":"index","5":"index","$":"index","%":"index","r":"index","f":"index","v":"index","t":"index","g":"index","b":"index",
  "Win":"thumb","Alt":"thumb"," ":"thumb","Altgr":"thumb",
  "6":"index","7":"index","^":"index","&":"index","y":"index","h":"index","n":"index","u":"index","j":"index","m":"index",
  "8":"middle","*":"middle","i":"middle","k":"middle",",":"middle","<":"middle",
  "o":"ring","l":"ring",".":"ring","9":"ring","(":"ring",">":"ring",
  "0":"pinky","-":"pinky","=":"pinky","Backspace":"pinky",")":"pinky","_":"pinky","+":"pinky",
  "p":"pinky","[":"pinky","]":"pinky","\\":"pinky","{":"pinky","}":"pinky","|":"pinky",
  ";":"pinky","'":"pinky","Enter":"pinky",":":"pinky",'"':"pinky","/":"pinky","Shift":"pinky","?":"pinky",
  "Fn":"pinky","Ctrl":"pinky",
};

const shiftMap = {
  "!":"1","@":"2","#":"3","$":"4","%":"5","^":"6","&":"7","*":"8","(":"9",")":"0",
  "_":"-","+":"=","{":"[","}":"]","|":"\\",":":";","\"":"'","<":",",">":".","?":"/","~":"`"
};

const leftKeys = ["`","~","1","!","2","@","3","#","4","$","5","%","q","w","e","r","t","a","s","d","f","g","z","x","c","v","b","Tab","CapsLock","Shift","Ctrl","Fn","Alt"];
const rightKeys = ["6","^","7","&","8","*","9","(","0",")","-","_","=","+","y","u","i","o","p","[","{","]","}","\\","|","h","j","k","l",";",":","'","\"","n","m",",","<",".",">","/","?","Shift","Ctrl","Fn","Alt","Enter","Backspace"];

// ================= WPM & Accuracy =================
function calculateWPM() {
  if(!startTime) return 0;
  const now = new Date();
  const minutes = (now - startTime) / 60000;
  return Math.round((charIndex / 5) / minutes);
}

function calculateAccuracy() {
  if(totalKeystrokes === 0) return 100;
  return Math.round(((totalKeystrokes - errors)/totalKeystrokes)*100);
}

// ================= Update Stats =================
function updateStats() {
  const wpmSpan = document.getElementById("wpm");
  const accuracySpan = document.getElementById("accuracy");
  const fingerErrorsSpan = document.getElementById("finger-errors");
  const problemKeysSpan = document.getElementById("key-errors");
  const rhythmSpan = document.getElementById("rhythm");

  if(wpmSpan) wpmSpan.textContent = calculateWPM();
  if(accuracySpan) accuracySpan.textContent = calculateAccuracy() + "%";
  if(fingerErrorsSpan) fingerErrorsSpan.textContent = Object.values(fingerErrors).reduce((a,b)=>a+b,0);

  const sortedKeys = Object.entries(keyErrors)
                          .sort((a,b)=>b[1]-a[1])
                          .slice(0,3)
                          .map(k=>k[0]);
  if(problemKeysSpan) problemKeysSpan.textContent = sortedKeys.length ? sortedKeys.join(", ") : "None";

  const avgInterval = keystrokeIntervals.length 
                      ? Math.round(keystrokeIntervals.reduce((a,b)=>a+b,0)/keystrokeIntervals.length)
                      : 0;
  if(rhythmSpan) rhythmSpan.textContent = avgInterval + "ms";
}

// ================= Render Keyboard =================
document.addEventListener("DOMContentLoaded", () => {
    const keyboardDiv = document.getElementById("keyboard");
    if(keyboardDiv){
        keyboardLayout.forEach(row=>{
            const rowDiv = document.createElement("div");
            rowDiv.className="key-row";
            row.forEach(key=>{
                const keyDiv = document.createElement("div");
                const fclass = fingerClass[key] || fingerClass[key.toLowerCase()] || "thumb";
                keyDiv.className = `key ${fclass}`;
                const shiftedSymbol = Object.keys(shiftMap).find(s=>shiftMap[s]===key);
                keyDiv.innerHTML = shiftedSymbol ? `<span style="font-size:0.6rem;position:absolute;top:2px;">${shiftedSymbol}</span><br>${key}` : key;
                keyDiv.dataset.key = key;
                if(key==="Backspace") keyDiv.classList.add("w100");
                else if(key==="Ctrl") keyDiv.classList.add("w75");
                else if(key==="Tab") keyDiv.classList.add("w80");
                else if(key==="CapsLock") keyDiv.classList.add("w90");
                else if(key==="Enter") keyDiv.classList.add("w100");
                else if(key==="Shift") keyDiv.classList.add("w120");
                else if(key==="Fn") keyDiv.classList.add("w60");
                else if(key==="Win") keyDiv.classList.add("w70");
                else if(key==="Alt") keyDiv.classList.add("w70");
                else if(key==="Altgr") keyDiv.classList.add("w70");
                else if(key===" ") keyDiv.classList.add("w250");
                else keyDiv.classList.add("w60");
                rowDiv.appendChild(keyDiv);
            });
            keyboardDiv.appendChild(rowDiv);
        });
    }

    renderLesson();
    updateStats();
});

// ================= Highlight Key & Fingers =================
function highlightKey(char,e){
  const keys = document.querySelectorAll(".key");
  keys.forEach(k=>k.classList.remove("active"));
  const mid = window.innerWidth/2;
  const capsOn = e ? e.getModifierState && e.getModifierState("CapsLock") : false;
  const baseChar = shiftMap[char] ? shiftMap[char] : char;

  function getHandSide(k){
    return leftKeys.includes(k) ? "left" : rightKeys.includes(k) ? "right" : null;
  }
  const letterSide = getHandSide(baseChar) || getHandSide(baseChar.toLowerCase()) || getHandSide(char);
  const isUpperCase = /^[A-Z]$/.test(char);
  const needsShift = (isUpperCase && !capsOn) || Object.keys(shiftMap).includes(char);

  if(shiftMap[char]){
    const baseKeyElem = [...keys].find(k=>k.dataset.key===shiftMap[char]);
    if(baseKeyElem) baseKeyElem.classList.add("active");
  } else {
    keys.forEach(k=>{if(k.dataset.key && k.dataset.key.toLowerCase()===char.toLowerCase()) k.classList.add("active");});
  }

  function highlightOpposite(modKey){
    document.querySelectorAll(`.key[data-key='${modKey}']`).forEach(s=>{
      const rect = s.getBoundingClientRect();
      if(letterSide==="right" && rect.left<mid) s.classList.add("active");
      if(letterSide==="left" && rect.left>mid) s.classList.add("active");
    });
  }

  if(needsShift) highlightOpposite("Shift");
  if(e && ["control","ctrl"].includes(e.key.toLowerCase())) highlightOpposite("Ctrl");
  if(e && e.key.toLowerCase()==="fn") highlightOpposite("Fn");
  if(e && ["alt","altgr"].includes(e.key.toLowerCase())) { highlightOpposite("Alt"); highlightOpposite("Altgr"); }

  const capsKey = document.querySelector(".key[data-key='CapsLock']");
  if(capsKey) capsOn ? capsKey.classList.add("active") : capsKey.classList.remove("active");

  const currentKeyElem = [...keys].find(k=>k.classList.contains("active"));
  if(currentKeyElem){
    const fingerType = [...currentKeyElem.classList].find(c=>["pinky","ring","middle","index","thumb"].includes(c));
    if(fingerType){
      document.querySelectorAll(".finger").forEach(f=>f.classList.remove("active"));
      const key = currentKeyElem.dataset.key;
      let handSide;
      if(fingerType === "thumb") {
        if(char === " ") {
            handSide = lastHandUsed === "left" ? "right" : "left";
            lastHandUsed = handSide;
        } else {
            handSide = leftKeys.includes(key) || leftKeys.includes(key.toLowerCase()) ? "left" : "right";
        }
      } else {
        handSide = leftKeys.includes(key) || leftKeys.includes(key.toLowerCase()) ? "left" : "right";
        lastHandUsed = handSide;
      }

      const fingerElem = document.getElementById(`finger-${handSide}-${fingerType}`);
      if(fingerElem) fingerElem.classList.add("active");
    }
  }
}

// ================= Lesson Completion Check =================
function isLessonCompleted() {
    for(let i=0; i<TASKS_PER_LESSON; i++){
        if(localStorage.getItem(`${pageKeyPrefix}TaskDone${i}`) !== "true"){
            return false;
        }
    }
    return true;
}

// ================= Render Lesson (Optimized) =================
function renderLesson(e) {
    const lessonDiv = document.getElementById("lesson");
    const instructionDiv = document.getElementById("instruction");
    const currentLesson = lessons[lessonIndex];
    if (!currentLesson) return;
    const currentTask = currentLesson.tasks[taskIndex];
    if (!currentTask) return;

    const code = currentTask.codeToType;

    // Initial render
    if (lessonDiv.childElementCount === 0) {
        if (instructionDiv) instructionDiv.textContent = currentTask.instruction;
        for (let i = 0; i < code.length; i++) {
            const span = document.createElement("span");
            span.className = i < charIndex ? "typed" : i === charIndex ? "current" : "remaining";
            span.textContent = code[i];
            lessonDiv.appendChild(span);
        }
    } else {
        // Update only changed characters
        const spans = lessonDiv.querySelectorAll("span");
        const oldCurrent = lessonDiv.querySelector(".current");
        if (oldCurrent) oldCurrent.classList.remove("current");
        if (charIndex > 0) spans[charIndex - 1].classList.add("typed");
        if (charIndex < spans.length) spans[charIndex].classList.add("current");
    }

    highlightKey(code[charIndex], e);
    updateProgress();
}

// ================= Update Progress Bar =================
function updateProgress() {
    const progressBar = document.getElementById("progress-bar");
    const currentTask = lessons[lessonIndex].tasks[taskIndex];
    const codeLength = currentTask.codeToType.length;
    progressBar.style.width = (charIndex / codeLength) * 100 + "%";
}

// ================= Typing Listener =================
document.addEventListener("keydown", e => {
    e.preventDefault();
    const currentLesson = lessons[lessonIndex];
    if (!currentLesson) return;
    const currentTask = currentLesson.tasks[taskIndex];
    if (!currentTask) return;

    const code = currentTask.codeToType;
    const currentChar = code[charIndex];
    if (!currentChar) return;

    const now = new Date();
    if(lastKeyTime) keystrokeIntervals.push(now - lastKeyTime);
    lastKeyTime = now;
    if(!startTime) startTime = new Date();

    let pressedChar = e.key;
    if(pressedChar === "Spacebar" || pressedChar === " ") pressedChar = " ";
    if(pressedChar === "Enter") pressedChar = "Enter";
    if(pressedChar === "Shift" || pressedChar === "CapsLock"){
        renderLesson(e);
        return;
    }

    totalKeystrokes++;

    if(pressedChar === "Backspace"){
        if(charIndex > 0) charIndex--;
        localStorage.setItem(charIndexKey, charIndex);
        updateStats();
        renderLesson(e);
        return;
    }

    const fingerType = fingerClass[currentChar] || fingerClass[currentChar.toLowerCase()] || "thumb";

    if(pressedChar === currentChar){
        charIndex++;
        // Save progress after every correct keystroke
        localStorage.setItem(charIndexKey, charIndex);
        localStorage.setItem(storageTaskKey, taskIndex);
        localStorage.setItem(storageLessonKey, lessonIndex);
        localStorage.setItem(totalKeystrokesKey, totalKeystrokes);
        localStorage.setItem(errorsKey, errors);
        localStorage.setItem(intervalsKey, JSON.stringify(keystrokeIntervals));

        if(charIndex >= code.length) {
            localStorage.setItem(`${pageKeyPrefix}TaskDone${taskIndex}`, "true");
            taskIndex++;
            charIndex = 0;
            startTime = new Date();
            totalKeystrokes = 0;
            errors = 0;
            keystrokeIntervals = [];
            Object.keys(fingerErrors).forEach(k => fingerErrors[k] = 0);
            Object.keys(keyErrors).forEach(k => keyErrors[k] = 0);

            localStorage.setItem(charIndexKey, charIndex);
            localStorage.setItem(storageTaskKey, taskIndex);
            localStorage.setItem(storageLessonKey, lessonIndex);

            if(taskIndex >= currentLesson.tasks.length) {
                taskIndex = 0;
                lessonIndex++;
                localStorage.setItem(storageLessonKey, lessonIndex);
            }

            if(lessonIndex >= lessons.length) {
                completeLessons();
                return;
            }
        }

        renderLesson(e);
        updateStats();
    } else {
        errors++;
        if(fingerType) fingerErrors[fingerType] = (fingerErrors[fingerType] || 0) + 1;
        keyErrors[currentChar] = (keyErrors[currentChar] || 0) + 1;

        const keyDiv = [...document.querySelectorAll(".key")].find(
            k => k.dataset.key === currentChar || k.dataset.key === shiftMap[currentChar] || k.dataset.key === currentChar.toUpperCase()
        );
        if(keyDiv){
            keyDiv.classList.add("shake");
            setTimeout(() => keyDiv.classList.remove("shake"), 300);
        }

        renderLesson(e);
        updateStats();
    }
});
