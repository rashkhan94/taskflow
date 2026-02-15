import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    DndContext,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Navbar from '../components/Navbar.jsx';
import { getAvatarColor, getInitials } from '../components/Navbar.jsx';
import { useSocket } from '../hooks/useSocket.js';
import { useToast } from '../hooks/useToast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

/* ====== SORTABLE TASK CARD ====== */
function SortableTaskCard({ task, onClick }) {
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: task._id, data: { type: 'task', task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}
            className={`task-card ${isDragging ? 'dragging' : ''}`}
            onClick={() => onClick(task)}>
            {task.labels?.length > 0 && (
                <div className="task-card-labels">
                    {task.labels.map((l, i) => <span key={i} className="task-label">{l}</span>)}
                </div>
            )}
            <div className="task-card-title">{task.title}</div>
            <div className="task-card-footer">
                <span className={`task-card-priority ${task.priority}`}>{task.priority}</span>
                {task.assignees?.length > 0 && (
                    <div className="task-card-assignees">
                        {task.assignees.map((a) => (
                            <div key={a._id} className="avatar avatar-sm"
                                style={{ background: getAvatarColor(a.name) }} title={a.name}>
                                {getInitials(a.name)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ====== TASK CARD (for overlay) ====== */
function TaskCardOverlay({ task }) {
    return (
        <div className="task-card" style={{ cursor: 'grabbing', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', transform: 'rotate(3deg)' }}>
            <div className="task-card-title">{task.title}</div>
            <div className="task-card-footer">
                <span className={`task-card-priority ${task.priority}`}>{task.priority}</span>
            </div>
        </div>
    );
}

/* ====== DROPPABLE LIST ====== */
function DroppableList({ list, tasks, onAddTask, onClickTask, onDeleteList, onUpdateList }) {
    const [adding, setAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(list.title);

    const taskIds = useMemo(() => tasks.map((t) => t._id), [tasks]);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        onAddTask(list._id, newTitle);
        setNewTitle('');
        setAdding(false);
    };

    const handleRename = (e) => {
        e.preventDefault();
        if (!editTitle.trim()) return;
        onUpdateList(list._id, editTitle);
        setEditing(false);
    };

    return (
        <div className="kanban-list">
            <div className="kanban-list-header">
                {editing ? (
                    <form onSubmit={handleRename} style={{ flex: 1 }}>
                        <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                            autoFocus onBlur={() => setEditing(false)} style={{ padding: '4px 8px', fontSize: '13px' }} />
                    </form>
                ) : (
                    <span className="kanban-list-title" onDoubleClick={() => setEditing(true)}>
                        {list.title}
                        <span className="kanban-list-count">{tasks.length}</span>
                    </span>
                )}
                <div className="kanban-list-actions">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDeleteList(list._id)}
                        title="Delete list" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>🗑</button>
                </div>
            </div>

            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <div className="kanban-list-body" data-list-id={list._id}>
                    {tasks.map((task) => (
                        <SortableTaskCard key={task._id} task={task} onClick={onClickTask} />
                    ))}
                    {tasks.length === 0 && !adding && (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No tasks yet
                        </div>
                    )}
                </div>
            </SortableContext>

            {adding ? (
                <form onSubmit={handleAdd} className="inline-form">
                    <input className="input" placeholder="Task title..." value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)} autoFocus
                        onBlur={() => { if (!newTitle.trim()) setAdding(false); }} />
                    <button type="submit" className="btn btn-primary btn-sm">Add</button>
                </form>
            ) : (
                <button className="add-task-btn" onClick={() => setAdding(true)}>+ Add Task</button>
            )}
        </div>
    );
}

/* ====== TASK DETAIL MODAL ====== */
function TaskModal({ task, boardMembers, onClose, onUpdate, onDelete, onAssign }) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onUpdate(task._id, { title, description, priority });
        setSaving(false);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
                <div className="modal-header">
                    <h3>Edit Task</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="input-group">
                        <label>Title</label>
                        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label>Description</label>
                        <textarea className="input" rows={3} value={description}
                            onChange={(e) => setDescription(e.target.value)} placeholder="Add a description..." />
                    </div>
                    <div className="input-group">
                        <label>Priority</label>
                        <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Assignees</label>
                        <div className="member-list">
                            {boardMembers.map((member) => {
                                const isAssigned = task.assignees?.some((a) => a._id === member._id);
                                return (
                                    <div key={member._id} className="member-item member-item-toggle"
                                        onClick={() => onAssign(task._id, member._id)}
                                        style={{
                                            borderColor: isAssigned ? 'var(--accent)' : undefined,
                                            background: isAssigned ? 'var(--bg-hover)' : undefined
                                        }}>
                                        <div className="avatar avatar-sm"
                                            style={{ background: getAvatarColor(member.name) }}>
                                            {getInitials(member.name)}
                                        </div>
                                        <div className="member-item-info">
                                            <div className="member-item-name">{member.name}</div>
                                            <div className="member-item-email">{member.email}</div>
                                        </div>
                                        <span style={{ fontSize: '16px' }}>{isAssigned ? '✓' : ''}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-danger btn-sm" onClick={() => { onDelete(task._id); onClose(); }}>
                        Delete Task
                    </button>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ====== ACTIVITY PANEL ====== */
function ActivityPanel({ boardId, onClose }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => { fetchActivities(); }, []);

    const fetchActivities = async (p = 1) => {
        try {
            const res = await api.get(`/boards/${boardId}/activity?page=${p}&limit=15`);
            if (p === 1) {
                setActivities(res.data.activities);
            } else {
                setActivities((prev) => [...prev, ...res.data.activities]);
            }
            setHasMore(res.data.pagination.page < res.data.pagination.pages);
            setPage(p);
        } catch { /* ignore */ }
        setLoading(false);
    };

    const formatAction = (action) => {
        const map = {
            'board.created': 'created this board',
            'board.updated': 'updated the board',
            'list.created': 'created a list',
            'list.updated': 'updated a list',
            'list.deleted': 'deleted a list',
            'task.created': 'created a task',
            'task.updated': 'updated a task',
            'task.deleted': 'deleted a task',
            'task.moved': 'moved tasks',
            'member.added': 'added a member',
            'member.removed': 'removed a member',
            'task.assigned': 'assigned a task',
            'task.unassigned': 'unassigned a task',
        };
        return map[action] || action;
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="activity-panel">
            <div className="activity-panel-header">
                <h3>Activity</h3>
                <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
            </div>
            <div className="activity-panel-body">
                {loading ? (
                    <div className="loading-spinner"><div className="spinner" /></div>
                ) : activities.length === 0 ? (
                    <div className="empty-state">
                        <p>No activity yet</p>
                    </div>
                ) : (
                    <>
                        {activities.map((a) => (
                            <div key={a._id} className="activity-item">
                                <div className="activity-item-avatar">
                                    <div className="avatar avatar-sm"
                                        style={{ background: getAvatarColor(a.user?.name) }}>
                                        {getInitials(a.user?.name)}
                                    </div>
                                </div>
                                <div className="activity-item-content">
                                    <div className="activity-item-text">
                                        <strong>{a.user?.name}</strong> {formatAction(a.action)}
                                        {a.details?.title && <> — <em>{a.details.title}</em></>}
                                    </div>
                                    <div className="activity-item-time">{timeAgo(a.createdAt)}</div>
                                </div>
                            </div>
                        ))}
                        {hasMore && (
                            <div className="activity-load-more">
                                <button className="btn btn-secondary btn-sm" onClick={() => fetchActivities(page + 1)}>
                                    Load More
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ====== ADD MEMBER MODAL ====== */
function AddMemberModal({ boardId, onClose, onAdded }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post(`/boards/${boardId}/members`, { email });
            onAdded(res.data.board);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add member');
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                <div className="modal-header">
                    <h3>Add Member</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="auth-error">{error}</div>}
                        <div className="input-group">
                            <label>Email Address</label>
                            <input className="input" type="email" placeholder="member@example.com"
                                value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ====== SEARCH BAR ====== */
function SearchBar({ boardId, onSelectTask }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showing, setShowing] = useState(false);

    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }
        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/boards/${boardId}/tasks/search?q=${query}`);
                setResults(res.data.tasks);
                setShowing(true);
            } catch { /* ignore */ }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, boardId]);

    return (
        <div className="search-bar">
            <span className="search-bar-icon">🔍</span>
            <input className="input" placeholder="Search tasks..." value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowing(true)}
                onBlur={() => setTimeout(() => setShowing(false), 200)} />
            {showing && results.length > 0 && (
                <div className="search-results">
                    {results.map((t) => (
                        <div key={t._id} className="search-result-item"
                            onClick={() => { onSelectTask(t); setQuery(''); setShowing(false); }}>
                            <h4>{t.title}</h4>
                            <p>{t.priority} priority</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ====== MAIN BOARD DETAIL PAGE ====== */
export default function BoardDetailPage() {
    const { id: boardId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast, ToastComponent } = useToast();

    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showActivity, setShowActivity] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [addingList, setAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Fetch board data
    useEffect(() => {
        fetchBoard();
    }, [boardId]);

    const fetchBoard = async () => {
        try {
            const res = await api.get(`/boards/${boardId}`);
            setBoard(res.data.board);
            setLists(res.data.lists);
            setTasks(res.data.tasks);
        } catch {
            showToast('Failed to load board', 'error');
            navigate('/boards');
        } finally {
            setLoading(false);
        }
    };

    // ---- Socket.io real-time handlers ----
    const socketHandlers = useMemo(() => ({
        onTaskCreated: (task) => setTasks((prev) => [...prev, task]),
        onTaskUpdated: (task) => setTasks((prev) => prev.map((t) => t._id === task._id ? task : t)),
        onTaskDeleted: ({ taskId }) => setTasks((prev) => prev.filter((t) => t._id !== taskId)),
        onTasksReordered: ({ tasks: reordered }) => {
            setTasks((prev) => {
                const updated = [...prev];
                reordered.forEach(({ _id, list, position }) => {
                    const idx = updated.findIndex((t) => t._id === _id);
                    if (idx !== -1) {
                        updated[idx] = { ...updated[idx], list, position };
                    }
                });
                return updated;
            });
        },
        onListCreated: (list) => setLists((prev) => [...prev, list]),
        onListUpdated: (list) => setLists((prev) => prev.map((l) => l._id === list._id ? list : l)),
        onListDeleted: ({ listId }) => {
            setLists((prev) => prev.filter((l) => l._id !== listId));
            setTasks((prev) => prev.filter((t) => t.list !== listId));
        },
        onBoardUpdated: (b) => setBoard(b),
        onBoardDeleted: () => { showToast('Board was deleted', 'info'); navigate('/boards'); },
        onMemberAdded: ({ board: b }) => setBoard(b),
    }), [navigate, showToast]);

    useSocket(boardId, socketHandlers);

    // ---- CRUD actions ----
    const addList = async (e) => {
        e.preventDefault();
        if (!newListTitle.trim()) return;
        try {
            const res = await api.post(`/boards/${boardId}/lists`, { title: newListTitle });
            setLists((prev) => [...prev, res.data.list]);
            setNewListTitle('');
            setAddingList(false);
        } catch { showToast('Failed to create list', 'error'); }
    };

    const updateList = async (listId, title) => {
        try {
            const res = await api.put(`/lists/${listId}`, { title });
            setLists((prev) => prev.map((l) => l._id === listId ? res.data.list : l));
        } catch { showToast('Failed to update list', 'error'); }
    };

    const deleteList = async (listId) => {
        try {
            await api.delete(`/lists/${listId}`);
            setLists((prev) => prev.filter((l) => l._id !== listId));
            setTasks((prev) => prev.filter((t) => t.list !== listId));
            showToast('List deleted', 'success');
        } catch { showToast('Failed to delete list', 'error'); }
    };

    const addTask = async (listId, title) => {
        try {
            const res = await api.post(`/lists/${listId}/tasks`, { title });
            setTasks((prev) => [...prev, res.data.task]);
        } catch { showToast('Failed to create task', 'error'); }
    };

    const updateTask = async (taskId, data) => {
        try {
            const res = await api.put(`/tasks/${taskId}`, data);
            setTasks((prev) => prev.map((t) => t._id === taskId ? res.data.task : t));
            showToast('Task updated', 'success');
        } catch { showToast('Failed to update task', 'error'); }
    };

    const deleteTask = async (taskId) => {
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks((prev) => prev.filter((t) => t._id !== taskId));
            showToast('Task deleted', 'success');
        } catch { showToast('Failed to delete task', 'error'); }
    };

    const assignTask = async (taskId, userId) => {
        try {
            const res = await api.post(`/tasks/${taskId}/assign`, { userId });
            setTasks((prev) => prev.map((t) => t._id === taskId ? res.data.task : t));
            // Also update selected task if viewing
            setSelectedTask((prev) => prev && prev._id === taskId ? res.data.task : prev);
        } catch { showToast('Failed to assign task', 'error'); }
    };

    // ---- Drag & Drop ----
    const getTasksForList = useCallback(
        (listId) => tasks.filter((t) => t.list === listId).sort((a, b) => a.position - b.position),
        [tasks]
    );

    const findListContaining = (taskId) => {
        const task = tasks.find((t) => t._id === taskId);
        return task?.list || null;
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeTaskId = active.id;
        const overId = over.id;

        const activeListId = findListContaining(activeTaskId);
        // over could be a task or a list body
        const overListId = findListContaining(overId) ||
            (lists.find((l) => l._id === overId) ? overId : null);

        if (!activeListId || !overListId || activeListId === overListId) return;

        // Move task to new list
        setTasks((prev) => {
            const task = prev.find((t) => t._id === activeTaskId);
            if (!task) return prev;
            const overListTasks = prev.filter((t) => t.list === overListId).sort((a, b) => a.position - b.position);
            const overIndex = overListTasks.findIndex((t) => t._id === overId);
            const newPos = overIndex >= 0 ? overIndex : overListTasks.length;

            return prev.map((t) => {
                if (t._id === activeTaskId) {
                    return { ...t, list: overListId, position: newPos };
                }
                return t;
            });
        });
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTaskId = active.id;
        const overId = over.id;
        const currentListId = findListContaining(activeTaskId);

        if (!currentListId) return;

        const listTasks = tasks
            .filter((t) => t.list === currentListId)
            .sort((a, b) => a.position - b.position);

        const oldIndex = listTasks.findIndex((t) => t._id === activeTaskId);
        const newIndex = listTasks.findIndex((t) => t._id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const reordered = arrayMove(listTasks, oldIndex, newIndex);
            const updates = reordered.map((t, i) => ({
                _id: t._id,
                list: currentListId,
                position: i,
            }));

            setTasks((prev) => {
                const otherTasks = prev.filter((t) => t.list !== currentListId);
                const updatedTasks = reordered.map((t, i) => ({ ...t, position: i }));
                return [...otherTasks, ...updatedTasks];
            });

            try {
                await api.put('/tasks/reorder', { tasks: updates, boardId });
            } catch { showToast('Failed to reorder', 'error'); }
        } else if (findListContaining(activeTaskId)) {
            // Cross-list move — recalculate positions in new list
            const newListId = findListContaining(activeTaskId);
            const newListTasks = tasks
                .filter((t) => t.list === newListId)
                .sort((a, b) => a.position - b.position);

            const updates = newListTasks.map((t, i) => ({
                _id: t._id,
                list: newListId,
                position: i,
            }));

            try {
                await api.put('/tasks/reorder', { tasks: updates, boardId });
            } catch { showToast('Failed to move task', 'error'); }
        }
    };

    // ---- Render ----
    if (loading) {
        return (
            <div className="app-layout">
                <Navbar />
                <div className="loading-spinner"><div className="spinner" /></div>
            </div>
        );
    }

    if (!board) return null;

    const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

    return (
        <div className="app-layout">
            <Navbar />
            <div className="board-page">
                <div className="board-toolbar">
                    <div className="board-toolbar-left">
                        <Link to="/boards" className="board-toolbar-back">←</Link>
                        <h2>{board.title}</h2>
                    </div>
                    <div className="board-toolbar-right">
                        <SearchBar boardId={boardId} onSelectTask={(t) => setSelectedTask(t)} />
                        <div className="board-toolbar-members">
                            {board.members?.map((m) => (
                                <div key={m._id} className="avatar avatar-sm"
                                    style={{ background: getAvatarColor(m.name) }} title={m.name}>
                                    {getInitials(m.name)}
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
                            + Member
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowActivity(!showActivity)}>
                            Activity
                        </button>
                    </div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="kanban-container">
                        {lists.map((list) => (
                            <DroppableList
                                key={list._id}
                                list={list}
                                tasks={getTasksForList(list._id)}
                                onAddTask={addTask}
                                onClickTask={(t) => setSelectedTask(t)}
                                onDeleteList={deleteList}
                                onUpdateList={updateList}
                            />
                        ))}

                        {addingList ? (
                            <div className="kanban-list" style={{ minWidth: 300, maxWidth: 300 }}>
                                <form onSubmit={addList} className="inline-form" style={{ padding: '16px' }}>
                                    <input className="input" placeholder="List title..." value={newListTitle}
                                        onChange={(e) => setNewListTitle(e.target.value)} autoFocus
                                        onBlur={() => { if (!newListTitle.trim()) setAddingList(false); }} />
                                    <button type="submit" className="btn btn-primary btn-sm">Add</button>
                                </form>
                            </div>
                        ) : (
                            <button className="add-list-btn" onClick={() => setAddingList(true)}>
                                + Add List
                            </button>
                        )}
                    </div>

                    <DragOverlay>
                        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    boardMembers={board.members || []}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                    onAssign={assignTask}
                />
            )}

            {showActivity && (
                <ActivityPanel boardId={boardId} onClose={() => setShowActivity(false)} />
            )}

            {showAddMember && (
                <AddMemberModal
                    boardId={boardId}
                    onClose={() => setShowAddMember(false)}
                    onAdded={(b) => { setBoard(b); showToast('Member added!', 'success'); }}
                />
            )}

            {ToastComponent}
        </div>
    );
}
