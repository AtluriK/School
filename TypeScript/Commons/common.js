// UI elements
  const tasksContainer = document.getElementById('tasks-container');
  const completionSection = document.getElementById('completion-section');
  const nextTopicBtn = document.getElementById('next-topic-btn');

  let currentTaskIndex = 0; // Index of current active task

  // Load saved progress from localStorage
  function loadProgress() {
    const savedIndex = localStorage.getItem(`${pageKeyPrefix}TaskIndex`);
    if (savedIndex !== null) {
      const idx = parseInt(savedIndex, 10);
      if (idx >= 0 && idx <= tasks.length) { 
        currentTaskIndex = idx;
      } else {
        currentTaskIndex = 0;
        saveProgress();
      }
    } else {
      currentTaskIndex = 0;
    }
  }

  // Save current progress index
  function saveProgress() {
    localStorage.setItem(`${pageKeyPrefix}TaskIndex`, currentTaskIndex);
  }

  // Create task block with full UI
  function createTask(task, index) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task';
    taskDiv.id = `task-${index}`;

    // Initially hide all tasks
    taskDiv.style.display = 'none';

    // Task header with checkmark
    const taskTitle = document.createElement('h3');
    taskTitle.textContent = `Task ${index + 1}`;
    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';
    checkmark.textContent = '';
    taskTitle.appendChild(checkmark);
    taskDiv.appendChild(taskTitle);

    // Instruction
    const instruction = document.createElement('p');
    instruction.className = 'instruction';
    instruction.textContent = task.instruction;
    taskDiv.appendChild(instruction);

    // Code to type
    const codeToTypePre = document.createElement('pre');
    codeToTypePre.className = 'expected-code';
    codeToTypePre.textContent = task.codeToType;
    taskDiv.appendChild(codeToTypePre);

    // Textarea for user input
    const textarea = document.createElement('textarea');
    textarea.className = 'task-input';
    textarea.setAttribute('spellcheck', 'false');
    textarea.setAttribute('autocomplete', 'off');
    textarea.setAttribute('autocorrect', 'off');
    textarea.setAttribute('autocapitalize', 'off');
    // Make textarea auto-expand as user types
textarea.style.overflowY = 'hidden';
textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
});
    taskDiv.appendChild(textarea);

    // Error and success messages
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    taskDiv.appendChild(errorMessage);

    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    taskDiv.appendChild(successMessage);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'submit-btn';
    submitBtn.type = 'button';
    submitBtn.textContent = 'Submit';
    submitBtn.disabled = true;
    taskDiv.appendChild(submitBtn);

    // Live preview
    const livePreview = document.createElement('div');
    livePreview.className = 'live-preview';
    livePreview.setAttribute('aria-label', 'Live preview of your code');
    taskDiv.appendChild(livePreview);

    // Event: Input in textarea to enable submit if correct
