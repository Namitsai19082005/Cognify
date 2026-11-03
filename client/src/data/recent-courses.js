const STORAGE_KEY = "text-to-learn:recent-courses";
const COURSE_ID_PATTERN = /^[a-f\d]{24}$/i;
const MAX_RECENT_COURSES = 20;

function isCourseSummary(value) {
  return Boolean(
    value
    && typeof value === "object"
    && COURSE_ID_PATTERN.test(value.id)
    && typeof value.title === "string"
    && typeof value.topic === "string"
    && typeof value.level === "string"
    && typeof value.createdAt === "string",
  );
}

export function readRecentCourses() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    const parsed = storedValue ? JSON.parse(storedValue) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCourseSummary).slice(0, MAX_RECENT_COURSES);
  } catch {
    return [];
  }
}

export function rememberCourse(course) {
  if (!course || !COURSE_ID_PATTERN.test(course.id)) return;

  const summary = {
    id: course.id,
    title: course.title,
    topic: course.topic,
    level: course.level,
    createdAt: course.createdAt,
  };
  const recentCourses = [
    summary,
    ...readRecentCourses().filter((savedCourse) => savedCourse.id !== summary.id),
  ].slice(0, MAX_RECENT_COURSES);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recentCourses));
  } catch {
    // The course remains usable when browser storage is disabled or full.
  }
}

export function forgetCourse(courseId) {
  const recentCourses = readRecentCourses().filter(
    (course) => course.id !== courseId,
  );

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recentCourses));
  } catch {
    // Removing a browser shortcut should not interrupt course navigation.
  }

  return recentCourses;
}
