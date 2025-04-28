// Global Variables
let selectedDate = new Date();
let viewDate = new Date(); // controls the currently displayed month

// Data storage (retrieved from localStorage)
let tasksByDate = JSON.parse(localStorage.getItem('tempus_tasks')) || {};
let notesByDate = JSON.parse(localStorage.getItem('tempus_notes')) || {};
let currentTheme = localStorage.getItem('tempus_theme') || 'dark';

/* --- Utility Functions --- */
function saveData() {
  localStorage.setItem('tempus_tasks', JSON.stringify(tasksByDate));
  localStorage.setItem('tempus_notes', JSON.stringify(notesByDate));
}
function formatDateKey(date) {
  return date.toDateString();
}

/* --- Theme Toggle --- */
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  localStorage.setItem('tempus_theme', theme);
}
applyTheme(currentTheme);
document.getElementById('themeToggle').addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
});

/* --- Calendar Rendering --- */
function generateCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
  
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const monthYearDisplay = document.getElementById('monthYearDisplay');
  monthYearDisplay.innerText = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const headerRow = document.createElement('div');
  headerRow.className = 'calendar-row';
  daysOfWeek.forEach(day => {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-header';
    cell.innerText = day;
    headerRow.appendChild(cell);
  });
  calendar.appendChild(headerRow);
  
  let date = 1;
  for (let i = 0; i < 6; i++) {
    const row = document.createElement('div');
    row.className = 'calendar-row';
    for (let j = 0; j < 7; j++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      if (i === 0 && j < firstDayIndex) {
        cell.innerText = '';
      } else if (date > lastDate) {
        cell.innerText = '';
      } else {
        cell.innerText = date;
        const cellDate = new Date(year, month, date);
        if (cellDate.toDateString() === selectedDate.toDateString()) {
          cell.classList.add('selected');
        }
        const today = new Date();
        if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
          cell.classList.add('today');
        }
        cell.addEventListener('click', () => {
          selectedDate = cellDate;
          renderTasks();
          renderNotes();
          generateCalendar();
        });
        date++;
      }
      row.appendChild(cell);
    }
    calendar.appendChild(row);
    if (date > lastDate) break;
  }
}
document.getElementById('prevMonth').addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  generateCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  generateCalendar();
});

/* --- Tasks Management --- */
function renderTasks() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';
  const dateKey = formatDateKey(selectedDate);
  const tasks = tasksByDate[dateKey] || [];
  const taskFilter = document.getElementById('taskSearch').value.toLowerCase();
  
  tasks.forEach((task, index) => {
    if (taskFilter && !task.text.toLowerCase().includes(taskFilter)) return;
    
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'task-text';
    span.innerText = task.text;
    if (task.done) {
      span.style.textDecoration = 'line-through';
    }
    li.appendChild(span);
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'task-buttons';
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.innerText = 'Edit';
    editBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = task.text;
      li.replaceChild(input, span);
      input.focus();
      input.addEventListener('blur', () => {
        task.text = input.value.trim() || task.text;
        saveData();
        renderTasks();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });
    });
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = 'Del';
    deleteBtn.addEventListener('click', () => {
      tasks.splice(index, 1);
      tasksByDate[dateKey] = tasks;
      saveData();
      renderTasks();
    });
    // Reorder buttons
    const upBtn = document.createElement('button');
    upBtn.innerText = '↑';
    upBtn.addEventListener('click', () => {
      if (index > 0) {
        [tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]];
        tasksByDate[dateKey] = tasks;
        saveData();
        renderTasks();
      }
    });
    const downBtn = document.createElement('button');
    downBtn.innerText = '↓';
    downBtn.addEventListener('click', () => {
      if (index < tasks.length - 1) {
        [tasks[index + 1], tasks[index]] = [tasks[index], tasks[index + 1]];
        tasksByDate[dateKey] = tasks;
        saveData();
        renderTasks();
      }
    });
    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(deleteBtn);
    btnContainer.appendChild(upBtn);
    btnContainer.appendChild(downBtn);
    li.appendChild(btnContainer);
    taskList.appendChild(li);
  });
}
document.getElementById('addTask').addEventListener('click', () => {
  const taskInput = document.getElementById('newTask');
  const taskText = taskInput.value.trim();
  if (taskText) {
    const dateKey = formatDateKey(selectedDate);
    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = [];
    }
    tasksByDate[dateKey].push({ text: taskText, done: false });
    taskInput.value = '';
    saveData();
    renderTasks();
  }
});
document.getElementById('taskSearch').addEventListener('input', renderTasks);

