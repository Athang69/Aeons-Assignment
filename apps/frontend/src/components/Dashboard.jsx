import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [attemptingQuiz, setAttemptingQuiz] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "", questions: [] });
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("http://localhost:3000/dashboard", { headers: { token } })
      .then((res) => setQuizzes(res.data.dashboardData || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Delete quiz
  const handleDelete = async (quizId) => {
    try {
      await axios.delete(`http://localhost:3000/quiz/${quizId}`, { headers: { token } });
      setQuizzes(quizzes.filter((q) => q.quizId !== quizId));
    } catch (err) {
      alert("Error deleting quiz: " + (err.response?.data?.message || err.message));
    }
  };

  // Start editing a quiz
  const startEdit = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({ title: quiz.title, description: quiz.description, questions: quiz.questions });
  };

  // Submit edit
  const handleEditSubmit = async () => {
    try {
      await axios.put(`http://localhost:3000/quiz/${editingQuiz.quizId}`, formData, { headers: { token } });
      setQuizzes(quizzes.map(q => (q.quizId === editingQuiz.quizId ? { ...q, ...formData } : q)));
      setEditingQuiz(null);
    } catch (err) {
      alert("Failed to edit quiz: " + (err.response?.data?.message || err.message));
    }
  };

  // Start attempt
  const startAttempt = (quiz) => {
  const answers = quiz.questions.map((q) => ({
    questionId: q._id,
    chosenIndex: null, // start with no answer selected
  }));
  setAttemptingQuiz({ ...quiz, answers });
};

const updateAnswer = (qIndex, selectedIndex) => {
  const newAnswers = [...attemptingQuiz.answers];
  newAnswers[qIndex].chosenIndex = selectedIndex;
  setAttemptingQuiz({ ...attemptingQuiz, answers: newAnswers });
};

const handleAttemptSubmit = async () => {
  try {
    // Ensure all questions have a selected answer
    const incomplete = attemptingQuiz.answers.some(a => a.chosenIndex === null);
    if (incomplete) return alert("Please answer all questions");

    const res = await axios.post(
      `http://localhost:3000/quiz/${attemptingQuiz.quizId}/attempt`,
      { answers: attemptingQuiz.answers },
      { headers: { token } }
    );
    alert(`You scored ${res.data.score} / ${res.data.maxScore}`);
    setAttemptingQuiz(null);
  } catch (err) {
    console.error(err);
    alert("Failed to submit attempt: " + (err.response?.data?.message || err.message));
  }
};


  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Quiz Dashboard</h1>

      {/* Edit quiz form */}
      {editingQuiz && (
        <div className="mb-4 p-4 border rounded bg-gray-100">
          <h2 className="font-semibold mb-2">Editing Quiz: {editingQuiz.title}</h2>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Title"
            className="w-full p-2 mb-2 border rounded"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            className="w-full p-2 mb-2 border rounded"
          />
          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleEditSubmit}>
            Save Changes
          </button>
          <button className="px-3 py-1 bg-gray-400 text-white rounded ml-2" onClick={() => setEditingQuiz(null)}>
            Cancel
          </button>
        </div>
      )}

      {/* Attempt quiz form */}
      {attemptingQuiz && (
  <div className="p-4 border rounded bg-gray-100 mb-4">
    <h2 className="font-semibold mb-2">Attempting: {attemptingQuiz.title}</h2>
    {attemptingQuiz.questions.map((q, idx) => (
      <div key={q._id} className="mb-2">
        <p>{q.text}</p>
        {q.options.map((opt, i) => (
          <label key={i} className="block">
            <input
              type="radio"
              name={`q-${idx}`}
              value={i}
              checked={attemptingQuiz.answers[idx].chosenIndex === i}
              onChange={() => updateAnswer(idx, i)}
            />
            {opt}
          </label>
        ))}
      </div>
    ))}
    <button
      className="px-3 py-1 bg-purple-500 text-white rounded"
      onClick={handleAttemptSubmit}
    >
      Submit Attempt
    </button>
    <button
      className="px-3 py-1 bg-gray-400 text-white rounded ml-2"
      onClick={() => setAttemptingQuiz(null)}
    >
      Cancel
    </button>
  </div>
)}


      {/* Quizzes list */}
      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <div key={quiz.quizId} className="border rounded p-4 bg-white shadow-md">
            <h2 className="font-semibold">{quiz.title}</h2>
            <p>{quiz.description}</p>
            <p>Questions: {quiz.questionCount}</p>
            <p>Total Score: {quiz.totalScore} / {quiz.totalMaxScore}</p>

            {String(quiz.owner) === atob(JSON.parse(window.atob(token.split(".")[1])).id) && (
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={() => startEdit(quiz)}>Edit</button>
                <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(quiz.quizId)}>Delete</button>
              </div>
            )}

            <button className="px-3 py-1 mt-2 bg-purple-500 text-white rounded" onClick={() => startAttempt(quiz)}>
              Attempt Quiz
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