textarea.addEventListener('input', () => {
  const userCodeRaw = textarea.value;

  // Normalize user input and expected code (ignore whitespace, unify quotes, ignore case)
  function normalizeCode(str) {
    return str
      .replace(/\s+/g, '')    // Remove ALL whitespace (spaces, tabs, newlines)
      .replace(/"/g, "'")     // Convert double quotes to single quotes
      .toLowerCase()          // Ignore case differences
      .trim();
  }

  const userCode = normalizeCode(userCodeRaw);
  const expectedCode = normalizeCode(task.codeToType);

  // Render live preview using raw user input (preserves formatting for preview)
  renderLivePreview(userCodeRaw, livePreview);

  if (userCode === expectedCode) {
    errorMessage.textContent = '';
    successMessage.textContent = '';
    submitBtn.disabled = false;
    submitBtn.classList.add('enabled');
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.remove('enabled');

    // Basic tag count check for helpful hints (optional)
    const expectedTagsCount = (expectedCode.match(/</g) || []).length;
    const userTagsCount = (userCode.match(/</g) || []).length;

    if (userTagsCount !== expectedTagsCount) {
      errorMessage.textContent = "Check the number of tags, some may be missing or extra.";
    } else {
      errorMessage.textContent = "Your code does not match exactly. Check quotes, spelling, and tag order.";
    }

    successMessage.textContent = '';
  }
});


    // Submit button clicked
    submitBtn.addEventListener('click', () => {
      submitBtn.disabled = true;
      submitBtn.classList.remove('enabled');
      successMessage.textContent = 'Correct! Moving to next task...';
      errorMessage.textContent = '';

      // Mark task done with checkmark
      checkmark.textContent = '✓';

      // Save task done flag
      localStorage.setItem(`${pageKeyPrefix}TaskDone${index}`, "true");

      // Advance to next task index
      currentTaskIndex++;
      saveProgress();

      // Hide current task
      taskDiv.style.display = 'none';

      // Show next task or completion
      if (currentTaskIndex < tasks.length) {
        const nextTask = document.getElementById(`task-${currentTaskIndex}`);
        if (nextTask) {
          nextTask.style.display = 'block';
          nextTask.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // All tasks done - hide tasks container, show completion & next button
        tasksContainer.style.display = 'none';
        completionSection.hidden = false;
        nextTopicBtn.style.display = 'inline-block';
        completionSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return taskDiv;
  }

  // Render live preview of user code
  function renderLivePreview(code, container) {
    const parser = new DOMParser();
    let doc;
    try {
      doc = parser.parseFromString(code, 'text/html');
    } catch {
      container.textContent = "(Error parsing your code)";
      return;
    }
    let htmlElem = doc.querySelector('html');
    if (!htmlElem) {
      container.textContent = "(No <html> tag found)";
      return;
    }
    const bodyElem = htmlElem.querySelector('body');
    if (bodyElem) {
      container.innerHTML = bodyElem.innerHTML.trim() || "(Empty page)";
      return;
    }
    let content = htmlElem.innerHTML.trim();
    container.textContent = content || "(Empty page)";
  }


  // Initialize tasks UI on page load
  function initTasks() {
  loadProgress();

  tasksContainer.innerHTML = '';

  tasks.forEach((task, idx) => {
    const taskElem = createTask(task, idx);
    tasksContainer.appendChild(taskElem);

    if (localStorage.getItem(`${pageKeyPrefix}TaskDone${idx}`) === "true") {
      const checkmarkSpan = taskElem.querySelector('.checkmark');
      if (checkmarkSpan) checkmarkSpan.textContent = '✓';
    }
  });

  // Check if any task is done
  const anyTaskDone = tasks.some((_, i) => localStorage.getItem(`${pageKeyPrefix}TaskDone${i}`) === "true");

  if (currentTaskIndex >= tasks.length) {
    // All tasks done
    tasksContainer.style.display = 'none';
    completionSection.hidden = false;
    nextTopicBtn.style.display = "inline-block";
    completionSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    // Show only the next incomplete task
    tasks.forEach((_, idx) => {
      const taskElem = document.getElementById(`task-${idx}`);
      if (!taskElem) return;
      if (idx === currentTaskIndex) {
        taskElem.style.display = 'block';

        // Scroll only if at least one task is done
        if (anyTaskDone) {
          taskElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        taskElem.style.display = 'none';
      }
    });

    completionSection.hidden = true;
    nextTopicBtn.style.display = "none";
  }
}

// Disable copy/paste/cut/right-click to enforce typing practice
  document.body.addEventListener('copy', e => e.preventDefault());
  document.body.addEventListener('paste', e => e.preventDefault());
  document.body.addEventListener('cut', e => e.preventDefault());
  document.body.addEventListener('contextmenu', e => e.preventDefault());
  document.body.addEventListener('dragstart', e => e.preventDefault());
  document.body.addEventListener('drop', e => e.preventDefault());


  // Initialize everything on load
  window.onload = () => {
    initTasks();
  };