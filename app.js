let story = null;

const get = (id) => document.getElementById(id);

// Read the selected story from the page address.
const availableStories = [
  "story_001",
  "story_002",
  "story_003",
  "story_004",
  "story_005",
  "story_006",
  "story_007",
  "story_008",
  "story_009",
  "story_010",
  "story_011",
  "story_012",
  "story_013",
  "story_014",
  "story_015",
  "story_016",
  "story_017",
  "story_018",
  "story_019",
  "story_020"
];
const params = new URLSearchParams(window.location.search);
const requestedStory = params.get("story");

const selectedStory = availableStories.includes(requestedStory)
  ? requestedStory
  : "story_001";

get("story-select").value = selectedStory;

// Reload the page with the chosen lesson.
get("story-select").addEventListener("change", (event) => {
  const url = new URL(window.location.href);
  url.searchParams.set("story", event.target.value);
  window.location.href = url.href;
});

// Create an element safely using text rather than HTML.
function make(tag, text, className, language) {
  const node = document.createElement(tag);

  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  if (language) node.lang = language;

  return node;
}

function addHelp(parent, heading, text) {
  const details = make("details");
  details.append(
    make("summary", heading),
    make("p", text)
  );
  parent.append(details);
}

// 1. Thai story
function renderStory() {
  for (const sentence of story.sentences) {
    const row = make("div", undefined, "item");
    row.append(make("p", sentence.th, "thai", "th"));
    get("thai-story").append(row);
  }
}

// 2. Translations
function renderTranslations() {
  const container = get("translations");
  container.replaceChildren();

  const language = get("translation-language").value;
  if (language === "none") return;

  for (const sentence of story.sentences) {
    const row = make("div", undefined, "item");

    row.append(
      make("p", sentence.th, "thai", "th"),
      make("p", sentence[language], "translation", language)
    );

    container.append(row);
  }
}

function renderLanguageNotes() {
  for (const note of story.language_notes) {
    addHelp(
      get("language-notes"),
      "Language note",
      `${note.en}\n${note["zh-TW"]}`
    );
  }
}

// 3. Vocabulary
function renderVocabulary() {
  for (const note of story.vocabulary_notes) {
    get("vocabulary-notes").append(
      make("p", `${note.en} ${note["zh-TW"]}`, "hint")
    );
  }

  for (const word of story.vocabulary) {
    const row = make("div", undefined, "item");

    row.append(
      make(
        "p",
        `${word.priority ? "★ " : ""}${word.th}`,
        "thai",
        "th"
      ),
      make("p", `${word.en} · ${word["zh-TW"]}`),
      make(
        "p",
        word.introduced_before_story
          ? "Previously encountered"
          : "New in this story",
        "hint"
      )
    );

    if (word.notes_en) {
      row.append(make("p", word.notes_en, "hint"));
    }

    get("vocabulary-list").append(row);
  }
}

// 4. Pronunciation
function renderPronunciation() {
  get("pronunciation-advice").textContent =
    story.pronunciation.reading_advice_en;

  for (const note of story.pronunciation.notes) {
    const row = make("div", undefined, "item");

    row.append(
      make("p", note.th, "thai", "th"),
      make("p", note.school_reading, "reading"),
      make("p", note.note_en)
    );

    get("pronunciation-list").append(row);
  }
}

// 5. Sentence patterns
function renderPatterns() {
  for (const pattern of story.sentence_patterns) {
    const card = make("div", undefined, "card");

    card.append(
      make("h3", pattern.name_en),
      make("p", pattern.pattern_th, "thai"),
      make("p", pattern.explanation_en)
    );

    for (const example of pattern.examples) {
      card.append(
        make("p", example.th, "thai", "th"),
        make(
          "p",
          `${example.en} · ${example["zh-TW"]}`,
          "translation"
        )
      );
    }

    get("patterns").append(card);
  }
}

