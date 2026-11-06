const STORAGE_KEY = "text-to-learn:recent-courses";
const COURSE_ID_PATTERN = /^[a-f\d]{24}$/i;
const MAX_RECENT_COURSES = 20;

function getStorageKey(userId) {
  if (typeof userId !== "string" || !userId.trim()) return "";
  return `${STORAGE_KEY}:${encodeURIComponent(userId)}`;
}

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

export function readRecentCourses(userId) {
  const key = getStorageKey(userId);
  if (!key) return [];

  try {
    const storedValue = window.localStorage.getItem(key);
    const parsed = storedValue ? JSON.parse(storedValue) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCourseSummary).slice(0, MAX_RECENT_COURSES);
  } catch {
    return [];
  }
}

export function rememberCourse(course, userId) {
  const key = getStorageKey(userId);
  if (!key || !course || !COURSE_ID_PATTERN.test(course.id)) return;

  const summary = {
    id: course.id,
    title: course.title,
    topic: course.topic,
    level: course.level,
    createdAt: course.createdAt,
  };
  const recentCourses = [
    summary,
    ...readRecentCourses(userId).filter((savedCourse) => savedCourse.id !== summary.id),
  ].slice(0, MAX_RECENT_COURSES);

  try {
    window.localStorage.setItem(key, JSON.stringify(recentCourses));
  } catch {
    // The course remains usable when browser storage is disabled or full.
  }
}

export function forgetCourse(courseId, userId) {
  const key = getStorageKey(userId);
  if (!key) return [];
  const recentCourses = readRecentCourses(userId).filter(
    (course) => course.id !== courseId,
  );

  try {
    window.localStorage.setItem(key, JSON.stringify(recentCourses));
  } catch {
    // Removing a browser shortcut should not interrupt course navigation.
  }

  return recentCourses;
}
