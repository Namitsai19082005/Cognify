import { useState } from "react";
import { CourseCreateRequestSchema } from "@text-to-learn/shared";

const COURSE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

function getValidationMessage(issue) {
  if (issue?.path[0] === "topic" && issue.code === "too_small") {
    return "Add at least 3 characters so we can shape your course.";
  }
  if (issue?.path[0] === "topic" && issue.code === "too_big") {
    return "Keep your topic under 160 characters.";
  }

  return "Check the topic and learning level, then try again.";
}

export default function CourseForm({ error, isGenerating, onSubmit }) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [validationError, setValidationError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const result = CourseCreateRequestSchema.safeParse({ topic, level });

    if (!result.success) {
      setValidationError(getValidationMessage(result.error.issues[0]));
      return;
    }

    setValidationError("");
    onSubmit(result.data);
  }

  return (
    <form className="course-form" onSubmit={handleSubmit} noValidate>
      <div className="form-heading">
        <span className="form-step">START A COURSE</span>
        <h2>What would you like to learn?</h2>
        <p>Choose a topic and we’ll organize the first steps.</p>
      </div>

      <div className="field-group">
        <label htmlFor="course-topic">Learning topic</label>
        <textarea
          id="course-topic"
          name="topic"
          rows="3"
          maxLength={160}
          placeholder="e.g. Zero Trust network security"
          value={topic}
          onChange={(event) => {
            setTopic(event.target.value);
            setValidationError("");
          }}
          aria-describedby="topic-hint topic-count"
          aria-invalid={Boolean(validationError)}
          disabled={isGenerating}
        />
        <div className="field-meta">
          <span id="topic-hint">Be specific for a more useful syllabus.</span>
          <span id="topic-count">{topic.trim().length}/160</span>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="course-level">Your starting level</label>
        <select
          id="course-level"
          name="level"
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          disabled={isGenerating}
        >
          {COURSE_LEVELS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      {validationError ? (
        <p className="form-error" role="alert">{validationError}</p>
      ) : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <button className="primary-button generate-button" type="submit" disabled={isGenerating}>
        {isGenerating ? (
          <>
            <span className="button-spinner" aria-hidden="true" />
            Building your outline…
          </>
        ) : (
          <>
            Generate course
            <span aria-hidden="true">↗</span>
          </>
        )}
      </button>
      <p className="form-footnote">A structured outline, generated and saved for you.</p>
    </form>
  );
}
