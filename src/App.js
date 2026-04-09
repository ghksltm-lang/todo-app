import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState('none');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const editRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
    }
  }, [editingId]);

  const addTodo = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setTodos([...todos, {
      id: Date.now(),
      text,
      completed: false,
      priority,
      dueDate: dueDate || null,
    }]);
    setInput('');
    setPriority('none');
    setDueDate('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = (id) => {
    const text = editText.trim();
    if (!text) {
      deleteTodo(id);
    } else {
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, text } : todo
      ));
    }
    setEditingId(null);
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') saveEdit(id);
    if (e.key === 'Escape') setEditingId(null);
  };

  const cyclePriority = (id) => {
    const order = ['none', 'low', 'medium', 'high'];
    setTodos(todos.map(todo => {
      if (todo.id !== id) return todo;
      const idx = order.indexOf(todo.priority || 'none');
      return { ...todo, priority: order[(idx + 1) % order.length] };
    }));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const filteredTodos = todos
    .filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter(todo =>
      search ? todo.text.toLowerCase().includes(search.toLowerCase()) : true
    );

  const remaining = todos.filter(todo => !todo.completed).length;

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const priorityLabel = { high: 'High', medium: 'Med', low: 'Low' };

  return (
    <div className="app">
      <h1>Todo</h1>

      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Search todos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <form className="todo-form" onSubmit={addTodo}>
        <input
          className="todo-input"
          type="text"
          placeholder="What needs to be done?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <select
          className="priority-select"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="none">-</option>
          <option value="low">Low</option>
          <option value="medium">Med</option>
          <option value="high">High</option>
        </select>
        <input
          className="date-input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button className="add-btn" type="submit">Add</button>
      </form>

      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <li
            key={todo.id}
            className={`todo-item ${todo.completed ? 'completed' : ''} ${isOverdue(todo.dueDate) && !todo.completed ? 'overdue' : ''}`}
          >
            <input
              type="checkbox"
              className="todo-checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />

            {editingId === todo.id ? (
              <input
                ref={editRef}
                className="edit-input"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => saveEdit(todo.id)}
                onKeyDown={(e) => handleEditKeyDown(e, todo.id)}
              />
            ) : (
              <div className="todo-content" onDoubleClick={() => startEditing(todo)}>
                <span className="todo-text">{todo.text}</span>
                <div className="todo-meta">
                  {todo.priority && todo.priority !== 'none' && (
                    <span
                      className={`priority-badge priority-${todo.priority}`}
                      onClick={(e) => { e.stopPropagation(); cyclePriority(todo.id); }}
                      title="Click to change priority"
                    >
                      {priorityLabel[todo.priority]}
                    </span>
                  )}
                  {todo.dueDate && (
                    <span className={`due-date ${isOverdue(todo.dueDate) && !todo.completed ? 'overdue-text' : ''}`}>
                      {formatDate(todo.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {!todo.priority || todo.priority === 'none' ? (
              <button
                className="priority-btn"
                onClick={() => cyclePriority(todo.id)}
                title="Set priority"
              >
                !
              </button>
            ) : null}

            <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>
              &times;
            </button>
          </li>
        ))}
      </ul>

      {todos.length > 0 && (
        <div className="todo-footer">
          <span className="remaining">{remaining} item{remaining !== 1 ? 's' : ''} left</span>
          <div className="filters">
            {['all', 'active', 'completed'].map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className="clear-btn" onClick={clearCompleted}>Clear completed</button>
        </div>
      )}
    </div>
  );
}

export default App;
