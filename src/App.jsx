import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ClassDetail from './pages/ClassDetail';
import ExamCreator from './pages/ExamCreator';
import ExamDetail from './pages/ExamDetail';
import StudentDetail from './pages/StudentDetail';
import WrongNoteCreator from './pages/WrongNoteCreator';
import WrongNoteDetail from './pages/WrongNoteDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="class/:classId" element={<ClassDetail />} />
          <Route path="student/:studentId" element={<StudentDetail />} />
          <Route path="exam/new" element={<ExamCreator />} />
          <Route path="exam/:examId" element={<ExamDetail />} />
          <Route path="exam/wrong/:noteId" element={<WrongNoteDetail />} />
          <Route path="wrong-note/new/:studentId/:examId" element={<WrongNoteCreator />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;