import { useParams, Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { 
  Plus, User, FileText, Settings, Trash2, Search, Folder, FolderPlus, 
  Palette, MoreVertical, Check, FolderInput, X, CheckCircle2, Circle, Edit2, Merge
} from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

const EXAM_COLORS = [
  { id: 'none', bg: 'bg-white', border: 'border-slate-200', ribbon: 'bg-transparent', label: '기본' },
  { id: 'red', bg: 'bg-red-50/50', border: 'border-red-200', ribbon: 'bg-red-500', label: '빨강' },
  { id: 'orange', bg: 'bg-orange-50/50', border: 'border-orange-200', ribbon: 'bg-orange-500', label: '주황' },
  { id: 'yellow', bg: 'bg-yellow-50/50', border: 'border-yellow-200', ribbon: 'bg-yellow-400', label: '노랑' },
  { id: 'green', bg: 'bg-emerald-50/50', border: 'border-emerald-200', ribbon: 'bg-emerald-500', label: '초록' },
  { id: 'blue', bg: 'bg-blue-50/50', border: 'border-blue-200', ribbon: 'bg-blue-500', label: '파랑' },
  { id: 'purple', bg: 'bg-purple-50/50', border: 'border-purple-200', ribbon: 'bg-purple-500', label: '보라' },
  { id: 'gray', bg: 'bg-slate-100/50', border: 'border-slate-300', ribbon: 'bg-slate-500', label: '회색' },
];

export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const id = Number(classId);
  const [isManaging, setIsManaging] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("all"); // 'all', 'unassigned', or folderId
  
  // Dropdown Menu State (Single Item)
  const [activeMenuExamId, setActiveMenuExamId] = useState(null);
  const menuRef = useRef(null);

  // Bulk Selection State
  const [selectedExamIds, setSelectedExamIds] = useState(new Set());
  const isSelectionMode = selectedExamIds.size > 0;
  const [activeBulkMenu, setActiveBulkMenu] = useState(null); // 'folder' | 'color' | null
  const bulkMenuRef = useRef(null);

  // Folder Context Menu State
  const [folderContextMenu, setFolderContextMenu] = useState(null); // { x, y, folder }
  const folderMenuRef = useRef(null);

  // Folder Delete Modal State
  const [folderToDelete, setFolderToDelete] = useState(null); // folder object
  const [deleteOption, setDeleteOption] = useState('unassign'); // 'unassign' | 'cascade'

  // Outside click handler for menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuExamId(null);
      }
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(event.target)) {
        setActiveBulkMenu(null);
      }
      if (folderMenuRef.current && !folderMenuRef.current.contains(event.target)) {
        setFolderContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cls = useLiveQuery(() => db.classes.get(id), [id]);
  const students = useLiveQuery(() => db.students.where("classIds").equals(id).toArray(), [id]) || [];
  const exams = useLiveQuery(() => db.exams.where("classId").equals(id).toArray(), [id]) || [];
  const folders = useLiveQuery(() => db.folders.where("classId").equals(id).toArray(), [id]) || [];

  const allStudents = useLiveQuery(() => db.students.toArray()) || [];
  const studentsNotInClass = allStudents.filter((s) => !s.classIds.includes(id));

  // --- Handlers ---
  const addStudent = async () => {
    const name = prompt("새 학생 이름을 입력하세요:");
    if (name) {
      await db.students.add({ name, classIds: [id] });
    }
  };

  const addExistingStudent = async (studentId) => {
    const student = await db.students.get(Number(studentId));
    if (student) {
      await db.students.update(student.id, {
        classIds: [...new Set([...student.classIds, id])],
      });
    }
  };

  const deleteClass = async () => {
    if (confirm("이 클래스를 삭제하시겠습니까? 관련 데이터가 삭제될 수 있습니다.")) {
      await db.classes.delete(id);
      navigate("/");
    }
  };

  // --- Folder Management Actions ---
  const addFolder = async () => {
    const name = prompt("새 폴더 이름을 입력하세요:");
    if (name?.trim()) {
      await db.folders.add({ name: name.trim(), classId: id, createdAt: Date.now() });
    }
  };

  const handleFolderContextMenu = (e, folder) => {
    e.preventDefault();
    setFolderContextMenu({ x: e.clientX, y: e.clientY, folder });
  };

  const handleRenameFolder = async (folder) => {
    setFolderContextMenu(null);
    const newName = prompt("새 폴더 이름을 입력하세요:", folder.name);
    if (newName && newName.trim() !== "" && newName !== folder.name) {
      await db.folders.update(folder.id, { name: newName.trim() });
    }
  };

  const handleRequestDeleteFolder = (folder) => {
    setFolderContextMenu(null);
    setFolderToDelete(folder);
    setDeleteOption('unassign'); // Reset option
  };

  const executeDeleteFolder = async () => {
    if (!folderToDelete) return;
    
    if (deleteOption === 'unassign') {
      const relatedExams = await db.exams.where("folderId").equals(folderToDelete.id).toArray();
      await Promise.all(relatedExams.map(ex => db.exams.update(ex.id, { folderId: undefined })));
    } else if (deleteOption === 'cascade') {
      const relatedExams = await db.exams.where("folderId").equals(folderToDelete.id).toArray();
      const examIds = relatedExams.map(e => e.id);
      await Promise.all(examIds.map(eid => db.exams.delete(eid)));
      await Promise.all(examIds.map(eid => db.wrongNotes.where("examId").equals(eid).delete()));
    }

    await db.folders.delete(folderToDelete.id);
    
    if (selectedFolderId === folderToDelete.id) {
      setSelectedFolderId('all');
      clearSelection();
    }
    
    setFolderToDelete(null);
  };

  // --- Single Item Actions ---
  const updateExamColor = async (examId, colorId) => {
    await db.exams.update(examId, { color: colorId === 'none' ? undefined : colorId });
    setActiveMenuExamId(null);
  };

  const updateExamFolder = async (examId, folderId) => {
    await db.exams.update(examId, { folderId: folderId === 'unassigned' ? undefined : folderId });
    setActiveMenuExamId(null);
  };

  const deleteExam = async (examId, e) => {
    e.stopPropagation();
    if (confirm("이 시험지를 삭제하시겠습니까?")) {
      await db.exams.delete(examId);
      await db.wrongNotes.where("examId").equals(examId).delete();
      setActiveMenuExamId(null);
    }
  };

  // --- Bulk Actions ---
  const toggleExamSelection = (examId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedExamIds(prev => {
      const next = new Set(prev);
      if (next.has(examId)) next.delete(examId);
      else next.add(examId);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedExamIds(new Set());
    setActiveBulkMenu(null);
  };

  const bulkUpdateFolder = async (targetFolderId) => {
    const ids = Array.from(selectedExamIds);
    await Promise.all(ids.map(eid => 
      db.exams.update(eid, { folderId: targetFolderId === 'unassigned' ? undefined : targetFolderId })
    ));
    clearSelection();
  };

  const bulkUpdateColor = async (colorId) => {
    const ids = Array.from(selectedExamIds);
    await Promise.all(ids.map(eid => 
      db.exams.update(eid, { color: colorId === 'none' ? undefined : colorId })
    ));
    clearSelection();
  };

  const bulkDelete = async () => {
    if (confirm(`선택한 ${selectedExamIds.size}개의 시험지를 정말 삭제하시겠습니까?`)) {
      const ids = Array.from(selectedExamIds);
      await Promise.all(ids.map(eid => db.exams.delete(eid)));
      await Promise.all(ids.map(eid => db.wrongNotes.where("examId").equals(eid).delete()));
      clearSelection();
    }
  };

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (selectedFolderId === 'unassigned' && exam.folderId) return false;
      if (selectedFolderId !== 'all' && selectedFolderId !== 'unassigned' && exam.folderId !== selectedFolderId) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!exam.title.toLowerCase().includes(query)) return false;
      }
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [exams, selectedFolderId, searchQuery]);

  if (!cls) return <div className="p-8">로딩 중...</div>;

  // Render
  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{cls.name}</h1>
          <p className="text-slate-500">클래스 관리 및 시험지 목록</p>
        </div>
        <div className="flex gap-2">
          {isManaging ? (
            <button onClick={() => setIsManaging(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors">
              완료
            </button>
          ) : (
            <button onClick={() => setIsManaging(true)} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          )}
          {isManaging && (
            <button onClick={deleteClass} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
        {/* Students List */}
        <div className="lg:col-span-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User size={20} className="text-indigo-500" />
              학생 목록 ({students.length})
            </h2>
            <div className="flex gap-1">
              {studentsNotInClass.length > 0 && (
                <select
                  onChange={(e) => addExistingStudent(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 w-24 truncate"
                  value=""
                >
                  <option value="" disabled>추가</option>
                  {studentsNotInClass.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
              <button onClick={addStudent} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="새 학생 추가">
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-y-auto flex-1">
            {students.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">등록된 학생이 없습니다.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {students.map((student) => (
                  <Link key={student.id} to={`/student/${student.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      {student.name[0]}
                    </div>
                    <span className="font-medium text-slate-700 truncate">{student.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exams List Area */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText size={20} className="text-indigo-500" />
              시험지 보관함 ({exams.length})
            </h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="시험지 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <Link to={`/exam/new?classId=${id}`} className="shrink-0 flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus size={16} /> 새 시험지
              </Link>
            </div>
          </div>

          {/* Folder Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 shrink-0 scrollbar-hide">
            <button
              onClick={() => { setSelectedFolderId('all'); clearSelection(); }}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedFolderId === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              전체 보기
            </button>
            <button
              onClick={() => { setSelectedFolderId('unassigned'); clearSelection(); }}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedFolderId === 'unassigned' ? 'bg-slate-200 text-slate-800' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              미분류
            </button>
            
            <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => { setSelectedFolderId(folder.id); clearSelection(); }}
                onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-context-menu ${selectedFolderId === folder.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Folder size={14} className={selectedFolderId === folder.id ? 'text-indigo-200' : 'text-slate-400'} />
                {folder.name}
              </button>
            ))}

            <button
              onClick={addFolder}
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white border border-dashed border-slate-300 text-slate-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
              title="새 폴더 추가"
            >
              <FolderPlus size={16} />
            </button>
          </div>
          
          {/* Exams Grid */}
          <div className="flex-1 overflow-y-auto pb-8">
            {filteredExams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center mt-4">
                <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 mb-2">조건에 맞는 시험지가 없습니다.</p>
                {searchQuery && <p className="text-sm text-slate-400">다른 검색어를 입력하거나 필터를 변경해보세요.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredExams.map(exam => {
                  const colorConfig = EXAM_COLORS.find(c => c.id === exam.color) || EXAM_COLORS[0];
                  const isSelected = selectedExamIds.has(exam.id);
                  
                  return (
                    <div key={exam.id} className="relative group">
                      <Link 
                        to={`/exam/${exam.id}`}
                        onClick={(e) => {
                          if (isSelectionMode) {
                            toggleExamSelection(exam.id, e);
                          }
                        }}
                        onContextMenu={(e) => {
                          if (!isSelectionMode) {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveMenuExamId(activeMenuExamId === exam.id ? null : exam.id);
                          }
                        }}
                        className={`block h-full bg-white p-5 rounded-2xl border ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/30' : colorConfig.border} hover:shadow-lg transition-all overflow-hidden relative`}
                      >
                        {/* Color Ribbon */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorConfig.ribbon}`} />

                        {/* Absolute Overlay Checkbox (Appears on Hover) */}
                        <div 
                          className={`absolute top-4 left-3 z-30 cursor-pointer bg-white/90 backdrop-blur-sm rounded-full p-0.5 shadow-sm border border-slate-100 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all hover:scale-105`}
                          onClick={(e) => toggleExamSelection(exam.id, e)}
                        >
                          {isSelected ? (
                            <CheckCircle2 size={20} className="text-indigo-600 fill-indigo-50" />
                          ) : (
                            <Circle size={20} className="text-slate-300 hover:text-slate-400" />
                          )}
                        </div>

                        <div className="flex justify-between items-start mb-4 pl-2">
                          <div className={`p-2 rounded-lg transition-colors z-20 ${colorConfig.id === 'none' ? 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600' : `${colorConfig.bg} ${colorConfig.ribbon.replace('bg-', 'text-')}`}`}>
                            <FileText size={20} />
                          </div>
                          <span className="text-xs text-slate-400 font-medium mr-6">
                            {new Date(exam.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="pl-2 pr-6">
                          <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{exam.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                            <span>총 {exam.images.length}문제</span>
                            {exam.folderId && (
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                                <Folder size={10} />
                                <span className="truncate max-w-[80px]">{folders.find(f => f.id === exam.folderId)?.name || '알 수 없음'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Single Dropdown Menu Toggle - Hidden in Selection Mode */}
                      {!isSelectionMode && (
                        <div className="absolute top-4 right-2 z-10">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenuExamId(activeMenuExamId === exam.id ? null : exam.id);
                            }}
                            className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {/* Dropdown Menu Body */}
                          {activeMenuExamId === exam.id && (
                            <div ref={menuRef} className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 text-sm">
                              <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">라벨 색상</div>
                              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                                {EXAM_COLORS.map(c => (
                                  <button
                                    key={c.id}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateExamColor(exam.id, c.id); }}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${c.id === 'none' ? 'bg-slate-100 border border-slate-300' : c.ribbon}`}
                                    title={c.label}
                                  >
                                    {exam.color === c.id || (!exam.color && c.id === 'none') ? <Check size={12} className={c.id === 'none' ? 'text-slate-400' : 'text-white'} /> : null}
                                  </button>
                                ))}
                              </div>
                              <div className="h-px bg-slate-100 my-1" />
                              
                              <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">폴더 이동</div>
                              <div className="max-h-32 overflow-y-auto">
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateExamFolder(exam.id, 'unassigned'); }}
                                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 ${!exam.folderId ? 'text-indigo-600 font-medium bg-indigo-50/50' : 'text-slate-600'}`}
                                >
                                  <Folder size={14} className={!exam.folderId ? 'text-indigo-500' : 'text-slate-400'} /> 미분류
                                </button>
                                {folders.map(f => (
                                  <button
                                    key={f.id}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateExamFolder(exam.id, f.id); }}
                                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 truncate ${exam.folderId === f.id ? 'text-indigo-600 font-medium bg-indigo-50/50' : 'text-slate-600'}`}
                                  >
                                    <Folder size={14} className={exam.folderId === f.id ? 'text-indigo-500' : 'text-slate-400'} /> {f.name}
                                  </button>
                                ))}
                              </div>
                              <div className="h-px bg-slate-100 my-1" />
                              <button
                                onClick={(e) => deleteExam(exam.id, e)}
                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                              >
                                <Trash2 size={14} /> 삭제하기
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Toolbar */}
      {isSelectionMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-2 py-2 flex items-center gap-2 shadow-2xl z-50 animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className="flex items-center gap-3 pl-4 pr-2">
            <button 
              onClick={clearSelection}
              className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
              title="선택 해제"
            >
              <X size={18} />
            </button>
            <span className="text-sm font-medium mr-2">{selectedExamIds.size}개 선택됨</span>
          </div>

          <div className="w-px h-6 bg-slate-700" />

          <div className="flex items-center gap-1 pr-2 relative" ref={bulkMenuRef}>
            <button
              onClick={() => setActiveBulkMenu(activeBulkMenu === 'folder' ? null : 'folder')}
              className={`p-2 rounded-full transition-colors flex items-center gap-2 text-sm font-medium ${activeBulkMenu === 'folder' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}
              title="폴더 이동"
            >
              <FolderInput size={18} />
            </button>
            
            <button
              onClick={() => setActiveBulkMenu(activeBulkMenu === 'color' ? null : 'color')}
              className={`p-2 rounded-full transition-colors flex items-center gap-2 text-sm font-medium ${activeBulkMenu === 'color' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}
              title="색상 변경"
            >
              <Palette size={18} />
            </button>

            <button
              onClick={() => {
                if (selectedExamIds.size < 2) {
                  alert("합치기를 하려면 2개 이상의 시험지를 선택해주세요.");
                  return;
                }
                const idsParam = Array.from(selectedExamIds).join(',');
                navigate(`/exam/merge?classId=${id}&ids=${idsParam}`);
              }}
              className="p-2 hover:bg-slate-800 text-slate-300 rounded-full transition-colors flex items-center gap-2 text-sm font-medium hover:text-white"
              title="시험지 합치기"
            >
              <Merge size={18} />
            </button>

            <button
              onClick={bulkDelete}
              className="p-2 hover:bg-red-900/50 hover:text-red-400 text-slate-300 rounded-full transition-colors ml-1"
              title="일괄 삭제"
            >
              <Trash2 size={18} />
            </button>

            {/* Bulk Folder Menu */}
            {activeBulkMenu === 'folder' && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">이동할 폴더 선택</div>
                <div className="max-h-48 overflow-y-auto">
                  <button
                    onClick={() => bulkUpdateFolder('unassigned')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700"
                  >
                    <Folder size={14} className="text-slate-400" /> 미분류로 이동
                  </button>
                  {folders.map(f => (
                    <button
                      key={f.id}
                      onClick={() => bulkUpdateFolder(f.id)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 truncate"
                    >
                      <Folder size={14} className="text-indigo-500" /> {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bulk Color Menu */}
            {activeBulkMenu === 'color' && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">일괄 색상 변경</div>
                <div className="px-3 py-2 flex flex-wrap gap-1.5">
                  {EXAM_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => bulkUpdateColor(c.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${c.id === 'none' ? 'bg-slate-100 border border-slate-300' : c.ribbon}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Folder Context Menu */}
      {folderContextMenu && (
        <div 
          ref={folderMenuRef}
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-in fade-in zoom-in-95 duration-100 text-sm min-w-[150px]"
          style={{ top: folderContextMenu.y, left: folderContextMenu.x }}
        >
          <div className="px-3 py-1 text-xs font-bold text-slate-400 border-b border-slate-100 mb-1 truncate">
            {folderContextMenu.folder.name}
          </div>
          <button
            onClick={() => handleRenameFolder(folderContextMenu.folder)}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
          >
            <Edit2 size={14} className="text-slate-500" /> 이름 변경
          </button>
          <button
            onClick={() => handleRequestDeleteFolder(folderContextMenu.folder)}
            className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium"
          >
            <Trash2 size={14} className="text-red-500" /> 삭제
          </button>
        </div>
      )}

      {/* Folder Delete Modal */}
      {folderToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">'{folderToDelete.name}' 폴더 삭제</h3>
              <p className="text-sm text-slate-500 mb-6">해당 폴더에 포함된 시험지들을 어떻게 처리할지 선택해주세요.</p>

              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${deleteOption === 'unassign' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-200'}`}>
                  <div className="pt-0.5">
                    <input 
                      type="radio" 
                      name="deleteOption" 
                      checked={deleteOption === 'unassign'} 
                      onChange={() => setDeleteOption('unassign')}
                      className="w-4 h-4 text-indigo-600 accent-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">폴더만 삭제</div>
                    <div className="text-xs text-slate-500 mt-1">폴더 내부의 시험지들은 삭제되지 않으며, '미분류'로 이동됩니다.</div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${deleteOption === 'cascade' ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-red-200'}`}>
                  <div className="pt-0.5">
                    <input 
                      type="radio" 
                      name="deleteOption" 
                      checked={deleteOption === 'cascade'} 
                      onChange={() => setDeleteOption('cascade')}
                      className="w-4 h-4 text-red-600 accent-red-600 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-red-700">모두 삭제 (위험)</div>
                    <div className="text-xs text-red-600/80 mt-1">폴더와 함께 내부의 모든 시험지, 그리고 작성된 오답노트 기록까지 영구적으로 삭제됩니다.</div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={executeDeleteFolder}
                className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${deleteOption === 'cascade' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                확인 및 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