/* --- Global Search Across All Dates --- */
function globalSearch() {
  const query = document.getElementById('globalSearch').value.trim().toLowerCase();
  const resultsContainer = document.getElementById('globalSearchResults');
  resultsContainer.innerHTML = '';
  if (!query) return;
  
  const results = [];
  for (const dateKey in tasksByDate) {
    tasksByDate[dateKey].forEach(task => {
      if (task.text.toLowerCase().includes(query)) {
        results.push({ date: dateKey, text: task.text, done: task.done });
      }
    });
  }
  if (results.length === 0) {
    resultsContainer.innerHTML = '<p>No matching tasks found.</p>';
    return;
  }
  const list = document.createElement('ul');
  results.forEach(result => {
    const li = document.createElement('li');
    li.textContent = `${result.date}: ${result.text}`;
    list.appendChild(li);
  });
  resultsContainer.appendChild(list);
}
document.getElementById('globalSearch').addEventListener('input', globalSearch);

/* --- Schedule / Notes Management --- */
function renderNotes() {
  const notesArea = document.getElementById('notesArea');
  const dateKey = formatDateKey(selectedDate);
  notesArea.value = notesByDate[dateKey] || '';
}
document.getElementById('notesArea').addEventListener('input', (e) => {
  const dateKey = formatDateKey(selectedDate);
  notesByDate[dateKey] = e.target.value;
  saveData();
});

/* --- Daily Quote Widget --- */
function renderDailyQuote() {
  const quotes = [
    "The best way to predict the future is to create it. – Peter Drucker",
    "Dream big and dare to fail. – Norman Vaughan",
    "I can, therefore I am. – Simone Weil",
    "Keep your eyes on the stars, and your feet on the ground. – Theodore Roosevelt",
    "Your limitation—it’s only your imagination.",
    "Push yourself, because no one else is going to do it for you.",
    "Sometimes later becomes never. Do it now.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn’t just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Dream bigger. Do bigger.",
    "Don’t stop when you’re tired. Stop when you’re done.",
    "Wake up with determination. Go to bed with satisfaction.",
    "Do something today that your future self will thank you for.",
    "Little things make big days.",
    "It’s going to be hard, but hard does not mean impossible.",
    "Don’t wait for opportunity. Create it.",
    "Sometimes we’re tested not to show our weaknesses, but to discover our strengths.",
    "The key to success is to focus on goals, not obstacles.",
    "Dream it. Believe it. Build it.",
    "The future depends on what you do today. – Mahatma Gandhi",
    "The secret of getting ahead is getting started. – Mark Twain",
    "Don’t wish it were easier. Wish you were better. – Jim Rohn",
    "Success is not how high you have climbed, but how you make a positive difference to the world. – Roy T. Bennett",
    "Hard work beats talent when talent doesn’t work hard. – Tim Notke",
    "Opportunities don’t happen, you create them. – Chris Grosser",
    "Success isn’t always about greatness. It’s about consistency. – Dwayne Johnson",
    "Don’t be afraid to give up the good to go for the great. – John D. Rockefeller",
    "I find that the harder I work, the more luck I seem to have. – Thomas Jefferson",
    "Don’t watch the clock; do what it does. Keep going. – Sam Levenson",
    "Keep your face always toward the sunshine—and shadows will fall behind you. – Walt Whitman",
    "Strive not to be a success, but rather to be of value. – Albert Einstein",
    "You are never too old to set another goal or to dream a new dream. – C.S. Lewis",
    "A year from now you may wish you had started today. – Karen Lamb",
    "The only limit to our realization of tomorrow is our doubts of today. – Franklin D. Roosevelt",
    "Creativity is intelligence having fun. – Albert Einstein",
    "What we think, we become. – Buddha",
    "When you arise in the morning, think of what a precious privilege it is to be alive. – Marcus Aurelius",
    "Do one thing every day that scares you. – Eleanor Roosevelt",
    "It always seems impossible until it’s done. – Nelson Mandela",
    "Aim for the moon. If you miss, you may hit a star. – W. Clement Stone",
    "Live as if you were to die tomorrow. Learn as if you were to live forever. – Mahatma Gandhi",
    "Everything you’ve ever wanted is on the other side of fear. – George Addair",
    "Action is the foundational key to all success. – Pablo Picasso",
    "Life is 10% what happens to us and 90% how we react to it. – Charles R. Swindoll",
    "You are never too old to set another goal or dream a new dream. – Les Brown",
    "Quality is not an act, it is a habit. – Aristotle",
    "Success is not final, failure is not fatal: It is the courage to continue that counts. – Winston Churchill",
    "The only place where success comes before work is in the dictionary. – Vidal Sassoon"
  ];
  const today = new Date();
  const dayCount = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const index = dayCount % quotes.length;
  document.getElementById('dailyQuote').innerText = quotes[index];
}