// 6. Comprehension quiz
function renderQuiz() {
  story.comprehension.forEach((question, index) => {
    const fieldset = make("fieldset");

    fieldset.append(
      make("legend", `${index + 1}. ${question.question_th}`)
    );

    addHelp(
      fieldset,
      "English question and hint",
      `${question.question_en} ${question.hint_en}`
    );

    for (const choice of question.choices) {
      const label = make("label", undefined, "choice");
      const radio = make("input");

      radio.type = "radio";
      radio.name = question.id;
      radio.value = choice.id;
      radio.required = true;

      label.append(
        radio,
        make("span", choice.th, undefined, "th")
      );

      fieldset.append(label);
    }

    addHelp(
      fieldset,
      "English meanings of the choices",
      question.choices
        .map((choice) => `${choice.th}: ${choice.en}`)
        .join(" / ")
    );

    const feedback = make("p", undefined, "feedback");
    feedback.id = `${question.id}-feedback`;
    feedback.setAttribute("role", "status");
    fieldset.append(feedback);

    get("quiz-questions").append(fieldset);
  });

  get("quiz-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const answers = new FormData(event.currentTarget);
    let score = 0;

    for (const question of story.comprehension) {
      const correct =
        answers.get(question.id) === question.correct_choice_id;

      if (correct) score += 1;

      const correctChoice = question.choices.find(
        (choice) => choice.id === question.correct_choice_id
      );

      const feedback = get(`${question.id}-feedback`);
      feedback.className =
        `feedback ${correct ? "correct" : "incorrect"}`;

      feedback.textContent = correct
        ? `Correct! ${question.explanation_en}`
        : `Correct answer: ${correctChoice.th}. ${question.explanation_en}`;
    }

    get("quiz-score").textContent =
      `Your score: ${score} / ${story.comprehension.length}`;
  });

  get("quiz-reset").addEventListener("click", () => {
    get("quiz-form").reset();
    get("quiz-score").textContent = "";

    for (const question of story.comprehension) {
      get(`${question.id}-feedback`).textContent = "";
    }
  });
}

// 7. Writing practice
function renderWriting() {
  get("writing-instructions").textContent =
    story.writing.instructions_en;

  story.writing.prompts.forEach((prompt, index) => {
    const card = make("div", undefined, "card");
    const label = make(
      "label",
      `${index + 1}. ${prompt.en}`,
      "writing-label"
    );

    label.htmlFor = prompt.id;

    const input = make("textarea");
    input.id = prompt.id;
    input.lang = "th";
    input.placeholder = "Write your Thai sentence here…";

    card.append(
      label,
      make("p", prompt["zh-TW"], "hint", "zh-TW"),
      input
    );

    addHelp(
      card,
      "Show suggested answer",
      prompt.suggested_answer_th
    );

    get("writing-prompts").append(card);
  });

  get("writing-personalization").textContent =
    story.writing.personalization_en;

  get("writing-pronoun-note").textContent =
    story.writing.pronoun_note_en;
}

// 8. Speaking practice
function renderSpeaking() {
  for (const task of story.speaking.tasks) {
    get("speaking-tasks").append(
      make("li", task.instruction_en)
    );
  }

  get("speaking-optional").textContent =
    story.speaking.optional_task_en;
}

// 9. Study schedule
function renderSchedule() {
  for (const day of story.study_schedule) {
    const card = make("div", undefined, "card");

    card.append(
      make("h3", `Day ${day.day}`),
      make("p", day.task_en),
      make("p", day["task_zh-TW"], "hint", "zh-TW")
    );

    get("study-schedule").append(card);
  }
}

// Load the JSON and display every lesson section.
async function loadStory() {
  try {
    const response = await fetch(
  `./data/stories/${selectedStory}.json`
);

    if (!response.ok) {
      throw new Error(`Could not load JSON: ${response.status}`);
    }

    story = await response.json();

    get("story-title").textContent = story.title.th;
    get("story-title").lang = "th";
    get("story-subtitle").textContent =
      `${story.title.en} · ${story.title["zh-TW"]}`;

    renderStory();
    renderTranslations();
    renderLanguageNotes();
    renderVocabulary();
    renderPronunciation();
    renderPatterns();
    renderQuiz();
    renderWriting();
    renderSpeaking();
    renderSchedule();

    get("lesson").hidden = false;
    get("status").hidden = true;
  } catch (error) {
    get("story-title").textContent = "Could not load the lesson";
    get("status").textContent =
      "Check that the JSON is saved and the file path is correct. Check the browser console for details.";
    console.error(error);
  }
}

get("translation-language").addEventListener(
  "change",
  renderTranslations
);

loadStory();