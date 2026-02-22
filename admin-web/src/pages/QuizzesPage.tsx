import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  archiveQuiz,
  createQuiz,
  deleteQuiz,
  listQuizzes,
  publishQuiz,
  updateQuiz,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import type { AdminQuiz, QuizQuestion } from "../types";

type QuizFormState = {
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  startAt: string;
  endAt: string;
  timeLimitMinutes: string;
  passingScore: string;
  questions: QuizQuestion[];
};

function toDateTimeInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

const defaultQuestion: QuizQuestion = {
  prompt: "",
  options: ["", ""],
  correctOptionIndex: 0,
  explanation: "",
};

const defaultForm: QuizFormState = {
  title: "",
  description: "",
  status: "published",
  startAt: "",
  endAt: "",
  timeLimitMinutes: "",
  passingScore: "60",
  questions: [{ ...defaultQuestion }],
};

export function QuizzesPage() {
  const { user } = useAuth();
  const communityId = user?.communityId ?? "";
  const [items, setItems] = useState<AdminQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "draft" | "published" | "archived">("");
  const [form, setForm] = useState<QuizFormState>(defaultForm);
  const [editing, setEditing] = useState<AdminQuiz | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!communityId) return;
    setLoading(true);
    setError("");
    try {
      const res = await listQuizzes(communityId, {
        page: 1,
        limit: 50,
        search: search.trim() || undefined,
        status: status || undefined,
      });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const title = useMemo(() => (editing ? "Edit Quiz" : "Create Quiz"), [editing]);

  function startCreate() {
    setEditing(null);
    setForm(defaultForm);
  }

  function startEdit(quiz: AdminQuiz) {
    setEditing(quiz);
    setForm({
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      startAt: toDateTimeInput(quiz.startAt),
      endAt: toDateTimeInput(quiz.endAt),
      timeLimitMinutes: quiz.timeLimitMinutes?.toString() ?? "",
      passingScore: quiz.passingScore.toString(),
      questions: quiz.questions.map((q) => ({ ...q })),
    });
  }

  function updateQuestion(index: number, next: Partial<QuizQuestion>) {
    setForm((prev) => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], ...next };
      return { ...prev, questions };
    });
  }

  function addQuestion() {
    setForm((prev) => ({ ...prev, questions: [...prev.questions, { ...defaultQuestion }] }));
  }

  function removeQuestion(index: number) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  function addOption(questionIndex: number) {
    setForm((prev) => {
      const questions = [...prev.questions];
      if (questions[questionIndex].options.length >= 6) return prev;
      questions[questionIndex] = {
        ...questions[questionIndex],
        options: [...questions[questionIndex].options, ""],
      };
      return { ...prev, questions };
    });
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setForm((prev) => {
      const questions = [...prev.questions];
      if (questions[questionIndex].options.length <= 2) return prev;
      const nextOptions = questions[questionIndex].options.filter((_, i) => i !== optionIndex);
      const corrected = Math.min(questions[questionIndex].correctOptionIndex, nextOptions.length - 1);
      questions[questionIndex] = {
        ...questions[questionIndex],
        options: nextOptions,
        correctOptionIndex: corrected,
      };
      return { ...prev, questions };
    });
  }

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    if (!communityId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        timeLimitMinutes: form.timeLimitMinutes ? Number(form.timeLimitMinutes) : null,
        passingScore: Number(form.passingScore || 60),
        questions: form.questions,
      };
      if (editing) {
        await updateQuiz(communityId, editing._id, payload);
      } else {
        await createQuiz(communityId, payload);
      }
      startCreate();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  }

  async function onPublish(quizId: string) {
    if (!communityId) return;
    try {
      await publishQuiz(communityId, quizId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    }
  }

  async function onArchive(quizId: string) {
    if (!communityId) return;
    try {
      await archiveQuiz(communityId, quizId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive failed");
    }
  }

  async function onDelete(quizId: string) {
    if (!communityId) return;
    if (!window.confirm("Delete this quiz and all attempts?")) return;
    try {
      await deleteQuiz(communityId, quizId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row between">
          <h3>Community Quizzes</h3>
          <div className="row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title..."
            />
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button className="btn btn-secondary" onClick={() => void load()}>
              Filter
            </button>
            <button className="btn btn-primary" onClick={startCreate}>
              New Quiz
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading quizzes...</p> : null}

      <div className="card">
        <h3>{title}</h3>
        <form className="form-grid" onSubmit={submitForm}>
          <label>
            Title
            <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as QuizFormState["status"] }))}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            Passing Score
            <input
              type="number"
              min={1}
              max={100}
              value={form.passingScore}
              onChange={(e) => setForm((s) => ({ ...s, passingScore: e.target.value }))}
              required
            />
          </label>
          <label>
            Time Limit (minutes)
            <input
              type="number"
              min={1}
              value={form.timeLimitMinutes}
              onChange={(e) => setForm((s) => ({ ...s, timeLimitMinutes: e.target.value }))}
              placeholder="Optional"
            />
          </label>
          <label>
            Start (optional)
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm((s) => ({ ...s, startAt: e.target.value }))}
            />
          </label>
          <label>
            End (optional)
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm((s) => ({ ...s, endAt: e.target.value }))}
            />
          </label>
          <label className="full">
            Description
            <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} rows={3} />
          </label>

          <div className="full stack-sm">
            <div className="row between">
              <h4>Questions</h4>
              <button className="btn btn-secondary btn-sm" type="button" onClick={addQuestion}>
                Add Question
              </button>
            </div>
            {form.questions.map((q, qi) => (
              <div key={qi} className="question-card">
                <div className="row between">
                  <strong>Q{qi + 1}</strong>
                  {form.questions.length > 1 ? (
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => removeQuestion(qi)}>
                      Remove
                    </button>
                  ) : null}
                </div>
                <label>
                  Prompt
                  <input
                    value={q.prompt}
                    onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Explanation (optional)
                  <input
                    value={q.explanation ?? ""}
                    onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                  />
                </label>
                <div className="stack-sm">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="row">
                      <input
                        value={opt}
                        onChange={(e) => {
                          const options = [...q.options];
                          options[oi] = e.target.value;
                          updateQuestion(qi, { options });
                        }}
                        placeholder={`Option ${oi + 1}`}
                        required
                      />
                      <label className="inline-label">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctOptionIndex === oi}
                          onChange={() => updateQuestion(qi, { correctOptionIndex: oi })}
                        />
                        Correct
                      </label>
                      {q.options.length > 2 ? (
                        <button className="btn btn-danger btn-sm" type="button" onClick={() => removeOption(qi, oi)}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {q.options.length < 6 ? (
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => addOption(qi)}>
                      Add Option
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Update Quiz" : "Create Quiz"}
            </button>
            {editing ? (
              <button className="btn btn-secondary" type="button" onClick={startCreate}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Questions</th>
                <th>Attempts</th>
                <th>Avg Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((quiz) => (
                <tr key={quiz._id}>
                  <td>{quiz.title}</td>
                  <td>{quiz.status}</td>
                  <td>{quiz.questionCount ?? quiz.questions.length}</td>
                  <td>{quiz.stats?.attempts ?? 0}</td>
                  <td>{quiz.stats?.avgScore ?? 0}%</td>
                  <td>
                    <div className="row">
                      <button className="btn btn-secondary btn-sm" onClick={() => startEdit(quiz)}>
                        Edit
                      </button>
                      {quiz.status !== "published" ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => void onPublish(quiz._id)}>
                          Publish
                        </button>
                      ) : null}
                      {quiz.status !== "archived" ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => void onArchive(quiz._id)}>
                          Archive
                        </button>
                      ) : null}
                      <button className="btn btn-danger btn-sm" onClick={() => void onDelete(quiz._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
