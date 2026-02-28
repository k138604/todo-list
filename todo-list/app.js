const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAllBtn');
const taskCount = document.getElementById('taskCount');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let isCompletedFolded = localStorage.getItem('isCompletedFolded') === 'true';
let editingIndex = null;

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveFoldState() {
    localStorage.setItem('isCompletedFolded', isCompletedFolded);
}

function updateTaskCount() {
    const activeCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;
    const parts = [];
    if (activeCount > 0) parts.push(`进行中 ${activeCount}`);
    if (completedCount > 0) parts.push(`已完成 ${completedCount}`);
    taskCount.textContent = parts.length > 0 ? parts.join('，') : '0 个任务';
}

function getDeadlineDisplay(deadline) {
    if (!deadline) return '';
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    
    if (diff <= 0) return '已过期';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}天${hours % 24}小时`;
    } else if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    } else {
        return `${minutes}分钟`;
    }
}

function getProgressPercent(deadline, deadlineSetAt) {
    if (!deadline || !deadlineSetAt) return 0;
    
    const start = new Date(deadlineSetAt.replace(' ', 'T'));
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    const total = deadlineDate - start;
    const elapsed = now - start;
    
    if (total <= 0) return 100;
    if (elapsed <= 0) return 0;
    if (elapsed >= total) return 100;
    
    return Math.round((elapsed / total) * 100);
}

function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<li class="empty-state">暂无任务，添加一个吧</li>';
        updateTaskCount();
        return;
    }
    
    const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return 0;
    });
    const completedTasks = tasks.filter(t => t.completed).sort((a, b) => {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return 0;
    });
    
    if (activeTasks.length > 0) {
        const groupTitle = document.createElement('li');
        groupTitle.className = 'group-title';
        groupTitle.textContent = '进行中';
        taskList.appendChild(groupTitle);
        
        activeTasks.forEach((task) => {
            const index = tasks.indexOf(task);
            const li = renderTaskItem(task, index);
            taskList.appendChild(li);
        });
    }
    
    if (completedTasks.length > 0) {
        const groupTitle = document.createElement('li');
        groupTitle.className = 'group-title';
        
        const titleText = document.createElement('span');
        titleText.textContent = '已完成';
        groupTitle.appendChild(titleText);
        
        const foldBtn = document.createElement('button');
        foldBtn.className = 'fold-btn';
        foldBtn.textContent = isCompletedFolded ? '+' : '-';
        foldBtn.addEventListener('click', () => {
            isCompletedFolded = !isCompletedFolded;
            saveFoldState();
            renderTasks();
        });
        groupTitle.appendChild(foldBtn);
        
        taskList.appendChild(groupTitle);
        
        if (!isCompletedFolded) {
            completedTasks.forEach((task) => {
                const index = tasks.indexOf(task);
                const li = renderTaskItem(task, index);
                taskList.appendChild(li);
            });
        }
    }
    
    updateTaskCount();
}

function renderTaskItem(task, index) {
    const li = document.createElement('li');
    li.className = `task-item ${task.important ? 'important' : ''}`;
    
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    if (task.deadline && !task.completed) {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        const percent = getProgressPercent(task.deadline, task.deadlineSetAt);
        progressFill.style.width = `${percent}%`;
        
        if (percent >= 100) {
            progressFill.classList.add('expired');
        } else if (percent >= 80) {
            progressFill.classList.add('urgent');
        }
        
        progressBar.appendChild(progressFill);
        taskContent.appendChild(progressBar);
    }
    
    const span = document.createElement('span');
    span.className = `task-text ${task.completed ? 'completed' : ''}`;
    span.textContent = task.text;
    span.addEventListener('click', (e) => {
        if (!span.isEditing) {
            toggleTask(index);
        }
    });
    taskContent.appendChild(span);
    
    const taskActionsRow = document.createElement('div');
    taskActionsRow.className = 'task-actions-row';
    
    const taskActionsLeft = document.createElement('div');
    taskActionsLeft.className = 'task-actions-left';
    
    const importantBtn = document.createElement('button');
    importantBtn.className = `important-toggle-btn ${task.important ? 'active' : ''}`;
    importantBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${task.important ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>`;
    importantBtn.title = task.important ? '取消重要' : '设为重要';
    importantBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        tasks[index].important = !tasks[index].important;
        saveTasks();
        renderTasks();
    });
    taskActionsLeft.appendChild(importantBtn);
    
    if (task.important) {
        const importantTag = document.createElement('span');
        importantTag.className = 'important-tag';
        importantTag.textContent = '重要';
        taskActionsLeft.appendChild(importantTag);
    }
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'task-time';
    timeSpan.textContent = task.createdAt || '';
    taskActionsLeft.appendChild(timeSpan);
    
    if (task.deadline && !task.completed) {
        const deadlineSpan = document.createElement('span');
        deadlineSpan.className = 'task-deadline';
        const mins = getDeadlineMinutes(task.deadline);
        if (mins > 0) {
            deadlineSpan.textContent = `剩余${formatDeadlineTime(mins)}`;
        } else {
            deadlineSpan.textContent = '已过期';
            deadlineSpan.classList.add('expired');
        }
        taskActionsLeft.appendChild(deadlineSpan);
    }
    
    taskActionsRow.appendChild(taskActionsLeft);
    
    const taskActionsRight = document.createElement('div');
    taskActionsRight.className = 'task-actions-right';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.title = '编辑';
    editBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>`;
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editingIndex = index;
        span.isEditing = true;
        span.contentEditable = true;
        span.focus();
    });
    
    span.addEventListener('blur', () => {
        editingIndex = null;
        span.isEditing = false;
        span.contentEditable = false;
        const newText = span.textContent.trim();
        if (newText && newText !== task.text) {
            tasks[index].text = newText;
            saveTasks();
        } else {
            span.textContent = task.text;
        }
    });
    
    span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            span.blur();
        }
    });
    
    taskActionsRight.appendChild(editBtn);
    
    const deadlineBtn = document.createElement('button');
    deadlineBtn.className = 'deadline-btn';
    deadlineBtn.title = '设置截止时间';
    deadlineBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>`;
    deadlineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const choice = prompt('请输入截止时间：\n30 或 30m = 30 分钟\n2h 或 2 小时 = 2 小时\n1d 或 1 天 = 1 天\n10080m 或 7d = 1 周\n输入 0 清除截止时间');
        if (choice !== null) {
            const mins = parseDeadlineInput(choice);
            if (mins === 0) {
                tasks[index].deadline = null;
                tasks[index].deadlineSetAt = null;
            } else if (!isNaN(mins) && mins > 0) {
                tasks[index].deadline = new Date(Date.now() + mins * 60 * 1000).toISOString();
                tasks[index].deadlineSetAt = formatDate(new Date());
            } else {
                alert('输入格式不正确，请输入数字或带单位的数字（如 30m, 2h, 1d）');
            }
            saveTasks();
            renderTasks();
        }
    });
    taskActionsRight.appendChild(deadlineBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = '删除';
    deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>`;
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(index);
    });
    taskActionsRight.appendChild(deleteBtn);
    taskActionsRow.appendChild(taskActionsRight);
    
    taskContent.appendChild(taskActionsRow);
    li.appendChild(taskContent);
    
    return li;
}

function getDeadlineMinutes(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    return Math.floor(diff / (1000 * 60));
}

function formatDeadlineTime(mins) {
    if (mins <= 0) return '已过期';
    
    const days = Math.floor(mins / (60 * 24));
    const hours = Math.floor((mins % (60 * 24)) / 60);
    const minutes = mins % 60;
    
    if (days > 0) {
        return `${days}天${hours}小时`;
    } else if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    } else {
        return `${minutes}分钟`;
    }
}

function parseDeadlineInput(input) {
    input = input.trim().toLowerCase();
    
    // Match patterns like "2h", "2 小时", "3d", "3 天", "30m", "30 分钟", "30"
    const dayMatch = input.match(/^(\d+)\s*(d|天|day|days)?$/);
    const hourMatch = input.match(/^(\d+)\s*(h|小时|hr|hrs|hour|hours)?$/);
    const minMatch = input.match(/^(\d+)\s*(m|分钟|min|mins|minute|minutes)?$/);
    
    if (dayMatch && (input.includes('d') || input.includes('天') || input.includes('day'))) {
        return parseInt(dayMatch[1]) * 24 * 60;
    } else if (hourMatch && (input.includes('h') || input.includes('小时') || input.includes('hour'))) {
        return parseInt(hourMatch[1]) * 60;
    } else if (minMatch || !isNaN(parseInt(input))) {
        return parseInt(input) || 0;
    }
    
    return NaN;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    
    tasks.push({ 
        text, 
        completed: false, 
        createdAt: formatDate(new Date()),
        important: false,
        deadline: null
    });
    saveTasks();
    renderTasks();
    taskInput.value = '';
    taskInput.focus();
}

function clearAll() {
    if (tasks.length === 0) return;
    if (!confirm('确定要清空所有任务吗？')) return;
    tasks = [];
    saveTasks();
    renderTasks();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
clearAllBtn.addEventListener('click', clearAll);

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('show');
});

closeModalBtn.addEventListener('click', () => {
    settingsModal.classList.remove('show');
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('show');
    }
});

exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-list-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    settingsModal.classList.remove('show');
});

importBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedTasks = JSON.parse(event.target.result);
            if (Array.isArray(importedTasks) && importedTasks.length > 0) {
                const choice = confirm(`导入 ${importedTasks.length} 个任务\n\n覆盖：替换当前所有任务\n合并：添加到现有任务`);
                
                if (choice) {
                    tasks = importedTasks;
                } else {
                    tasks = [...tasks, ...importedTasks];
                }
                saveTasks();
                renderTasks();
            } else {
                alert('文件格式不正确');
            }
        } catch (err) {
            alert('文件解析失败');
        }
        importFile.value = '';
        settingsModal.classList.remove('show');
    };
    reader.readAsText(file);
});

renderTasks();

setInterval(() => {
    if (editingIndex === null) {
        renderTasks();
    }
}, 60000);
