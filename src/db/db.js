import Dexie from 'dexie';

export const db = new Dexie('TestPaperDB');

db.version(1).stores({
  classes: '++id, name',
  students: '++id, name, *classIds', // *classIds is a multi-entry index
  exams: '++id, title, classId, createdAt, updatedAt',
  wrongNotes: '++id, studentId, examId, createdAt'
});

// Helper for storing blobs (images)
// In IndexedDB, we can store Blobs directly.
// The 'exams' and 'wrongNotes' stores will contain arrays of { file: Blob, id: string, order: number }
