import { createElement, useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CourseOverview from "../components/CourseOverview.jsx";
import LessonPage from "./LessonPage.jsx";
import { generateLessonContent, getCourse } from "../api/courses.js";
import { rememberCourse } from "../data/recent-courses.js";

export default function CourseRoute({ view = "overview" }) {
  const { courseId, moduleIndex, lessonIndex } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently, user } = useAuth0();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lessonGeneration, setLessonGeneration] = useState({
    lessonId: null,
    isLoading: false,
    error: "",
  });
  const lessonRequestRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    lessonRequestRef.current?.abort();
    lessonRequestRef.current = null;
    setCourse(null);
    setError("");
    setIsLoading(true);
    setLessonGeneration({ lessonId: null, isLoading: false, error: "" });

    getCourse(courseId, { signal: controller.signal, getAccessTokenSilently })
      .then((savedCourse) => {
        rememberCourse(savedCourse, user?.sub);
        setCourse(savedCourse);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => {
      controller.abort();
      lessonRequestRef.current?.abort();
    };
  }, [courseId, getAccessTokenSilently, user?.sub]);

  async function handleGenerateLesson(lessonId) {
    if (!course) return;

    lessonRequestRef.current?.abort();
    const controller = new AbortController();
    lessonRequestRef.current = controller;
    setLessonGeneration({ lessonId, isLoading: true, error: "" });

    try {
      const generatedLesson = await generateLessonContent(course.id, lessonId, {
        signal: controller.signal,
        getAccessTokenSilently,
      });
      setCourse((currentCourse) => {
        if (!currentCourse) return currentCourse;

        return {
          ...currentCourse,
          updatedAt: generatedLesson.generatedAt,
          modules: currentCourse.modules.map((courseModule) => ({
            ...courseModule,
            lessons: courseModule.lessons.map((lesson) => (
              lesson.id === generatedLesson.lessonId
                ? {
                    ...lesson,
                    content: generatedLesson.content,
                    contentGeneratedAt: generatedLesson.generatedAt,
                  }
                : lesson
            )),
          })),
        };
      });
      setLessonGeneration({ lessonId: null, isLoading: false, error: "" });
    } catch (requestError) {
      if (!controller.signal.aborted) {
        setLessonGeneration({ lessonId, isLoading: false, error: requestError.message });
      }
    } finally {
      if (!controller.signal.aborted) lessonRequestRef.current = null;
    }
  }

  if (isLoading) {
    return (
      <section className="loading-panel" role="status" aria-live="polite">
        <span className="loading-spinner" aria-hidden="true" />
        <p>Loading your saved course…</p>
      </section>
    );
  }

  if (error || !course) {
    return (
      <section className="route-message" aria-labelledby="course-error-title">
        <div className="page-eyebrow">COURSE UNAVAILABLE</div>
        <h1 id="course-error-title">We couldn’t open this course.</h1>
        <p role="alert">{error || "The course could not be found."}</p>
        <div className="route-actions">
          {createElement(Link, { className: "primary-button route-action", to: "/courses", children: "Open course library" })}
          {createElement(Link, { className: "secondary-button", to: "/", children: "Create a course" })}
        </div>
      </section>
    );
  }

  if (view === "lesson") {
    const selectedModuleIndex = Number(moduleIndex);
    const selectedLessonIndex = Number(lessonIndex);
    const selectedModule = course.modules[selectedModuleIndex];
    const selectedLesson = selectedModule?.lessons[selectedLessonIndex];

    if (
      !Number.isSafeInteger(selectedModuleIndex)
      || !Number.isSafeInteger(selectedLessonIndex)
      || !selectedLesson
    ) {
      return (
        <section className="route-message" aria-labelledby="lesson-error-title">
          <div className="page-eyebrow">LESSON NOT FOUND</div>
          <h1 id="lesson-error-title">This lesson isn’t in the course.</h1>
          {createElement(Link, {
            className: "primary-button route-action",
            to: `/courses/${encodeURIComponent(course.id)}`,
            children: "Return to course overview",
          })}
        </section>
      );
    }

    return createElement(LessonPage, {
      course,
      moduleIndex: selectedModuleIndex,
      lessonIndex: selectedLessonIndex,
      lesson: selectedLesson,
      onGenerateLesson: handleGenerateLesson,
      isGenerating: lessonGeneration.isLoading && lessonGeneration.lessonId === selectedLesson.id,
      error: lessonGeneration.lessonId === selectedLesson.id ? lessonGeneration.error : "",
    });
  }

  return createElement(CourseOverview, {
      course,
      onCreateAnother: () => navigate("/"),
      onGenerateLesson: handleGenerateLesson,
      onOpenLesson: (currentModuleIndex, currentLessonIndex) => navigate(
        `/courses/${encodeURIComponent(course.id)}/module/${currentModuleIndex}/lesson/${currentLessonIndex}`,
      ),
      generatingLessonId: lessonGeneration.isLoading ? lessonGeneration.lessonId : null,
      isGeneratingLesson: lessonGeneration.isLoading,
      lessonError: lessonGeneration.error ? lessonGeneration : null,
    });
}
