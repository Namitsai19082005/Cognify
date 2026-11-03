import { createElement, useState } from "react";
import { useNavigate } from "react-router-dom";
import CourseForm from "../components/CourseForm.jsx";
import { createCourse } from "../api/courses.js";

export default function HomePage() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerateCourse(input) {
    setIsGenerating(true);
    setError("");

    try {
      const course = await createCourse(input);
      navigate(`/courses/${encodeURIComponent(course.id)}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="hero-layout" aria-labelledby="page-title">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-line" aria-hidden="true" />
          A clearer way to learn
        </div>
        <h1 id="page-title">Turn a topic into a learning path.</h1>
        <p className="intro-copy">
          Tell us what you want to understand. Get a structured course
          outline with modules, lesson goals, key topics, and resources.
        </p>

        <ul className="feature-list" aria-label="Course features">
          <li><span aria-hidden="true">01</span> A guided 3-module syllabus</li>
          <li><span aria-hidden="true">02</span> Clear goals for every lesson</li>
          <li><span aria-hidden="true">03</span> Saved courses you can revisit</li>
        </ul>
      </div>

      {createElement(CourseForm, {
        error,
        isGenerating,
        onSubmit: handleGenerateCourse,
      })}
    </section>
  );
}