/* --- Analog Clock Functions --- */
function drawClock() {
  const canvas = document.getElementById("analogClock");
  if (!canvas) {
    console.error("Canvas element 'analogClock' not found.");
    return;
  }
  const ctx = canvas.getContext("2d");
  const radius = canvas.width / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(radius, radius);
  const adjustedRadius = radius * 0.90;
  drawFace(ctx, adjustedRadius);
  drawNumbers(ctx, adjustedRadius);
  drawTime(ctx, adjustedRadius);
  ctx.restore();
}
function drawFace(ctx, radius) {
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#F8F8F8";  
  ctx.fill();
  ctx.lineWidth = radius * 0.05;
  ctx.strokeStyle = "#CCCCCC";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
  ctx.fillStyle = "#333333";
  ctx.fill();
}
function drawNumbers(ctx, radius) {
  let ang, num;
  ctx.font = radius * 0.15 + "px Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#333333";
  for (num = 1; num < 13; num++) {
    ang = num * Math.PI / 6;
    ctx.rotate(ang);
    ctx.translate(0, -radius * 0.85);
    ctx.rotate(-ang);
    ctx.fillText(num.toString(), 0, 0);
    ctx.rotate(ang);
    ctx.translate(0, radius * 0.85);
    ctx.rotate(-ang);
  }
}
function drawTime(ctx, radius) {
  const now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();
  let second = now.getSeconds();
  hour = hour % 12;
  hour = (hour * Math.PI / 6) + (minute * Math.PI / (6 * 60)) + (second * Math.PI / (360 * 60));
  drawHand(ctx, hour, radius * 0.5, radius * 0.07);
  minute = (minute * Math.PI / 30) + (second * Math.PI / (30 * 60));
  drawHand(ctx, minute, radius * 0.8, radius * 0.07);
  second = second * Math.PI / 30;
  drawHand(ctx, second, radius * 0.9, radius * 0.02);
}
function drawHand(ctx, pos, length, width) {
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#333333";
  ctx.moveTo(0, 0);
  ctx.rotate(pos);
  ctx.lineTo(0, -length);
  ctx.stroke();
  ctx.rotate(-pos);
}
function updateDigitalClock() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  const strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
  document.getElementById("digitalClock").innerText = strTime;
}
function updateClock() {
  drawClock();
  updateDigitalClock();
}
setInterval(updateClock, 1000);
document.addEventListener('DOMContentLoaded', () => {
  generateCalendar();
  renderTasks();
  renderNotes();
  renderDailyQuote();
  updateClock();
});
