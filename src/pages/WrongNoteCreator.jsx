import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import {
  CheckCircle2,
  ChevronLeft,
  FileText,
  User,
  AlertCircle,
} from "lucide-react";

export default function WrongNoteCreator() {
  const {
    studentId: paramStudentId,
    examId: paramExamId,
    noteId,
  } = useParams();
  const navigate = useNavigate();

  // State for IDs when in edit mode
  const [resolvedStudentId, setResolvedStudentId] = useState(
    paramStudentId ? Number(paramStudentId) : null,
  );
  const [resolvedExamId, setResolvedExamId] = useState(
    paramExamId ? Number(paramExamId) : null,
  );

  const existingNote = useLiveQuery(
    () => (noteId ? db.wrongNotes.get(Number(noteId)) : null),
    [noteId],
  );

  const student = useLiveQuery(
    () => (resolvedStudentId ? db.students.get(resolvedStudentId) : null),
    [resolvedStudentId],
  );

  const exam = useLiveQuery(
    () => (resolvedExamId ? db.exams.get(resolvedExamId) : null),
    [resolvedExamId],
  );

  const otherNotes =
    useLiveQuery(
      () =>
        resolvedStudentId && resolvedExamId
          ? db.wrongNotes
              .where({ studentId: resolvedStudentId, examId: resolvedExamId })
              .toArray()
          : [],
      [resolvedStudentId, resolvedExamId],
    ) || [];

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [title, setTitle] = useState("");
  const [previews, setPreviews] = useState([]);

  const alreadyUsedIds = useMemo(() => {
    const ids = new Set();
    otherNotes.forEach((note) => {
      if (noteId && note.id === Number(noteId)) return;
      note.images.forEach((img) => ids.add(img.id));
    });
    return ids;
  }, [otherNotes, noteId]);

  // Effect to load existing note data
  useEffect(() => {
    if (existingNote) {
      setResolvedStudentId(existingNote.studentId);
      setResolvedExamId(existingNote.examId);
      setTitle(existingNote.title);
      // Pre-select IDs from the saved images
      const ids = new Set(existingNote.images.map((img) => img.id));
      setSelectedIds(ids);
    }
  }, [existingNote]);

  useEffect(() => {
    if (student && exam) {
      if (!noteId) {
        setTitle(`${exam.title} 오답노트`);
      }
      const urls = exam.images.map((img) => ({
        ...img,
        url: URL.createObjectURL(img.file),
      }));
      setPreviews(urls);
      return () => urls.forEach((u) => URL.revokeObjectURL(u.url));
    }
  }, [student, exam, noteId]);

  if (!student || !exam) return <div className="p-8">로딩 중...</div>;

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCreate = async () => {
    if (selectedIds.size === 0)
      return alert("최소 하나 이상의 틀린 문제를 선택하세요.");

    // Find the selected images from the original exam
    const selectedImages = exam.images
      .filter((img) => selectedIds.has(img.id))
      .map((img, index) => ({
        ...img,
        order: index,
      }));

    if (noteId) {
      // Update existing note
      await db.wrongNotes.update(Number(noteId), {
        title,
        images: selectedImages,
        updatedAt: new Date(),
      });
      navigate(`/exam/wrong/${noteId}`);
    } else {
      // Create new note
      const noteData = {
        title,
        studentId: resolvedStudentId,
        examId: resolvedExamId,
        images: selectedImages,
        config: exam.config, // Copy default config from exam
        createdAt: new Date(),
      };
      const id = await db.wrongNotes.add(noteData);
      navigate(`/student/${resolvedStudentId}`);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        뒤로가기
      </button>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
            <FileText size={16} />
            {noteId ? "오답노트 수정" : "오답노트 생성"}
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-black bg-transparent border-none focus:ring-0 w-full p-0"
          />
          <div className="flex items-center gap-2 text-slate-500">
            <User size={16} />
            <span>
              대상 학생:{" "}
              <span className="font-bold text-slate-900">{student.name}</span>
            </span>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <CheckCircle2 size={20} />
          {noteId ? "수정 완료" : "오답노트 저장"}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg">
          틀린 문제를 선택하세요 ({selectedIds.size})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((img, idx) => (
            <div
              key={img.id}
              onClick={() => toggleSelect(img.id)}
              className={`relative cursor-pointer group rounded-2xl border-4 transition-all overflow-hidden ${selectedIds.has(img.id) ? "border-indigo-600 ring-4 ring-indigo-100" : "border-white hover:border-slate-200"}`}
            >
              <div className="aspect-[3/4] bg-slate-50 flex items-center justify-center p-2">
                <img
                  src={img.url}
                  alt="q"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div
                className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm ${selectedIds.has(img.id) ? "bg-indigo-600 text-white" : "bg-white text-slate-400"}`}
              >
                {idx + 1}
              </div>
              {alreadyUsedIds.has(img.id) && (
                <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                  <AlertCircle size={10} />
                  틀린 문제
                </div>
              )}
              {selectedIds.has(img.id) && (
                <div className="absolute inset-0 bg-indigo-600/5 flex items-center justify-center">
                  <CheckCircle2
                    size={48}
                    className="text-indigo-600 opacity-20"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
