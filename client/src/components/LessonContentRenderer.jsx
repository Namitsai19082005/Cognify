import { createElement, useId, useState } from "react";

function QuizBlock({ block, blockIndex, lessonId }) {
  const radioGroupId = useId();
  const [selectedOption, setSelectedOption] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const isCorrect = selectedOption === block.answerIndex;

  return (
    <fieldset className="quiz-block">
      <legend>{block.question}</legend>
      <div className="quiz-options">
        {block.options.map((option, optionIndex) => {
          const inputId = `${radioGroupId}-option-${optionIndex}`;
          return (
            <label className="quiz-option" htmlFor={inputId} key={inputId}>
              <input
                id={inputId}
                type="radio"
                name={`quiz-${lessonId}-${blockIndex}`}
                value={optionIndex}
                checked={selectedOption === optionIndex}
                onChange={() => {
                  setSelectedOption(optionIndex);
                  setIsChecked(false);
                }}
              />
              <span className="quiz-option-letter" aria-hidden="true">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span>{option}</span>
            </label>
          );
        })}
      </div>
      <button
        className="quiz-check-button"
        type="button"
        disabled={selectedOption === null}
        onClick={() => setIsChecked(true)}
      >
        Check answer
      </button>
      {isChecked ? (
        <p className={`quiz-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`} role="status">
          <strong>{isCorrect ? "Correct." : "Not quite."}</strong> {block.explanation}
        </p>
      ) : null}
    </fieldset>
  );
}

function renderContentBlock(block, blockIndex, lessonId) {
  switch (block.type) {
    case "heading":
      return <h3 className="lesson-block-heading" key={blockIndex}>{block.text}</h3>;
    case "paragraph":
      return <p className="lesson-block-paragraph" key={blockIndex}>{block.text}</p>;
    case "code":
      return (
        <figure className="lesson-code-block" key={blockIndex}>
          <figcaption>{block.language}</figcaption>
          <pre><code>{block.text}</code></pre>
        </figure>
      );
    case "video":
      return (
        <aside className="lesson-video-query" key={blockIndex}>
          <span className="video-query-mark" aria-hidden="true">▶</span>
          <div>
            <strong>Video to explore</strong>
            <p>{block.query}</p>
          </div>
        </aside>
      );
    case "mcq":
      return createElement(QuizBlock, {
        key: blockIndex,
        block,
        blockIndex,
        lessonId,
      });
    default:
      return null;
  }
}

export default function LessonContentRenderer({ content, lessonId, generatedAt }) {
  return (
    <section className="lesson-content-renderer" aria-label="Detailed lesson content">
      <div className="renderer-heading">
        <span>DETAILED LESSON</span>
        {generatedAt ? (
          <time dateTime={generatedAt}>
            Saved {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(generatedAt))}
          </time>
        ) : null}
      </div>
      <div className="lesson-content-blocks">
        {content.map((block, blockIndex) => renderContentBlock(block, blockIndex, lessonId))}
      </div>
    </section>
  );
}
