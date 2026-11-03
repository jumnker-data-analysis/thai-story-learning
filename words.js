/* Word card content lives in data/words/special_ro.json. */
(() => {
  "use strict";

  const grid = document.getElementById("words-grid");
  const search = document.getElementById("words-search");
  const groupSelect = document.getElementById("words-group");
  const status = document.getElementById("words-status");
  const error = document.getElementById("words-error");
  const empty = document.getElementById("words-empty");
  const hideAll = document.getElementById("words-hide-all");
  let collection = null;
  // This Set tracks revealed cards only while the page is open.
  const revealed = new Set();

  // textContent displays JSON as text rather than executing it as HTML.
  function element(tag, className, text, lang) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    if (lang) node.lang = lang;
    return node;
  }

  function validate(data) {
    if (!data || data.schema_version !== 1 || !Array.isArray(data.words) ||
        !Array.isArray(data.groups) || data.groups.length === 0) {
      throw new Error("The word collection structure is invalid.");
    }
    const groupIds = new Set();
    for (const group of data.groups) {
      if (!group.id || !group.label || groupIds.has(group.id)) {
        throw new Error("Each reading group needs a unique ID and label.");
      }
      groupIds.add(group.id);
    }
    const wordIds = new Set();
    for (const word of data.words) {
      if (!/^[a-z0-9_-]+$/.test(word.id || "") || wordIds.has(word.id) ||
          !groupIds.has(word.group_id)) {
        throw new Error("A word has a duplicate/invalid ID or reading group.");
      }
      for (const key of ["th", "reading_th", "en", "zh-TW", "note_en", "note_zh-TW"]) {
        if (typeof word[key] !== "string" || !word[key].trim()) {
          throw new Error(`A word is missing ${key}.`);
        }
      }
      for (const key of ["th", "en", "zh-TW"]) {
        if (typeof word.example?.[key] !== "string" || !word.example[key].trim()) {
          throw new Error(`An example is missing ${key}.`);
        }
      }
      wordIds.add(word.id);
    }
    return data;
  }

  function createCard(word, position) {
    const card = element("article", "words-card");
    const group = collection.groups.find(item => item.id === word.group_id);
    card.append(element("p", "words-card-label", `${position + 1} · ${group.label}`));
    const title = element("h2", "words-card-word", word.th, "th");
    title.id = `title-${word.id}`;
    card.setAttribute("aria-labelledby", title.id);
    card.append(title);
    card.append(element("p", "words-card-prompt", "Read aloud before revealing."));

    const button = element("button", "words-button", "Show answer");
    button.type = "button";
    button.setAttribute("aria-label", `Show answer for ${word.th}`);
    button.setAttribute("aria-controls", `answer-${word.id}`);
    const answer = element("div", "words-answer");
    answer.id = `answer-${word.id}`;
    answer.append(element("p", "words-field-label", "Thai reading hint"));
    answer.append(element("p", "words-reading", word.reading_th, "th"));
    // ALA readings are optional. Do not invent one to fill an empty field.
    if (typeof word.school_reading === "string" && word.school_reading.trim()) {
      answer.append(element("p", "words-field-label", "ALA reading"));
      answer.append(element("p", "words-school-reading", word.school_reading));
    }
    answer.append(element("p", "words-meaning", word.en));
    answer.append(element("p", "words-chinese", word["zh-TW"], "zh-Hant"));
    answer.append(element("p", "words-note", word.note_en));
    answer.append(element("p", "words-note", word["note_zh-TW"], "zh-Hant"));
    answer.append(element("h3", "words-example-label", "Example"));
    answer.append(element("p", "words-example-thai", word.example.th, "th"));
    answer.append(element("p", "words-example-translation", word.example.en));
    answer.append(element("p", "words-example-translation", word.example["zh-TW"], "zh-Hant"));

    function updateReveal() {
      const isOpen = revealed.has(word.id);
      answer.hidden = !isOpen;
      button.textContent = isOpen ? "Hide answer" : "Show answer";
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", `${isOpen ? "Hide" : "Show"} answer for ${word.th}`);
    }
    button.addEventListener("click", () => {
      if (revealed.has(word.id)) revealed.delete(word.id);
      else revealed.add(word.id);
      updateReveal();
    });
    updateReveal();
    card.append(button, answer);
    return card;
  }

  function render() {
    const query = search.value.trim().normalize("NFC").toLocaleLowerCase();
    const selected = groupSelect.value;
    const matches = collection.words.filter(word => {
      const text = [word.th, word.reading_th, word.en, word["zh-TW"], word.school_reading || ""]
        .join(" ").normalize("NFC").toLocaleLowerCase();
      return (selected === "all" || word.group_id === selected) && text.includes(query);
    });
    const fragment = document.createDocumentFragment();
    matches.forEach(word => fragment.append(createCard(word, collection.words.indexOf(word))));
    grid.replaceChildren(fragment);
    status.textContent = `${matches.length} of ${collection.words.length} words`;
    empty.hidden = matches.length !== 0;
  }

  async function init() {
    try {
      const response = await fetch("./data/words/special_ro.json?v=20261103");
      if (!response.ok) throw new Error(`Word file returned HTTP ${response.status}.`);
      collection = validate(await response.json());
      for (const group of collection.groups) {
        const option = element("option", "", group.label);
        option.value = group.id;
        groupSelect.append(option);
      }
      search.disabled = false;
      groupSelect.disabled = false;
      hideAll.disabled = false;
      search.addEventListener("input", render);
      groupSelect.addEventListener("change", render);
      hideAll.addEventListener("click", () => {
        revealed.clear();
        render();
      });
      render();
    } catch (cause) {
      status.textContent = "Word cards could not load.";
      error.textContent = "Check that data/words/special_ro.json exists and contains valid JSON. Open this page through your local web server or deployed website. " + cause.message;
      error.hidden = false;
      console.error("Word cards:", cause);
    }
  }
  init();
})();
