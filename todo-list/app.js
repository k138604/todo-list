const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const priorityBtn = document.getElementById('priorityBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const taskCount = document.getElementById('taskCount');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let isImportant = false;
let isCompletedFolded = localStorage.getItem('isCompletedFolded') === 'true';

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
    const completedTasks = tasks.filter(t => t.completed);
    
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
    span.addEventListener('click', () => toggleTask(index));
    
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    
    if (task.important) {
        const tag = document.createElement('span');
        tag.className = 'priority-tag';
        tag.textContent = '重要';
        meta.appendChild(tag);
    }
    
    if (task.deadline) {
        const deadlineTag = document.createElement('span');
        deadlineTag.className = 'deadline-tag';
        deadlineTag.textContent = getDeadlineDisplay(task.deadline);
        meta.appendChild(deadlineTag);
    }
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'task-time';
    timeSpan.textContent = task.createdAt || '';
    
    meta.appendChild(timeSpan);
    
    taskContent.appendChild(span);
    taskContent.appendChild(meta);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => deleteTask(index));
    
    const deadlineBtn = document.createElement('button');
    deadlineBtn.className = 'deadline-btn';
    deadlineBtn.title = '设置截止时间';
    deadlineBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>`;
    deadlineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const choice = prompt('请输入截止时间（分钟）：\n30=30分钟, 60=1小时, 1440=1天, 10080=1周\n输入0清除截止时间');
        if (choice !== null) {
            const mins = parseInt(choice);
            if (mins === 0) {
                tasks[index].deadline = null;
                tasks[index].deadlineSetAt = null;
            } else if (!isNaN(mins) && mins > 0) {
                tasks[index].deadline = new Date(Date.now() + mins * 60 * 1000).toISOString();
                tasks[index].deadlineSetAt = formatDate(new Date());
            }
            saveTasks();
            renderTasks();
        }
    });
    
    li.appendChild(taskContent);
    li.appendChild(deadlineBtn);
    li.appendChild(deleteBtn);
    
    return li;
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
        important: isImportant,
        deadline: null
    });
    saveTasks();
    renderTasks();
    taskInput.value = '';
    isImportant = false;
    priorityBtn.classList.remove('active');
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

function togglePriority() {
    isImportant = !isImportant;
    priorityBtn.classList.toggle('active');
}

addBtn.addEventListener('click', addTask);
priorityBtn.addEventListener('click', () => {
    if (taskInput.value.trim()) {
        isImportant = !isImportant || !priorityBtn.classList.contains('active');
        priorityBtn.classList.add('active');
        addTask();
    } else {
        togglePriority();
    }
});
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
                const choice = confirm(`导入 ${importedTasks.length} 个任务\n\n确定：覆盖当前所有任务\n取消：合并到现有任务`);
                
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
    renderTasks();
}, 60000);
