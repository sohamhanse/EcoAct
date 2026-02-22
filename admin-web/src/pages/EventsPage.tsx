import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  archiveEvent,
  createEvent,
  deleteEvent,
  listEvents,
  publishEvent,
  updateEvent,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import type { AdminEvent } from "../types";

type EventFormState = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  coverImageUrl: string;
  status: "draft" | "published" | "archived";
  maxParticipants: string;
};

function toDateTimeInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

const defaultForm: EventFormState = {
  title: "",
  description: "",
  startAt: "",
  endAt: "",
  location: "",
  coverImageUrl: "",
  status: "published",
  maxParticipants: "",
};

export function EventsPage() {
  const { user } = useAuth();
  const communityId = user?.communityId ?? "";
  const [items, setItems] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "draft" | "published" | "archived">("");
  const [form, setForm] = useState<EventFormState>(defaultForm);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!communityId) return;
    setLoading(true);
    setError("");
    try {
      const res = await listEvents(communityId, {
        page: 1,
        limit: 50,
        search: search.trim() || undefined,
        status: status || undefined,
        sortBy: "startAt",
        order: "asc",
      });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const title = useMemo(() => (editing ? "Edit Event" : "Create Event"), [editing]);

  function startCreate() {
    setEditing(null);
    setForm(defaultForm);
  }

  function startEdit(event: AdminEvent) {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description,
      startAt: toDateTimeInput(event.startAt),
      endAt: toDateTimeInput(event.endAt),
      location: event.location,
      coverImageUrl: event.coverImageUrl,
      status: event.status,
      maxParticipants: event.maxParticipants?.toString() ?? "",
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
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        location: form.location || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        status: form.status,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      };
      if (editing) {
        await updateEvent(communityId, editing._id, payload);
      } else {
        await createEvent(communityId, payload);
      }
      startCreate();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  async function onPublish(eventId: string) {
    if (!communityId) return;
    try {
      await publishEvent(communityId, eventId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    }
  }

  async function onArchive(eventId: string) {
    if (!communityId) return;
    try {
      await archiveEvent(communityId, eventId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive failed");
    }
  }

  async function onDelete(eventId: string) {
    if (!communityId) return;
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    try {
      await deleteEvent(communityId, eventId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row between">
          <h3>Community Events</h3>
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
              New Event
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading events...</p> : null}

      <div className="card">
        <h3>{title}</h3>
        <form className="form-grid" onSubmit={submitForm}>
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              required
            />
          </label>
          <label>
            Start
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm((s) => ({ ...s, startAt: e.target.value }))}
              required
            />
          </label>
          <label>
            End
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm((s) => ({ ...s, endAt: e.target.value }))}
              required
            />
          </label>
          <label>
            Location
            <input
              value={form.location}
              onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
            />
          </label>
          <label>
            Cover Image URL
            <input
              value={form.coverImageUrl}
              onChange={(e) => setForm((s) => ({ ...s, coverImageUrl: e.target.value }))}
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as EventFormState["status"] }))}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            Max Participants
            <input
              type="number"
              min={1}
              value={form.maxParticipants}
              onChange={(e) => setForm((s) => ({ ...s, maxParticipants: e.target.value }))}
              placeholder="Optional"
            />
          </label>
          <label className="full">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              rows={4}
            />
          </label>
          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Update Event" : "Create Event"}
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
                <th>Start</th>
                <th>Status</th>
                <th>RSVPs</th>
                <th>Attended</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{new Date(item.startAt).toLocaleString()}</td>
                  <td>{item.status}</td>
                  <td>{item.stats?.rsvps ?? 0}</td>
                  <td>{item.stats?.attended ?? 0}</td>
                  <td>
                    <div className="row">
                      <button className="btn btn-secondary btn-sm" onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      {item.status !== "published" ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => void onPublish(item._id)}>
                          Publish
                        </button>
                      ) : null}
                      {item.status !== "archived" ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => void onArchive(item._id)}>
                          Archive
                        </button>
                      ) : null}
                      <button className="btn btn-danger btn-sm" onClick={() => void onDelete(item._id)}>
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
